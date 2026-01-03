import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';

import {
    Box,
    Card,
    Grid,
    Menu,
    Stack,
    Table,
    Button,
    Dialog,
    MenuItem,
    TableRow,
    Container,
    TableBody,
    TableCell,
    TableHead,
    TextField,
    IconButton,
    Typography,
    DialogTitle,
    DialogActions,
    DialogContent,
    TableContainer,
    Chip,
    Autocomplete,
} from '@mui/material';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type Partner = {
    id: string;
    fullName: string;
    phone: string;
    company: string;
    notes: string;
    categories: string[];
};

const CATEGORY_OPTIONS = [
    'Plyonka',
    'Kraska',
    'Razvaritel',
    'Razvaritel aralashmasi',
    'Silindir',
    'Kley',
    'Zapchastlar',
];


const STORAGE_KEY = 'partners-main';

const getRawPhone = (value: string | undefined | null) =>
    (typeof value === 'string' ? value : '').replace(/\D/g, '').slice(0, 9);

const formatPhone = (raw: string) => {
    const digits = getRawPhone(raw);
    const part1 = digits.slice(0, 2);
    const part2 = digits.slice(2, 5);
    const part3 = digits.slice(5, 7);
    const part4 = digits.slice(7, 9);
    let formatted = '';
    if (part1) formatted = `${part1}`;
    if (part2) formatted += ` ${part2}`;
    if (part3) formatted += `-${part3}`;
    if (part4) formatted += `-${part4}`;
    return formatted.trim();
};

const seedData: Partner[] = [
    {
        id: 'partner-1',
        fullName: 'Akmal Sobirov',
        phone: formatPhone('971234567'),
        company: 'Polimer Sanoat',
        notes: 'Asosiy xomashyo yetkazib beruvchi.',
        categories: ['Plyonka', 'Kley'],
    },
];


// ----------------------------------------------------------------------

export default function PartnersPage() {
    const { t } = useTranslate('pages');

    const initialData = useMemo<Partner[]>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    return JSON.parse(stored) as Partner[];
                } catch {
                    // ignore parsing errors
                }
            }
        }
        return seedData;
    }, []);

    const [items, setItems] = useState<Partner[]>(initialData);
    const [form, setForm] = useState<{
        fullName: string;
        phone: string;
        company: string;
        notes: string;
        categories: string[];
    }>({
        fullName: '',
        phone: '',
        company: '',
        notes: '',
        categories: [],
    });

    const [editing, setEditing] = useState<Partner | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuItem, setMenuItem] = useState<Partner | null>(null);

    const dialog = useBoolean();
    const deleteDialog = useBoolean();

    const pageTitle = `${t('partnersPage.title')} | ${CONFIG.appName}`;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
    }, [items]);

    const openAdd = () => {
        setEditing(null);
        setForm({ fullName: '', phone: '', company: '', notes: '', categories: [] });
        dialog.onTrue();
    };

    const openEdit = (item: Partner) => {
        setEditing(item);
        setForm({
            fullName: item.fullName,
            phone: formatPhone(item.phone),
            company: item.company,
            notes: item.notes,
            categories: item.categories || [],
        });

        dialog.onTrue();
    };

    const openMenu = (event: React.MouseEvent<HTMLElement>, item: Partner) => {
        setMenuAnchor(event.currentTarget);
        setMenuItem(item);
    };

    const closeMenu = () => {
        setMenuAnchor(null);
    };

    const handleSave = () => {
        const payload: Partner = {
            id: editing ? editing.id : uuidv4(),

            fullName: form.fullName.trim(),
            phone: getRawPhone(form.phone),
            company: form.company.trim(),
            notes: form.notes.trim(),
            categories: form.categories,
        };

        if (editing) {
            setItems((prev) => prev.map((it) => (it.id === editing.id ? payload : it)));
        } else {
            setItems((prev) => [...prev, payload]);
        }
        dialog.onFalse();
    };

    const handleDelete = () => {
        if (menuItem) {
            setItems((prev) => prev.filter((it) => it.id !== menuItem.id));
        }
        deleteDialog.onFalse();
        setMenuItem(null);
        setEditing(null);
    };

    const onPhoneChange = (value: string) => setForm((prev) => ({ ...prev, phone: formatPhone(value) }));
    const canSave = form.fullName.trim().length > 0;

    return (
        <>
            <title>{pageTitle}</title>

            <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
                <Stack spacing={3}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        flexWrap="wrap"
                        gap={1.5}
                    >
                        <Box>
                            <Typography variant="h4">{t('partnersPage.title')}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                {t('partnersPage.subtitle')}
                            </Typography>
                        </Box>

                        <Button variant="contained" onClick={openAdd} startIcon={<Iconify icon="mingcute:add-line" />}>
                            {t('partnersPage.add')}
                        </Button>
                    </Stack>

                    <Card>
                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 800 }}>
                                <TableHead>
                                    <TableCell>{t('partnersPage.fullName')}</TableCell>
                                    <TableCell>{t('partnersPage.phone')}</TableCell>
                                    <TableCell>{t('partnersPage.company')}</TableCell>
                                    <TableCell>{t('partnersPage.categories')}</TableCell>
                                    <TableCell>{t('partnersPage.notes')}</TableCell>
                                    <TableCell align="right">{t('partnersPage.actions')}</TableCell>

                                </TableHead>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5}>
                                                <Box
                                                    sx={{
                                                        py: 6,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexDirection: 'column',
                                                        gap: 1,
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {t('partnersPage.empty')}
                                                    </Typography>
                                                    <Button size="small" variant="outlined" onClick={openAdd}>
                                                        {t('partnersPage.add')}
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((partner) => (
                                            <TableRow key={partner.id} hover>
                                                <TableCell>{partner.fullName}</TableCell>
                                                <TableCell>{formatPhone(partner.phone)}</TableCell>
                                                <TableCell>{partner.company || t('partnersPage.notProvided')}</TableCell>
                                                <TableCell>
                                                    {partner.categories?.map((cat) => (
                                                        <Chip key={cat} label={cat} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                                    ))}
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {partner.notes || t('partnersPage.notProvided')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton onClick={(e) => openMenu(e, partner)}>
                                                        <Iconify icon="solar:menu-dots-bold-duotone" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Stack>
            </Container>

            <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm" fullWidth>
                <DialogTitle>{editing ? t('partnersPage.edit') : t('partnersPage.add')}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label={t('partnersPage.fullName')}
                                value={form.fullName}
                                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label={t('partnersPage.phone')}
                                value={form.phone}
                                onChange={(e) => onPhoneChange(e.target.value)}
                                placeholder="99 123-45-67"
                                inputProps={{ inputMode: 'tel' }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label={t('partnersPage.company')}
                                value={form.company}
                                onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                multiple
                                options={CATEGORY_OPTIONS}
                                value={form.categories}
                                onChange={(event, newValue) => {
                                    setForm((prev) => ({ ...prev, categories: newValue }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label={t('partnersPage.categories')} placeholder={t('partnersPage.categoriesPlaceholder')} />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip {...getTagProps({ index })} key={option} label={option} size="small" />
                                    ))
                                }
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>

                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                label={t('partnersPage.notes')}
                                value={form.notes}
                                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={dialog.onFalse} color="inherit">
                        {t('partnersPage.cancel')}
                    </Button>
                    <Button onClick={handleSave} variant="contained" disabled={!canSave}>
                        {t('partnersPage.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
                <DialogTitle>{t('partnersPage.deleteConfirm')}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {t('partnersPage.deleteHint')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={deleteDialog.onFalse} color="inherit">
                        {t('partnersPage.cancel')}
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        {t('partnersPage.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
                <MenuItem
                    onClick={() => {
                        if (menuItem) openEdit(menuItem);
                        closeMenu();
                    }}
                >
                    <Iconify icon="solar:pen-bold" width={18} height={18} style={{ marginRight: 8 }} />
                    {t('partnersPage.edit')}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuItem) {
                            deleteDialog.onTrue();
                        }
                        closeMenu();
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} height={18} style={{ marginRight: 8 }} />
                    {t('partnersPage.delete')}
                </MenuItem>
            </Menu>
        </>
    );
}

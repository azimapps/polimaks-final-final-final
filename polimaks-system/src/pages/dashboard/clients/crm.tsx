import { v4 as uuidv4 } from 'uuid';
import { useMemo, useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

type CrmStatus = 'interested' | 'very_interested' | 'not_interested' | 'follow_up';

type CrmLead = {
  id: string;
  fullName: string;
  phone: string;
  status: CrmStatus;
  company: string;
  note: string;
};

const CRM_STORAGE_KEY = 'clients-crm';

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

export default function ClientsCrmPage() {
  const { t } = useTranslate('pages');
  const pageTitle = `${t('clientsCrm.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<CrmLead[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CRM_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CrmLead[];
          return parsed.map((item, index) => ({
            id: item.id || `crm-${index}`,
            fullName: item.fullName || '',
            phone: getRawPhone(item.phone),
            status: (item.status as CrmStatus) || 'interested',
            company: item.company || '',
            note: item.note || '',
          }));
        } catch {
          // ignore parsing errors
        }
      }
    }
    return [];
  }, []);

  const [items, setItems] = useState<CrmLead[]>(initialData);
  const [editing, setEditing] = useState<CrmLead | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<CrmLead | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CrmLead | null>(null);
  const [form, setForm] = useState<{
    fullName: string;
    phone: string;
    status: CrmStatus;
    company: string;
    note: string;
  }>({
    fullName: '',
    phone: '',
    status: 'interested',
    company: '',
    note: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const statusOptions = [
    { value: 'interested', label: t('clientsCrm.statuses.interested') },
    { value: 'very_interested', label: t('clientsCrm.statuses.very_interested') },
    { value: 'follow_up', label: t('clientsCrm.statuses.follow_up') },
    { value: 'not_interested', label: t('clientsCrm.statuses.not_interested') },
  ];

  const setItemsAndPersist = (updater: (prev: CrmLead[]) => CrmLead[]) => {
    setItems((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ fullName: '', phone: '', status: 'interested', company: '', note: '' });
    dialog.onTrue();
  };

  const openEdit = (item: CrmLead) => {
    setEditing(item);
    setForm({
      fullName: item.fullName,
      phone: formatPhone(item.phone),
      status: item.status,
      company: item.company,
      note: item.note,
    });
    dialog.onTrue();
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: CrmLead) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const handleSave = () => {
    const payload: CrmLead = {
      id: editing ? editing.id : uuidv4(),
      fullName: form.fullName.trim(),
      phone: getRawPhone(form.phone),
      status: form.status,
      company: form.company.trim(),
      note: form.note.trim(),
    };
    if (editing) {
      setItemsAndPersist((prev) => prev.map((it) => (it.id === editing.id ? payload : it)));
    } else {
      setItemsAndPersist((prev) => [...prev, payload]);
    }
    dialog.onFalse();
  };

  const handleDelete = () => {
    if (pendingDelete) {
      setItemsAndPersist((prev) => prev.filter((it) => it.id !== pendingDelete.id));
    }
    setPendingDelete(null);
    deleteDialog.onFalse();
    setMenuItem(null);
    setEditing(null);
  };

  const onPhoneChange = (value: string) => setForm((prev) => ({ ...prev, phone: formatPhone(value) }));
  const canSave = form.fullName.trim() && getRawPhone(form.phone).length === 9;

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{t('clientsCrm.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('clientsCrm.subtitle')}
              </Typography>
            </Box>
            <Button variant="contained" onClick={openAdd}>
              {t('clientsCrm.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 220 }}>{t('clientsCrm.fullName')}</TableCell>
                    <TableCell sx={{ width: 140 }}>{t('clientsCrm.phone')}</TableCell>
                    <TableCell sx={{ width: 180 }}>{t('clientsCrm.status')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('clientsCrm.company')}</TableCell>
                    <TableCell sx={{ minWidth: 240 }}>{t('clientsCrm.note')}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      {t('clientsCrm.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box
                          sx={{
                            py: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('clientsCrm.empty')}
                          </Typography>
                          <Button size="small" variant="outlined" onClick={openAdd}>
                            {t('clientsCrm.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.fullName}</TableCell>
                        <TableCell>{formatPhone(item.phone)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {t(`clientsCrm.statuses.${item.status}`, { defaultValue: item.status })}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.company || t('clientsPage.notProvided')}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.note || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={(event) => openMenu(event, item)}>
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
        <DialogTitle>{editing ? t('clientsCrm.edit') : t('clientsCrm.add')}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('clientsCrm.fullName')}
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('clientsCrm.phone')}
                value={form.phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="99 123-45-67"
                inputProps={{ inputMode: 'tel' }}
                helperText={t('clientsPage.phoneHelper')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={t('clientsCrm.status')}
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as CrmStatus }))
                }
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('clientsCrm.company')}
                value={form.company}
                onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('clientsCrm.note')}
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('clientsCrm.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('clientsCrm.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog.value}
        onClose={() => {
          setPendingDelete(null);
          deleteDialog.onFalse();
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('clientsCrm.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('clientsCrm.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPendingDelete(null);
              deleteDialog.onFalse();
            }}
            color="inherit"
          >
            {t('clientsCrm.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('clientsCrm.delete')}
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
          {t('clientsCrm.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuItem) setPendingDelete(menuItem);
            deleteDialog.onTrue();
            closeMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {t('clientsCrm.delete')}
        </MenuItem>
      </Menu>
    </>
  );
}

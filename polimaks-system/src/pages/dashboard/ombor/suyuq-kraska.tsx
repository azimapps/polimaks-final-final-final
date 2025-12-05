/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import seedData from 'src/data/suyuq-kraska.json';

import { Iconify } from 'src/components/iconify';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';

type SuyuqKraskaItem = {
  id: string;
  colorName: string;
  colorHex: string;
  totalKg: number;
  pricePerKg: number;
  priceCurrency: Currency;
  seriyaNumber: string;
  description: string;
};

const STORAGE_KEY = 'ombor-suyuq-kraska';

export default function SuyuqKraskaPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.items.suyuq_kraska.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<SuyuqKraskaItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as SuyuqKraskaItem[];
        } catch {
          // ignore corrupted data
        }
      }
    }
    return seedData as SuyuqKraskaItem[];
  }, []);

  const [items, setItems] = useState<SuyuqKraskaItem[]>(initialData);
  const [editing, setEditing] = useState<SuyuqKraskaItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<SuyuqKraskaItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SuyuqKraskaItem | null>(null);
  const [form, setForm] = useState<
    Omit<SuyuqKraskaItem, 'id' | 'totalKg' | 'pricePerKg'> & { totalKg: string; pricePerKg: string }
  >({
    colorName: '',
    colorHex: '#6a1b9a',
    totalKg: '',
    pricePerKg: '',
    priceCurrency: 'UZS',
    seriyaNumber: '',
    description: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: SuyuqKraskaItem[]) => SuyuqKraskaItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      colorName: '',
      colorHex: '#6a1b9a',
      totalKg: '',
      pricePerKg: '',
      priceCurrency: 'UZS',
      seriyaNumber: '',
      description: '',
    });
    dialog.onTrue();
  };

  const openEdit = (item: SuyuqKraskaItem) => {
    setEditing(item);
    setForm({
      colorName: item.colorName,
      colorHex: item.colorHex,
      totalKg: item.totalKg ? String(item.totalKg) : '',
      pricePerKg: item.pricePerKg ? String(item.pricePerKg) : '',
      priceCurrency: item.priceCurrency,
      seriyaNumber: item.seriyaNumber,
      description: item.description,
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const totalKgNum = parseFloat(form.totalKg) || 0;
    const pricePerKgNum = parseFloat(form.pricePerKg) || 0;
    const payload: SuyuqKraskaItem = {
      id: editing ? editing.id : uuidv4(),
      colorName: form.colorName.trim(),
      colorHex: form.colorHex || '#000000',
      totalKg: totalKgNum,
      pricePerKg: pricePerKgNum,
      priceCurrency: form.priceCurrency,
      seriyaNumber: form.seriyaNumber.trim(),
      description: form.description,
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
    deleteDialog.onFalse();
    setPendingDelete(null);
    setMenuItem(null);
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: SuyuqKraskaItem) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const canSave =
    form.colorName.trim() &&
    parseFloat(form.totalKg) > 0 &&
    parseFloat(form.pricePerKg) > 0 &&
    form.seriyaNumber.trim();

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('suyuqKraskaPage.currency.uzs');
      case 'USD':
        return t('suyuqKraskaPage.currency.usd');
      case 'RUB':
        return t('suyuqKraskaPage.currency.rub');
      case 'EUR':
        return t('suyuqKraskaPage.currency.eur');
      default:
        return code;
    }
  };

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{t('suyuqKraskaPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('suyuqKraskaPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('suyuqKraskaPage.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 220 }}>{t('suyuqKraskaPage.color')}</TableCell>
                    <TableCell sx={{ width: 140 }}>{t('suyuqKraskaPage.totalKg')}</TableCell>
                    <TableCell sx={{ width: 200 }}>{t('suyuqKraskaPage.price')}</TableCell>
                    <TableCell sx={{ width: 160 }}>{t('suyuqKraskaPage.seriya')}</TableCell>
                    <TableCell>{t('suyuqKraskaPage.description')}</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>
                      {t('suyuqKraskaPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
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
                            {t('suyuqKraskaPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('suyuqKraskaPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: item.colorHex || '#000',
                              }}
                            />
                            <Box>
                              <Typography variant="subtitle2">{item.colorName}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {item.colorHex}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.totalKg.toLocaleString()} {t('suyuqKraskaPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.pricePerKg.toLocaleString()} {currencyLabel(item.priceCurrency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.seriyaNumber}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {item.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={(e) => openMenu(e, item)}>
                            <Iconify icon="eva:more-vertical-fill" />
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? t('suyuqKraskaPage.edit') : t('suyuqKraskaPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('suyuqKraskaPage.colorName')}
                  value={form.colorName}
                  onChange={(e) => setForm((prev) => ({ ...prev, colorName: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="color"
                  label={t('suyuqKraskaPage.colorHex')}
                  value={form.colorHex}
                  onChange={(e) => setForm((prev) => ({ ...prev, colorHex: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('suyuqKraskaPage.totalKg')}
                  value={form.totalKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalKg: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('suyuqKraskaPage.totalKg') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('suyuqKraskaPage.pricePerKg')}
                  value={form.pricePerKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, pricePerKg: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('suyuqKraskaPage.pricePerKg') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t('suyuqKraskaPage.priceCurrency')}
                  value={form.priceCurrency}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, priceCurrency: e.target.value as Currency }))
                  }
                >
                  {(['UZS', 'USD', 'RUB', 'EUR'] as Currency[]).map((cur) => (
                    <MenuItem key={cur} value={cur}>
                      {currencyLabel(cur)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('suyuqKraskaPage.seriya')}
                  value={form.seriyaNumber}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, seriyaNumber: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('suyuqKraskaPage.description')}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {/* TODO: replace static JSON/local storage with real API endpoints when backend is available */}
              {t('suyuqKraskaPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('suyuqKraskaPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('suyuqKraskaPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('suyuqKraskaPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('suyuqKraskaPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('suyuqKraskaPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('suyuqKraskaPage.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <ActionsMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        onEdit={() => menuItem && openEdit(menuItem)}
        onDelete={() => {
          if (menuItem) {
            setPendingDelete(menuItem);
            deleteDialog.onTrue();
          }
        }}
        labels={{ edit: t('suyuqKraskaPage.edit'), delete: t('suyuqKraskaPage.delete') }}
      />
    </>
  );
}

type ActionsMenuProps = {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: VoidFunction;
  onEdit: VoidFunction;
  onDelete: VoidFunction;
  labels: { edit: string; delete: string };
};

function ActionsMenu({ anchorEl, open, onClose, onEdit, onDelete, labels }: ActionsMenuProps) {
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem
        onClick={() => {
          onEdit();
          onClose();
        }}
      >
        <Iconify icon="solar:pen-bold" width={18} height={18} style={{ marginRight: 8 }} />
        {labels.edit}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onDelete();
          onClose();
        }}
        sx={{ color: 'error.main' }}
      >
        <Iconify icon="solar:trash-bin-trash-bold" width={18} height={18} style={{ marginRight: 8 }} />
        {labels.delete}
      </MenuItem>
    </Menu>
  );
}

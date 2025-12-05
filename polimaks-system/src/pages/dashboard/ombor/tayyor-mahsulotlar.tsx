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
import seedData from 'src/data/tayyor-mahsulotlar.json';

import { Iconify } from 'src/components/iconify';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';
type Location = 'angren' | 'tashkent';

type ProductItem = {
  id: string;
  location: Location;
  title: string;
  totalKg: number;
  totalMeter: number;
  pricePerKg: number;
  priceCurrency: Currency;
  description: string;
};

const STORAGE_KEY = 'ombor-tayyor-mahsulotlar';

export default function TayyorMahsulotlarPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.items.tayyor_mahsulotlar.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<ProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as ProductItem[];
        } catch {
          // ignore corrupted data
        }
      }
    }
    return seedData as ProductItem[];
  }, []);

  const [items, setItems] = useState<ProductItem[]>(initialData);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<ProductItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductItem | null>(null);
  const [form, setForm] = useState<
    Omit<ProductItem, 'id' | 'totalKg' | 'totalMeter' | 'pricePerKg'> & {
      totalKg: string;
      totalMeter: string;
      pricePerKg: string;
    }
  >({
    location: 'angren',
    title: '',
    totalKg: '',
    totalMeter: '',
    pricePerKg: '',
    priceCurrency: 'UZS',
    description: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: ProductItem[]) => ProductItem[]) => {
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
      location: 'angren',
      title: '',
      totalKg: '',
      totalMeter: '',
      pricePerKg: '',
      priceCurrency: 'UZS',
      description: '',
    });
    dialog.onTrue();
  };

  const openEdit = (item: ProductItem) => {
    setEditing(item);
    setForm({
      location: item.location,
      title: item.title,
      totalKg: item.totalKg ? String(item.totalKg) : '',
      totalMeter: item.totalMeter ? String(item.totalMeter) : '',
      pricePerKg: item.pricePerKg ? String(item.pricePerKg) : '',
      priceCurrency: item.priceCurrency,
      description: item.description,
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const payload: ProductItem = {
      id: editing ? editing.id : uuidv4(),
      location: form.location,
      title: form.title.trim(),
      totalKg: parseFloat(form.totalKg) || 0,
      totalMeter: parseFloat(form.totalMeter) || 0,
      pricePerKg: parseFloat(form.pricePerKg) || 0,
      priceCurrency: form.priceCurrency,
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: ProductItem) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const canSave =
    form.title.trim() &&
    parseFloat(form.totalKg) > 0 &&
    parseFloat(form.totalMeter) > 0 &&
    parseFloat(form.pricePerKg) > 0;

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('tayyorMahsulotlarPage.currency.uzs');
      case 'USD':
        return t('tayyorMahsulotlarPage.currency.usd');
      case 'RUB':
        return t('tayyorMahsulotlarPage.currency.rub');
      case 'EUR':
        return t('tayyorMahsulotlarPage.currency.eur');
      default:
        return code;
    }
  };

  const locationLabel = (loc: Location) => {
    switch (loc) {
      case 'angren':
        return t('tayyorMahsulotlarPage.location.angren');
      case 'tashkent':
        return t('tayyorMahsulotlarPage.location.tashkent');
      default:
        return loc;
    }
  };

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{t('tayyorMahsulotlarPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('tayyorMahsulotlarPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('tayyorMahsulotlarPage.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 160 }}>{t('tayyorMahsulotlarPage.locationLabel')}</TableCell>
                    <TableCell sx={{ width: 220 }}>{t('tayyorMahsulotlarPage.titleLabel')}</TableCell>
                    <TableCell sx={{ width: 140 }}>{t('tayyorMahsulotlarPage.totalKg')}</TableCell>
                    <TableCell sx={{ width: 140 }}>{t('tayyorMahsulotlarPage.totalMeter')}</TableCell>
                    <TableCell sx={{ width: 180 }}>{t('tayyorMahsulotlarPage.price')}</TableCell>
                    <TableCell>{t('tayyorMahsulotlarPage.description')}</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>
                      {t('tayyorMahsulotlarPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
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
                            {t('tayyorMahsulotlarPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('tayyorMahsulotlarPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          <Typography variant="subtitle2">{locationLabel(item.location)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{item.title}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.totalKg.toLocaleString()} {t('tayyorMahsulotlarPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.totalMeter.toLocaleString()} {t('tayyorMahsulotlarPage.meter')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.pricePerKg.toLocaleString()} {currencyLabel(item.priceCurrency)}
                          </Typography>
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
        <DialogTitle>{editing ? t('tayyorMahsulotlarPage.edit') : t('tayyorMahsulotlarPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t('tayyorMahsulotlarPage.locationLabel')}
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value as Location }))}
                >
                  {(['angren', 'tashkent'] as Location[]).map((loc) => (
                    <MenuItem key={loc} value={loc} sx={{ textTransform: 'capitalize' }}>
                      {locationLabel(loc)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label={t('tayyorMahsulotlarPage.titleLabel')}
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('tayyorMahsulotlarPage.totalKg')}
                  value={form.totalKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalKg: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('tayyorMahsulotlarPage.totalKg') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('tayyorMahsulotlarPage.totalMeter')}
                  value={form.totalMeter}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalMeter: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('tayyorMahsulotlarPage.totalMeter') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('tayyorMahsulotlarPage.pricePerKg')}
                  value={form.pricePerKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, pricePerKg: e.target.value }))}
                  inputProps={{
                    min: 0,
                    step: '0.01',
                    placeholder: t('tayyorMahsulotlarPage.pricePerKg'),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t('tayyorMahsulotlarPage.priceCurrency')}
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
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label={t('tayyorMahsulotlarPage.description')}
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
              {t('tayyorMahsulotlarPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('tayyorMahsulotlarPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('tayyorMahsulotlarPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('tayyorMahsulotlarPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('tayyorMahsulotlarPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('tayyorMahsulotlarPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('tayyorMahsulotlarPage.delete')}
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
        labels={{ edit: t('tayyorMahsulotlarPage.edit'), delete: t('tayyorMahsulotlarPage.delete') }}
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

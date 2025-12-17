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
import seedData from 'src/data/kley.json';

import { Iconify } from 'src/components/iconify';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';

type KleyItem = {
  id: string;
  receivedDate: string;
  numberIdentifier: string;
  type: string;
  supplier: string;
  name: string;
  barrels: number;
  netWeight: number;
  grossWeight: number;
  totalNetWeight: number;
  totalGrossWeight: number;
  price: number;
  priceCurrency: Currency;
  description: string;
};

const STORAGE_KEY = 'ombor-kley';

const todayISO = () => new Date().toISOString().slice(0, 10);

const normalizeItems = (items: (Partial<KleyItem> & { id?: string })[]): KleyItem[] =>
  items.map((item, index) => ({
    id: item.id || `kley-${index}`,
    receivedDate: item.receivedDate || todayISO(),
    numberIdentifier: item.numberIdentifier || '',
    type: item.type || '',
    supplier: item.supplier || '',
    name: item.name || '',
    barrels: typeof item.barrels === 'number' ? item.barrels : Number(item.barrels) || 0,
    netWeight: typeof item.netWeight === 'number' ? item.netWeight : Number(item.netWeight) || 0,
    grossWeight:
      typeof item.grossWeight === 'number' ? item.grossWeight : Number(item.grossWeight) || 0,
    totalNetWeight:
      typeof item.totalNetWeight === 'number'
        ? item.totalNetWeight
        : Number(item.totalNetWeight) || 0,
    totalGrossWeight:
      typeof item.totalGrossWeight === 'number'
        ? item.totalGrossWeight
        : Number(item.totalGrossWeight) || 0,
    price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
    priceCurrency: (item.priceCurrency as Currency) || 'UZS',
    description: item.description || '',
  }));

export default function KleyPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.items.kley.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<KleyItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return normalizeItems(JSON.parse(stored) as KleyItem[]);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return normalizeItems(seedData as KleyItem[]);
  }, []);

  const [items, setItems] = useState<KleyItem[]>(initialData);
  const [editing, setEditing] = useState<KleyItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<KleyItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<KleyItem | null>(null);
  const [form, setForm] = useState<
    Omit<KleyItem, 'id' | 'barrels' | 'netWeight' | 'grossWeight' | 'totalNetWeight' | 'totalGrossWeight' | 'price'> & {
      barrels: string;
      netWeight: string;
      grossWeight: string;
      totalNetWeight: string;
      totalGrossWeight: string;
      price: string;
    }
  >({
    receivedDate: todayISO(),
    numberIdentifier: '',
    type: '',
    supplier: '',
    name: '',
    barrels: '',
    netWeight: '',
    grossWeight: '',
    totalNetWeight: '',
    totalGrossWeight: '',
    price: '',
    priceCurrency: 'UZS',
    description: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: KleyItem[]) => KleyItem[]) => {
    setItems((prev) => {
      const next = normalizeItems(updater(prev));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      receivedDate: todayISO(),
      numberIdentifier: '',
      type: '',
      supplier: '',
      name: '',
      barrels: '',
      netWeight: '',
      grossWeight: '',
      totalNetWeight: '',
      totalGrossWeight: '',
      price: '',
      priceCurrency: 'UZS',
      description: '',
    });
    dialog.onTrue();
  };

  const openEdit = (item: KleyItem) => {
    setEditing(item);
    setForm({
      receivedDate: item.receivedDate || todayISO(),
      numberIdentifier: item.numberIdentifier,
      type: item.type,
      supplier: item.supplier,
      name: item.name,
      barrels: item.barrels ? String(item.barrels) : '',
      netWeight: item.netWeight ? String(item.netWeight) : '',
      grossWeight: item.grossWeight ? String(item.grossWeight) : '',
      totalNetWeight: item.totalNetWeight ? String(item.totalNetWeight) : '',
      totalGrossWeight: item.totalGrossWeight ? String(item.totalGrossWeight) : '',
      price: item.price ? String(item.price) : '',
      priceCurrency: item.priceCurrency,
      description: item.description,
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const barrelsNum = parseFloat(form.barrels) || 0;
    const netWeightNum = parseFloat(form.netWeight) || 0;
    const grossWeightNum = parseFloat(form.grossWeight) || 0;
    const totalNetWeightNum = parseFloat(form.totalNetWeight) || 0;
    const totalGrossWeightNum = parseFloat(form.totalGrossWeight) || 0;
    const priceNum = parseFloat(form.price) || 0;

    const payload: KleyItem = {
      id: editing ? editing.id : uuidv4(),
      receivedDate: form.receivedDate || todayISO(),
      numberIdentifier: form.numberIdentifier.trim(),
      type: form.type.trim(),
      supplier: form.supplier.trim(),
      name: form.name.trim(),
      barrels: barrelsNum,
      netWeight: netWeightNum,
      grossWeight: grossWeightNum,
      totalNetWeight: totalNetWeightNum,
      totalGrossWeight: totalGrossWeightNum,
      price: priceNum,
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: KleyItem) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const canSave =
    form.receivedDate &&
    form.numberIdentifier.trim() &&
    form.type.trim() &&
    form.supplier.trim() &&
    form.name.trim() &&
    parseFloat(form.barrels) > 0 &&
    parseFloat(form.totalNetWeight) > 0 &&
    parseFloat(form.totalGrossWeight) > 0 &&
    parseFloat(form.price) > 0;

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('kleyPage.currency.uzs');
      case 'USD':
        return t('kleyPage.currency.usd');
      case 'RUB':
        return t('kleyPage.currency.rub');
      case 'EUR':
        return t('kleyPage.currency.eur');
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
              <Typography variant="h4">{t('kleyPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('kleyPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('kleyPage.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table
                size="medium"
                sx={{
                  minWidth: 1400,
                  '& th, & td': { py: 1.5, px: 1.25 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 160 }}>{t('kleyPage.supplier')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('kleyPage.receivedDate')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('kleyPage.numberIdentifier')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('kleyPage.type')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('kleyPage.name')}</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>{t('kleyPage.barrels')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('kleyPage.netWeight')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('kleyPage.grossWeight')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('kleyPage.totalNetWeight')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('kleyPage.totalGrossWeight')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('kleyPage.price')}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{t('kleyPage.totalPrice')}</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>{t('kleyPage.description')}</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>
                      {t('kleyPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13}>
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
                            {t('kleyPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('kleyPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {item.supplier || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.receivedDate}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.numberIdentifier}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.type}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{item.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.barrels.toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.netWeight.toLocaleString()} {t('kleyPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.grossWeight.toLocaleString()} {t('kleyPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.totalNetWeight.toLocaleString()} {t('kleyPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.totalGrossWeight.toLocaleString()} {t('kleyPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.price.toLocaleString()} {currencyLabel(item.priceCurrency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(item.totalGrossWeight * item.price).toLocaleString()}{' '}
                            {currencyLabel(item.priceCurrency)}
                          </Typography>
                        </TableCell>
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="lg" fullWidth>
        <DialogTitle>{editing ? t('kleyPage.edit') : t('kleyPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('kleyPage.receivedDate')}
                  value={form.receivedDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, receivedDate: e.target.value || todayISO() }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('kleyPage.supplier')}
                  value={form.supplier}
                  onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('kleyPage.numberIdentifier')}
                  value={form.numberIdentifier}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, numberIdentifier: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('kleyPage.type')}
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('kleyPage.name')}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('kleyPage.barrels')}
                  value={form.barrels}
                  onChange={(e) => setForm((prev) => ({ ...prev, barrels: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('kleyPage.barrels') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('kleyPage.netWeight')}
                  value={form.netWeight}
                  onChange={(e) => setForm((prev) => ({ ...prev, netWeight: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('kleyPage.netWeight') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('kleyPage.grossWeight')}
                  value={form.grossWeight}
                  onChange={(e) => setForm((prev) => ({ ...prev, grossWeight: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('kleyPage.grossWeight') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('kleyPage.totalNetWeight')}
                  value={form.totalNetWeight}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalNetWeight: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('kleyPage.totalNetWeight') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('kleyPage.totalGrossWeight')}
                  value={form.totalGrossWeight}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, totalGrossWeight: e.target.value }))
                  }
                  inputProps={{ min: 0, step: '0.01', placeholder: t('kleyPage.totalGrossWeight') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('kleyPage.price')}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('kleyPage.price') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t('kleyPage.priceCurrency')}
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
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('kleyPage.description')}
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
              {t('kleyPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('kleyPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('kleyPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('kleyPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('kleyPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('kleyPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('kleyPage.delete')}
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
        labels={{ edit: t('kleyPage.edit'), delete: t('kleyPage.delete') }}
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

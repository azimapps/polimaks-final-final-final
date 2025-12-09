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
import seedData from 'src/data/tayyor-mahsulotlar-angren.json';

import { Iconify } from 'src/components/iconify';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';

type ProductItem = {
  id: string;
  receivedDate: string;
  numberIdentifier: string;
  type: string;
  supplier: string;
  client: string;
  name: string;
  quantity: number;
  netWeight: number;
  grossWeight: number;
  totalNetWeight: number;
  totalGrossWeight: number;
  price: number;
  priceCurrency: Currency;
  description: string;
};

const STORAGE_KEY = 'ombor-tayyor-mahsulotlar-angren';

const todayISO = () => new Date().toISOString().slice(0, 10);

const normalizeItems = (items: (Partial<ProductItem> & { id?: string })[]): ProductItem[] =>
  items.map((item, index) => ({
    id: item.id || `product-${index}`,
    receivedDate: item.receivedDate || todayISO(),
    numberIdentifier: item.numberIdentifier || '',
    type: item.type || '',
    supplier: item.supplier || '',
    client: item.client || '',
    name: item.name || '',
    quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 0,
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

export default function TayyorMahsulotlarAngrenPage() {
  const { t } = useTranslate('pages');

  const title = `${t('tayyorMahsulotlarAngrenPage.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<ProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return normalizeItems(JSON.parse(stored) as ProductItem[]);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return normalizeItems(seedData as ProductItem[]);
  }, []);

  const [items, setItems] = useState<ProductItem[]>(initialData);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<ProductItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductItem | null>(null);
  const [form, setForm] = useState<
    Omit<ProductItem, 'id' | 'quantity' | 'netWeight' | 'grossWeight' | 'totalNetWeight' | 'totalGrossWeight' | 'price'> & {
      quantity: string;
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
    client: '',
    name: '',
    quantity: '',
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

  const setItemsAndPersist = (updater: (prev: ProductItem[]) => ProductItem[]) => {
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
      client: '',
      name: '',
      quantity: '',
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

  const openEdit = (item: ProductItem) => {
    setEditing(item);
    setForm({
      receivedDate: item.receivedDate || todayISO(),
      numberIdentifier: item.numberIdentifier,
      type: item.type,
      supplier: item.supplier,
      client: item.client,
      name: item.name,
      quantity: item.quantity ? String(item.quantity) : '',
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
    const quantityNum = parseFloat(form.quantity) || 0;
    const netWeightNum = parseFloat(form.netWeight) || 0;
    const grossWeightNum = parseFloat(form.grossWeight) || 0;
    const totalNetWeightNum = parseFloat(form.totalNetWeight) || 0;
    const totalGrossWeightNum = parseFloat(form.totalGrossWeight) || 0;
    const priceNum = parseFloat(form.price) || 0;

    const payload: ProductItem = {
      id: editing ? editing.id : uuidv4(),
      receivedDate: form.receivedDate || todayISO(),
      numberIdentifier: form.numberIdentifier.trim(),
      type: form.type.trim(),
      supplier: form.supplier.trim(),
      client: form.client.trim(),
      name: form.name.trim(),
      quantity: quantityNum,
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: ProductItem) => {
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
    form.client.trim() &&
    form.name.trim() &&
    parseFloat(form.quantity) > 0 &&
    parseFloat(form.netWeight) > 0 &&
    parseFloat(form.grossWeight) > 0 &&
    parseFloat(form.totalNetWeight) > 0 &&
    parseFloat(form.totalGrossWeight) > 0 &&
    parseFloat(form.price) > 0;

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('tayyorMahsulotlarAngrenPage.currency.uzs');
      case 'USD':
        return t('tayyorMahsulotlarAngrenPage.currency.usd');
      case 'RUB':
        return t('tayyorMahsulotlarAngrenPage.currency.rub');
      case 'EUR':
        return t('tayyorMahsulotlarAngrenPage.currency.eur');
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
              <Typography variant="h4">{t('tayyorMahsulotlarAngrenPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('tayyorMahsulotlarAngrenPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('tayyorMahsulotlarAngrenPage.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table
                size="medium"
                sx={{
                  minWidth: 1500,
                  '& th, & td': { py: 1.5, px: 1.25 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 140 }}>{t('tayyorMahsulotlarAngrenPage.client')}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>{t('tayyorMahsulotlarAngrenPage.receivedDate')}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{t('tayyorMahsulotlarAngrenPage.supplier')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('tayyorMahsulotlarAngrenPage.numberIdentifier')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('tayyorMahsulotlarAngrenPage.type')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('tayyorMahsulotlarAngrenPage.name')}</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>{t('tayyorMahsulotlarAngrenPage.quantity')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('tayyorMahsulotlarAngrenPage.netWeight')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('tayyorMahsulotlarAngrenPage.grossWeight')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('tayyorMahsulotlarAngrenPage.totalNetWeight')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('tayyorMahsulotlarAngrenPage.totalGrossWeight')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('tayyorMahsulotlarAngrenPage.price')}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{t('tayyorMahsulotlarAngrenPage.totalPrice')}</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>{t('tayyorMahsulotlarAngrenPage.description')}</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>
                      {t('tayyorMahsulotlarAngrenPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15}>
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
                            {t('tayyorMahsulotlarAngrenPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('tayyorMahsulotlarAngrenPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2">{item.client}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.receivedDate}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {item.supplier || '—'}
                          </Typography>
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
                          <Typography variant="body2">{item.quantity.toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.netWeight.toLocaleString()} {t('tayyorMahsulotlarAngrenPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.grossWeight.toLocaleString()} {t('tayyorMahsulotlarAngrenPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.totalNetWeight.toLocaleString()} {t('tayyorMahsulotlarAngrenPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.totalGrossWeight.toLocaleString()} {t('tayyorMahsulotlarAngrenPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.price.toLocaleString()} {currencyLabel(item.priceCurrency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(item.quantity * item.price).toLocaleString()}{' '}
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
        <DialogTitle>
          {editing ? t('tayyorMahsulotlarAngrenPage.edit') : t('tayyorMahsulotlarAngrenPage.add')}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('tayyorMahsulotlarAngrenPage.receivedDate')}
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
                  label={t('tayyorMahsulotlarAngrenPage.supplier')}
                  value={form.supplier}
                  onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('tayyorMahsulotlarAngrenPage.numberIdentifier')}
                  value={form.numberIdentifier}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, numberIdentifier: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('tayyorMahsulotlarAngrenPage.type')}
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('tayyorMahsulotlarAngrenPage.client')}
                  value={form.client}
                  onChange={(e) => setForm((prev) => ({ ...prev, client: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('tayyorMahsulotlarAngrenPage.name')}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('tayyorMahsulotlarAngrenPage.quantity')}
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('tayyorMahsulotlarAngrenPage.quantity') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('tayyorMahsulotlarAngrenPage.netWeight')}
                  value={form.netWeight}
                  onChange={(e) => setForm((prev) => ({ ...prev, netWeight: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('tayyorMahsulotlarAngrenPage.netWeight') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('tayyorMahsulotlarAngrenPage.grossWeight')}
                  value={form.grossWeight}
                  onChange={(e) => setForm((prev) => ({ ...prev, grossWeight: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('tayyorMahsulotlarAngrenPage.grossWeight') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('tayyorMahsulotlarAngrenPage.totalNetWeight')}
                  value={form.totalNetWeight}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, totalNetWeight: e.target.value }))
                  }
                  inputProps={{
                    min: 0,
                    step: '0.01',
                    placeholder: t('tayyorMahsulotlarAngrenPage.totalNetWeight'),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('tayyorMahsulotlarAngrenPage.totalGrossWeight')}
                  value={form.totalGrossWeight}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, totalGrossWeight: e.target.value }))
                  }
                  inputProps={{
                    min: 0,
                    step: '0.01',
                    placeholder: t('tayyorMahsulotlarAngrenPage.totalGrossWeight'),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('tayyorMahsulotlarAngrenPage.price')}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('tayyorMahsulotlarAngrenPage.price') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t('tayyorMahsulotlarAngrenPage.priceCurrency')}
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
                  label={t('tayyorMahsulotlarAngrenPage.description')}
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
              {t('tayyorMahsulotlarAngrenPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('tayyorMahsulotlarAngrenPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('tayyorMahsulotlarAngrenPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('tayyorMahsulotlarAngrenPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('tayyorMahsulotlarAngrenPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('tayyorMahsulotlarAngrenPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('tayyorMahsulotlarAngrenPage.delete')}
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
        labels={{ edit: t('tayyorMahsulotlarAngrenPage.edit'), delete: t('tayyorMahsulotlarAngrenPage.delete') }}
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

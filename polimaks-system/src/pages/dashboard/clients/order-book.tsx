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

import { Iconify } from 'src/components/iconify';

type Material = 'BOPP' | 'CPP' | 'PE' | 'PET';

type OrderBookItem = {
  id: string;
  date: string; // ISO date - order creation
  orderNumber: string;
  client: string;
  title: string;
  quantityKg: number;
  material: Material;
  filmThickness: number; // microns
  filmWidth: number; // mm
  cylinderLength: number; // mm
  cylinderCount: number;
  startDate: string; // ISO date - production start
  endDate: string; // ISO date - production end
};

const MATERIALS: Material[] = ['BOPP', 'CPP', 'PE', 'PET'];

const STORAGE_KEY = 'clients-order-book';

const todayISO = () => new Date().toISOString().slice(0, 10);

const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = now.getTime().toString().slice(-4);
  return `ORD-${year}-${timestamp}`;
};

const normalizeItems = (items: (Partial<OrderBookItem> & { id?: string })[]): OrderBookItem[] =>
  items.map((item, index) => ({
    id: item.id || `order-${index}`,
    date: item.date || todayISO(),
    orderNumber: item.orderNumber || generateOrderNumber(),
    client: item.client || '',
    title: item.title || '',
    quantityKg: typeof item.quantityKg === 'number' ? item.quantityKg : Number(item.quantityKg) || 0,
    material: (item.material as Material) || 'BOPP',
    filmThickness:
      typeof item.filmThickness === 'number' ? item.filmThickness : Number(item.filmThickness) || 0,
    filmWidth: typeof item.filmWidth === 'number' ? item.filmWidth : Number(item.filmWidth) || 0,
    cylinderLength:
      typeof item.cylinderLength === 'number' ? item.cylinderLength : Number(item.cylinderLength) || 0,
    cylinderCount:
      typeof item.cylinderCount === 'number' ? item.cylinderCount : Number(item.cylinderCount) || 0,
    startDate: item.startDate || todayISO(),
    endDate: item.endDate || todayISO(),
  }));

const seedData: OrderBookItem[] = [
  {
    id: 'order-1',
    date: '2024-12-01',
    orderNumber: 'ORD-2024-001',
    client: 'PoliTex Group',
    title: 'Упаковочная пленка BOPP',
    quantityKg: 1500,
    material: 'BOPP',
    filmThickness: 20,
    filmWidth: 1000,
    cylinderLength: 320,
    cylinderCount: 8,
    startDate: '2024-12-05',
    endDate: '2024-12-15',
  },
  {
    id: 'order-2',
    date: '2024-12-02',
    orderNumber: 'ORD-2024-002',
    client: 'GreenPack LLC',
    title: 'Прозрачная пленка CPP',
    quantityKg: 800,
    material: 'CPP',
    filmThickness: 25,
    filmWidth: 800,
    cylinderLength: 280,
    cylinderCount: 6,
    startDate: '2024-12-10',
    endDate: '2024-12-20',
  },
];

export default function ClientsOrderBookPage() {
  const { t } = useTranslate('pages');

  const title = `${t('clients.items.order_book.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<OrderBookItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return normalizeItems(JSON.parse(stored) as OrderBookItem[]);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return normalizeItems(seedData as OrderBookItem[]);
  }, []);

  const [items, setItems] = useState<OrderBookItem[]>(initialData);
  const [editing, setEditing] = useState<OrderBookItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<OrderBookItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OrderBookItem | null>(null);
  const [form, setForm] = useState<
    Omit<OrderBookItem, 'id' | 'quantityKg' | 'filmThickness' | 'filmWidth' | 'cylinderLength' | 'cylinderCount'> & {
      quantityKg: string;
      filmThickness: string;
      filmWidth: string;
      cylinderLength: string;
      cylinderCount: string;
    }
  >({
    date: todayISO(),
    orderNumber: generateOrderNumber(),
    client: '',
    title: '',
    quantityKg: '',
    material: 'BOPP',
    filmThickness: '',
    filmWidth: '',
    cylinderLength: '',
    cylinderCount: '',
    startDate: todayISO(),
    endDate: todayISO(),
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: OrderBookItem[]) => OrderBookItem[]) => {
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
      date: todayISO(),
      orderNumber: generateOrderNumber(),
      client: '',
      title: '',
      quantityKg: '',
      material: 'BOPP',
      filmThickness: '',
      filmWidth: '',
      cylinderLength: '',
      cylinderCount: '',
      startDate: todayISO(),
      endDate: todayISO(),
    });
    dialog.onTrue();
  };

  const openEdit = (item: OrderBookItem) => {
    setEditing(item);
    setForm({
      date: item.date || todayISO(),
      orderNumber: item.orderNumber,
      client: item.client,
      title: item.title,
      quantityKg: item.quantityKg ? String(item.quantityKg) : '',
      material: item.material,
      filmThickness: item.filmThickness ? String(item.filmThickness) : '',
      filmWidth: item.filmWidth ? String(item.filmWidth) : '',
      cylinderLength: item.cylinderLength ? String(item.cylinderLength) : '',
      cylinderCount: item.cylinderCount ? String(item.cylinderCount) : '',
      startDate: item.startDate || todayISO(),
      endDate: item.endDate || todayISO(),
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const quantityKgNum = parseFloat(form.quantityKg) || 0;
    const filmThicknessNum = parseFloat(form.filmThickness) || 0;
    const filmWidthNum = parseFloat(form.filmWidth) || 0;
    const cylinderLengthNum = parseFloat(form.cylinderLength) || 0;
    const cylinderCountNum = parseInt(form.cylinderCount, 10) || 0;

    const payload: OrderBookItem = {
      id: editing ? editing.id : uuidv4(),
      date: form.date || todayISO(),
      orderNumber: form.orderNumber.trim() || generateOrderNumber(),
      client: form.client.trim(),
      title: form.title.trim(),
      quantityKg: quantityKgNum,
      material: form.material,
      filmThickness: filmThicknessNum,
      filmWidth: filmWidthNum,
      cylinderLength: cylinderLengthNum,
      cylinderCount: cylinderCountNum,
      startDate: form.startDate || todayISO(),
      endDate: form.endDate || todayISO(),
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: OrderBookItem) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const canSave =
    form.client.trim() &&
    form.title.trim() &&
    parseFloat(form.quantityKg) > 0 &&
    parseFloat(form.filmThickness) > 0 &&
    parseFloat(form.filmWidth) > 0 &&
    parseFloat(form.cylinderLength) > 0 &&
    parseInt(form.cylinderCount, 10) > 0 &&
    form.startDate &&
    form.endDate &&
    form.startDate <= form.endDate;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{t('orderBookPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('orderBookPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('orderBookPage.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table
                size="medium"
                sx={{
                  minWidth: 1800,
                  '& th, & td': { py: 1.5, px: 1.25 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 120 }}>{t('orderBookPage.date')}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>{t('orderBookPage.orderNumber')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('orderBookPage.client')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('orderBookPage.orderTitle')}</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>{t('orderBookPage.quantityKg')}</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>{t('orderBookPage.material')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('orderBookPage.filmThickness')}</TableCell>
                    <TableCell sx={{ minWidth: 130 }}>{t('orderBookPage.filmWidth')}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>{t('orderBookPage.cylinderLength')}</TableCell>
                    <TableCell sx={{ minWidth: 130 }}>{t('orderBookPage.cylinderCount')}</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>{t('orderBookPage.startDate')}</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>{t('orderBookPage.endDate')}</TableCell>
                    <TableCell align="right" sx={{ width: 80 }}>
                      {t('orderBookPage.actions')}
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
                            {t('orderBookPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('orderBookPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2">{item.date}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.orderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.client}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{item.title}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.quantityKg.toLocaleString()} {t('orderBookPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.material}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.filmThickness} {t('orderBookPage.microns')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.filmWidth} {t('orderBookPage.mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.cylinderLength} {t('orderBookPage.mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.cylinderCount} {t('orderBookPage.pcs')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.startDate}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.endDate}</Typography>
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
          {editing ? t('orderBookPage.edit') : t('orderBookPage.add')}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              {/* Row 1 */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('orderBookPage.date')}
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value || todayISO() }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('orderBookPage.orderNumber')}
                  value={form.orderNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, orderNumber: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('orderBookPage.client')}
                  value={form.client}
                  onChange={(e) => setForm((prev) => ({ ...prev, client: e.target.value }))}
                />
              </Grid>

              {/* Row 2 */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderBookPage.orderTitle')}
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.quantityKg')}
                  value={form.quantityKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantityKg: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('orderBookPage.quantityKg') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  label={t('orderBookPage.material')}
                  value={form.material}
                  onChange={(e) => setForm((prev) => ({ ...prev, material: e.target.value as Material }))}
                >
                  {MATERIALS.map((material) => (
                    <MenuItem key={material} value={material}>
                      {material}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Row 3 */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.filmThickness')}
                  value={form.filmThickness}
                  onChange={(e) => setForm((prev) => ({ ...prev, filmThickness: e.target.value }))}
                  inputProps={{ min: 0, step: '0.1', placeholder: t('orderBookPage.filmThickness') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.filmWidth')}
                  value={form.filmWidth}
                  onChange={(e) => setForm((prev) => ({ ...prev, filmWidth: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('orderBookPage.filmWidth') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.cylinderLength')}
                  value={form.cylinderLength}
                  onChange={(e) => setForm((prev) => ({ ...prev, cylinderLength: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('orderBookPage.cylinderLength') }}
                />
              </Grid>

              {/* Row 4 */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.cylinderCount')}
                  value={form.cylinderCount}
                  onChange={(e) => setForm((prev) => ({ ...prev, cylinderCount: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('orderBookPage.cylinderCount') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('orderBookPage.startDate')}
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value || todayISO() }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('orderBookPage.endDate')}
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value || todayISO() }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('orderBookPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('orderBookPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('orderBookPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('orderBookPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('orderBookPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('orderBookPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('orderBookPage.delete')}
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
          {t('orderBookPage.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuItem) {
              setPendingDelete(menuItem);
              deleteDialog.onTrue();
            }
            closeMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {t('orderBookPage.delete')}
        </MenuItem>
      </Menu>
    </>
  );
}
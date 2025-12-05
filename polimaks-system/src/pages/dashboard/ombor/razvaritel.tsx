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
import seedData from 'src/data/razvaritel.json';

import { Iconify } from 'src/components/iconify';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';

type RazvaritelType = 'eaf' | 'etilin' | 'metoksil';

type RazvaritelItem = {
  id: string;
  type: RazvaritelType;
  totalLiter: number;
  pricePerLiter: number;
  priceCurrency: Currency;
  seriyaNumber: string;
  createdDate: string;
  supplier: string;
  description: string;
};

const STORAGE_KEY = 'ombor-razvaritel';

const todayISO = () => new Date().toISOString().slice(0, 10);

const normalizeItems = (items: (Partial<RazvaritelItem> & { id?: string })[]): RazvaritelItem[] =>
  items.map((item, index) => ({
    id: item.id || `razvaritel-${index}`,
    type: (item.type as RazvaritelType) || 'eaf',
    totalLiter: typeof item.totalLiter === 'number' ? item.totalLiter : Number(item.totalLiter) || 0,
    pricePerLiter:
      typeof item.pricePerLiter === 'number'
        ? item.pricePerLiter
        : Number(item.pricePerLiter) || 0,
    priceCurrency: (item.priceCurrency as Currency) || 'UZS',
    seriyaNumber: item.seriyaNumber || '',
    createdDate: item.createdDate || todayISO(),
    supplier: item.supplier || '',
    description: item.description || '',
  }));

export default function RazvaritelPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.items.razvaritel.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<RazvaritelItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return normalizeItems(JSON.parse(stored) as RazvaritelItem[]);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return normalizeItems(seedData as RazvaritelItem[]);
  }, []);

  const [items, setItems] = useState<RazvaritelItem[]>(initialData);
  const [editing, setEditing] = useState<RazvaritelItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<RazvaritelItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RazvaritelItem | null>(null);
  const [form, setForm] = useState<
    Omit<RazvaritelItem, 'id' | 'totalLiter' | 'pricePerLiter'> & {
      totalLiter: string;
      pricePerLiter: string;
    }
  >({
    type: 'eaf',
    totalLiter: '',
    pricePerLiter: '',
    priceCurrency: 'UZS',
    seriyaNumber: '',
    createdDate: todayISO(),
    supplier: '',
    description: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: RazvaritelItem[]) => RazvaritelItem[]) => {
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
      type: 'eaf',
      totalLiter: '',
      pricePerLiter: '',
      priceCurrency: 'UZS',
      seriyaNumber: '',
      createdDate: todayISO(),
      description: '',
    });
    dialog.onTrue();
  };

  const openEdit = (item: RazvaritelItem) => {
    setEditing(item);
    setForm({
      type: item.type,
      totalLiter: item.totalLiter ? String(item.totalLiter) : '',
      pricePerLiter: item.pricePerLiter ? String(item.pricePerLiter) : '',
      priceCurrency: item.priceCurrency,
      seriyaNumber: item.seriyaNumber,
      createdDate: item.createdDate || todayISO(),
      supplier: item.supplier || '',
      description: item.description,
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const totalNum = parseFloat(form.totalLiter) || 0;
    const priceNum = parseFloat(form.pricePerLiter) || 0;
    const payload: RazvaritelItem = {
      id: editing ? editing.id : uuidv4(),
      type: form.type,
      totalLiter: totalNum,
      pricePerLiter: priceNum,
      priceCurrency: form.priceCurrency,
      seriyaNumber: form.seriyaNumber.trim(),
      createdDate: form.createdDate || todayISO(),
      supplier: form.supplier.trim(),
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: RazvaritelItem) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const canSave =
    parseFloat(form.totalLiter) > 0 &&
    parseFloat(form.pricePerLiter) > 0 &&
    form.seriyaNumber.trim() &&
    form.createdDate &&
    form.supplier.trim();

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('razvaritelPage.currency.uzs');
      case 'USD':
        return t('razvaritelPage.currency.usd');
      case 'RUB':
        return t('razvaritelPage.currency.rub');
      case 'EUR':
        return t('razvaritelPage.currency.eur');
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
              <Typography variant="h4">{t('razvaritelPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('razvaritelPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('razvaritelPage.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table
                size="medium"
                sx={{
                  minWidth: 1200,
                  '& th, & td': { py: 1.5, px: 1.25 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 180 }}>{t('razvaritelPage.type')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('razvaritelPage.totalLiter')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('razvaritelPage.price')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('razvaritelPage.totalPrice')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('razvaritelPage.seriya')}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{t('razvaritelPage.receivedDate')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('razvaritelPage.supplier')}</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>{t('razvaritelPage.description')}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      {t('razvaritelPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
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
                            {t('razvaritelPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('razvaritelPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ textTransform: 'uppercase' }}>
                          <Typography variant="subtitle2">{item.type}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.totalLiter.toLocaleString()} {t('razvaritelPage.liter')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.pricePerLiter.toLocaleString()} {currencyLabel(item.priceCurrency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(item.totalLiter * item.pricePerLiter).toLocaleString()}{' '}
                            {currencyLabel(item.priceCurrency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.seriyaNumber}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {item.supplier || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.createdDate}</Typography>
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? t('razvaritelPage.edit') : t('razvaritelPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t('razvaritelPage.type')}
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as RazvaritelType }))}
                >
                  {(['eaf', 'etilin', 'metoksil'] as RazvaritelType[]).map((opt) => (
                    <MenuItem key={opt} value={opt} sx={{ textTransform: 'uppercase' }}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('razvaritelPage.totalLiter')}
                  value={form.totalLiter}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalLiter: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('razvaritelPage.totalLiter') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('razvaritelPage.pricePerLiter')}
                  value={form.pricePerLiter}
                  onChange={(e) => setForm((prev) => ({ ...prev, pricePerLiter: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('razvaritelPage.pricePerLiter') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t('razvaritelPage.priceCurrency')}
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
                  label={t('razvaritelPage.seriya')}
                  value={form.seriyaNumber}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, seriyaNumber: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('razvaritelPage.receivedDate')}
                  value={form.createdDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, createdDate: e.target.value || todayISO() }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('razvaritelPage.supplier')}
                  value={form.supplier}
                  onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('razvaritelPage.description')}
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
              {t('razvaritelPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('razvaritelPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('razvaritelPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('razvaritelPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('razvaritelPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('razvaritelPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('razvaritelPage.delete')}
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
        labels={{ edit: t('razvaritelPage.edit'), delete: t('razvaritelPage.delete') }}
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

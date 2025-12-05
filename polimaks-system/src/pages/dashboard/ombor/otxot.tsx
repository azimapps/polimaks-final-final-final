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
import seedData from 'src/data/otxot.json';

import { Iconify } from 'src/components/iconify';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';

type OtxotItem = {
  id: string;
  title: string;
  totalKg: number;
  pricePerKg: number;
  priceCurrency: Currency;
  createdDate: string;
  description: string;
};

const STORAGE_KEY = 'ombor-otxot';

const todayISO = () => new Date().toISOString().slice(0, 10);

const normalizeItems = (items: (Partial<OtxotItem> & { id?: string })[]): OtxotItem[] =>
  items.map((item, index) => ({
    id: item.id || `otxot-${index}`,
    title: item.title || '',
    totalKg: typeof item.totalKg === 'number' ? item.totalKg : Number(item.totalKg) || 0,
    pricePerKg:
      typeof item.pricePerKg === 'number' ? item.pricePerKg : Number(item.pricePerKg) || 0,
    priceCurrency: (item.priceCurrency as Currency) || 'UZS',
    createdDate: item.createdDate || todayISO(),
    description: item.description || '',
  }));

export default function OtxotPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.items.otxot.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<OtxotItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return normalizeItems(JSON.parse(stored) as OtxotItem[]);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return normalizeItems(seedData as OtxotItem[]);
  }, []);

  const [items, setItems] = useState<OtxotItem[]>(initialData);
  const [editing, setEditing] = useState<OtxotItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<OtxotItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OtxotItem | null>(null);
  const [form, setForm] = useState<
    Omit<OtxotItem, 'id' | 'pricePerKg' | 'totalKg'> & { pricePerKg: string; totalKg: string }
  >({
    title: '',
    totalKg: '',
    pricePerKg: '',
    priceCurrency: 'UZS',
    createdDate: todayISO(),
    description: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: OtxotItem[]) => OtxotItem[]) => {
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
      title: '',
      totalKg: '',
      pricePerKg: '',
      priceCurrency: 'UZS',
      createdDate: todayISO(),
      description: '',
    });
    dialog.onTrue();
  };

  const openEdit = (item: OtxotItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      totalKg: item.totalKg ? String(item.totalKg) : '',
      pricePerKg: item.pricePerKg ? String(item.pricePerKg) : '',
      priceCurrency: item.priceCurrency,
      createdDate: item.createdDate || todayISO(),
      description: item.description,
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const priceNum = parseFloat(form.pricePerKg) || 0;
    const totalNum = parseFloat(form.totalKg) || 0;
    const payload: OtxotItem = {
      id: editing ? editing.id : uuidv4(),
      title: form.title.trim(),
      totalKg: totalNum,
      pricePerKg: priceNum,
      priceCurrency: form.priceCurrency,
      createdDate: form.createdDate || todayISO(),
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: OtxotItem) => {
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
    parseFloat(form.pricePerKg) > 0 &&
    form.createdDate;

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('otxotPage.currency.uzs');
      case 'USD':
        return t('otxotPage.currency.usd');
      case 'RUB':
        return t('otxotPage.currency.rub');
      case 'EUR':
        return t('otxotPage.currency.eur');
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
              <Typography variant="h4">{t('otxotPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('otxotPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('otxotPage.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table
                size="medium"
                sx={{
                  minWidth: 1100,
                  '& th, & td': { py: 1.5, px: 1.25 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 220 }}>{t('otxotPage.titleLabel')}</TableCell>
                    <TableCell sx={{ width: 160 }}>{t('otxotPage.totalKg')}</TableCell>
                    <TableCell sx={{ width: 200 }}>{t('otxotPage.price')}</TableCell>
                    <TableCell sx={{ width: 200 }}>{t('otxotPage.totalPrice')}</TableCell>
                    <TableCell sx={{ width: 180 }}>{t('otxotPage.receivedDate')}</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>{t('otxotPage.description')}</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>
                      {t('otxotPage.actions')}
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
                            {t('otxotPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('otxotPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{item.title}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.totalKg.toLocaleString()} {t('otxotPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.pricePerKg.toLocaleString()} {currencyLabel(item.priceCurrency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(item.totalKg * item.pricePerKg).toLocaleString()}{' '}
                            {currencyLabel(item.priceCurrency)}
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('otxotPage.edit') : t('otxotPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('otxotPage.titleLabel')}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <TextField
              type="number"
              label={t('otxotPage.totalKg')}
              value={form.totalKg}
              onChange={(e) => setForm((prev) => ({ ...prev, totalKg: e.target.value }))}
              inputProps={{ min: 0, step: '0.01', placeholder: t('otxotPage.totalKg') }}
            />
            <TextField
              fullWidth
              type="date"
              label={t('otxotPage.receivedDate')}
              value={form.createdDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, createdDate: e.target.value || todayISO() }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                fullWidth
                type="number"
                label={t('otxotPage.price')}
                value={form.pricePerKg}
                onChange={(e) => setForm((prev) => ({ ...prev, pricePerKg: e.target.value }))}
                inputProps={{ min: 0, step: '0.01', placeholder: t('otxotPage.price') }}
              />
              <TextField
                select
                fullWidth
                label={t('otxotPage.priceCurrency')}
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
            </Stack>
            <TextField
              label={t('otxotPage.description')}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              multiline
              minRows={2}
            />

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {/* TODO: replace static JSON/local storage with real API endpoints when backend is available */}
              {t('otxotPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('otxotPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('otxotPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('otxotPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('otxotPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('otxotPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('otxotPage.delete')}
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
        labels={{ edit: t('otxotPage.edit'), delete: t('otxotPage.delete') }}
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

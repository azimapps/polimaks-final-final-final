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
import seedData from 'src/data/zapchastlar.json';

import { Iconify } from 'src/components/iconify';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';

type PartItem = {
  id: string;
  title: string;
  price: number;
  priceCurrency: Currency;
  description: string;
};

const STORAGE_KEY = 'ombor-zapchastlar';

export default function ZapchastlarPage() {
  const { t } = useTranslate('pages');
  const title = `${t('inventory.items.zapchastlar.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<PartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as PartItem[];
        } catch {
          // ignore corrupted data
        }
      }
    }
    return seedData as PartItem[];
  }, []);

  const [items, setItems] = useState<PartItem[]>(initialData);
  const [editing, setEditing] = useState<PartItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<PartItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PartItem | null>(null);
  const [form, setForm] = useState<Omit<PartItem, 'id' | 'price'> & { price: string }>({
    title: '',
    price: '',
    priceCurrency: 'UZS',
    description: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: PartItem[]) => PartItem[]) => {
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
    setForm({ title: '', price: '', priceCurrency: 'UZS', description: '' });
    dialog.onTrue();
  };

  const openEdit = (item: PartItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      price: item.price ? String(item.price) : '',
      priceCurrency: item.priceCurrency,
      description: item.description,
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const priceNum = parseFloat(form.price) || 0;
    const payload: PartItem = {
      id: editing ? editing.id : uuidv4(),
      title: form.title.trim(),
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: PartItem) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const canSave = form.title.trim() && parseFloat(form.price) > 0;

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('zapchastlarPage.currency.uzs');
      case 'USD':
        return t('zapchastlarPage.currency.usd');
      case 'RUB':
        return t('zapchastlarPage.currency.rub');
      case 'EUR':
        return t('zapchastlarPage.currency.eur');
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
              <Typography variant="h4">{t('zapchastlarPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('zapchastlarPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('zapchastlarPage.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 240 }}>{t('zapchastlarPage.titleLabel')}</TableCell>
                    <TableCell sx={{ width: 200 }}>{t('zapchastlarPage.price')}</TableCell>
                    <TableCell>{t('zapchastlarPage.description')}</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>
                      {t('zapchastlarPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
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
                            {t('zapchastlarPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('zapchastlarPage.add')}
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
                            {item.price.toLocaleString()} {currencyLabel(item.priceCurrency)}
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('zapchastlarPage.edit') : t('zapchastlarPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('zapchastlarPage.titleLabel')}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                fullWidth
                type="number"
                label={t('zapchastlarPage.price')}
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                inputProps={{ min: 0, step: '0.01', placeholder: t('zapchastlarPage.price') }}
              />
              <TextField
                select
                fullWidth
                label={t('zapchastlarPage.priceCurrency')}
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
              label={t('zapchastlarPage.description')}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              multiline
              minRows={2}
            />

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {/* TODO: replace static JSON/local storage with real API endpoints when backend is available */}
              {t('zapchastlarPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('zapchastlarPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('zapchastlarPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('zapchastlarPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('zapchastlarPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('zapchastlarPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('zapchastlarPage.delete')}
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
        labels={{ edit: t('zapchastlarPage.edit'), delete: t('zapchastlarPage.delete') }}
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

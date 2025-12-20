/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';

import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
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
import seedData from 'src/data/silindir.json';
import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';
type Origin = 'china' | 'germany';

type SilindirItem = {
  id: string;
  origin: Origin;
  seriyaNumber: string;
  length: number;
  diameter: number;
  quantity: number;
  usage: number;
  usageLimit: number;
  price: number;
  priceCurrency: Currency;
  createdDate: string;
  description: string;
};

const STORAGE_KEY = 'ombor-silindir';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function SilindirPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();

  const title = `${t('inventory.items.silindir.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<SilindirItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return (JSON.parse(stored) as SilindirItem[]).map((item, index) => ({
            ...item,
            id: item.id || `silindir-${index}`,
            createdDate: item.createdDate || todayISO(),
            quantity: typeof (item as any).quantity === 'number' ? (item as any).quantity : Number((item as any).quantity) || 0,
          }));
        } catch {
          // ignore corrupted data
        }
      }
    }
    return (seedData as SilindirItem[]).map((item, index) => ({
      ...item,
      id: item.id || `silindir-${index}`,
      createdDate: item.createdDate || todayISO(),
      quantity: typeof (item as any).quantity === 'number' ? (item as any).quantity : Number((item as any).quantity) || 0,
    }));
  }, []);

  const [items, setItems] = useState<SilindirItem[]>(initialData);
  const [editing, setEditing] = useState<SilindirItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<SilindirItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SilindirItem | null>(null);
  const [transactionsTarget, setTransactionsTarget] = useState<SilindirItem | null>(null);
  const [filterLengthMin, setFilterLengthMin] = useState('');
  const [filterDiameterMin, setFilterDiameterMin] = useState('');
  const [filterQuantityMin, setFilterQuantityMin] = useState('');
  const [form, setForm] = useState<
    Omit<
      SilindirItem,
      'id' | 'length' | 'diameter' | 'usage' | 'usageLimit' | 'price' | 'quantity'
    > & {
      length: string;
      diameter: string;
      quantity: string;
      usage: string;
      usageLimit: string;
      price: string;
    }
  >({
    origin: 'china',
    seriyaNumber: '',
    length: '',
    diameter: '',
    quantity: '',
    usage: '',
    usageLimit: '',
    price: '',
    priceCurrency: 'UZS',
    createdDate: todayISO(),
    description: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();
  const transactionsDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: SilindirItem[]) => SilindirItem[]) => {
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
      origin: 'china',
      seriyaNumber: '',
      length: '',
      diameter: '',
      quantity: '',
      usage: '',
      usageLimit: '',
      price: '',
      priceCurrency: 'UZS',
      createdDate: todayISO(),
      description: '',
    });
    dialog.onTrue();
  };

  const openTransactionsSearch = () => {
    setTransactionsTarget(null);
    transactionsDialog.onTrue();
  };

  const openEdit = (item: SilindirItem) => {
    setEditing(item);
    setForm({
      origin: item.origin,
      seriyaNumber: item.seriyaNumber,
      length: item.length ? String(item.length) : '',
      diameter: item.diameter ? String(item.diameter) : '',
      quantity: item.quantity ? String(item.quantity) : '',
      usage: item.usage ? String(item.usage) : '',
      usageLimit: item.usageLimit ? String(item.usageLimit) : '',
      price: item.price ? String(item.price) : '',
      priceCurrency: item.priceCurrency,
      createdDate: item.createdDate || todayISO(),
      description: item.description,
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const payload: SilindirItem = {
      id: editing ? editing.id : uuidv4(),
      origin: form.origin,
      seriyaNumber: form.seriyaNumber.trim(),
      length: parseFloat(form.length) || 0,
      diameter: parseFloat(form.diameter) || 0,
      quantity: parseFloat(form.quantity) || 0,
      usage: parseFloat(form.usage) || 0,
      usageLimit: parseFloat(form.usageLimit) || 0,
      price: parseFloat(form.price) || 0,
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: SilindirItem) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const canSave =
    form.seriyaNumber.trim() &&
    parseFloat(form.length) > 0 &&
    parseFloat(form.diameter) > 0 &&
    parseFloat(form.quantity) > 0 &&
    parseFloat(form.usage) >= 0 &&
    parseFloat(form.usageLimit) > 0 &&
    parseFloat(form.price) > 0 &&
    form.createdDate;

  const originLabel = (origin: Origin) => {
    switch (origin) {
      case 'china':
        return t('silindirPage.origin.china');
      case 'germany':
        return t('silindirPage.origin.germany');
      default:
        return origin;
    }
  };

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('silindirPage.currency.uzs');
      case 'USD':
        return t('silindirPage.currency.usd');
      case 'RUB':
        return t('silindirPage.currency.rub');
      case 'EUR':
        return t('silindirPage.currency.eur');
      default:
        return code;
    }
  };

  const transactionsFilterOptions = createFilterOptions<SilindirItem>({
    stringify: (option) =>
      `${option.id} ${option.seriyaNumber} ${option.origin} ${option.length} ${option.diameter}`,
  });

  const formatTransactionsOption = (item: SilindirItem) => {
    const seriya = item.seriyaNumber || item.id;
    return `${seriya} · ${originLabel(item.origin)} · ${item.length}×${item.diameter}`;
  };

  const filteredItems = items.filter((item) => {
    const lengthOk = filterLengthMin ? item.length >= Number(filterLengthMin) : true;
    const diameterOk = filterDiameterMin ? item.diameter >= Number(filterDiameterMin) : true;
    const quantityOk = filterQuantityMin ? item.quantity >= Number(filterQuantityMin) : true;
    return lengthOk && diameterOk && quantityOk;
  });

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{t('silindirPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('silindirPage.subtitle')}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button variant="outlined" onClick={openTransactionsSearch}>
                {t('silindirPage.transactions')}
              </Button>
              <Button variant="contained" onClick={openAdd}>
                {t('silindirPage.add')}
              </Button>
            </Stack>
          </Stack>

          <Card sx={{ p: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
            <TextField
              type="number"
              size="small"
              label={`${t('silindirPage.length')} ≥`}
              value={filterLengthMin}
              onChange={(e) => setFilterLengthMin(e.target.value)}
              inputProps={{ min: 0, step: '0.01', placeholder: '0' }}
            />
            <TextField
              type="number"
              size="small"
              label={`${t('silindirPage.diameter')} ≥`}
              value={filterDiameterMin}
              onChange={(e) => setFilterDiameterMin(e.target.value)}
              inputProps={{ min: 0, step: '0.01', placeholder: '0' }}
            />
            <TextField
              type="number"
              size="small"
              label={`${t('silindirPage.quantity')} ≥`}
              value={filterQuantityMin}
              onChange={(e) => setFilterQuantityMin(e.target.value)}
              inputProps={{ min: 0, step: '1', placeholder: '0' }}
            />
          </Card>

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
                    <TableCell sx={{ minWidth: 180 }}>{t('silindirPage.receivedDate')}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{t('silindirPage.seriya')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('silindirPage.originLabel')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('silindirPage.length')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('silindirPage.diameter')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('silindirPage.quantity')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('silindirPage.usage')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('silindirPage.price')}</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>{t('silindirPage.description')}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      {t('silindirPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
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
                            {t('silindirPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('silindirPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2">{item.createdDate}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.seriyaNumber}</Typography>
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          <Typography variant="subtitle2">{originLabel(item.origin)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.length.toLocaleString()} {t('silindirPage.mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.diameter.toLocaleString()} {t('silindirPage.mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.quantity.toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.usage.toLocaleString()} / {item.usageLimit.toLocaleString()}{' '}
                            {t('silindirPage.usageUnit')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.price.toLocaleString()} {currencyLabel(item.priceCurrency)}
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? t('silindirPage.edit') : t('silindirPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t('silindirPage.originLabel')}
                  value={form.origin}
                  onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value as Origin }))}
                >
                  {(['china', 'germany'] as Origin[]).map((opt) => (
                    <MenuItem key={opt} value={opt} sx={{ textTransform: 'capitalize' }}>
                      {originLabel(opt)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('silindirPage.length')}
                  value={form.length}
                  onChange={(e) => setForm((prev) => ({ ...prev, length: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('silindirPage.length') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('silindirPage.diameter')}
                  value={form.diameter}
                  onChange={(e) => setForm((prev) => ({ ...prev, diameter: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('silindirPage.diameter') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('silindirPage.quantity')}
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('silindirPage.quantity') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('silindirPage.usage')}
                  value={form.usage}
                  onChange={(e) => setForm((prev) => ({ ...prev, usage: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('silindirPage.usage') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('silindirPage.usageLimit')}
                  value={form.usageLimit}
                  onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('silindirPage.usageLimit') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('silindirPage.price')}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  inputProps={{
                    min: 0,
                    step: '0.01',
                    placeholder: t('silindirPage.price'),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t('silindirPage.priceCurrency')}
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
                  label={t('silindirPage.seriya')}
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
                  label={t('silindirPage.receivedDate')}
                  value={form.createdDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, createdDate: e.target.value || todayISO() }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('silindirPage.description')}
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
              {t('silindirPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('silindirPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('silindirPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('silindirPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('silindirPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('silindirPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('silindirPage.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={transactionsDialog.value}
        onClose={transactionsDialog.onFalse}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('silindirPage.transactionsSearchTitle')}</DialogTitle>
        <DialogContent>
          <Autocomplete
            autoHighlight
            options={items}
            value={transactionsTarget}
            onChange={(_event, value) => {
              setTransactionsTarget(value);
              if (value?.id) {
                transactionsDialog.onFalse();
                navigate(paths.dashboard.inventory.silindirTransactions(value.id));
              }
            }}
            getOptionLabel={formatTransactionsOption}
            filterOptions={transactionsFilterOptions}
            noOptionsText={t('silindirPage.transactionsSearchEmpty')}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                label={t('silindirPage.transactionsSearchLabel')}
                placeholder={t('silindirPage.transactionsSearchPlaceholder')}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={transactionsDialog.onFalse} color="inherit">
            {t('silindirPage.cancel')}
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
        labels={{ edit: t('silindirPage.edit'), delete: t('silindirPage.delete') }}
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

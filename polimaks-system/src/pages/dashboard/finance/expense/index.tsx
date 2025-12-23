/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router';
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
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { notifyFinanceStorage } from '../finance-storage';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';
type ExpenseType = 'cash' | 'transfer';

type ExpenseItem = {
  id: string;
  name: string;
  type: ExpenseType;
  amount: number;
  currency: Currency;
  date: string;
  note: string;
};

type FinanceExpenseViewProps = {
  embedded?: boolean;
  method?: ExpenseType;
};

const STORAGE_KEY = 'finance-expense';
const todayISO = () => new Date().toISOString().slice(0, 10);
const DEFAULT_RATES: Record<Currency, number> = { USD: 1, EUR: 0.92, RUB: 90, UZS: 12500 };

export function FinanceExpenseView({ embedded = false, method }: FinanceExpenseViewProps) {
  const { t } = useTranslate('pages');
  const title = `${t('finance.expense.title')} | ${CONFIG.appName}`;
  const { method: routeMethod } = useParams() as { method?: string };
  const routeType = method ?? (routeMethod === 'cash' || routeMethod === 'transfer' ? routeMethod : null);
  const expenseTypes: { value: ExpenseType; label: string }[] = [
    { value: 'cash', label: t('finance.expense.types.cash') },
    { value: 'transfer', label: t('finance.expense.types.transfer') },
  ];

  const initialData = useMemo<ExpenseItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return (JSON.parse(stored) as ExpenseItem[]).map((item, index) => ({
            id: item.id || `expense-${index}`,
            name: item.name || '',
            type: (item.type as ExpenseType) || 'cash',
            amount: typeof item.amount === 'number' ? item.amount : Number(item.amount) || 0,
            currency: (item.currency as Currency) || 'UZS',
            date: item.date || todayISO(),
            note: item.note || '',
          }));
        } catch {
          // ignore corrupted data
        }
      }
    }
    return [];
  }, []);

  const [items, setItems] = useState<ExpenseItem[]>(initialData);
  const [editing, setEditing] = useState<ExpenseItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<ExpenseItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExpenseItem | null>(null);
  const [activeType, setActiveType] = useState<ExpenseType>(routeType ?? 'cash');
  const [form, setForm] = useState<{
    name: string;
    type: ExpenseType;
    amount: string;
    currency: Currency;
    date: string;
    note: string;
  }>({
    name: '',
    type: 'cash',
    amount: '',
    currency: 'UZS',
    date: todayISO(),
    note: '',
  });
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('UZS');
  const [rates, setRates] = useState<Record<Currency, number>>(DEFAULT_RATES);
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  useEffect(() => {
    if (routeType) {
      setActiveType(routeType);
    }
  }, [routeType]);

  const setItemsAndPersist = (updater: (prev: ExpenseItem[]) => ExpenseItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        notifyFinanceStorage();
      }
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', type: activeType, amount: '', currency: 'UZS', date: todayISO(), note: '' });
    dialog.onTrue();
  };

  const openEdit = (item: ExpenseItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      type: item.type,
      amount: item.amount ? String(item.amount) : '',
      currency: item.currency,
      date: item.date || todayISO(),
      note: item.note,
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const payload: ExpenseItem = {
      id: editing ? editing.id : uuidv4(),
      name: form.name.trim(),
      type: form.type,
      amount: parseFloat(form.amount) || 0,
      currency: form.currency,
      date: form.date || todayISO(),
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
    deleteDialog.onFalse();
    setPendingDelete(null);
    setMenuItem(null);
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: ExpenseItem) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const canSave = form.name.trim() && parseFloat(form.amount) > 0 && form.date;

  const filteredItems = useMemo(
    () => items.filter((item) => item.type === activeType),
    [items, activeType]
  );

  const totalInDisplay = useMemo(() => {
    const toRate = rates[displayCurrency] ?? 1;
    return filteredItems.reduce((sum, item) => {
      const fromRate = rates[item.currency] ?? 1;
      const converted = item.currency === displayCurrency ? item.amount : (item.amount / fromRate) * toRate;
      return sum + converted;
    }, 0);
  }, [filteredItems, displayCurrency, rates]);

  const latestDate = useMemo(() => {
    if (!filteredItems.length) return null;
    return filteredItems.map((i) => i.date).sort().at(-1);
  }, [filteredItems]);

  useEffect(() => {
    let active = true;
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('rate fetch failed');
        const data = (await res.json()) as { rates?: Record<string, number>; time_last_update_utc?: string };
        const fetched: Partial<Record<Currency, number>> = {};
        ['USD', 'EUR', 'RUB', 'UZS'].forEach((cur) => {
          if (data.rates?.[cur]) fetched[cur as Currency] = data.rates[cur];
        });
        if (active && Object.keys(fetched).length) {
          setRates((prev) => ({ ...prev, ...fetched }));
          setRateUpdatedAt(data.time_last_update_utc || new Date().toUTCString());
          setRateError(null);
        }
      } catch (err: any) {
        if (active) {
          setRateError(err?.message || 'rate fetch failed');
        }
      }
    };
    fetchRates();
    return () => {
      active = false;
    };
  }, []);

  const content = (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h4">{t('finance.expense.title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('finance.expense.description')}
          </Typography>
        </Box>

        <Button variant="contained" onClick={openAdd}>
          {t('finance.expense.add')}
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('finance.expense.totalEntries')}
            </Typography>
            <Typography variant="h5">{filteredItems.length}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('finance.expense.latestDate')} {latestDate || '—'}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography variant="subtitle2">{t('finance.expense.displayCurrency')}</Typography>
              <TextField
                select
                size="small"
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
                sx={{ minWidth: 120 }}
              >
                {(['UZS', 'USD', 'RUB', 'EUR'] as Currency[]).map((cur) => (
                  <MenuItem key={cur} value={cur}>
                    {cur}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Typography variant="h5" sx={{ mt: 1 }}>
              {totalInDisplay.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: rateError ? 'error.main' : 'text.secondary' }}>
              {rateError
                ? t('finance.expense.rateError')
                : t('finance.expense.rateUpdated', { date: rateUpdatedAt || t('finance.expense.rateUnknown') })}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {!routeType && (
        <Tabs
          value={activeType}
          onChange={(_event, value) => setActiveType(value as ExpenseType)}
          sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}
        >
          {expenseTypes.map((type) => (
            <Tab key={type.value} value={type.value} label={type.label} />
          ))}
        </Tabs>
      )}

      <Card>
        <TableContainer>
          <Table
            size="medium"
            sx={{
              minWidth: 960,
              '& th, & td': { py: 1.5, px: 1.25 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200 }}>{t('finance.expense.name')}</TableCell>
                <TableCell sx={{ minWidth: 160 }}>{t('finance.expense.amount')}</TableCell>
                <TableCell sx={{ minWidth: 140 }}>{t('finance.expense.currency')}</TableCell>
                <TableCell sx={{ minWidth: 140 }}>{t('finance.expense.date')}</TableCell>
                <TableCell sx={{ minWidth: 260 }}>{t('finance.expense.note')}</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>
                  {t('finance.expense.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
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
                        {t('finance.expense.empty')}
                      </Typography>
                      <Button size="small" onClick={openAdd} variant="outlined">
                        {t('finance.expense.add')}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{item.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.amount.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.currency}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.date}</Typography>
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
                        {item.note || '—'}
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
  );

  return (
    <>
      {!embedded && <title>{title}</title>}

      {embedded ? (
        content
      ) : (
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
          {content}
        </Container>
      )}

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('finance.expense.edit') : t('finance.expense.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label={t('finance.expense.name')}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              autoFocus
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('finance.expense.amount')}
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: '0' }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t('finance.expense.currency')}
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value as Currency }))}
                >
                  {(['UZS', 'USD', 'RUB', 'EUR'] as Currency[]).map((cur) => (
                    <MenuItem key={cur} value={cur}>
                      {cur}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t('finance.expense.type')}
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as ExpenseType }))}
                  disabled={Boolean(routeType)}
                >
                  {expenseTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              type="date"
              label={t('finance.expense.date')}
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value || todayISO() }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label={t('finance.expense.note')}
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('finance.expense.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('finance.expense.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('finance.expense.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('finance.expense.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('finance.expense.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('finance.expense.delete')}
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
          {t('finance.expense.edit')}
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
          {t('finance.expense.delete')}
        </MenuItem>
      </Menu>
    </>
  );
}

export default function FinanceExpensePage() {
  return <FinanceExpenseView />;
}

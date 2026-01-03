import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { Navigate, useParams } from 'react-router';
import { useMemo, useState, useEffect, useCallback, type MouseEvent, Fragment } from 'react';

import Menu from '@mui/material/Menu';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { CustomDateRangePicker, type UseDateRangePickerReturn, useDateRangePicker } from 'src/components/custom-date-range-picker';

import { useFinanceRates } from '../use-finance-rates';
import { useFinanceAnalytics } from '../use-finance-analytics';
import { FinanceMethodSummary } from '../finance-method-summary';
import { notifyFinanceStorage, FINANCE_STORAGE_EVENT } from '../finance-storage';
import {
  readClients,
  readOrderBookPromises,
  convertToDisplayCurrency,
  readTransactions as readClientTransactions,
} from '../../clients/transactions-data';

type Method = 'cash' | 'transfer';
type FinanceDirection = 'income' | 'expense';
type Currency = 'UZS' | 'USD';
type FinanceStorageEntry = {
  id: string;
  name: string;
  type: Method;
  amount: number;
  currency: Currency;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
  note: string;
  clientId?: string; // Optional client link
  exchangeRate?: number; // Snapshot rate at time of transaction
};

const STORAGE_KEYS = {
  income: 'finance-income',
  expense: 'finance-expense',
};

// Utils
const readFinanceStorage = (key: string, direction: FinanceDirection): FinanceStorageEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read finance storage:', e);
    return [];
  }
};

const persistFinanceEntry = (direction: FinanceDirection, entry: FinanceStorageEntry) => {
  const key = direction === 'income' ? STORAGE_KEYS.income : STORAGE_KEYS.expense;
  const current = readFinanceStorage(key, direction);
  const updated = [entry, ...current];
  localStorage.setItem(key, JSON.stringify(updated));
  notifyFinanceStorage();
};

const removeFinanceEntry = (direction: FinanceDirection, id: string) => {
  const key = direction === 'income' ? STORAGE_KEYS.income : STORAGE_KEYS.expense;
  const current = readFinanceStorage(key, direction);
  const updated = current.filter((e) => e.id !== id);
  localStorage.setItem(key, JSON.stringify(updated));
  notifyFinanceStorage();
};

const upsertFinanceEntry = (direction: FinanceDirection, entry: FinanceStorageEntry) => {
  const key = direction === 'income' ? STORAGE_KEYS.income : STORAGE_KEYS.expense;
  const current = readFinanceStorage(key, direction);
  const existingIndex = current.findIndex((e) => e.id === entry.id);

  let updated;
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = entry;
  } else {
    updated = [entry, ...current];
  }
  localStorage.setItem(key, JSON.stringify(updated));
  notifyFinanceStorage();
};

const timestampISO = () => new Date().toISOString();

const getInitialTransactionFormState = () => ({
  direction: 'income' as FinanceDirection,
  name: '',
  amount: '',
  currency: 'USD' as Currency,
  date: dayjs().format('YYYY-MM-DD'),
  note: '',
  clientId: '',
  exchangeRate: '',
});

const SUPPORTED_CURRENCIES: Currency[] = ['USD', 'UZS'];

const getEntryTimestamp = (entry: FinanceStorageEntry) => {
  // Use createdAt if available, else fallback to date (start of day)
  if (entry.createdAt) return new Date(entry.createdAt).getTime();
  return new Date(entry.date).getTime();
};

const readLegacyClientTransactions = (): Partial<FinanceStorageEntry>[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('clients-transactions');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item: any) => item.type === 'payment')
      .map((item: any) => ({
        id: item.id,
        name: item.clientName || 'Client Payment',
        type: 'cash',
        amount: Number(item.amount) || 0,
        currency: (SUPPORTED_CURRENCIES.includes(item.currency) ? item.currency : 'UZS') as Currency,
        date: item.date ? String(item.date).slice(0, 10) : new Date().toISOString().split('T')[0],
        createdAt: item.date,
        note: item.notes || '',
        exchangeRate: item.exchangeRate ? Number(item.exchangeRate) : undefined,
        clientId: item.clientId,
      }));
  } catch {
    return [];
  }
};

export default function FinanceMethodPage() {
  const params = useParams();
  const method = params.method as Method;
  const { t } = useTranslate('pages');
  const rangePicker = useDateRangePicker(dayjs(), dayjs());

  // Verify method is valid
  if (!['cash', 'transfer'].includes(method)) {
    return <Navigate to="/dashboard/finance/cash" replace />;
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between">
          <Typography variant="h4">
            {method === 'cash' ? t('finance.cashTitle') : t('finance.transferTitle')}
          </Typography>
          <Button
            variant="outlined"
            onClick={rangePicker.onOpen}
            startIcon={<Iconify icon="solar:calendar-date-bold" />}
          >
            {rangePicker.label}
          </Button>
          <CustomDateRangePicker
            open={rangePicker.open}
            startDate={rangePicker.startDate}
            endDate={rangePicker.endDate}
            onChangeStartDate={rangePicker.onChangeStartDate}
            onChangeEndDate={rangePicker.onChangeEndDate}
            onClose={rangePicker.onClose}
            error={rangePicker.error}
          />
        </Stack>

        <FinanceMethodSummary method={method} rangePicker={rangePicker} />

        <FinanceTransactionsSection
          method={method}
          rangePicker={rangePicker}
        />
      </Stack>
    </Container>
  );
}

// ----------------------------------------------------------------------

type CombinedEntry = FinanceStorageEntry & { direction: FinanceDirection };

function FinanceTransactionsSection({
  method,
  rangePicker,
}: {
  method: Method;
  rangePicker: UseDateRangePickerReturn;
}) {
  const { t: tPages } = useTranslate('pages');
  const { t: tNavbar } = useTranslate('navbar');
  const [filter, setFilter] = useState<'all' | FinanceDirection>('all');
  const [transactions, setTransactions] = useState<CombinedEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(getInitialTransactionFormState);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuEntry, setMenuEntry] = useState<CombinedEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<CombinedEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CombinedEntry | null>(null);
  const [selectedClientBalance, setSelectedClientBalance] = useState<number | null>(null);

  const { getRateForDate } = useFinanceRates();

  const { rangeStart, rangeEnd, dayBeforeStart } = useMemo(() => {
    const start = rangePicker.startDate ?? dayjs();
    const end = rangePicker.endDate ?? start;
    const [rangeStartDate, rangeEndDate] = start.isAfter(end) ? [end, start] : [start, end];
    return {
      rangeStart: rangeStartDate.format('YYYY-MM-DD'),
      rangeEnd: rangeEndDate.format('YYYY-MM-DD'),
      dayBeforeStart: rangeStartDate.subtract(1, 'day').format('YYYY-MM-DD'),
    };
  }, [rangePicker.startDate, rangePicker.endDate]);

  const { openingBalance } = useFinanceAnalytics(method, rangeStart, rangeEnd, dayBeforeStart);

  const dailyGroups = useMemo(() => {
    // 1. Sort global transactions ASC for calculation
    const sortedDetails = [...transactions].sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return getEntryTimestamp(a) - getEntryTimestamp(b);
    });

    // 2. Group
    const groups: Record<string, CombinedEntry[]> = {};
    const days: string[] = [];

    sortedDetails.forEach(t => {
      if (!groups[t.date]) {
        groups[t.date] = [];
        days.push(t.date);
      }
      groups[t.date].push(t);
    });

    // 3. Iterate ASC to calc balances
    const result: {
      date: string;
      start: { UZS: number; USD: number };
      end: { UZS: number; USD: number };
      entries: CombinedEntry[]
    }[] = [];

    const currentBalance = { ...openingBalance };

    days.forEach(date => {
      const dayEntries = groups[date];
      const start = { ...currentBalance };

      dayEntries.forEach(entry => {
        if (entry.direction === 'income') {
          if (entry.currency === 'UZS' || entry.currency === 'USD') {
            currentBalance[entry.currency] += entry.amount;
          }
        } else {
          if (entry.currency === 'UZS' || entry.currency === 'USD') {
            currentBalance[entry.currency] -= entry.amount;
          }
        }
      });

      const end = { ...currentBalance };

      result.push({
        date,
        start,
        end,
        entries: dayEntries.sort((a, b) => getEntryTimestamp(b) - getEntryTimestamp(a)),
      });
    });

    return result.reverse();
  }, [transactions, openingBalance]);

  const loadTransactions = useCallback(() => {
    const withinRange = (entry: FinanceStorageEntry) =>
      entry.date >= rangeStart && entry.date <= rangeEnd;

    const incomes = readFinanceStorage(STORAGE_KEYS.income, 'income')
      .filter((entry) => entry.type === method && withinRange(entry))
      .map((entry) => ({ ...entry, direction: 'income' as FinanceDirection }));
    const expenses = readFinanceStorage(STORAGE_KEYS.expense, 'expense')
      .filter((entry) => entry.type === method && withinRange(entry))
      .map((entry) => ({ ...entry, direction: 'expense' as FinanceDirection }));

    // 3. Read Client Transactions (Legacy only)
    const clients = method === 'cash' ? readLegacyClientTransactions() : [];

    // Normalize clients
    const normalizedClients: CombinedEntry[] = clients.map((t: any) => ({
      id: t.id,
      name: t.name || 'Client Payment',
      type: 'cash',
      amount: t.amount,
      currency: t.currency,
      date: t.date,
      createdAt: t.createdAt,
      note: t.note,
      direction: 'income',
      exchangeRate: t.exchangeRate,
      clientId: t.clientId
    }));

    const combined = [...incomes, ...expenses, ...normalizedClients].sort((a, b) => getEntryTimestamp(b) - getEntryTimestamp(a));
    setTransactions(combined);
  }, [method, rangeEnd, rangeStart]);

  useEffect(() => {
    loadTransactions();
    if (typeof window === 'undefined') return undefined;
    const handler = () => loadTransactions();
    window.addEventListener(FINANCE_STORAGE_EVENT, handler);
    return () => {
      window.removeEventListener(FINANCE_STORAGE_EVENT, handler);
    };
  }, [loadTransactions]);

  // Clients Integration
  const [clients] = useState(() => readClients());
  const clientBalances = useMemo(() => {
    const paidMap = new Map<string, number>();
    const promiseMap = new Map<string, number>();

    const clientTxs = readClientTransactions();
    const clientPromises = readOrderBookPromises();
    const all = [...clientTxs, ...clientPromises];

    all.forEach((tx) => {
      if (!tx.clientId) return;
      // We assume USD for basic debt calc if currency mixing, but for simplicity
      // we'll just sum raw or simple conversion.
      // Ideally reuse convertToDisplayCurrency but we need a fixed base.
      // Let's assume we want to know if they owe us in GENERAL.
      // For this feature, let's just use the raw amount if currency matches or converted to USD.
      // Actually, let's just stick to the logic from clients page:
      const converted = convertToDisplayCurrency(tx.amount, tx.currency, 'USD');
      // Using USD as base for debt check
      if (tx.type === 'payment') {
        paidMap.set(tx.clientId, (paidMap.get(tx.clientId) ?? 0) + converted);
      } else {
        promiseMap.set(tx.clientId, (promiseMap.get(tx.clientId) ?? 0) + converted);
      }
    });

    const balances = new Map<string, number>();
    clients.forEach((c) => {
      const paid = paidMap.get(c.id) ?? 0;
      const promised = promiseMap.get(c.id) ?? 0;
      balances.set(c.fullName, paid - promised); // Key by name for easy lookup in Autocomplete
    });
    return balances;
  }, [clients]);

  const directionLabels = useMemo(
    () => ({
      income: tNavbar('finance_income'),
      expense: tNavbar('finance_expense'),
    }), [tNavbar]
  );



  const handleFilterChange = (_event: MouseEvent<HTMLElement>, nextFilter: 'all' | FinanceDirection | null) => {
    if (nextFilter) {
      setFilter(nextFilter);
    }
  };

  const handleFormChange = (field: keyof ReturnType<typeof getInitialTransactionFormState>, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // Auto-set rate if date changes and rate is empty or user hasn't typed it yet
      // Simple logic: if date matches, fetch rate.
      // But here we just update state. We can use useEffect to sync rate with date.
      return next;
    });
  };

  // Sync Rate with Date
  // Logic: When dialog opens or date changes, we fetch the rate for that date.
  // We overwrite the field to ensure the user gets the correct rate for the chosen date.
  // If the user wants to customize it, they can edit it AFTER the date is set.
  useEffect(() => {
    if (dialogOpen && !editingEntry) {
      const rate = getRateForDate('USD', form.date);
      // Always update the rate when date changes or dialog opens for new entry (Round to integer)
      setForm(prev => ({ ...prev, exchangeRate: rate ? String(Math.round(rate)) : '' }));
    }
  }, [dialogOpen, form.date, getRateForDate, editingEntry]);


  const canSave = Boolean(form.name.trim()) && Number.parseFloat(form.amount) > 0 && Boolean(form.date);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEntry(null);
    setSelectedClientBalance(null);
    setForm(getInitialTransactionFormState());
  };

  const handleSave = () => {
    if (!canSave) return;
    const payload: FinanceStorageEntry = {
      id: editingEntry ? editingEntry.id : uuidv4(),
      name: form.name.trim(),
      type: method,
      amount: Number.parseFloat(form.amount) || 0,
      currency: form.currency,
      date: form.date,
      createdAt: editingEntry?.createdAt || timestampISO(),
      note: form.note.trim(),
      clientId: form.clientId,
      exchangeRate: form.exchangeRate ? Number.parseFloat(form.exchangeRate) : undefined,
    };

    if (editingEntry) {
      if (editingEntry.direction === form.direction) {
        upsertFinanceEntry(form.direction, payload);
      } else {
        removeFinanceEntry(editingEntry.direction, editingEntry.id);
        upsertFinanceEntry(form.direction, payload);
      }
    } else {
      persistFinanceEntry(form.direction, payload);
    }

    handleDialogClose();
  };

  const openRowMenu = (event: MouseEvent<HTMLElement>, entry: CombinedEntry) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuEntry(entry);
  };

  const closeRowMenu = () => {
    setMenuAnchor(null);
    setMenuEntry(null);
  };

  const startEditEntry = (entry: CombinedEntry) => {
    setEditingEntry(entry);
    setForm({
      direction: entry.direction,
      name: entry.name,
      amount: entry.amount ? String(entry.amount) : '',
      currency: entry.currency,
      date: entry.date,
      note: entry.note,
      clientId: entry.clientId || '',
      exchangeRate: entry.exchangeRate ? String(entry.exchangeRate) : '',
    });
    setDialogOpen(true);

    // Set balance display for editing if linked to a client
    if (entry.clientId) {
      // We can try to finding it by name if ID matches or just by name
      const balance = clientBalances.get(entry.name);
      setSelectedClientBalance(balance !== undefined ? balance : null);
    }
  };

  const handleMenuEdit = () => {
    const entry = menuEntry;
    closeRowMenu();
    if (entry) {
      startEditEntry(entry);
    }
  };

  const handleMenuDelete = () => {
    const entry = menuEntry;
    closeRowMenu();
    if (entry) {
      setPendingDelete(entry);
    }
  };

  const handleDeleteConfirm = () => {
    if (pendingDelete) {
      removeFinanceEntry(pendingDelete.direction, pendingDelete.id);
    }
    setPendingDelete(null);
  };

  // Helper to show converted amount
  const convertedAmountDisplay = useMemo(() => {
    const amount = Number.parseFloat(form.amount);
    const rate = Number.parseFloat(form.exchangeRate);
    if (!amount || !rate || Number.isNaN(amount) || Number.isNaN(rate)) return null;

    if (form.currency === 'USD') {
      // USD -> UZS
      const uzs = amount * rate;
      return `≈ ${uzs.toLocaleString()} UZS`;
    }
    // UZS -> USD
    const usd = amount / rate;
    return `≈ ${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD`;
  }, [form.amount, form.exchangeRate, form.currency]);

  const renderBalanceRow = (label: string, balance: { UZS: number, USD: number }, isFooter: boolean = false) => (
    <TableRow sx={{
      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
      borderBottom: isFooter ? 'none' : undefined,
      borderTop: isFooter ? '2px solid' : undefined,
      borderColor: 'divider'
    }}>
      <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
        {label}
      </TableCell>
      <TableCell align="right" colSpan={5} sx={{ fontWeight: 'bold' }}>
        <Stack direction="row" spacing={3} justifyContent="flex-end" sx={{ pr: 2 }}>
          <Typography variant="subtitle2">
            {balance.UZS.toLocaleString()} UZS
          </Typography>
          <Typography variant="subtitle2">
            {balance.USD.toLocaleString()} USD
          </Typography>
        </Stack>
      </TableCell>
    </TableRow>
  );

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" spacing={1}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          size="small"
          color="primary"
          aria-label="finance filter"
        >
          <ToggleButton value="all">{tPages('finance.transactions.filter.all')}</ToggleButton>
          <ToggleButton value="income">{directionLabels.income}</ToggleButton>
          <ToggleButton value="expense">{directionLabels.expense}</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          {tNavbar('finance_transactions_add')}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        {rangePicker.label || `${rangeStart} — ${rangeEnd}`}
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{tPages('finance.transactions.table.type')}</TableCell>
              <TableCell>{tPages('finance.transactions.table.name')}</TableCell>
              <TableCell align="right">{tPages('finance.transactions.table.amount')}</TableCell>
              <TableCell>{tPages('finance.transactions.table.currency')}</TableCell>
              <TableCell>{tPages('finance.transactions.table.date')}</TableCell>
              <TableCell>{tPages('finance.transactions.table.note')}</TableCell>
              <TableCell align="right">{tPages('finance.transactions.table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dailyGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                    {tPages('finance.transactions.table.empty')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              dailyGroups.map((group) => {
                const visibleEntries = group.entries.filter(e => filter === 'all' || e.direction === filter);
                if (visibleEntries.length === 0 && filter !== 'all') return null;

                return (
                  <Fragment key={group.date}>
                    <TableRow sx={{ backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.04) }}>
                      <TableCell colSpan={7} sx={{ fontWeight: 'bold', py: 1 }}>
                        {dayjs(group.date).format('DD MMM YYYY')}
                      </TableCell>
                    </TableRow>

                    {renderBalanceRow(tPages('finance.analytics.startBalance'), group.start)}

                    {visibleEntries.map((entry) => (
                      <TableRow
                        key={`${entry.direction}-${entry.id}`}
                        sx={(theme) => ({
                          backgroundColor:
                            entry.direction === 'income'
                              ? alpha(theme.palette.success.main, 0.08)
                              : alpha(theme.palette.error.main, 0.08),
                          borderLeft: `4px solid ${entry.direction === 'income' ? theme.palette.success.main : theme.palette.error.main
                            }`,
                        })}
                      >
                        <TableCell>{directionLabels[entry.direction]}</TableCell>
                        <TableCell>{entry.name || '—'}</TableCell>
                        <TableCell align="right">
                          {entry.amount.toLocaleString()}
                          {entry.exchangeRate && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Rate: {entry.exchangeRate}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{entry.currency}</TableCell>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.note || '—'}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            aria-label={tPages('finance.transactions.table.actions')}
                            onClick={(event) => openRowMenu(event, entry)}
                          >
                            <Iconify icon="eva:more-vertical-fill" width={18} height={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}

                    {renderBalanceRow(tPages('finance.analytics.finishingBalance'), group.end, true)}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeRowMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleMenuEdit}>{tPages('finance.transactions.menu.edit')}</MenuItem>
        <MenuItem onClick={handleMenuDelete}>{tPages('finance.transactions.menu.delete')}</MenuItem>
      </Menu>

      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{tPages('finance.transactions.deleteTitle')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">{tPages('finance.transactions.deleteConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>
            {tPages('finance.transactions.form.cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            {tPages('finance.transactions.deleteAction')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>{tNavbar('finance_transactions_add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={form.direction}
              exclusive
              size="small"
              onChange={(_event, value) => value && handleFormChange('direction', value)}
            >
              <ToggleButton value="income">{directionLabels.income}</ToggleButton>
              <ToggleButton value="expense">{directionLabels.expense}</ToggleButton>
            </ToggleButtonGroup>

            <Autocomplete
              freeSolo
              options={clients.map((c) => c.fullName)}
              value={form.name}
              onChange={(_event, newValue) => {
                const name = newValue || '';
                handleFormChange('name', name);

                // Find client object to set ID
                const client = clients.find(c => c.fullName === name);
                handleFormChange('clientId', client?.id || '');

                const balance = clientBalances.get(name);
                setSelectedClientBalance(balance !== undefined ? balance : null);

                // Auto-calc debt
                if (balance !== undefined && balance < 0) {
                  const debt = Math.abs(balance);
                  if (form.currency === 'USD') {
                    handleFormChange('amount', String(Math.round(debt)));
                  } else if (form.currency === 'UZS') {
                    handleFormChange('amount', String(Math.round(debt)));
                    handleFormChange('currency', 'USD');
                  } else {
                    handleFormChange('amount', String(Math.round(debt)));
                  }
                }
              }}
              onInputChange={(_event, newInputValue) => {
                handleFormChange('name', newInputValue);
                // Clear balance and ID if user clears or changes input
                if (!newInputValue) {
                  setSelectedClientBalance(null);
                  handleFormChange('clientId', '');
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={tPages('finance.transactions.form.name')}
                  fullWidth
                  helperText={
                    selectedClientBalance !== null ? (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          color: selectedClientBalance < 0 ? 'error.main' : 'success.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {selectedClientBalance < 0
                          ? `Debt: ${Math.abs(Math.round(selectedClientBalance))} USD` /* Simplistic label, assumes USD base */
                          : `Credit: ${Math.round(selectedClientBalance)} USD`
                        }
                      </Typography>
                    ) : null
                  }
                />
              )}
            />

            <TextField
              inputProps={{ min: 0 }}
              label={tPages('finance.transactions.form.amount')}
              value={form.amount}
              onChange={(event) => {
                // Allow any text input for math expressions
                handleFormChange('amount', event.target.value);
              }}
              onBlur={() => {
                // Try to evaluate math expression safely
                const value = form.amount.trim();
                // Simple regex to check for allowed characters: numbers, operators, parens, decimal
                if (new RegExp('^[\\d\\s+\\-*/.()]+$').test(value)) {
                  try {
                    const result = new Function(`return ${value}`)();
                    if (typeof result === 'number' && !Number.isNaN(result) && Number.isFinite(result)) {
                      // Update with calculated result rounded to 2 decimals if needed, or integers? 
                      // Finance usually 2 decimals max.
                      handleFormChange('amount', String(Math.round(result * 100) / 100));
                    }
                  } catch {
                    // Ignore invalid expression, keep as is (user might fix it)
                  }
                }
              }}
              fullWidth
              helperText={
                <Stack component="span" direction="row" justifyContent="space-between">
                  <span>{tPages('finance.transactions.form.mathHint') || "Supports math: 100+50"}</span>
                  {convertedAmountDisplay && <span>{convertedAmountDisplay}</span>}
                </Stack>
              }
            />

            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                select
                label={tPages('finance.transactions.form.currency')}
                value={form.currency}
                onChange={(e) => handleFormChange('currency', e.target.value)}
                sx={{ width: '120px' }}
              >
                {SUPPORTED_CURRENCIES.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Exchange Rate (1 USD)"
                value={form.exchangeRate}
                onChange={(e) => handleFormChange('exchangeRate', e.target.value)}
                type="number"
                fullWidth
                helperText={form.date ? `Rate for ${form.date}` : "Current rate"}
              />
            </Stack>

            <TextField
              type="date"
              label={tPages('finance.transactions.form.date')}
              value={form.date}
              onChange={(e) => handleFormChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label={tPages('finance.transactions.form.note')}
              value={form.note}
              onChange={(e) => handleFormChange('note', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>{tPages('finance.transactions.form.cancel')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {tPages('finance.transactions.form.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export function FinanceMethodFlowRedirect() {
  const params = useParams();
  const method = params.method as Method;
  return <Navigate to={`/dashboard/finance/${method}`} replace />;
}

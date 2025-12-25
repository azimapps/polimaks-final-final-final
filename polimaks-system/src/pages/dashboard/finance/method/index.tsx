import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { Navigate, useParams } from 'react-router';
import { useMemo, useState, useEffect, useCallback, type MouseEvent } from 'react';

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
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { useDateRangePicker, type UseDateRangePickerReturn } from 'src/components/custom-date-range-picker';

import { FinanceMethodSummary } from '../finance-method-summary';
import { notifyFinanceStorage, FINANCE_STORAGE_EVENT } from '../finance-storage';

type Method = 'cash' | 'transfer';
type FinanceDirection = 'income' | 'expense';
type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';
type FinanceStorageEntry = {
  id: string;
  name: string;
  type: Method;
  amount: number;
  currency: Currency;
  date: string;
  note: string;
};
type CombinedEntry = FinanceStorageEntry & { direction: FinanceDirection };

const STORAGE_KEYS = {
  income: 'finance-income',
  expense: 'finance-expense',
} as const;

const SUPPORTED_CURRENCIES: Currency[] = ['UZS', 'USD', 'RUB', 'EUR'];

const todayISO = () => new Date().toISOString().slice(0, 10);

const normalizeFinanceEntries = (items: any[], prefix: string): FinanceStorageEntry[] =>
  items.map((item, index) => ({
    id: item?.id || `${prefix}-${index}`,
    name: item?.name || '',
    type: item?.type === 'transfer' ? 'transfer' : 'cash',
    amount: typeof item?.amount === 'number' ? item.amount : Number(item?.amount) || 0,
    currency: (SUPPORTED_CURRENCIES.includes(item?.currency) ? item.currency : 'UZS') as Currency,
    date: item?.date ? String(item.date) : todayISO(),
    note: item?.note || '',
  }));

const readFinanceStorage = (key: string, prefix: string): FinanceStorageEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return normalizeFinanceEntries(JSON.parse(raw), prefix);
  } catch {
    return [];
  }
};

const persistFinanceEntry = (direction: FinanceDirection, entry: FinanceStorageEntry) => {
  if (typeof window === 'undefined') return;
  const key = direction === 'income' ? STORAGE_KEYS.income : STORAGE_KEYS.expense;
  const prefix = direction === 'income' ? 'income' : 'expense';
  const existing = readFinanceStorage(key, prefix);
  localStorage.setItem(key, JSON.stringify([...existing, entry]));
  notifyFinanceStorage();
};

const normalizeMethod = (method?: string): Method => (method === 'transfer' || method === 'cash' ? method : 'cash');

const getInitialTransactionFormState = () => ({
  direction: 'income' as FinanceDirection,
  name: '',
  amount: '',
  currency: SUPPORTED_CURRENCIES[0],
  date: todayISO(),
  note: '',
});

export default function FinanceMethodPage() {
  const { t: tNavbar } = useTranslate('navbar');
  const { method } = useParams() as { method?: string };
  const rangePicker = useDateRangePicker(dayjs().subtract(6, 'day'), dayjs());

  const resolvedMethod: Method = normalizeMethod(method);

  const methodLabel = useMemo(
    () => (resolvedMethod === 'transfer' ? tNavbar('finance_transfer') : tNavbar('finance_cash')),
    [resolvedMethod, tNavbar]
  );
  const pageTitle = `${methodLabel} | ${CONFIG.appName}`;

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            {methodLabel}
          </Typography>
          <FinanceMethodSummary method={resolvedMethod} rangePicker={rangePicker} />
        </Stack>

        <FinanceTransactionsSection method={resolvedMethod} rangePicker={rangePicker} />
      </Container>
    </>
  );
}

type FinanceTransactionsSectionProps = {
  method: Method;
  rangePicker: UseDateRangePickerReturn;
};

function FinanceTransactionsSection({ method, rangePicker }: FinanceTransactionsSectionProps) {
  const { t: tNavbar } = useTranslate('navbar');
  const { t: tPages } = useTranslate('pages');
  const [filter, setFilter] = useState<'all' | FinanceDirection>('all');
  const [transactions, setTransactions] = useState<CombinedEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(getInitialTransactionFormState);

  const { rangeStart, rangeEnd } = useMemo(() => {
    const start = rangePicker.startDate ?? dayjs();
    const end = rangePicker.endDate ?? start;
    const [rangeStartDate, rangeEndDate] = start.isAfter(end) ? [end, start] : [start, end];
    return {
      rangeStart: rangeStartDate.format('YYYY-MM-DD'),
      rangeEnd: rangeEndDate.format('YYYY-MM-DD'),
    };
  }, [rangePicker.startDate, rangePicker.endDate]);

  const loadTransactions = useCallback(() => {
    const withinRange = (entry: FinanceStorageEntry) =>
      entry.date >= rangeStart && entry.date <= rangeEnd;

    const incomes = readFinanceStorage(STORAGE_KEYS.income, 'income')
      .filter((entry) => entry.type === method && withinRange(entry))
      .map((entry) => ({ ...entry, direction: 'income' as FinanceDirection }));
    const expenses = readFinanceStorage(STORAGE_KEYS.expense, 'expense')
      .filter((entry) => entry.type === method && withinRange(entry))
      .map((entry) => ({ ...entry, direction: 'expense' as FinanceDirection }));

    const combined = [...incomes, ...expenses].sort((a, b) => b.date.localeCompare(a.date));
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

  const directionLabels = useMemo(
    () => ({
      income: tNavbar('finance_income'),
      expense: tNavbar('finance_expense'),
    }), [tNavbar]
  );

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((entry) => filter === 'all' || entry.direction === filter),
    [filter, transactions]
  );

  const handleFilterChange = (_event: MouseEvent<HTMLElement>, nextFilter: 'all' | FinanceDirection | null) => {
    if (nextFilter) {
      setFilter(nextFilter);
    }
  };

  const handleFormChange = (field: keyof ReturnType<typeof getInitialTransactionFormState>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canSave = Boolean(form.name.trim()) && Number.parseFloat(form.amount) > 0 && Boolean(form.date);

  const handleSave = () => {
    if (!canSave) return;
    const entry: FinanceStorageEntry = {
      id: uuidv4(),
      name: form.name.trim(),
      type: method,
      amount: Number.parseFloat(form.amount) || 0,
      currency: form.currency,
      date: form.date,
      note: form.note.trim(),
    };
    persistFinanceEntry(form.direction, entry);
    setForm(getInitialTransactionFormState());
    setDialogOpen(false);
  };

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
          </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {tPages('finance.transactions.table.empty')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((entry) => (
                <TableRow
                  key={`${entry.direction}-${entry.id}`}
                  sx={(theme) => ({
                    backgroundColor:
                      entry.direction === 'income'
                        ? alpha(theme.palette.success.main, 0.08)
                        : alpha(theme.palette.error.main, 0.08),
                    borderLeft: `4px solid ${
                      entry.direction === 'income' ? theme.palette.success.main : theme.palette.error.main
                    }`,
                  })}
                >
                  <TableCell>{directionLabels[entry.direction]}</TableCell>
                  <TableCell>{entry.name || '—'}</TableCell>
                  <TableCell align="right">{entry.amount.toLocaleString()}</TableCell>
                  <TableCell>{entry.currency}</TableCell>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.note || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
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
            <TextField
              label={tPages('finance.transactions.form.name')}
              value={form.name}
              onChange={(event) => handleFormChange('name', event.target.value)}
              fullWidth
            />
            <TextField
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              label={tPages('finance.transactions.form.amount')}
              value={form.amount}
              onChange={(event) => handleFormChange('amount', event.target.value)}
              fullWidth
            />
            <TextField
              select
              label={tPages('finance.transactions.form.currency')}
              value={form.currency}
              onChange={(event) => handleFormChange('currency', event.target.value)}
              fullWidth
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <MenuItem key={currency} value={currency}>
                  {currency}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="date"
              label={tPages('finance.transactions.form.date')}
              value={form.date}
              onChange={(event) => handleFormChange('date', event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={tPages('finance.transactions.form.note')}
              value={form.note}
              onChange={(event) => handleFormChange('note', event.target.value)}
              fullWidth
              multiline
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{tPages('finance.transactions.form.cancel')}</Button>
          <Button variant="contained" disabled={!canSave} onClick={handleSave}>
            {tNavbar('finance_transactions_add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export function FinanceMethodFlowRedirect() {
  const { method } = useParams() as { method?: string };

  if (!method) {
    return <Navigate to="/finance" replace />;
  }

  const resolvedMethod = normalizeMethod(method);
  return <Navigate to={`/finance/${resolvedMethod}`} replace />;
}

import type { UseDateRangePickerReturn } from 'src/components/custom-date-range-picker';

import dayjs from 'dayjs';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { fNumber } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import { CustomDateRangePicker } from 'src/components/custom-date-range-picker';

import { FINANCE_STORAGE_EVENT } from './finance-storage';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';
type Method = 'cash' | 'transfer';

type FinanceEntry = {
  id: string;
  type: Method;
  amount: number;
  currency: Currency;
  date: string;
  createdAt: string;
};

type FinanceMethodSummaryProps = {
  method: Method;
  rangePicker: UseDateRangePickerReturn;
};

const STORAGE_KEYS = { income: 'finance-income', expense: 'finance-expense' };
const SUPPORTED: Currency[] = ['UZS', 'USD', 'RUB', 'EUR'];
const DEFAULT_RATES: Record<Currency, number> = { USD: 1, EUR: 0.92, RUB: 90, UZS: 12500 };

const todayISO = () => new Date().toISOString().slice(0, 10);
const timestampISO = () => new Date().toISOString();

const normalizeEntries = (items: any[], prefix: string): FinanceEntry[] =>
  items.map((item, index) => ({
    id: item.id || `${prefix}-${index}`,
    type: item.type === 'transfer' ? 'transfer' : 'cash',
    amount: typeof item.amount === 'number' ? item.amount : Number(item.amount) || 0,
    currency: (SUPPORTED.includes(item.currency) ? item.currency : 'UZS') as Currency,
    date: item.date ? String(item.date).slice(0, 10) : todayISO(),
    createdAt: item.createdAt || timestampISO(),
  }));

const readFinanceStorage = (key: string, prefix: string): FinanceEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return normalizeEntries(JSON.parse(raw) as FinanceEntry[], prefix);
  } catch {
    return [];
  }
};

export function FinanceMethodSummary({ method, rangePicker }: FinanceMethodSummaryProps) {
  const { t } = useTranslate('pages');

  const [incomeEntries, setIncomeEntries] = useState<FinanceEntry[]>(() =>
    readFinanceStorage(STORAGE_KEYS.income, 'income')
  );
  const [expenseEntries, setExpenseEntries] = useState<FinanceEntry[]>(() =>
    readFinanceStorage(STORAGE_KEYS.expense, 'expense')
  );
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('UZS');
  const [rates, setRates] = useState<Record<Currency, number>>(DEFAULT_RATES);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const refresh = () => {
      setIncomeEntries(readFinanceStorage(STORAGE_KEYS.income, 'income'));
      setExpenseEntries(readFinanceStorage(STORAGE_KEYS.expense, 'expense'));
    };

    refresh();
    window.addEventListener(FINANCE_STORAGE_EVENT, refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(FINANCE_STORAGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('rate fetch failed');
        const data = (await res.json()) as { rates?: Record<string, number> };
        const fetched: Partial<Record<Currency, number>> = {};
        ['USD', 'EUR', 'RUB', 'UZS'].forEach((cur) => {
          if (data.rates?.[cur]) fetched[cur as Currency] = data.rates[cur];
        });
        if (active && Object.keys(fetched).length) {
          setRates((prev) => ({ ...prev, ...fetched }));
        }
      } catch {
        // keep defaults when offline
      }
    };
    fetchRates();
    return () => {
      active = false;
    };
  }, []);

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

  const methodIncomes = useMemo(
    () => incomeEntries.filter((entry) => entry.type === method),
    [incomeEntries, method]
  );
  const methodExpenses = useMemo(
    () => expenseEntries.filter((entry) => entry.type === method),
    [expenseEntries, method]
  );

  const convertAmount = useMemo(() => {
    const toRate = rates[displayCurrency] ?? 1;
    return (amount: number, currency: Currency) => {
      const fromRate = rates[currency] ?? 1;
      if (!fromRate) return amount;
      if (currency === displayCurrency) return amount;
      return (amount / fromRate) * toRate;
    };
  }, [displayCurrency, rates]);

  const openingBalance = useMemo(() => {
    const incomeBefore = methodIncomes.reduce((sum, item) => {
      if (item.date <= dayBeforeStart) {
        return sum + convertAmount(item.amount, item.currency);
      }
      return sum;
    }, 0);
    const expenseBefore = methodExpenses.reduce((sum, item) => {
      if (item.date <= dayBeforeStart) {
        return sum + convertAmount(item.amount, item.currency);
      }
      return sum;
    }, 0);
    return incomeBefore - expenseBefore;
  }, [convertAmount, dayBeforeStart, methodExpenses, methodIncomes]);

  const rangeNet = useMemo(() => {
    const incomeRange = methodIncomes.reduce((sum, item) => {
      if (item.date >= rangeStart && item.date <= rangeEnd) {
        return sum + convertAmount(item.amount, item.currency);
      }
      return sum;
    }, 0);
    const expenseRange = methodExpenses.reduce((sum, item) => {
      if (item.date >= rangeStart && item.date <= rangeEnd) {
        return sum + convertAmount(item.amount, item.currency);
      }
      return sum;
    }, 0);
    return incomeRange - expenseRange;
  }, [convertAmount, methodExpenses, methodIncomes, rangeEnd, rangeStart]);

  const finalBalance = openingBalance + rangeNet;
  const rangeNetColor = rangeNet >= 0 ? 'success.main' : 'error.main';

  const rangeLabel = rangePicker.error ? t('finance.analytics.dateRange') : rangePicker.label || '';

  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <TextField
            label={t('finance.analytics.dateRange')}
            value={rangeLabel}
            onClick={rangePicker.onOpen}
            size="small"
            InputProps={{ readOnly: true }}
            sx={{ minWidth: 240, cursor: 'pointer', '& input': { cursor: 'pointer' } }}
          />

          <TextField
            select
            size="small"
            label={t('finance.income.displayCurrency')}
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
            sx={{ minWidth: 160 }}
          >
            {SUPPORTED.map((cur) => (
              <MenuItem key={cur} value={cur}>
                {cur}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="stretch"
          justifyContent="space-between"
        >
          {[
            { label: 'finance.analytics.startBalance', value: openingBalance },
            { label: 'finance.analytics.rangeNet', value: rangeNet, color: rangeNetColor },
            { label: 'finance.analytics.finishingBalance', value: finalBalance },
          ].map(({ label, value, color }) => (
            <Box
              key={label}
              sx={{
                flex: 1,
                minWidth: 180,
                p: 2,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {t(label)}
              </Typography>
              <Typography variant="h6" color={color}>
                {fNumber(value, { maximumFractionDigits: 0 })} {displayCurrency}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>

      <CustomDateRangePicker
        variant="range"
        title={t('finance.analytics.dateRange')}
        open={rangePicker.open}
        startDate={rangePicker.startDate}
        endDate={rangePicker.endDate}
        onChangeStartDate={rangePicker.onChangeStartDate}
        onChangeEndDate={rangePicker.onChangeEndDate}
        onClose={rangePicker.onClose}
        error={rangePicker.error}
      />
    </Card>
  );
}

export default FinanceMethodSummary;

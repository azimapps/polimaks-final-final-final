import { useMemo, useState, useEffect } from 'react';
import type { MouseEvent } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTheme } from '@mui/material/styles';

import { fNumber } from 'src/utils/format-number';
import { useTranslate } from 'src/locales';

import { Chart, useChart } from 'src/components/chart';

import { FINANCE_STORAGE_EVENT } from './finance-storage';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';
type Method = 'cash' | 'transfer';

type FinanceEntry = {
  id: string;
  type: Method;
  amount: number;
  currency: Currency;
  date: string;
};

type FinanceMethodAnalyticsProps = {
  method: Method;
};

const STORAGE_KEYS = { income: 'finance-income', expense: 'finance-expense' };
const SUPPORTED: Currency[] = ['UZS', 'USD', 'RUB', 'EUR'];
const DEFAULT_RATES: Record<Currency, number> = { USD: 1, EUR: 0.92, RUB: 90, UZS: 12500 };
const QUICK_RANGES = [7, 30] as const;

const todayISO = () => new Date().toISOString().slice(0, 10);

const shiftISODate = (daysBack: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().slice(0, 10);
};

const normalizeEntries = (items: any[], prefix: string): FinanceEntry[] =>
  items.map((item, index) => ({
    id: item.id || `${prefix}-${index}`,
    type: item.type === 'transfer' ? 'transfer' : 'cash',
    amount: typeof item.amount === 'number' ? item.amount : Number(item.amount) || 0,
    currency: (SUPPORTED.includes(item.currency) ? item.currency : 'UZS') as Currency,
    date: item.date ? String(item.date).slice(0, 10) : todayISO(),
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

const buildDateRange = (start: string, end: string): string[] => {
  if (!start || !end) return [];
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];

  const dates: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

export function FinanceMethodAnalytics({ method }: FinanceMethodAnalyticsProps) {
  const theme = useTheme();
  const { t } = useTranslate('pages');

  const [incomeEntries, setIncomeEntries] = useState<FinanceEntry[]>(() =>
    readFinanceStorage(STORAGE_KEYS.income, 'income')
  );
  const [expenseEntries, setExpenseEntries] = useState<FinanceEntry[]>(() =>
    readFinanceStorage(STORAGE_KEYS.expense, 'expense')
  );
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('UZS');
  const [rates, setRates] = useState<Record<Currency, number>>(DEFAULT_RATES);
  const [quickRange, setQuickRange] = useState<(typeof QUICK_RANGES)[number] | null>(7);
  const [startDate, setStartDate] = useState<string>(() => shiftISODate(6));
  const [endDate, setEndDate] = useState<string>(() => todayISO());

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

  const { rangeStart, rangeEnd } = useMemo(() => {
    const start = startDate || todayISO();
    const end = endDate || todayISO();
    if (start <= end) return { rangeStart: start, rangeEnd: end };
    return { rangeStart: end, rangeEnd: start };
  }, [startDate, endDate]);

  const methodIncomes = useMemo(
    () => incomeEntries.filter((entry) => entry.type === method),
    [incomeEntries, method]
  );
  const methodExpenses = useMemo(
    () => expenseEntries.filter((entry) => entry.type === method),
    [expenseEntries, method]
  );

  const rangedIncomes = useMemo(
    () => methodIncomes.filter((entry) => entry.date >= rangeStart && entry.date <= rangeEnd),
    [methodIncomes, rangeStart, rangeEnd]
  );
  const rangedExpenses = useMemo(
    () => methodExpenses.filter((entry) => entry.date >= rangeStart && entry.date <= rangeEnd),
    [methodExpenses, rangeStart, rangeEnd]
  );

  const dates = useMemo(() => buildDateRange(rangeStart, rangeEnd), [rangeStart, rangeEnd]);

  const convertAmount = useMemo(() => {
    const toRate = rates[displayCurrency] ?? 1;
    return (amount: number, currency: Currency) => {
      const fromRate = rates[currency] ?? 1;
      if (!fromRate) return amount;
      if (currency === displayCurrency) return amount;
      return (amount / fromRate) * toRate;
    };
  }, [displayCurrency, rates]);

  const profitSeries = useMemo(() => {
    const incomeByDate = rangedIncomes.reduce<Record<string, number>>((acc, item) => {
      acc[item.date] = (acc[item.date] ?? 0) + convertAmount(item.amount, item.currency);
      return acc;
    }, {});
    const expenseByDate = rangedExpenses.reduce<Record<string, number>>((acc, item) => {
      acc[item.date] = (acc[item.date] ?? 0) + convertAmount(item.amount, item.currency);
      return acc;
    }, {});

    const data = dates.map((date) => (incomeByDate[date] ?? 0) - (expenseByDate[date] ?? 0));

    return { data, total: data.reduce((sum, value) => sum + value, 0) };
  }, [convertAmount, dates, rangedExpenses, rangedIncomes]);

  const chartOptions = useChart({
    colors: [theme.palette.success.main],
    xaxis: { categories: dates },
    plotOptions: {
      bar: {
        columnWidth: '55%',
        borderRadius: 6,
        colors: {
          ranges: [
            { from: -999999999, to: -0.01, color: theme.palette.error.main },
            { from: 0, to: 999999999, color: theme.palette.success.main },
          ],
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${fNumber(val, { maximumFractionDigits: 0 })} ${displayCurrency}`,
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => fNumber(val, { maximumFractionDigits: 0 }),
      },
    },
  });

  const handleQuickRange = (_event: MouseEvent<HTMLElement>, value: (typeof QUICK_RANGES)[number] | null) => {
    if (!value) return;
    setQuickRange(value);
    setEndDate(todayISO());
    setStartDate(shiftISODate(value - 1));
  };

  const handleStartDate = (value: string) => {
    setStartDate(value || todayISO());
    setQuickRange(null);
  };

  const handleEndDate = (value: string) => {
    setEndDate(value || todayISO());
    setQuickRange(null);
  };

  const hasData = rangedIncomes.length > 0 || rangedExpenses.length > 0;

  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h6">{t('finance.analytics.profitByDay')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('finance.analytics.inCurrency', { currency: displayCurrency })}
            </Typography>
          </Box>
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
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            type="date"
            label={t('finance.analytics.startDate')}
            value={startDate}
            onChange={(e) => handleStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
          <TextField
            type="date"
            label={t('finance.analytics.endDate')}
            value={endDate}
            onChange={(e) => handleEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">{t('finance.analytics.quickRange')}</Typography>
            <ToggleButtonGroup size="small" exclusive value={quickRange} onChange={handleQuickRange}>
              {QUICK_RANGES.map((days) => (
                <ToggleButton key={days} value={days}>
                  {days === 7 ? t('finance.analytics.last7Days') : t('finance.analytics.last30Days')}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2">{t('finance.analytics.netBalance')}</Typography>
          <Typography variant="h6">
            {fNumber(profitSeries.total, { maximumFractionDigits: 0 })} {displayCurrency}
          </Typography>
        </Stack>

        {hasData ? (
          <Box sx={{ height: 320 }}>
            <Chart
              type="bar"
              series={[{ name: t('finance.analytics.series.net'), data: profitSeries.data }]}
              options={chartOptions}
              sx={{ height: 320 }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              py: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1.5,
              border: (themeValue) => `1px dashed ${themeValue.palette.divider}`,
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('finance.analytics.empty')}
            </Typography>
          </Box>
        )}
      </Stack>
    </Card>
  );
}

export default FinanceMethodAnalytics;

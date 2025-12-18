import { useMemo } from 'react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fNumber, fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import { Chart, useChart } from 'src/components/chart';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';

type FinanceEntry = {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  date: string;
  note?: string;
};

type FinanceAnalyticsProps = {
  displayCurrency: Currency;
  rates: Record<Currency, number>;
  incomeItems?: FinanceEntry[];
  expenseItems?: FinanceEntry[];
};

const STORAGE_KEYS = { income: 'finance-income', expense: 'finance-expense' };
const SUPPORTED: Currency[] = ['UZS', 'USD', 'RUB', 'EUR'];
const todayISO = () => new Date().toISOString().slice(0, 10);

const normalizeEntries = (items: any[]): FinanceEntry[] =>
  items.map((item, index) => ({
    id: item.id || `finance-${index}`,
    name: item.name || '',
    amount: typeof item.amount === 'number' ? item.amount : Number(item.amount) || 0,
    currency: (SUPPORTED.includes(item.currency) ? item.currency : 'UZS') as Currency,
    date: item.date ? String(item.date).slice(0, 10) : todayISO(),
    note: item.note || '',
  }));

const readFinanceStorage = (key: string): FinanceEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return normalizeEntries(JSON.parse(raw) as FinanceEntry[]);
  } catch {
    return [];
  }
};

export function FinanceAnalytics({ incomeItems, expenseItems, displayCurrency, rates }: FinanceAnalyticsProps) {
  const { t } = useTranslate('pages');

  const incomes = useMemo(
    () => (incomeItems && incomeItems.length ? incomeItems : readFinanceStorage(STORAGE_KEYS.income)),
    [incomeItems]
  );
  const expenses = useMemo(
    () => (expenseItems && expenseItems.length ? expenseItems : readFinanceStorage(STORAGE_KEYS.expense)),
    [expenseItems]
  );

  const hasData = incomes.length > 0 || expenses.length > 0;

  const convertAmount = useMemo(() => {
    const toRate = rates[displayCurrency] ?? 1;
    return (amount: number, currency: Currency) => {
      const fromRate = rates[currency] ?? 1;
      if (!fromRate) return amount;
      if (currency === displayCurrency) return amount;
      return (amount / fromRate) * toRate;
    };
  }, [displayCurrency, rates]);

  const totals = useMemo(() => {
    const incomeTotal = incomes.reduce((sum, item) => sum + convertAmount(item.amount, item.currency), 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + convertAmount(item.amount, item.currency), 0);
    return { income: incomeTotal, expense: expenseTotal };
  }, [convertAmount, incomes, expenses]);

  const dates = useMemo(() => {
    const uniq = new Set<string>();
    incomes.forEach((item) => item.date && uniq.add(item.date));
    expenses.forEach((item) => item.date && uniq.add(item.date));
    return Array.from(uniq).sort();
  }, [expenses, incomes]);

  const flowSeries = useMemo(() => {
    const incomeByDate = incomes.reduce<Record<string, number>>((acc, item) => {
      if (!item.date) return acc;
      acc[item.date] = (acc[item.date] ?? 0) + convertAmount(item.amount, item.currency);
      return acc;
    }, {});
    const expenseByDate = expenses.reduce<Record<string, number>>((acc, item) => {
      if (!item.date) return acc;
      acc[item.date] = (acc[item.date] ?? 0) + convertAmount(item.amount, item.currency);
      return acc;
    }, {});

    const incomeLabel = t('finance.analytics.series.income');
    const expenseLabel = t('finance.analytics.series.expense');
    const netLabel = t('finance.analytics.series.net');

    return [
      { name: incomeLabel, data: dates.map((date) => incomeByDate[date] ?? 0) },
      { name: expenseLabel, data: dates.map((date) => expenseByDate[date] ?? 0) },
      {
        name: netLabel,
        data: dates.map((date) => (incomeByDate[date] ?? 0) - (expenseByDate[date] ?? 0)),
      },
    ];
  }, [convertAmount, dates, expenses, incomes, t]);

  const flowOptions = useChart({
    stroke: { width: [3, 3, 2], curve: 'smooth' },
    legend: { show: true },
    fill: {
      type: ['gradient', 'gradient', 'solid'],
      opacity: [0.22, 0.2, 1],
    },
    xaxis: {
      categories: dates,
    },
    tooltip: {
      shared: true,
      y: {
        formatter: (val: number) => `${fNumber(val, { maximumFractionDigits: 0 })} ${displayCurrency}`,
      },
    },
  });

  const shareOptions = useChart({
    labels: [t('finance.analytics.series.income'), t('finance.analytics.series.expense')],
    legend: { show: true, position: 'bottom' },
    stroke: { width: 0 },
    tooltip: {
      y: {
        formatter: (val: number) => `${fCurrency(val, { currency: displayCurrency, maximumFractionDigits: 0 })}`,
      },
    },
    plotOptions: {
      pie: { donut: { labels: { show: true } } },
    },
  });

  if (!hasData) {
    return (
      <Card sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('finance.analytics.empty')}
        </Typography>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2, height: 360 }}>
            <Chart type="area" series={flowSeries} options={flowOptions} sx={{ height: 280 }} />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, height: 360 }}>
            <Chart
              type="donut"
              series={[totals.income, totals.expense]}
              options={shareOptions}
              sx={{ height: 240 }}
            />
            <Stack spacing={0.5} sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">{t('finance.analytics.series.income')}</Typography>
                <Typography variant="body2">
                  {fNumber(totals.income, { maximumFractionDigits: 0 })} {displayCurrency}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">{t('finance.analytics.series.expense')}</Typography>
                <Typography variant="body2">
                  {fNumber(totals.expense, { maximumFractionDigits: 0 })} {displayCurrency}
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default FinanceAnalytics;

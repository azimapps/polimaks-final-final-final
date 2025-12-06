import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  ToggleButton,
  TableContainer,
  ToggleButtonGroup,
} from '@mui/material';

import { fNumber, fCurrency, fShortenNumber } from 'src/utils/format-number';

import kleySeed from 'src/data/kley.json';
import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import otxotSeed from 'src/data/otxot.json';
import kraskaSeed from 'src/data/kraska.json';
import plyonkaSeed from 'src/data/plyonka.json';
import silindirSeed from 'src/data/silindir.json';
import razvaritelSeed from 'src/data/razvaritel.json';
import zapchastlarSeed from 'src/data/zapchastlar.json';
import suyuqKraskaSeed from 'src/data/suyuq-kraska.json';
import tayyorAngrenSeed from 'src/data/tayyor-mahsulotlar-angren.json';
import tayyorTashkentSeed from 'src/data/tayyor-mahsulotlar-tashkent.json';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Currency = 'USD' | 'EUR' | 'RUB' | 'UZS';

type InventorySource = {
  key: string;
  storageKey: string;
  seed: any[];
  titleKey: string;
  compute: (
    items: any[],
    convertValue: (value: number, currency?: string | null | undefined) => number
  ) => {
    amount: number;
    value: number;
    nativeValue: number;
    count: number;
    unit: string;
    dates: string[];
  };
};

type InventoryMetric = ReturnType<InventorySource['compute']> & {
  key: string;
  label: string;
  nativeValue: number;
};

const toNumber = (value: any): number => (typeof value === 'number' ? value : Number(value) || 0);

const getDateKey = (item: any): string | null => {
  const raw = item?.createdDate || item?.receivedDate || item?.date;
  if (!raw) return null;
  return String(raw).slice(0, 10);
};

const readLocal = (storageKey: string, seed: any[]): any[] => {
  if (typeof window === 'undefined') return seed;
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return seed;
  try {
    return JSON.parse(stored) as any[];
  } catch {
    return seed;
  }
};

const inventorySources: InventorySource[] = [
  {
    key: 'plyonka',
    storageKey: 'ombor-plyonka',
    seed: plyonkaSeed as any[],
    titleKey: 'plyonka',
    compute: (items, convertValue) => {
      const amount = items.reduce((sum, item) => sum + toNumber(item.totalKg), 0);
      const nativeValue = items.reduce((sum, item) => sum + toNumber(item.totalKg) * toNumber(item.pricePerKg), 0);
      const value = items.reduce((sum, item) => {
        const native = toNumber(item.totalKg) * toNumber(item.pricePerKg);
        return sum + convertValue(native, item.priceCurrency);
      }, 0);
      const dates = items.map(getDateKey).filter(Boolean) as string[];
      return { amount, value, nativeValue, count: items.length, unit: 'kg', dates };
    },
  },
  {
    key: 'kraska',
    storageKey: 'ombor-kraska',
    seed: kraskaSeed as any[],
    titleKey: 'kraska',
    compute: (items, convertValue) => {
      const amount = items.reduce((sum, item) => sum + toNumber(item.totalKg), 0);
      const nativeValue = items.reduce((sum, item) => sum + toNumber(item.totalKg) * toNumber(item.pricePerKg), 0);
      const value = items.reduce((sum, item) => {
        const native = toNumber(item.totalKg) * toNumber(item.pricePerKg);
        return sum + convertValue(native, item.priceCurrency);
      }, 0);
      const dates = items.map(getDateKey).filter(Boolean) as string[];
      return { amount, value, nativeValue, count: items.length, unit: 'kg', dates };
    },
  },
  {
    key: 'suyuq_kraska',
    storageKey: 'ombor-suyuq-kraska',
    seed: suyuqKraskaSeed as any[],
    titleKey: 'suyuq_kraska',
    compute: (items, convertValue) => {
      const amount = items.reduce((sum, item) => sum + toNumber(item.totalKg), 0);
      const nativeValue = items.reduce((sum, item) => sum + toNumber(item.totalKg) * toNumber(item.pricePerKg), 0);
      const value = items.reduce((sum, item) => {
        const native = toNumber(item.totalKg) * toNumber(item.pricePerKg);
        return sum + convertValue(native, item.priceCurrency);
      }, 0);
      const dates = items.map(getDateKey).filter(Boolean) as string[];
      return { amount, value, nativeValue, count: items.length, unit: 'kg', dates };
    },
  },
  {
    key: 'razvaritel',
    storageKey: 'ombor-razvaritel',
    seed: razvaritelSeed as any[],
    titleKey: 'razvaritel',
    compute: (items, convertValue) => {
      const amount = items.reduce((sum, item) => sum + toNumber(item.totalLiter), 0);
      const nativeValue = items.reduce((sum, item) => sum + toNumber(item.totalLiter) * toNumber(item.pricePerLiter), 0);
      const value = items.reduce((sum, item) => {
        const native = toNumber(item.totalLiter) * toNumber(item.pricePerLiter);
        return sum + convertValue(native, item.priceCurrency);
      }, 0);
      const dates = items.map(getDateKey).filter(Boolean) as string[];
      return { amount, value, nativeValue, count: items.length, unit: 'L', dates };
    },
  },
  {
    key: 'silindir',
    storageKey: 'ombor-silindir',
    seed: silindirSeed as any[],
    titleKey: 'silindir',
    compute: (items, convertValue) => {
      const amount = items.length;
      const nativeValue = items.reduce((sum, item) => sum + toNumber(item.price), 0);
      const value = items.reduce(
        (sum, item) => sum + convertValue(toNumber(item.price), item.priceCurrency),
        0
      );
      const dates = items.map(getDateKey).filter(Boolean) as string[];
      return { amount, value, nativeValue, count: items.length, unit: 'unit', dates };
    },
  },
  {
    key: 'kley',
    storageKey: 'ombor-kley',
    seed: kleySeed as any[],
    titleKey: 'kley',
    compute: (items, convertValue) => {
      const amount = items.reduce((sum, item) => sum + toNumber(item.totalNetWeight), 0);
      const nativeValue = items.reduce(
        (sum, item) => sum + toNumber(item.totalNetWeight) * toNumber(item.price),
        0
      );
      const value = items.reduce((sum, item) => {
        const native = toNumber(item.totalNetWeight) * toNumber(item.price);
        return sum + convertValue(native, item.priceCurrency);
      }, 0);
      const dates = items.map(getDateKey).filter(Boolean) as string[];
      return { amount, value, nativeValue, count: items.length, unit: 'kg', dates };
    },
  },
  {
    key: 'zapchastlar',
    storageKey: 'ombor-zapchastlar',
    seed: zapchastlarSeed as any[],
    titleKey: 'zapchastlar',
    compute: (items, convertValue) => {
      const amount = items.reduce((sum, item) => sum + toNumber(item.quantity), 0);
      const nativeValue = items.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.price), 0);
      const value = items.reduce((sum, item) => {
        const native = toNumber(item.quantity) * toNumber(item.price);
        return sum + convertValue(native, item.priceCurrency);
      }, 0);
      const dates = items.map(getDateKey).filter(Boolean) as string[];
      return { amount, value, nativeValue, count: items.length, unit: 'unit', dates };
    },
  },
  {
    key: 'otxot',
    storageKey: 'ombor-otxot',
    seed: otxotSeed as any[],
    titleKey: 'otxot',
    compute: (items, convertValue) => {
      const amount = items.reduce((sum, item) => sum + toNumber(item.totalKg), 0);
      const nativeValue = items.reduce((sum, item) => sum + toNumber(item.totalKg) * toNumber(item.pricePerKg), 0);
      const value = items.reduce((sum, item) => {
        const native = toNumber(item.totalKg) * toNumber(item.pricePerKg);
        return sum + convertValue(native, item.priceCurrency);
      }, 0);
      const dates = items.map(getDateKey).filter(Boolean) as string[];
      return { amount, value, nativeValue, count: items.length, unit: 'kg', dates };
    },
  },
  {
    key: 'tayyor_mahsulotlar_tashkent',
    storageKey: 'ombor-tayyor-mahsulotlar-tashkent',
    seed: tayyorTashkentSeed as any[],
    titleKey: 'tayyor_mahsulotlar_tashkent',
    compute: (items, convertValue) => {
      const amount = items.reduce((sum, item) => sum + toNumber(item.totalNetWeight), 0);
      const nativeValue = items.reduce(
        (sum, item) => sum + toNumber(item.quantity || item.totalNetWeight) * toNumber(item.price),
        0
      );
      const value = items.reduce((sum, item) => {
        const native = toNumber(item.quantity || item.totalNetWeight) * toNumber(item.price);
        return sum + convertValue(native, item.priceCurrency);
      }, 0);
      const dates = items.map(getDateKey).filter(Boolean) as string[];
      return { amount, value, nativeValue, count: items.length, unit: 'kg', dates };
    },
  },
  {
    key: 'tayyor_mahsulotlar_angren',
    storageKey: 'ombor-tayyor-mahsulotlar-angren',
    seed: tayyorAngrenSeed as any[],
    titleKey: 'tayyor_mahsulotlar_angren',
    compute: (items, convertValue) => {
      const amount = items.reduce((sum, item) => sum + toNumber(item.totalNetWeight), 0);
      const nativeValue = items.reduce(
        (sum, item) => sum + toNumber(item.quantity || item.totalNetWeight) * toNumber(item.price),
        0
      );
      const value = items.reduce((sum, item) => {
        const native = toNumber(item.quantity || item.totalNetWeight) * toNumber(item.price);
        return sum + convertValue(native, item.priceCurrency);
      }, 0);
      const dates = items.map(getDateKey).filter(Boolean) as string[];
      return { amount, value, nativeValue, count: items.length, unit: 'kg', dates };
    },
  },
];

// ----------------------------------------------------------------------

export default function InventoryAnalyticsPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventoryAnalytics.title')} | ${CONFIG.appName}`;

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [rates, setRates] = useState<Record<Currency, number>>({
    USD: 1,
    EUR: 0.92,
    RUB: 90,
    UZS: 12700,
  });
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const json = await res.json();
        if (json?.result === 'success' && json?.conversion_rates) {
          setRates((prev) => ({
            ...prev,
            USD: 1,
            EUR: json.conversion_rates.EUR ?? prev.EUR,
            RUB: json.conversion_rates.RUB ?? prev.RUB,
            UZS: json.conversion_rates.UZS ?? prev.UZS,
          }));
          setRateUpdatedAt(json.time_last_update_utc || null);
          setRateError(null);
        } else {
          setRateError(t('inventoryAnalytics.rateError'));
        }
      } catch (error) {
        console.error('Failed to fetch currency rates', error);
        setRateError(t('inventoryAnalytics.rateError'));
      }
    };
    fetchRates();
  }, [t]);

  const convertValue = useCallback(
    (value: number, currency?: string | null | undefined) => {
      const currencyUpper = (currency || 'USD').toUpperCase() as Currency;
      const fromCurrency: Currency = ['USD', 'EUR', 'RUB', 'UZS'].includes(currencyUpper)
        ? currencyUpper
        : 'USD';
      const rateFrom = rates[fromCurrency];
      const rateTo = rates[selectedCurrency];

      if (!rateFrom || !rateTo) return value;
      const valueInUsd = fromCurrency === 'USD' ? value : value / rateFrom;
      return selectedCurrency === 'USD' ? valueInUsd : valueInUsd * rateTo;
    },
    [rates, selectedCurrency]
  );

  const metrics = useMemo<InventoryMetric[]>(
    () =>
      inventorySources.map((source) => {
        const items = readLocal(source.storageKey, source.seed);
        const computed = source.compute(items, convertValue);
        const label = t(`inventory.items.${source.titleKey}.title`);
        return { ...computed, key: source.key, label };
      }),
    [convertValue, t]
  );

  const totalValue = metrics.reduce((sum, item) => sum + item.value, 0);
  const totalRecords = metrics.reduce((sum, item) => sum + item.count, 0);
  const mostValuable = metrics.reduce(
    (prev, curr) => (curr.value > prev.value ? curr : prev),
    metrics[0] ?? null
  );

  const averageValuePerRecord = totalRecords ? totalValue / totalRecords : 0;

  const barOptions = useChart({
    plotOptions: { bar: { columnWidth: '50%' } },
    xaxis: { categories: metrics.map((item) => item.label) },
    tooltip: {
      y: { formatter: (value: number) => fCurrency(value, { currency: selectedCurrency }) },
    },
  });

  const donutOptions = useChart({
    labels: metrics.map((item) => item.label),
    legend: { position: 'bottom' },
    tooltip: {
      y: { formatter: (value: number) => fCurrency(value, { currency: selectedCurrency }) },
    },
  });

  const timelineData = useMemo(() => {
    const map = new Map<string, number>();
    metrics.forEach((item) => {
      item.dates.forEach((date) => {
        map.set(date, (map.get(date) || 0) + 1);
      });
    });
    const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.slice(-12);
  }, [metrics]);

  const lineOptions = useChart({
    stroke: { width: 3 },
    xaxis: { categories: timelineData.map(([date]) => date) },
    markers: { size: 4 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.35,
        opacityFrom: 0.7,
        opacityTo: 0.2,
      },
    },
  });

  const valueSeries = metrics.map((item) => Number(item.value.toFixed(2)));
  const amountSeries = metrics.map((item) => Number(item.amount.toFixed(2)));

  return (
    <>
      <title>{title}</title>

      <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Stack spacing={0.5}>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                {t('inventory.title')}
              </Typography>
              <Typography variant="h4">{t('inventoryAnalytics.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 840 }}>
                {t('inventoryAnalytics.subtitle')}
              </Typography>
            </Stack>

            <Stack spacing={1} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
              <ToggleButtonGroup
                value={selectedCurrency}
                exclusive
                onChange={(_, val) => val && setSelectedCurrency(val)}
                size="small"
              >
                <ToggleButton value="USD">USD</ToggleButton>
                <ToggleButton value="EUR">EUR</ToggleButton>
                <ToggleButton value="RUB">RUB</ToggleButton>
                <ToggleButton value="UZS">UZS</ToggleButton>
              </ToggleButtonGroup>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={0.5} justifyContent="flex-end">
                {(['USD', 'EUR', 'RUB', 'UZS'] as Currency[]).map((cur) => {
                  const rate =
                    cur === selectedCurrency
                      ? 1
                      : convertValue(1, cur) || 0;
                  return (
                    <Chip
                      key={cur}
                      size="small"
                      label={`${cur} → ${selectedCurrency}: ${rate ? rate.toFixed(3) : '-'}`}
                      color={cur === selectedCurrency ? 'primary' : 'default'}
                      variant={cur === selectedCurrency ? 'filled' : 'outlined'}
                    />
                  );
                })}
              </Stack>
              <Typography variant="caption" sx={{ color: rateError ? 'error.main' : 'text.secondary' }}>
                {rateError
                  ? rateError
                  : rateUpdatedAt
                    ? `${t('inventoryAnalytics.rateUpdated')} ${rateUpdatedAt}`
                    : t('inventoryAnalytics.rateLoading')}
              </Typography>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title={t('inventoryAnalytics.cards.value')}
                value={fCurrency(totalValue, { currency: selectedCurrency })}
                hint={t('inventoryAnalytics.cards.valueHint')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title={t('inventoryAnalytics.cards.records')}
                value={fNumber(totalRecords)}
                hint={t('inventoryAnalytics.cards.recordsHint')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title={t('inventoryAnalytics.cards.categories')}
                value={fNumber(metrics.length)}
                hint={t('inventoryAnalytics.cards.categoriesHint')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title={t('inventoryAnalytics.cards.avgRecord')}
                value={fCurrency(averageValuePerRecord, { currency: selectedCurrency })}
                hint={t('inventoryAnalytics.cards.avgRecordHint')}
              />
            </Grid>
            {mostValuable ? (
              <Grid size={{ xs: 12, md: 8 }}>
                <SummaryCard
                  title={t('inventoryAnalytics.cards.topCategory')}
                  value={`${mostValuable.label} — ${fCurrency(mostValuable.value, { currency: selectedCurrency })}`}
                  hint={t('inventoryAnalytics.cards.topCategoryHint')}
                />
              </Grid>
            ) : null}
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ p: 2.5, height: 420 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">{t('inventoryAnalytics.charts.stockByCategory')}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('inventoryAnalytics.series.stock')}
                  </Typography>
                </Stack>
                <Chart
                  type="bar"
                  series={[{ name: t('inventoryAnalytics.series.stock'), data: amountSeries }]}
                  options={barOptions}
                  sx={{ height: 340 }}
                />
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ p: 2.5, height: 420 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">{t('inventoryAnalytics.charts.valueShare')}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('inventoryAnalytics.series.value')}
                  </Typography>
                </Stack>
                <Chart type="donut" series={valueSeries} options={donutOptions} sx={{ height: 340 }} />
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">{t('inventoryAnalytics.charts.recentChanges')}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('inventoryAnalytics.series.entries')}
                </Typography>
              </Stack>
              <Chart
                type="line"
                series={[
                  {
                    name: t('inventoryAnalytics.series.entries'),
                    data: timelineData.map(([, count]) => count),
                  },
                ]}
                options={lineOptions}
                sx={{ height: 320 }}
              />
            </Stack>
          </Card>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('inventoryAnalytics.table.category')}</TableCell>
                    <TableCell>{t('inventoryAnalytics.table.amount')}</TableCell>
                    <TableCell>{t('inventoryAnalytics.table.unit')}</TableCell>
                    <TableCell>{t('inventoryAnalytics.table.value')}</TableCell>
                    <TableCell>{t('inventoryAnalytics.table.records')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.map((item) => (
                    <TableRow key={item.key} hover>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{fShortenNumber(item.amount)}</TableCell>
                      <TableCell>{item.unit || t('inventoryAnalytics.emptyLabel')}</TableCell>
                      <TableCell>{fCurrency(item.value, { currency: selectedCurrency })}</TableCell>
                      <TableCell>{fNumber(item.count)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      </Box>
    </>
  );
}

// ----------------------------------------------------------------------

type SummaryCardProps = {
  title: string;
  value: string;
  hint?: string;
};

function SummaryCard({ title, value, hint }: SummaryCardProps) {
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Stack spacing={1.5} sx={{ height: '100%' }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
        <Typography variant="h4">{value}</Typography>
        {hint ? (
          <>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {hint}
            </Typography>
          </>
        ) : null}
      </Stack>
    </Card>
  );
}

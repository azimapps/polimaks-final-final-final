import { useMemo, useState, useEffect, useCallback } from 'react';

import { notifyFinanceRates, FINANCE_RATES_EVENT } from './finance-storage';

export type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';
export type DateRateOverrides = Record<string, Partial<Record<Currency, number>>>;

const STORAGE_KEY = 'finance-rates';
export const DEFAULT_RATES: Record<Currency, number> = { USD: 1, EUR: 0.92, RUB: 90, UZS: 12500 };

const readRateOverrides = (): DateRateOverrides => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DateRateOverrides;
  } catch {
    return {};
  }
};

const persistRateOverrides = (values: DateRateOverrides) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  notifyFinanceRates();
};

export function useFinanceRates() {
  const [rates, setRates] = useState<Record<Currency, number>>(DEFAULT_RATES);
  const [overrides, setOverrides] = useState<DateRateOverrides>(() => readRateOverrides());

  useEffect(() => {
    let active = true;
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('rate fetch failed');
        const data = (await res.json()) as { rates?: Record<string, number> };
        const fetched: Partial<Record<Currency, number>> = {};
        ['USD', 'EUR', 'RUB', 'UZS'].forEach((cur) => {
          if (data.rates?.[cur]) {
            fetched[cur as Currency] = data.rates[cur];
          }
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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = (event: StorageEvent | Event) => {
      if (event instanceof StorageEvent) {
        if (event.key && event.key !== STORAGE_KEY) return;
      }
      setOverrides(readRateOverrides());
    };
    window.addEventListener('storage', handler);
    window.addEventListener(FINANCE_RATES_EVENT, handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(FINANCE_RATES_EVENT, handler);
    };
  }, []);

  const updateOverrides = useCallback(
    (updater: (prev: DateRateOverrides) => DateRateOverrides) => {
      setOverrides((prev) => {
        const next = updater(prev);
        persistRateOverrides(next);
        return next;
      });
    },
    []
  );

  const setRateOverride = useCallback(
    (date: string, currency: Currency, value: number | null) => {
      updateOverrides((prev) => {
        const existing = prev[date] ? { ...prev[date] } : {};
        if (value === null || Number.isNaN(value)) {
          delete existing[currency];
        } else {
          existing[currency] = value;
        }
        if (Object.keys(existing).length === 0) {
          if (!(date in prev)) return prev;
          const next = { ...prev };
          delete next[date];
          return next;
        }
        return {
          ...prev,
          [date]: existing,
        };
      });
    },
    [updateOverrides]
  );

  const clearOverridesForDate = useCallback(
    (date: string) => {
      updateOverrides((prev) => {
        if (!prev[date]) return prev;
        const next = { ...prev };
        delete next[date];
        return next;
      });
    },
    [updateOverrides]
  );

  const getRateForDate = useCallback(
    (currency: Currency, date: string) => {
      const override = overrides[date]?.[currency];
      if (override != null) return override;
  if (currency === 'UZS') return 1;
  return rates[currency] ?? DEFAULT_RATES[currency] ?? 1;
    },
    [overrides, rates]
  );

  const hasManualRate = useCallback(
    (date: string) => Boolean(overrides[date] && Object.keys(overrides[date]!).length),
    [overrides]
  );

  const datesWithRates = useMemo(() => Object.keys(overrides).sort((a, b) => (a < b ? 1 : -1)), [overrides]);

  return {
    rates,
    overrides,
    setRateOverride,
    clearOverridesForDate,
    getRateForDate,
    hasManualRate,
    datesWithRates,
  };
}

import { v4 as uuidv4 } from 'uuid';

export type TransactionType = 'promise' | 'payment';

export type ClientSummary = {
  id: string;
  fullName: string;
};

export type ClientTransaction = {
  id: string;
  clientId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  notes: string;
};

export const CLIENTS_KEY = 'clients-main';
export const TRANSACTIONS_KEY = 'clients-transactions';

export const CURRENCY_OPTIONS = ['UZS', 'USD', 'EUR', 'RUB'] as const;
export const CURRENCY_RATES: Record<string, number> = {
  UZS: 1,
  USD: 11500,
  EUR: 12400,
  RUB: 130,
};

export const convertToDisplayCurrency = (value: number, from: string, to: string) => {
  const fromRate = CURRENCY_RATES[from] ?? 1;
  const toRate = CURRENCY_RATES[to] ?? 1;
  if (!fromRate || !toRate) return value;
  return (value * fromRate) / toRate;
};

export const formatAmount = (value: number) => new Intl.NumberFormat().format(value);

export const readClients = (): ClientSummary[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CLIENTS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((client: any) => ({
        id: client.id ?? '',
        fullName: client.fullName?.trim() || client.company?.trim() || '',
      }))
      .filter((client: ClientSummary) => Boolean(client.id));
  } catch {
    return [];
  }
};

export const readTransactions = (): ClientTransaction[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    const normalized: ClientTransaction[] = parsed.map((entry: any) => ({
      id: entry.id ?? uuidv4(),
      clientId: entry.clientId ?? '',
      type: entry.type === 'payment' ? 'payment' : 'promise',
      amount: Number(entry.amount) || 0,
      currency: (entry.currency ?? 'UZS').toString(),
      date: entry.date ?? new Date().toISOString().split('T')[0],
      notes: entry.notes ?? '',
    }));
    return normalized.filter((entry) => Boolean(entry.clientId));
  } catch {
    return [];
  }
};

export const persistTransactions = (transactions: ClientTransaction[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

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
export const ORDER_BOOK_KEY = 'clients-order-book';

export const CURRENCY_OPTIONS = ['UZS', 'USD', 'EUR', 'RUB'] as const;
export const CURRENCY_RATES: Record<string, number> = {
  UZS: 1,
  USD: 11500,
  EUR: 12400,
  RUB: 130,
};

const FALLBACK_CLIENTS: ClientSummary[] = [
  { id: 'client-1', fullName: 'Otabek Karimov' },
  { id: 'client-2', fullName: 'Dilnoza Rahimova' },
];

export const convertToDisplayCurrency = (value: number, from: string, to: string) => {
  const fromRate = CURRENCY_RATES[from] ?? 1;
  const toRate = CURRENCY_RATES[to] ?? 1;
  if (!fromRate || !toRate) return value;
  return (value * fromRate) / toRate;
};

export const formatAmount = (value: number) => new Intl.NumberFormat().format(value);

export const readClients = (): ClientSummary[] => {
  if (typeof window === 'undefined') return FALLBACK_CLIENTS;
  const stored = localStorage.getItem(CLIENTS_KEY);
  if (!stored) return FALLBACK_CLIENTS;
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return FALLBACK_CLIENTS;
    return parsed
      .map((client: any) => ({
        id: client.id ?? '',
        fullName: client.fullName?.trim() || client.company?.trim() || '',
      }))
      .filter((client: ClientSummary) => Boolean(client.id));
  } catch {
    return FALLBACK_CLIENTS;
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
      // All manual entries are treated as payments now
      type: 'payment',
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

type OrderBookItem = {
  id?: string;
  clientId?: string;
  orderNumber?: string;
  title?: string;
  quantityKg?: number;
  pricePerKg?: number;
  priceCurrency?: string;
  date?: string;
};

const toNumber = (value: unknown): number => (typeof value === 'number' ? value : Number(value) || 0);

export const readOrderBookPromises = (): ClientTransaction[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ORDER_BOOK_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    const normalized: ClientTransaction[] = parsed
      .map((entry: OrderBookItem, index) => {
        const clientId = entry.clientId ?? '';
        const quantity = toNumber(entry.quantityKg);
        const price = toNumber(entry.pricePerKg);
        const amount = quantity * price;
        if (!clientId || amount <= 0) return null;

        const currency = (entry.priceCurrency ?? 'UZS').toString().toUpperCase();
        const labelParts = [
          entry.orderNumber ? `Order ${entry.orderNumber}` : null,
          entry.title ? ` ${entry.title}` : null,
        ]
          .filter(Boolean)
          .join(': ')
          .trim();

        return {
          id: `orderbook-${entry.id ?? entry.orderNumber ?? index}`,
          clientId,
          type: 'promise' as TransactionType,
          amount,
          currency,
          date: entry.date ?? new Date().toISOString().split('T')[0],
          notes: labelParts || '',
        };
      })
      .filter(Boolean) as ClientTransaction[];

    return normalized;
  } catch {
    return [];
  }
};

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
  exchangeRate?: number;
};

export const CLIENTS_KEY = 'clients-main';
export const TRANSACTIONS_KEY = 'clients-transactions';
export const ORDER_BOOK_KEY = 'clients-order-book';

export const CURRENCY_OPTIONS = ['USD', 'UZS'] as const;
export const CURRENCY_RATES: Record<string, number> = {
  UZS: 1,
  USD: 11500,
};

const FALLBACK_CLIENTS: ClientSummary[] = [
  { id: 'client-1', fullName: 'Otabek Karimov' },
  { id: 'client-2', fullName: 'Dilnoza Rahimova' },
];

export const convertToDisplayCurrency = (
  value: number,
  from: string,
  to: string,
  manualRate?: number
) => {
  // If manualRate is provided, use it as the 'from' rate (assuming 'from' is the transaction currency)
  // We assume manualRate is always relative to the base currency (UZS), i.e., 1 Unit = X UZS.
  const fromRate = manualRate ?? CURRENCY_RATES[from] ?? 1;
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

  const transactions: ClientTransaction[] = [];
  const clients = readClients(); // Read clients to allow name matching fallback

  // 1. Read legacy client transactions
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const normalized: ClientTransaction[] = parsed.map((entry: any) => ({
          id: entry.id ?? uuidv4(),
          clientId: entry.clientId ?? '',
          type: 'payment',
          amount: Number(entry.amount) || 0,
          currency: (entry.currency ?? 'UZS').toString(),
          date: entry.date ?? new Date().toISOString().split('T')[0],
          notes: entry.notes ?? '',
          exchangeRate: entry.exchangeRate ? Number(entry.exchangeRate) : undefined,
        }));
        transactions.push(...normalized.filter((entry) => Boolean(entry.clientId)));
      }
    } catch {
      // ignore
    }
  }

  // Helper to resolve Client ID (check stored ID first, then fallback to name match)
  const resolveClientId = (entry: any): string | null => {
    if (entry.clientId) return entry.clientId;
    // Fallback: match by exact name
    const found = clients.find(c => c.fullName.trim().toLowerCase() === (entry.name || '').trim().toLowerCase());
    return found ? found.id : null;
  };

  // 2. Read Finance Income (Payments)
  // Income in Finance = We received money = Payment from Client
  const incomeRaw = localStorage.getItem('finance-income');
  if (incomeRaw) {
    try {
      const parsed = JSON.parse(incomeRaw);
      if (Array.isArray(parsed)) {
        const normalized: ClientTransaction[] = parsed
          .map((entry: any) => {
            const clientId = resolveClientId(entry);
            if (!clientId) return null;

            return {
              id: entry.id,
              clientId,
              type: 'payment', // Income is a payment FROM client
              amount: Number(entry.amount) || 0,
              currency: (entry.currency ?? 'UZS').toString(),
              date: entry.date ? String(entry.date) : new Date().toISOString().split('T')[0],
              notes: `Finance Income: ${entry.name} - ${entry.note || ''}`,
              exchangeRate: entry.exchangeRate ? Number(entry.exchangeRate) : undefined,
            };
          })
          .filter(Boolean) as ClientTransaction[];
        transactions.push(...normalized);
      }
    } catch {
      // ignore
    }
  }

  // 3. Read Finance Expense (Refunds? Or Payments TO client?)
  // Expense in Finance = We paid money = Refund? 
  // For now let's treat Expense linked to Client as "Giving Money Back" or "Loan to Client" -> Increases Debt (Promise)
  // Or maybe it's just a reverse payment. 
  // Let's assume Expense = We gave money to client.
  // If Client Balance = Paid - Promised.
  // We gave money -> Paid decreases? Or Promised increases?
  // Let's treat it as a negative payment for now? Or just 'promise' type (debt increases).
  const expenseRaw = localStorage.getItem('finance-expense');
  if (expenseRaw) {
    try {
      const parsed = JSON.parse(expenseRaw);
      if (Array.isArray(parsed)) {
        const normalized: ClientTransaction[] = parsed
          .map((entry: any) => {
            const clientId = resolveClientId(entry);
            if (!clientId) return null;

            return {
              id: entry.id,
              clientId,
              type: 'promise', // We gave money, so they owe us (Debt/Promise)
              amount: Number(entry.amount) || 0,
              currency: (entry.currency ?? 'UZS').toString(),
              date: entry.date ? String(entry.date) : new Date().toISOString().split('T')[0],
              notes: `Finance Expense: ${entry.name} - ${entry.note || ''}`,
              exchangeRate: entry.exchangeRate ? Number(entry.exchangeRate) : undefined,
            };
          })
          .filter(Boolean) as ClientTransaction[];
        transactions.push(...normalized);
      }
    } catch {
      // ignore
    }
  }

  return transactions;
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

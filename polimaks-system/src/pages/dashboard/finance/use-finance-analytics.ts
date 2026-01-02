import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { type Currency } from './use-finance-rates';
import { FINANCE_STORAGE_EVENT } from './finance-storage';

type Method = 'cash' | 'transfer';

export type FinanceEntry = {
    id: string;
    type: Method;
    amount: number;
    currency: Currency;
    date: string;
    createdAt: string;
    exchangeRate?: number;
};

const STORAGE_KEYS = { income: 'finance-income', expense: 'finance-expense' };
const SUPPORTED: Currency[] = ['UZS', 'USD'];
const todayISO = () => dayjs().format('YYYY-MM-DD');
const timestampISO = () => new Date().toISOString();

const normalizeEntries = (items: any[], prefix: string): FinanceEntry[] =>
    items.map((item, index) => ({
        id: item.id || `${prefix}-${index}`,
        type: item.type === 'transfer' ? 'transfer' : 'cash',
        amount: typeof item.amount === 'number' ? item.amount : Number(item.amount) || 0,
        currency: (SUPPORTED.includes(item.currency) ? item.currency : 'UZS') as Currency,
        date: item.date ? String(item.date).slice(0, 10) : todayISO(),
        createdAt: item.createdAt || timestampISO(),
        exchangeRate: item.exchangeRate ? Number(item.exchangeRate) : undefined,
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

const readClientTransactions = (): FinanceEntry[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem('clients-transactions');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((item: any) => item.type === 'payment') // Only Payments are Income
            .map((item: any) => ({
                id: item.id || uuidv4(),
                type: 'cash',
                amount: Number(item.amount) || 0,
                currency: (SUPPORTED.includes(item.currency) ? item.currency : 'UZS') as Currency,
                date: item.date ? String(item.date).slice(0, 10) : todayISO(),
                createdAt: item.date || timestampISO(),
                exchangeRate: item.exchangeRate ? Number(item.exchangeRate) : undefined,
            }));
    } catch {
        return [];
    }
};

export function useFinanceAnalytics(method: Method, rangeStart: string, rangeEnd: string, dayBeforeStart: string) {
    const [incomeEntries, setIncomeEntries] = useState<FinanceEntry[]>(() =>
        [...readFinanceStorage(STORAGE_KEYS.income, 'income'), ...readClientTransactions()]
    );
    const [expenseEntries, setExpenseEntries] = useState<FinanceEntry[]>(() =>
        readFinanceStorage(STORAGE_KEYS.expense, 'expense')
    );

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const refresh = () => {
            setIncomeEntries([...readFinanceStorage(STORAGE_KEYS.income, 'income'), ...readClientTransactions()]);
            setExpenseEntries(readFinanceStorage(STORAGE_KEYS.expense, 'expense'));
        };

        window.addEventListener(FINANCE_STORAGE_EVENT, refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener(FINANCE_STORAGE_EVENT, refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    const methodIncomes = useMemo(
        () => incomeEntries.filter((entry) => entry.type === method),
        [incomeEntries, method]
    );
    const methodExpenses = useMemo(
        () => expenseEntries.filter((entry) => entry.type === method),
        [expenseEntries, method]
    );

    const calculateBalance = useCallback((startDate: string | null, endDate: string | null, filterFn: (date: string) => boolean) => {
        const totals: { UZS: number; USD: number } = { UZS: 0, USD: 0 };

        // Sum Incomes
        methodIncomes.forEach((item) => {
            if (filterFn(item.date)) {
                if (item.currency === 'UZS' || item.currency === 'USD') {
                    totals[item.currency] += item.amount;
                }
            }
        });

        // Subtract Expenses
        methodExpenses.forEach((item) => {
            if (filterFn(item.date)) {
                if (item.currency === 'UZS' || item.currency === 'USD') {
                    totals[item.currency] -= item.amount;
                }
            }
        });

        return totals;
    }, [methodIncomes, methodExpenses]);

    const openingBalance = useMemo(
        () => calculateBalance(null, dayBeforeStart, (date) => date <= dayBeforeStart),
        [dayBeforeStart, calculateBalance]
    );

    const rangeNet = useMemo(
        () => calculateBalance(rangeStart, rangeEnd, (date) => date >= rangeStart && date <= rangeEnd),
        [rangeStart, rangeEnd, calculateBalance]
    );

    const finalBalance = useMemo(() => ({
        UZS: openingBalance.UZS + rangeNet.UZS,
        USD: openingBalance.USD + rangeNet.USD,
    }), [openingBalance, rangeNet]);

    return {
        openingBalance,
        rangeNet,
        finalBalance,
    };
}

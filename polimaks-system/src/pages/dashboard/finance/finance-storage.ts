export const FINANCE_STORAGE_EVENT = 'finance-storage-updated';
export const FINANCE_RATES_EVENT = 'finance-rates-updated';

export const notifyFinanceStorage = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(FINANCE_STORAGE_EVENT));
};

export const notifyFinanceRates = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(FINANCE_RATES_EVENT));
};

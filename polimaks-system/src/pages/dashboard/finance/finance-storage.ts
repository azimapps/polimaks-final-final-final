export const FINANCE_STORAGE_EVENT = 'finance-storage-updated';

export const notifyFinanceStorage = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(FINANCE_STORAGE_EVENT));
};

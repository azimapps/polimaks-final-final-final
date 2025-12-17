import { StaffSimplePage, type StaffMember } from './staff-template';

const ACCOUNTANT_SEED: StaffMember[] = [
  { id: 'acc-1', name: 'Lead accountant', phone: '907654321', description: 'Payroll and invoicing' },
  { id: 'acc-2', name: 'Assistant accountant', phone: '935551122', description: 'Payables and receipts' },
];

export default function StaffAccountantPage() {
  return <StaffSimplePage roleKey="accountant" storageKey="staff-accountant" seed={ACCOUNTANT_SEED} />;
}

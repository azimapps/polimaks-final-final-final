import { StaffSimplePage, type StaffMember } from './staff-template';

const CRM_SEED: StaffMember[] = [
  { id: 'crm-1', name: 'CRM lead', phone: '901234567', description: 'Owns key accounts' },
  { id: 'crm-2', name: 'Support rep', phone: '931112233', description: 'Handles inbound requests' },
];

export default function StaffCrmPage() {
  return <StaffSimplePage roleKey="crm" storageKey="staff-crm" seed={CRM_SEED} />;
}

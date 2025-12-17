import { StaffSimplePage, type StaffMember } from './staff-template';

const PLANNER_SEED: StaffMember[] = [
  { id: 'plan-1', name: 'Production planner', phone: '998765432', description: 'Slots jobs and capacities' },
  { id: 'plan-2', name: 'Shift coordinator', phone: '901119988', description: 'Coordinates shifts and changes' },
];

export default function StaffPlannerPage() {
  return <StaffSimplePage roleKey="planner" storageKey="staff-planner" seed={PLANNER_SEED} />;
}

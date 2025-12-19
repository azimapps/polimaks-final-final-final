import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import stanokReskaSeed from 'src/data/stanok-reska.json';
import brigadaReskaSeed from 'src/data/stanok-brigada-reska.json';

type PlanItem = {
  id: string;
  orderNumber: string;
  clientName: string;
  title: string;
  quantityKg: number;
  startDate: string;
  endDate: string;
  machineType: string;
  machineId: string;
  machineName?: string;
  groupId: string;
  groupName?: string;
};

const ORDER_PLAN_STORAGE_KEY = 'orderPlansV2';
const LEGACY_ORDER_PLAN_STORAGE_KEY = 'orderPlans';
const PLAN_SEED: PlanItem[] = [
  {
    id: 'reska-plan-1',
    orderNumber: 'RP-001',
    clientName: 'Demo klient',
    title: 'Kesish partiya',
    quantityKg: 1200,
    startDate: '2024-01-05',
    endDate: '2024-01-06',
    machineType: 'reska',
    machineId: 'reska-1',
    machineName: 'Kesish stanogi 1',
    groupId: 'brigada-reska-1',
    groupName: 'Reska Alpha',
  },
];

const normalizePlanItem = (raw: any, index: number): PlanItem => ({
  id: raw?.id || `plan-${index}`,
  orderNumber: raw?.orderNumber || '',
  clientName: raw?.clientName || '',
  title: raw?.title || '',
  quantityKg: Number(raw?.quantityKg) || 0,
  startDate: raw?.startDate || '',
  endDate: raw?.endDate || '',
  machineType: raw?.machineType || '',
  machineId: raw?.machineId || '',
  machineName: raw?.machineName || '',
  groupId: raw?.groupId || '',
  groupName: raw?.groupName || '',
});

const loadPlanItems = (): PlanItem[] => {
  if (typeof window === 'undefined') return PLAN_SEED;

  try {
    const stored = localStorage.getItem(ORDER_PLAN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as any[];
      const normalized = parsed.map((item, idx) => normalizePlanItem(item, idx));
      const reskaPlans = normalized.filter((plan) => plan.machineType === 'reska');
      if (reskaPlans.length) return reskaPlans;
    }

    const legacy = localStorage.getItem(LEGACY_ORDER_PLAN_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as any[];
      const normalized = parsed.map((item, idx) => normalizePlanItem(item, idx));
      const reskaPlans = normalized.filter((plan) => plan.machineType === 'reska');
      if (reskaPlans.length) return reskaPlans;
    }
  } catch {
    // ignore parse errors
  }

  return PLAN_SEED;
};

const readLocalArray = (key: string, fallback: any[]) => {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

// ----------------------------------------------------------------------

export default function ReskaOverviewPage() {
  const { t } = useTranslate('pages');
  const title = `${t('reskaPanel.title')} | ${CONFIG.appName}`;

  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [brigadas, setBrigadas] = useState<any[]>([]);
  const [selectedBrigadaId, setSelectedBrigadaId] = useState<string>('');
  const [plans, setPlans] = useState<PlanItem[]>(() => loadPlanItems());

  useEffect(() => {
    const loadMachines = () => setMachines(readLocalArray('stanok-reska', stanokReskaSeed as any[]));
    const loadBrigadas = () => {
      setBrigadas(
        selectedMachineId
          ? readLocalArray(`stanok-brigada-reska-${selectedMachineId}`, brigadaReskaSeed as any[])
          : readLocalArray('stanok-brigada-reska', brigadaReskaSeed as any[])
      );
    };
    const loadPlansFromStorage = () => setPlans(loadPlanItems());

    loadMachines();
    loadBrigadas();
    loadPlansFromStorage();

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === 'stanok-reska') loadMachines();
      if (event.key.startsWith('stanok-brigada-reska')) loadBrigadas();
      if (
        event.key === ORDER_PLAN_STORAGE_KEY ||
        event.key === LEGACY_ORDER_PLAN_STORAGE_KEY ||
        event.key === null
      ) {
        loadPlansFromStorage();
      }
    };

    const onFocus = () => {
      loadMachines();
      loadBrigadas();
      loadPlansFromStorage();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
      window.addEventListener('focus', onFocus);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [selectedMachineId]);

  useEffect(() => {
    if (!selectedMachineId && machines[0]?.id) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  useEffect(() => {
    const nextBrigadas = selectedMachineId
      ? readLocalArray(`stanok-brigada-reska-${selectedMachineId}`, brigadaReskaSeed as any[])
      : readLocalArray('stanok-brigada-reska', brigadaReskaSeed as any[]);
    setBrigadas(nextBrigadas);
  }, [selectedMachineId]);

  useEffect(() => {
    if (!brigadas.length) {
      setSelectedBrigadaId('');
      return;
    }
    if (!selectedBrigadaId || !brigadas.some((b: any) => b.id === selectedBrigadaId)) {
      setSelectedBrigadaId(brigadas[0]?.id || '');
    }
  }, [brigadas, selectedBrigadaId]);

  const filteredPlans = useMemo(
    () =>
      plans.filter(
        (plan) =>
          plan.machineType === 'reska' &&
          (!selectedMachineId || plan.machineId === selectedMachineId) &&
          (!selectedBrigadaId || plan.groupId === selectedBrigadaId)
      ),
    [plans, selectedMachineId, selectedBrigadaId]
  );

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <div>
            <Typography variant="h3" gutterBottom>
              {t('reskaPanel.overview.heading')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('reskaPanel.overview.description')}
            </Typography>
          </div>
        </Stack>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <FormControl fullWidth>
                <InputLabel>{t('reskaPanel.machineLabel')}</InputLabel>
                <Select
                  value={selectedMachineId}
                  label={t('reskaPanel.machineLabel')}
                  onChange={(e) => setSelectedMachineId(e.target.value as string)}
                >
                  {machines.length === 0 && (
                    <MenuItem value="">
                      <em>{t('reskaPanel.noMachines')}</em>
                    </MenuItem>
                  )}
                  {machines.map((machine: any) => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name || machine.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!brigadas.length}>
                <InputLabel>{t('reskaPanel.brigadaLabel')}</InputLabel>
                <Select
                  value={selectedBrigadaId}
                  label={t('reskaPanel.brigadaLabel')}
                  onChange={(e) => setSelectedBrigadaId(e.target.value as string)}
                >
                  {brigadas.length === 0 && (
                    <MenuItem value="">
                      <em>{t('reskaPanel.noBrigadas')}</em>
                    </MenuItem>
                  )}
                  {brigadas.map((brigada: any) => (
                    <MenuItem key={brigada.id} value={brigada.id}>
                      {brigada.name || brigada.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {selectedMachineId
                ? t('reskaPanel.overview.selection', {
                    machine: machines.find((m: any) => m.id === selectedMachineId)?.name || selectedMachineId,
                    brigada:
                      brigadas.find((b: any) => b.id === selectedBrigadaId)?.name ||
                      selectedBrigadaId ||
                      t('reskaPanel.noBrigadas'),
                  })
                : t('reskaPanel.noMachines')}
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('orderPlanPage.orderNumber')}</TableCell>
                    <TableCell>{t('orderPlanPage.client')}</TableCell>
                    <TableCell>{t('orderPlanPage.title')}</TableCell>
                    <TableCell align="right">{t('orderPlanPage.quantityKg')}</TableCell>
                    <TableCell>{t('orderPlanPage.date')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.disabled' }}>
                        {t('orderPlanPage.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => (
                      <TableRow key={plan.id} hover>
                        <TableCell>{plan.orderNumber}</TableCell>
                        <TableCell>{plan.clientName}</TableCell>
                        <TableCell>{plan.title}</TableCell>
                        <TableCell align="right">{plan.quantityKg}</TableCell>
                        <TableCell>
                          {plan.startDate
                            ? new Date(plan.startDate).toLocaleDateString()
                            : t('orderPlanPage.date')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Card>
      </Container>
    </>
  );
}

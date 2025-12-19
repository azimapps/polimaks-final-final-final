import React, { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import stanokReskaSeed from 'src/data/stanok-reska.json';
import brigadaReskaSeed from 'src/data/stanok-brigada-reska.json';

import { Iconify } from 'src/components/iconify';

type PlanItem = {
  id: string;
  orderNumber: string;
  clientName: string;
  title: string;
  quantityKg: number;
  orderDate?: string;
  startDate: string;
  endDate: string;
  machineType: string;
  machineId: string;
  machineName?: string;
  groupId: string;
  groupName?: string;
  material?: string;
  subMaterial?: string;
  filmThickness?: number;
  filmWidth?: number;
  cylinderLength?: number;
  cylinderCount?: number;
  cylinderAylanasi?: number;
  note?: string;
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
  orderDate: raw?.orderDate,
  startDate: raw?.startDate || '',
  endDate: raw?.endDate || '',
  machineType: raw?.machineType || '',
  machineId: raw?.machineId || '',
  machineName: raw?.machineName || '',
  groupId: raw?.groupId || '',
  groupName: raw?.groupName || '',
  material: raw?.material,
  subMaterial: raw?.subMaterial,
  filmThickness: Number(raw?.filmThickness) || undefined,
  filmWidth: Number(raw?.filmWidth) || undefined,
  cylinderLength: Number(raw?.cylinderLength) || undefined,
  cylinderCount: Number(raw?.cylinderCount) || undefined,
  cylinderAylanasi: Number(raw?.cylinderAylanasi) || undefined,
  note: raw?.note,
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
  const [openPlanRows, setOpenPlanRows] = useState<Record<string, boolean>>({});

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

  const togglePlanRow = (id: string) =>
    setOpenPlanRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

  const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

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
                    <TableCell width={56} />
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
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.disabled' }}>
                        {t('orderPlanPage.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => {
                      const isOpen = openPlanRows[plan.id];
                      return (
                        <React.Fragment key={plan.id}>
                          <TableRow hover>
                            <TableCell width={56}>
                              <IconButton size="small" onClick={() => togglePlanRow(plan.id)}>
                                <Iconify icon={isOpen ? 'eva:arrow-upward-fill' : 'eva:arrow-downward-fill'} />
                              </IconButton>
                            </TableCell>
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

                          <TableRow>
                            <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                <Box sx={{ px: 2, py: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                                  <Stack spacing={1.25}>
                                    <Typography variant="subtitle2">{t('orderPlanPage.details')}</Typography>
                                    <Box
                                      sx={{
                                        display: 'grid',
                                        gap: 1.5,
                                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                      }}
                                    >
                                      <DetailItem label={t('orderPlanPage.orderNumber')} value={plan.orderNumber} />
                                      <DetailItem label={t('orderPlanPage.client')} value={plan.clientName} />
                                      <DetailItem label={t('orderPlanPage.title')} value={plan.title} />
                                      <DetailItem
                                        label={t('orderPlanPage.quantityKg')}
                                        value={
                                          plan.quantityKg
                                            ? `${plan.quantityKg} ${t('orderPlanPage.kg')}`
                                            : ''
                                        }
                                      />
                                      <DetailItem label={t('orderPlanPage.date')} value={formatDate(plan.orderDate || plan.startDate)} />
                                      <DetailItem label={t('orderPlanPage.endDate')} value={formatDate(plan.endDate)} />
                                      <DetailItem label={t('reskaPanel.machineLabel')} value={plan.machineName || plan.machineId} />
                                      <DetailItem label={t('reskaPanel.brigadaLabel')} value={plan.groupName || plan.groupId} />
                                      <DetailItem
                                        label={t('orderPlanPage.material')}
                                        value={plan.material ? `${plan.material}${plan.subMaterial ? ` · ${plan.subMaterial}` : ''}` : ''}
                                      />
                                      <DetailItem
                                        label="Silindr"
                                        value={[
                                          plan.cylinderLength ? `L=${plan.cylinderLength} mm` : '',
                                          plan.cylinderCount ? `Soni=${plan.cylinderCount}` : '',
                                          plan.cylinderAylanasi ? `Ayln=${plan.cylinderAylanasi} mm` : '',
                                        ]
                                          .filter(Boolean)
                                          .join(' · ')}
                                      />
                                      <DetailItem
                                        label="Plyonka"
                                        value={[
                                          plan.filmThickness ? `${plan.filmThickness} mkm` : '',
                                          plan.filmWidth ? `${plan.filmWidth} mm` : '',
                                        ]
                                          .filter(Boolean)
                                          .join(' · ')}
                                      />
                                      <DetailItem label="Izoh" value={plan.note || ''} />
                                    </Box>
                                  </Stack>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
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

type DetailItemProps = { label: string; value?: string };

function DetailItem({ label, value }: DetailItemProps) {
  if (!value) return null;
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

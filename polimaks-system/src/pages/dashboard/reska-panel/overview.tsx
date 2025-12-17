import { useMemo, useState, useEffect } from 'react';

import Typography from '@mui/material/Typography';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';

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

const PLAN_STORAGE_KEY = 'orderPlansV2';

// ----------------------------------------------------------------------

export default function ReskaOverviewPage() {
  const { t } = useTranslate('pages');
  const title = `${t('reskaPanel.title')} | ${CONFIG.appName}`;

  const machines = useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('stanok-reska');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as any[];
          if (parsed.length) return parsed;
        } catch {
          // ignore corrupted data
        }
      }
    }
    return stanokReskaSeed as any[];
  }, []);

  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const [plans, setPlans] = useState<PlanItem[]>([]);

  const brigadas = useMemo(() => {
    if (!selectedMachineId) return [];
    if (typeof window !== 'undefined') {
      const keys = [`stanok-brigada-reska-${selectedMachineId}`, 'stanok-brigada-reska'];
      for (const key of keys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as any[];
            if (parsed.length) return parsed;
          } catch {
            // ignore corrupted data
          }
        }
      }
    }
    return brigadaReskaSeed as any[];
  }, [selectedMachineId]);

  const [selectedBrigadaId, setSelectedBrigadaId] = useState<string>('');

  useEffect(() => {
    if (!selectedMachineId && machines[0]?.id) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  useEffect(() => {
    if (!brigadas.length) {
      setSelectedBrigadaId('');
      return;
    }
    if (!selectedBrigadaId || !brigadas.some((b: any) => b.id === selectedBrigadaId)) {
      setSelectedBrigadaId(brigadas[0]?.id || '');
    }
  }, [brigadas, selectedBrigadaId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(PLAN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as any[];
        const mapped = parsed.map((p, idx) => ({
          id: p?.id || `plan-${idx}`,
          orderNumber: p?.orderNumber || '',
          clientName: p?.clientName || '',
          title: p?.title || '',
          quantityKg: Number(p?.quantityKg) || 0,
          startDate: p?.startDate || '',
          endDate: p?.endDate || '',
          machineType: p?.machineType || '',
          machineId: p?.machineId || '',
          machineName: p?.machineName || '',
          groupId: p?.groupId || '',
          groupName: p?.groupName || '',
        }));
        setPlans(mapped);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

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

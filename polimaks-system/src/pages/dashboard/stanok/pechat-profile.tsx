import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router';

import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Dialog,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import data from 'src/data/stanok-pechat.json';

import { Iconify } from 'src/components/iconify';

type Complaint = {
  id: string;
  message: string;
  createdAt: string;
  status: 'open' | 'resolved';
  resolvedAt: string | null;
};

type MonthlyPlan = {
  id: string;
  month: string;
  limitKg: number;
};

type Machine = {
  id: string;
  language_code: string;
  name: string;
  complaints: Complaint[];
  monthlyPlans: MonthlyPlan[];
};

const STORAGE_KEY = 'stanok-pechat';

const normalizeMachine = (m: any, currentMonth: string): Machine => ({
  id: m.id ?? uuidv4(),
  language_code: m.language_code ?? '',
  name: m.name ?? '',
  complaints: (m.complaints ?? []).map((comp: any) => ({
    id: comp.id ?? uuidv4(),
    message: comp.message ?? '',
    createdAt: comp.createdAt ?? new Date().toISOString(),
    status: comp.status === 'resolved' ? 'resolved' : 'open',
    resolvedAt: comp.resolvedAt ?? null,
  })),
  monthlyPlans: (m.monthlyPlans ?? []).map((plan: any) => ({
    id: plan.id ?? uuidv4(),
    month: plan.month ?? currentMonth,
    limitKg: Number(plan.limitKg) || 0,
  })),
});

const readMachines = (currentMonth: string): Machine[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return (data as any[]).map((m) => ({ ...m, complaints: [], monthlyPlans: [] }));
  try {
    const parsed = JSON.parse(stored) as any[];
    return parsed.map((m) => normalizeMachine(m, currentMonth));
  } catch {
    return (data as any[]).map((m) => ({ ...m, complaints: [], monthlyPlans: [] }));
  }
};

const persistMachines = (machines: Machine[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
};

export default function PechatProfilePage() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslate('pages');

  const currentMonth = useMemo(() => {
    const now = new Date();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${now.getFullYear()}-${m}`;
  }, []);

  const [machines, setMachines] = useState<Machine[]>(() => readMachines(currentMonth));
  const machine = useMemo(
    () => machines.find((m) => m.id === machineId) ?? null,
    [machines, machineId]
  );

  const [complaintText, setComplaintText] = useState('');
  const [plan, setPlan] = useState<{ month: string; limitKg: string }>({
    month: currentMonth,
    limitKg: '',
  });
  const complaintDialog = useBoolean();
  const planDialog = useBoolean();

  const updateMachine = useCallback(
    (updater: (m: Machine) => Machine) => {
      setMachines((prev) => {
        const next = prev.map((m) => (m.id === machineId ? updater(m) : m));
        persistMachines(next);
        return next;
      });
    },
    [machineId]
  );

  const addComplaint = () => {
    if (!machine || !complaintText.trim()) return;
    const payload: Complaint = {
      id: uuidv4(),
      message: complaintText.trim(),
      createdAt: new Date().toISOString(),
      status: 'open',
      resolvedAt: null,
    };
    updateMachine((m) => ({ ...m, complaints: [...(m.complaints ?? []), payload] }));
    setComplaintText('');
    complaintDialog.onFalse();
  };

  const toggleComplaintStatus = (complaintId: string) => {
    updateMachine((m) => ({
      ...m,
      complaints: (m.complaints ?? []).map((comp) =>
        comp.id === complaintId
          ? {
              ...comp,
              status: comp.status === 'resolved' ? 'open' : 'resolved',
              resolvedAt: comp.status === 'resolved' ? null : new Date().toISOString(),
            }
          : comp
      ),
    }));
  };

  const addPlan = () => {
    if (!machine || !plan.month || !plan.limitKg) return;
    const limit = Number(plan.limitKg) || 0;
    const payload: MonthlyPlan = { id: uuidv4(), month: plan.month, limitKg: limit };
    updateMachine((m) => {
      const filtered = (m.monthlyPlans ?? []).filter((p) => p.month !== plan.month);
      return { ...m, monthlyPlans: [...filtered, payload] };
    });
    planDialog.onFalse();
  };

  const canSaveComplaint = complaintText.trim().length > 0;
  const canSavePlan = plan.month >= currentMonth && Number(plan.limitKg) > 0;

  if (!machine) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" size="small" onClick={() => navigate(paths.dashboard.stanok.pechat)}>
              {t('stanokProfile.back')}
            </Button>
            <Typography variant="h6">{t('stanokProfile.notFound')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('stanokProfile.notFoundHint')}
          </Typography>
        </Stack>
      </Container>
    );
  }

  const title = `${machine.name} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.5}>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                {t('stanokProfile.overline')}
              </Typography>
              <Typography variant="h4">{machine.name || t('stanokProfile.unnamed')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('stanokProfile.language', { code: machine.language_code.toUpperCase() || 'N/A' })}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                component={RouterLink}
                to={paths.dashboard.stanok.pechat}
                variant="outlined"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              >
                {t('stanokProfile.back')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:chat-round-dots-bold" />}
                onClick={complaintDialog.onTrue}
              >
                {t('stanokProfile.addComplaint')}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Iconify icon="solar:calendar-date-bold" />}
                onClick={() => {
                  setPlan({ month: currentMonth, limitKg: '' });
                  planDialog.onTrue();
                }}
              >
                {t('stanokProfile.monthlyPlan')}
              </Button>
            </Stack>
          </Stack>

          <Card sx={{ p: 2.5 }}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1">{t('stanokProfile.info')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('stanokProfile.infoBody')}
              </Typography>
            </Stack>
          </Card>

          <Card sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">{t('stanokProfile.complaints')}</Typography>
              <Button size="small" onClick={complaintDialog.onTrue} startIcon={<Iconify icon="solar:chat-round-dots-bold" />}>
                {t('stanokProfile.addComplaint')}
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 160 }}>{t('stanokProfile.complaintDate')}</TableCell>
                    <TableCell>{t('stanokProfile.complaintText')}</TableCell>
                    <TableCell sx={{ width: 140 }}>{t('stanokProfile.status')}</TableCell>
                    <TableCell sx={{ width: 160 }}>{t('stanokProfile.resolvedAt')}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      {t('clientsPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {machine.complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                          {t('stanokProfile.noComplaints')}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    machine.complaints.map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell>{new Date(comp.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{comp.message}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              comp.status === 'resolved'
                                ? t('stanokProfile.statusResolved')
                                : t('stanokProfile.statusOpen')
                            }
                            color={comp.status === 'resolved' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {comp.resolvedAt ? new Date(comp.resolvedAt).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => toggleComplaintStatus(comp.id)}
                          >
                            {comp.status === 'resolved'
                              ? t('stanokProfile.reopen')
                              : t('stanokProfile.resolve')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Card sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">{t('stanokProfile.plans')}</Typography>
              <Button
                size="small"
                onClick={() => {
                  setPlan({ month: currentMonth, limitKg: '' });
                  planDialog.onTrue();
                }}
                startIcon={<Iconify icon="solar:calendar-date-bold" />}
              >
                {t('stanokProfile.monthlyPlan')}
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 140 }}>{t('clientsPage.planMonth')}</TableCell>
                    <TableCell sx={{ width: 160 }}>{t('clientsPage.planLimit')}</TableCell>
                    <TableCell>{t('stanokProfile.planStatus')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {machine.monthlyPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                          {t('stanokProfile.noPlans')}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    machine.monthlyPlans
                      .slice()
                      .sort((a, b) => a.month.localeCompare(b.month))
                      .map((planItem) => (
                        <TableRow key={planItem.id}>
                          <TableCell>{planItem.month}</TableCell>
                          <TableCell>{planItem.limitKg} kg</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                border: '1px dashed',
                                borderColor: 'divider',
                                bgcolor: 'background.neutral',
                              }}
                            >
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t('stanokProfile.planTodo')}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
              {t('stanokProfile.todoOrders')}
            </Typography>
          </Card>
        </Stack>
      </Container>

      <Dialog open={complaintDialog.value} onClose={complaintDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{t('stanokProfile.addComplaint')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            {t('clientsPage.complaintHint')}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder={t('clientsPage.complaintPlaceholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={complaintDialog.onFalse} color="inherit">
            {t('clientsPage.cancel')}
          </Button>
          <Button onClick={addComplaint} disabled={!canSaveComplaint} variant="contained">
            {t('clientsPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={planDialog.value} onClose={planDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{t('stanokProfile.monthlyPlan')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('clientsPage.planHint')}
            </Typography>
            <TextField
              fullWidth
              label={t('clientsPage.planMonth')}
              type="month"
              inputProps={{ min: currentMonth }}
              value={plan.month}
              onChange={(e) => setPlan((prev) => ({ ...prev, month: e.target.value }))}
            />
            <TextField
              fullWidth
              label={t('clientsPage.planLimit')}
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={plan.limitKg}
              onChange={(e) => setPlan((prev) => ({ ...prev, limitKg: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={planDialog.onFalse} color="inherit">
            {t('clientsPage.cancel')}
          </Button>
          <Button onClick={addPlan} disabled={!canSavePlan} variant="contained">
            {t('clientsPage.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

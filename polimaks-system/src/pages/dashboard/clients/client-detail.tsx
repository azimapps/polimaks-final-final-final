import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Button,
  Dialog,
  Divider,
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

import { Iconify } from 'src/components/iconify';

type Complaint = {
  id: string;
  message: string;
  createdAt: string;
  status: 'open' | 'resolved';
  resolvedAt: string | null;
};

type Client = {
  id: string;
  fullName: string;
  phone: string;
  company: string;
  notes: string;
  complaints: Complaint[];
  monthlyPlans: MonthlyPlan[];
};

const STORAGE_KEY = 'clients-main';

const getRawPhone = (value: string) => value.replace(/\D/g, '').slice(0, 9);

const formatPhone = (raw: string) => {
  const digits = getRawPhone(raw);
  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 7);
  const part4 = digits.slice(7, 9);
  let formatted = '';
  if (part1) formatted = `${part1}`;
  if (part2) formatted += ` ${part2}`;
  if (part3) formatted += `-${part3}`;
  if (part4) formatted += `-${part4}`;
  return formatted.trim();
};

const normalizeClient = (c: any, currentMonth: string): Client => ({
  id: c.id ?? uuidv4(),
  fullName: c.fullName ?? '',
  phone: c.phone ?? '',
  company: c.company ?? '',
  notes: c.notes ?? '',
  complaints: (c.complaints ?? []).map((comp: any) => ({
    id: comp.id ?? uuidv4(),
    message: comp.message ?? '',
    createdAt: comp.createdAt ?? new Date().toISOString(),
    status: comp.status === 'resolved' ? 'resolved' : 'open',
    resolvedAt: comp.resolvedAt ?? null,
  })),
  monthlyPlans: (c.monthlyPlans ?? []).map((plan: any) => ({
    id: plan.id ?? uuidv4(),
    month: plan.month ?? currentMonth,
    limitKg: Number(plan.limitKg) || 0,
  })),
});

const readClients = (currentMonth: string): Client[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as any[];
    return parsed.map((c) => normalizeClient(c, currentMonth));
  } catch {
    return [];
  }
};

const persistClients = (clients: Client[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
};

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslate('pages');

  const currentMonth = useMemo(() => {
    const now = new Date();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${now.getFullYear()}-${m}`;
  }, []);

  const [clients, setClients] = useState<Client[]>(() => readClients(currentMonth));
  const client = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId]
  );

  const [complaintText, setComplaintText] = useState('');
  const [plan, setPlan] = useState<{ month: string; limitKg: string }>({
    month: currentMonth,
    limitKg: '',
  });
  const complaintDialog = useBoolean();
  const planDialog = useBoolean();

  const updateClient = useCallback(
    (updater: (client: Client) => Client) => {
      setClients((prev) => {
        const next = prev.map((c) => (c.id === clientId ? updater(c) : c));
        persistClients(next);
        return next;
      });
    },
    [clientId]
  );

  const addComplaint = () => {
    if (!client || !complaintText.trim()) return;
    const payload: Complaint = {
      id: uuidv4(),
      message: complaintText.trim(),
      createdAt: new Date().toISOString(),
      status: 'open',
      resolvedAt: null,
    };
    updateClient((c) => ({ ...c, complaints: [...(c.complaints ?? []), payload] }));
    setComplaintText('');
    complaintDialog.onFalse();
  };

  const toggleComplaintStatus = (complaintId: string) => {
    updateClient((c) => ({
      ...c,
      complaints: (c.complaints ?? []).map((comp) =>
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
    if (!client || !plan.month || !plan.limitKg) return;
    const limit = Number(plan.limitKg) || 0;
    const payload: MonthlyPlan = { id: uuidv4(), month: plan.month, limitKg: limit };
    updateClient((c) => {
      const filtered = (c.monthlyPlans ?? []).filter((p) => p.month !== plan.month);
      return { ...c, monthlyPlans: [...filtered, payload] };
    });
    planDialog.onFalse();
  };

  const canSaveComplaint = complaintText.trim().length > 0;
  const canSavePlan = plan.month >= currentMonth && Number(plan.limitKg) > 0;

  if (!client) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" size="small" onClick={() => navigate(paths.dashboard.clients.root)}>
              {t('clientsDetail.back')}
            </Button>
            <Typography variant="h6">{t('clientsDetail.notFound')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('clientsDetail.notFoundHint')}
          </Typography>
        </Stack>
      </Container>
    );
  }

  const title = `${client.fullName} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.5}>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                {t('clientsDetail.overline')}
              </Typography>
              <Typography variant="h4">{client.fullName || t('clientsPage.notProvided')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {client.company || t('clientsPage.notProvided')}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                component={RouterLink}
                to={paths.dashboard.clients.root}
                variant="outlined"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              >
                {t('clientsDetail.back')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:chat-round-dots-bold" />}
                onClick={complaintDialog.onTrue}
              >
                {t('clientsPage.addComplaint')}
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
                {t('clientsPage.monthlyPlan')}
              </Button>
            </Stack>
          </Stack>

          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              {t('clientsDetail.contact')}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('clientsPage.phone')}
                  </Typography>
                  <Typography variant="body1">{formatPhone(client.phone)}</Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('clientsPage.company')}
                  </Typography>
                  <Typography variant="body1">{client.company || t('clientsPage.notProvided')}</Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('clientsPage.notes')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {client.notes || t('clientsPage.notProvided')}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">{t('clientsDetail.complaints')}</Typography>
              <Button size="small" onClick={complaintDialog.onTrue} startIcon={<Iconify icon="solar:chat-round-dots-bold" />}>
                {t('clientsPage.addComplaint')}
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 160 }}>{t('clientsDetail.complaintDate')}</TableCell>
                    <TableCell>{t('clientsDetail.complaintText')}</TableCell>
                    <TableCell sx={{ width: 140 }}>{t('clientsDetail.status')}</TableCell>
                    <TableCell sx={{ width: 160 }}>{t('clientsDetail.resolvedAt')}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      {t('clientsPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {client.complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                          {t('clientsDetail.noComplaints')}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    client.complaints.map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell>{new Date(comp.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{comp.message}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              comp.status === 'resolved'
                                ? t('clientsDetail.statusResolved')
                                : t('clientsDetail.statusOpen')
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
                              ? t('clientsDetail.reopen')
                              : t('clientsDetail.resolve')}
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
              <Typography variant="subtitle1">{t('clientsDetail.plans')}</Typography>
              <Button
                size="small"
                onClick={() => {
                  setPlan({ month: currentMonth, limitKg: '' });
                  planDialog.onTrue();
                }}
                startIcon={<Iconify icon="solar:calendar-date-bold" />}
              >
                {t('clientsPage.monthlyPlan')}
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 140 }}>{t('clientsPage.planMonth')}</TableCell>
                    <TableCell sx={{ width: 160 }}>{t('clientsPage.planLimit')}</TableCell>
                    <TableCell>{t('clientsDetail.planStatus')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {client.monthlyPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                          {t('clientsDetail.noPlans')}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    client.monthlyPlans
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
                                {t('clientsDetail.planTodo')}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('clientsDetail.todoOrders')}
            </Typography>
          </Card>
        </Stack>
      </Container>

      <Dialog open={complaintDialog.value} onClose={complaintDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{t('clientsPage.addComplaint')}</DialogTitle>
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
        <DialogTitle>{t('clientsPage.monthlyPlan')}</DialogTitle>
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

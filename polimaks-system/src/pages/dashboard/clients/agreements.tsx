import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';

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
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { ORDER_BOOK_KEY } from './transactions-data';

// ----------------------------------------------------------------------

type MonthlyPlan = {
  id: string;
  month: string; // YYYY-MM
  limit: number;
};

type StoredClient = {
  id: string;
  fullName: string;
  monthlyPlans?: MonthlyPlan[];
};

const CLIENTS_STORAGE_KEY = 'clients-main';
const ORDER_BOOK_STORAGE_KEY = ORDER_BOOK_KEY;
const FALLBACK_CLIENTS: StoredClient[] = [
  { id: 'client-1', fullName: 'Otabek Karimov', monthlyPlans: [] },
  { id: 'client-2', fullName: 'Dilnoza Rahimova', monthlyPlans: [] },
];

const readFullClients = (): StoredClient[] => {
  if (typeof window === 'undefined') return FALLBACK_CLIENTS;
  const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
  if (!stored) return FALLBACK_CLIENTS;
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return FALLBACK_CLIENTS;
    return parsed.map((item: any) => ({
      id: item.id ?? '',
      fullName: item.fullName ?? '',
      monthlyPlans: (item.monthlyPlans ?? []).map((plan: any) => ({
        id: plan.id ?? uuidv4(),
        month: plan.month ?? '',
        limit: Number(plan.limitKg ?? plan.limit ?? 0) || 0,
      })),
    }));
  } catch {
    return FALLBACK_CLIENTS;
  }
};

const persistPlans = (clientId: string, plans: MonthlyPlan[]) => {
  if (typeof window === 'undefined') return;
  const list = readFullClients();
  const next = list.map((client) =>
    client.id === clientId ? { ...client, monthlyPlans: plans } : client
  );
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(next));
};

type OrderRecord = {
  id: string;
  clientId: string;
  date?: string;
  startDate?: string;
  quantityKg: number;
};

const readOrderBook = (): OrderRecord[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ORDER_BOOK_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any, index: number) => ({
      id: item.id ?? `order-${index}`,
      clientId: item.clientId ?? '',
      date: item.date,
      startDate: item.startDate,
      quantityKg: Number(item.quantityKg ?? item.miqdor ?? 0) || 0,
    }));
  } catch {
    return [];
  }
};

const getOrderMonth = (order: OrderRecord): string | null => {
  const date = order.date || order.startDate;
  if (!date) return null;
  return String(date).slice(0, 7);
};

// ----------------------------------------------------------------------

export default function ClientAgreementsPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();
  const { clientId } = useParams();

  const clients = useMemo(() => readFullClients(), []);
  const client = useMemo(() => clients.find((item) => item.id === clientId) ?? null, [clients, clientId]);

  const [plans, setPlans] = useState<MonthlyPlan[]>(() => client?.monthlyPlans ?? []);
  const dialog = useBoolean();
  const [orders, setOrders] = useState<OrderRecord[]>(() => readOrderBook());
  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    limit: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CLIENTS_STORAGE_KEY) {
        const updated = readFullClients();
        const found = updated.find((c) => c.id === clientId);
        setPlans(found?.monthlyPlans ?? []);
      }
      if (event.key === ORDER_BOOK_STORAGE_KEY) {
        setOrders(readOrderBook());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [clientId]);

  useEffect(() => {
    const found = readFullClients().find((c) => c.id === clientId);
    setPlans(found?.monthlyPlans ?? []);
    setOrders(readOrderBook());
  }, [clientId]);

  const filtered = useMemo(
    () => [...plans].sort((a, b) => b.month.localeCompare(a.month)),
    [plans]
  );
  const pageTitle = `${client?.fullName ?? t('clientsPage.title')} — Agreements | ${CONFIG.appName}`;
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const monthTotals = useMemo(() => {
    const map = new Map<string, number>();
    orders
      .filter((order) => order.clientId === clientId)
      .forEach((order) => {
        const key = getOrderMonth(order);
        if (!key) return;
        map.set(key, (map.get(key) ?? 0) + order.quantityKg);
      });
    return map;
  }, [clientId, orders]);

  const rows = useMemo(
    () =>
      filtered.map((plan) => {
        const achieved = monthTotals.get(plan.month) ?? 0;
        const hit = achieved >= plan.limit && plan.limit > 0;
        const isCurrent = plan.month === currentMonth;
        const hitLabel = t('clientsAgreements.hit', { defaultValue: 'Hit limit' });
        const inProgressLabel = t('clientsAgreements.inProgress', { defaultValue: 'In progress' });
        const belowLimitLabel = t('clientsAgreements.belowLimit', { defaultValue: 'Below limit' });
        let color: 'success' | 'warning' | 'error' = 'success';
        let label = hitLabel;
        if (hit) {
          color = 'success';
          label = hitLabel;
        } else if (isCurrent) {
          color = 'warning';
          label = inProgressLabel;
        } else {
          color = 'error';
          label = belowLimitLabel;
        }
        return { ...plan, achieved, status: { color, label }, isCurrent };
      }),
    [currentMonth, filtered, monthTotals, t]
  );

  const savePlan = () => {
    if (!clientId || !form.month || !Number(form.limit)) return;
    const payload: MonthlyPlan = {
      id: uuidv4(),
      month: form.month,
      limit: Number(form.limit) || 0,
    };
    const nextPlans = (() => {
      const others = plans.filter((p) => p.month !== payload.month);
      return [...others, payload].sort((a, b) => a.month.localeCompare(b.month));
    })();
    setPlans(nextPlans);
    persistPlans(clientId, nextPlans);
    dialog.onFalse();
    setForm({ month: currentMonth, limit: '' });
  };

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" rowGap={1}>
            <Button
              onClick={() => navigate(paths.dashboard.clients.root)}
              startIcon={<span aria-hidden>←</span>}
              color="inherit"
            >
              {t('clientsPage.title')}
            </Button>
            <Typography variant="h4">{t('clientsAgreements.title', { defaultValue: 'Agreements' })}</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" rowGap={1}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {client?.fullName || t('clientsTransactionsPage.detailGeneric')}
            </Typography>
            <Chip
              label={`Plans: ${plans.length}`}
              color="info"
              size="small"
              variant="soft"
            />
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
            <Stack spacing={0.25}>
              <Typography variant="subtitle1">
                {t('clientsAgreements.monthlyLimits', { defaultValue: 'Monthly limits' })}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('clientsAgreements.subtitle', {
                  defaultValue: 'Track monthly commitment vs. delivered.',
                })}
              </Typography>
            </Stack>
            <Button variant="contained" onClick={dialog.onTrue}>
              {t('clientsAgreements.addLimit', { defaultValue: 'Add month limit' })}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 160 }}>{t('clientsAgreements.month', { defaultValue: 'Month' })}</TableCell>
                    <TableCell sx={{ width: 160 }}>{t('clientsAgreements.limit', { defaultValue: 'Limit' })}</TableCell>
                    <TableCell sx={{ width: 160 }}>
                      {t('clientsAgreements.actual', { defaultValue: 'Progress' })}
                    </TableCell>
                    <TableCell sx={{ width: 160 }}>{t('clientsAgreements.status', { defaultValue: 'Status' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Box sx={{ py: 4 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('clientsAgreements.empty', {
                              defaultValue: 'No monthly limits yet. Add one to start tracking.',
                            })}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((item) => (
                      <TableRow
                        key={item.id}
                        hover
                        sx={{
                          ...(item.isCurrent && {
                            bgcolor: (theme) =>
                              theme.palette.mode === 'light'
                                ? 'rgba(0, 167, 111, 0.06)'
                                : 'rgba(0, 167, 111, 0.12)',
                          }),
                        }}
                      >
                        <TableCell>{item.month}</TableCell>
                        <TableCell>{item.limit.toLocaleString()} kg</TableCell>
                        <TableCell>{item.achieved.toLocaleString()} kg</TableCell>
                        <TableCell>
                          <Chip label={item.status.label} color={item.status.color} size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      </Container>

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{t('clientsAgreements.addLimit', { defaultValue: 'Add month limit' })}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              type="month"
              label={t('clientsAgreements.month', { defaultValue: 'Month' })}
              value={form.month}
              onChange={(e) => setForm((prev) => ({ ...prev, month: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="number"
              label={t('clientsAgreements.limit', { defaultValue: 'Limit amount' })}
              value={form.limit}
              onChange={(e) => setForm((prev) => ({ ...prev, limit: e.target.value }))}
              inputProps={{ min: 0, step: 1 }}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('clientsAgreements.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button onClick={savePlan} variant="contained" disabled={!form.month || !Number(form.limit)}>
            {t('clientsAgreements.saveLimit', { defaultValue: 'Save limit' })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

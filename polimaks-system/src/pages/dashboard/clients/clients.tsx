import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Menu,
  Stack,
  Table,
  Button,
  Dialog,
  MenuItem,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
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

import {
  formatAmount,
  ORDER_BOOK_KEY,
  CURRENCY_OPTIONS,
  TRANSACTIONS_KEY,
  readTransactions,
  readOrderBookPromises,
  convertToDisplayCurrency,
} from './transactions-data';

// ----------------------------------------------------------------------

export type Client = {
  id: string;
  fullName: string;
  phone: string;
  company: string;
  notes: string;
  complaints: Complaint[];
  monthlyPlans: MonthlyPlan[];
};

type Complaint = {
  id: string;
  message: string;
  createdAt: string;
  status: 'open' | 'resolved';
  resolvedAt: string | null;
};

export type MonthlyPlan = {
  id: string;
  month: string; // YYYY-MM
  limitKg: number;
};

const STORAGE_KEY = 'clients-main';

const getRawPhone = (value: string | undefined | null) =>
  (typeof value === 'string' ? value : '').replace(/\D/g, '').slice(0, 9);

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

const seedData: Client[] = [
  {
    id: 'client-1',
    fullName: 'Otabek Karimov',
    phone: formatPhone('991234567'),
    company: 'PoliTex Group',
    notes: 'Key contact for packaging films. Prefers USD quotes.',
    complaints: [],
    monthlyPlans: [],
  },
  {
    id: 'client-2',
    fullName: 'Dilnoza Rahimova',
    phone: formatPhone('909876543'),
    company: 'GreenPack LLC',
    notes: 'Handles tolling materials (davalilik).',
    complaints: [],
    monthlyPlans: [],
  },
];

// ----------------------------------------------------------------------

export default function ClientsPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();
  const currentMonth = useMemo(() => {
    const now = new Date();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${now.getFullYear()}-${m}`;
  }, []);

  const initialData = useMemo<Client[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Client[];
          return parsed.map((c) => ({
            ...c,
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
          }));
        } catch {
          // ignore parsing errors
        }
      }
    }
    return seedData;
  }, [currentMonth]);

  const [items, setItems] = useState<Client[]>(initialData);
  const [form, setForm] = useState<{ fullName: string; phone: string; company: string; notes: string }>({
    fullName: '',
    phone: '',
    company: '',
    notes: '',
  });
  const [transactions, setTransactions] = useState(() => readTransactions());
  const [orderPromises, setOrderPromises] = useState(() => readOrderBookPromises());
  const [displayCurrency, setDisplayCurrency] = useState<string>(CURRENCY_OPTIONS[0]);
  const [editing, setEditing] = useState<Client | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<Client | null>(null);
  const [complaintText, setComplaintText] = useState('');
  const [plan, setPlan] = useState<{ month: string; limitKg: string }>({ month: '', limitKg: '' });
  const dialog = useBoolean();
  const deleteDialog = useBoolean();
  const complaintDialog = useBoolean();
  const planDialog = useBoolean();
  const pageTitle = `${t('clients.items.clients.title')} | ${CONFIG.appName}`;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TRANSACTIONS_KEY) {
        setTransactions(readTransactions());
      }
      if (event.key === ORDER_BOOK_KEY) {
        setOrderPromises(readOrderBookPromises());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const allTransactions = useMemo(
    () => [...transactions, ...orderPromises],
    [orderPromises, transactions]
  );

  const clientSummaries = useMemo(() => {
    const paidMap = new Map<string, number>();
    const promiseMap = new Map<string, number>();

    items.forEach((client) => {
      paidMap.set(client.id, 0);
      promiseMap.set(client.id, 0);
    });

    allTransactions.forEach((tx) => {
      if (!tx.clientId) return;
      const converted = convertToDisplayCurrency(tx.amount, tx.currency, displayCurrency, tx.exchangeRate);
      if (tx.type === 'payment') {
        paidMap.set(tx.clientId, (paidMap.get(tx.clientId) ?? 0) + converted);
      } else {
        promiseMap.set(tx.clientId, (promiseMap.get(tx.clientId) ?? 0) + converted);
      }
    });

    return items.map((client) => {
      const paid = paidMap.get(client.id) ?? 0;
      const promised = promiseMap.get(client.id) ?? 0;
      const balance = paid - promised;

      const status =
        balance === 0
          ? {
            label: t('clientsTransactionsPage.statusBalanced'),
            color: 'success' as const,
            caption: t('clientsTransactionsPage.balanceBalanced'),
          }
          : balance > 0
            ? {
              label: t('clientsTransactionsPage.statusWeOwe'),
              color: 'info' as const,
              caption: t('clientsTransactionsPage.balanceWeOwe', {
                amount: formatAmount(balance),
              }),
            }
            : {
              label: t('clientsTransactionsPage.statusTheyOwe'),
              color: 'error' as const,
              caption: t('clientsTransactionsPage.balanceClientOwes', {
                amount: formatAmount(Math.abs(balance)),
              }),
            };

      return {
        client,
        paid,
        promised,
        balance,
        status,
      };
    });
  }, [allTransactions, displayCurrency, items, t]);

  const setItemsAndPersist = (updater: (prev: Client[]) => Client[]) => {
    setItems((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ fullName: '', phone: '', company: '', notes: '' });
    dialog.onTrue();
  };

  const openEdit = (item: Client) => {
    setEditing(item);
    setForm({
      fullName: item.fullName,
      phone: formatPhone(item.phone),
      company: item.company,
      notes: item.notes,
    });
    dialog.onTrue();
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: Client) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const handleSave = () => {
    const payload: Client = {
      id: editing ? editing.id : uuidv4(),
      fullName: form.fullName.trim(),
      phone: getRawPhone(form.phone),
      company: form.company.trim(),
      notes: form.notes.trim(),
      complaints: editing?.complaints ?? [],
      monthlyPlans: editing?.monthlyPlans ?? [],
    };
    if (editing) {
      setItemsAndPersist((prev) => prev.map((it) => (it.id === editing.id ? payload : it)));
    } else {
      setItemsAndPersist((prev) => [...prev, payload]);
    }
    dialog.onFalse();
  };

  const handleDelete = () => {
    if (menuItem) {
      setItemsAndPersist((prev) => prev.filter((it) => it.id !== menuItem.id));
    }
    deleteDialog.onFalse();
    setMenuItem(null);
    setEditing(null);
  };

  const addComplaint = () => {
    if (!menuItem || !complaintText.trim()) return;
    const payload: Complaint = {
      id: uuidv4(),
      message: complaintText.trim(),
      createdAt: new Date().toISOString(),
      status: 'open',
      resolvedAt: null,
    };
    setItemsAndPersist((prev) =>
      prev.map((c) =>
        c.id === menuItem.id ? { ...c, complaints: [...(c.complaints ?? []), payload] } : c
      )
    );
    setComplaintText('');
    complaintDialog.onFalse();
  };

  const addPlan = () => {
    if (!menuItem || !plan.month || !plan.limitKg) return;
    const limit = Number(plan.limitKg) || 0;
    const payload: MonthlyPlan = { id: uuidv4(), month: plan.month, limitKg: limit };
    setItemsAndPersist((prev) =>
      prev.map((c) => {
        if (c.id !== menuItem.id) return c;
        const others = (c.monthlyPlans ?? []).filter((p) => p.month !== plan.month);
        return { ...c, monthlyPlans: [...others, payload] };
      })
    );
    planDialog.onFalse();
  };

  const onPhoneChange = (value: string) => setForm((prev) => ({ ...prev, phone: formatPhone(value) }));
  const canSave = form.fullName.trim() && getRawPhone(form.phone).length === 9;
  const canSaveComplaint = complaintText.trim().length > 0;
  const canSavePlan = plan.month >= currentMonth && Number(plan.limitKg) > 0;

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1.5}
          >
            <Box>
              <Typography variant="h4">{t('clientsPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('clientsPage.subtitle')}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
              <TextField
                select
                size="small"
                label={t('clientsTransactionsPage.displayCurrencyLabel')}
                value={displayCurrency}
                onChange={(event) => setDisplayCurrency(event.target.value)}
                sx={{ minWidth: 160 }}
              >
                {CURRENCY_OPTIONS.map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="contained" onClick={openAdd}>
                {t('clientsPage.add')}
              </Button>
            </Stack>
          </Stack>

          <Card>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 200 }}>{t('clientsPage.fullName')}</TableCell>
                    <TableCell sx={{ width: 120 }}>{t('clientsPage.phone')}</TableCell>
                    <TableCell sx={{ width: 180 }}>{t('clientsPage.company')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('clientsPage.notes')}</TableCell>
                    <TableCell sx={{ width: 200 }}>{t('clientsTransactionsPage.tableBalance')}</TableCell>
                    <TableCell align="right" sx={{ width: 260 }}>
                      {t('clientsPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box
                          sx={{
                            py: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('clientsPage.empty')}
                          </Typography>
                          <Button size="small" variant="outlined" onClick={openAdd}>
                            {t('clientsPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientSummaries.map(({ client, balance, status }) => (
                      <TableRow key={client.id} hover>
                        <TableCell>{client.fullName}</TableCell>
                        <TableCell>{formatPhone(client.phone)}</TableCell>
                        <TableCell>{client.company || t('clientsPage.notProvided')}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {client.notes || t('clientsPage.notProvided')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: 0.75,
                                bgcolor: `${status.color}.main`,
                              }}
                            />
                            <Stack spacing={0.25}>
                              <Typography variant="body2">
                                {formatAmount(balance)} {displayCurrency}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {status.label}
                              </Typography>
                            </Stack>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={(e) => openMenu(e, client)}>
                            <Iconify icon="solar:menu-dots-bold-duotone" />
                          </IconButton>
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
        <DialogTitle>{editing ? t('clientsPage.edit') : t('clientsPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('clientsPage.fullName')}
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('clientsPage.phone')}
                value={form.phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="99 123-45-67"
                inputProps={{ inputMode: 'tel' }}
                helperText={t('clientsPage.phoneHelper')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={t('clientsPage.company')}
                value={form.company}
                onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label={t('clientsPage.notes')}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('clientsPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('clientsPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('clientsPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('clientsPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('clientsPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('clientsPage.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (menuItem) {
              navigate(paths.dashboard.clients.agreementsClient(menuItem.id));
            }
            closeMenu();
          }}
        >
          <Iconify icon="solar:file-text-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {t('clientsAgreements.title', { defaultValue: 'Agreements' })}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuItem) {
              navigate(paths.dashboard.clients.transactionsClient(menuItem.id));
            }
            closeMenu();
          }}
        >
          <Iconify icon="eva:arrow-ios-forward-fill" width={18} height={18} style={{ marginRight: 8 }} />
          {t('clientsTransactionsPage.viewHistory')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuItem) {
              navigate(paths.dashboard.clients.complaintsClient(menuItem.id));
            }
            closeMenu();
          }}
        >
          <Iconify icon="solar:chat-round-dots-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {t('clientsComplaints.title', { defaultValue: 'Complaints' })}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuItem) openEdit(menuItem);
          }}
        >
          <Iconify icon="solar:pen-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {t('clientsPage.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuItem) {
              deleteDialog.onTrue();
            }
            closeMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {t('clientsPage.delete')}
        </MenuItem>
      </Menu>

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
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'background.neutral',
              }}
            >
              <Typography variant="subtitle2">{t('clientsPage.planTodoTitle')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('clientsPage.planTodoBody')}
              </Typography>
            </Box>
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

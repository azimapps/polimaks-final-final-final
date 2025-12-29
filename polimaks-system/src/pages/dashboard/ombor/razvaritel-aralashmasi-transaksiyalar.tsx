/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate } from 'react-router';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import pechatSeed from 'src/data/stanok-pechat.json';
import reskaSeed from 'src/data/stanok-reska.json';
import laminatsiyaSeed from 'src/data/stanok-laminatsiya.json';
import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

type MachineType = 'pechat' | 'reska' | 'laminatsiya';
type MachineTypeValue = MachineType | '';

type MixtureComponent = {
  razvaritelId: string;
  quantity: number;
};

type Mixture = {
  id: string;
  name: string;
  eafComponent: MixtureComponent | null;
  etilinComponent: MixtureComponent | null;
  metoksilComponent: MixtureComponent | null;
  totalLiter: number;
  totalKg: number;
  pricePerLiter: number;
  pricePerKg: number;
  createdDate: string;
};

type MixtureTransaction = {
  id: string;
  mixtureId: string;
  date: string;
  type: 'in' | 'out';
  amountLiter: number;
  machineType: MachineTypeValue;
  machineId: string;
  orderId?: string; // Selected order ID
  note: string;
  createdAt: number;
};

type OrderBookItem = {
  id: string;
  orderNumber: string;
  clientName: string;
  title: string;
};

const MIXTURES_STORAGE_KEY = 'ombor-razvaritel-mixtures';
const TX_STORAGE_KEY = 'ombor-mixture-transactions';
const ORDERS_STORAGE_KEY = 'clients-order-book';

type Machine = { id: string; name?: string };

const MACHINE_SOURCE: Record<MachineType, { storageKey: string; seed: Machine[] }> = {
  pechat: { storageKey: 'stanok-pechat', seed: pechatSeed as any as Machine[] },
  reska: { storageKey: 'stanok-reska', seed: reskaSeed as any as Machine[] },
  laminatsiya: { storageKey: 'stanok-laminatsiya', seed: laminatsiyaSeed as any as Machine[] },
};

export default function MixtureTransactionsPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();

  // Load mixtures from localStorage
  const initialMixtures = useMemo<Mixture[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MIXTURES_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as Mixture[];
        } catch {
          // ignore corrupted data
        }
      }
    }
    return [];
  }, []);

  // Load transactions from localStorage
  const initialTransactions = useMemo<MixtureTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TX_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as MixtureTransaction[];
        } catch {
          // ignore corrupted data
        }
      }
    }
    return [];
  }, []);

  // Load orders from localStorage
  const initialOrders = useMemo<OrderBookItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as OrderBookItem[];
        } catch {
          // ignore corrupted data
        }
      }
    }
    return [];
  }, []);

  const { mixtureId } = useParams();
  const [mixtures, setMixtures] = useState<Mixture[]>(initialMixtures);
  const mixture = useMemo(() => mixtures.find((m) => m.id === mixtureId) || null, [mixtures, mixtureId]);

  const [transactions, setTransactions] = useState<MixtureTransaction[]>(() =>
    initialTransactions.filter(tx => tx.mixtureId === mixtureId)
  );
  const [orders] = useState<OrderBookItem[]>(initialOrders);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<MixtureTransaction | null>(null);

  // Form state
  // selectedMixture is implied by URL param
  // type is always 'out'
  const [form, setForm] = useState<{
    amountLiter: string;
    date: string;
    machineType: MachineTypeValue;
    machineId: string;
    orderId: string | null;
    note: string;
  }>({
    amountLiter: '',
    date: new Date().toISOString().slice(0, 10),
    machineType: '',
    machineId: '',
    orderId: null,
    note: '',
  });

  const requiresMachine = true; // Always requires machine for usage ('out')

  const persistTransactions = useCallback((txList: MixtureTransaction[]) => {
    // We need to merge with OTHER mixtures' transactions
    const allTx = JSON.parse(localStorage.getItem(TX_STORAGE_KEY) || '[]') as MixtureTransaction[];
    const others = allTx.filter(tx => tx.mixtureId !== mixtureId);
    const combined = [...others, ...txList];

    try {
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(combined));
    } catch (error) {
      console.error('Failed to save mixture transactions:', error);
    }
  }, [mixtureId]);

  const getMachines = useCallback((machineType: MachineType): Machine[] => {
    if (typeof window === 'undefined') return [];

    const { storageKey, seed } = MACHINE_SOURCE[machineType];
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        return JSON.parse(stored) as Machine[];
      } catch {
        return seed;
      }
    }

    return seed;
  }, []);

  const machines = useMemo(() => {
    if (!form.machineType) return [];
    return getMachines(form.machineType as MachineType);
  }, [form.machineType, getMachines]);

  const resetForm = useCallback(() => {
    setForm({
      amountLiter: '',
      date: new Date().toISOString().slice(0, 10),
      machineType: '',
      machineId: '',
      orderId: null,
      note: '',
    });
  }, []);

  // Calculate stock based on initial mixture quantity and transactions
  const mergedTransactions = useMemo<MixtureTransaction[]>(() => {
    if (!mixture) return transactions;
    // The mixture itself represents the INITIAL 'in' transaction (creation)
    // Actually, the mixture.totalLiter in JSON is likely the *current* value if we were using the old system.
    // But in the new system, we should treat mixture creation as the source.
    // mixture.totalLiter could be the INITIAL amount or CURRENT.
    // In `razvaritel-aralashmasi.tsx`, we have 'totalLiter' which is decremented.
    // Note: To match other pages, we should reconstruct flow.
    // However, if `totalLiter` is already mutually updated, we might rely on it.
    // BUT, the goal is to calculate it dynamically here.
    // Let's assume standard pattern:
    // We construct a fake 'initial' transaction from the mixture data?
    // Wait, the mixture might have a `createdDate` and initial amount.
    // BUT `razvaritel-aralashmasi.tsx` DECREMENTS `totalLiter` in `updateRazvaritelInventory`.
    // NO, `updateRazvaritelInventory` updates RAW MATERIALS.
    // The mixture ITSELF has `totalLiter`.
    // We should assume `mixture.totalLiter` in storage is the CURRENT valid stock if we trust it,
    // OR we switch to "initial total" + transactions.
    // For now, let's stick to the "calculate from history" pattern if possible, BUT we need the INITIAL amount.
    // If `totalLiter` in storage is already decremented, we can't easily get the specific initial amount unless we stored it.
    // `razvaritel-aralashmasi.tsx` creates `totalLiter` (initial) and does NOT store an `initialTotalLiter`.
    // AND it has `handleCreateMixture` which sets `totalLiter`.
    // AND `razvaritel-aralashmasi-transaksiyalar.tsx` (old) was decrementing it.
    // IF we want to use the "Transaction History" as the source of truth for current stock, we need the STARTING point.
    // For existing mixtures, `totalLiter` is whatever it is now.
    // Let's treat the current `mixture.totalLiter` (when loaded) as the STARTING point for this session? No, that's buggy.
    // HACK: We will assume `mixture` object in localStorage IS the source of truth for "Available Stock" to be simple,
    // and transactions just LOG usage.
    // BUT user wants "Standardize". Standard pattern is: Stock = Initial + In - Out.
    // If we want that, we need an `initialAmount` field on Mixture.
    // Since we can't migrate easily without data loss risk, let's do this:
    // We will use the `mixture` object's `totalLiter` as the CURRENT stock for validation.
    // And when we save a transaction, we DECREMENT `mixture.totalLiter` in storage (as the old code did).
    // This maintains compatibility while enforcing the "Usage" UI.

    // So, we don't use `mergedTransactions` for stock calc, we use it for display.
    return transactions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [mixture, transactions]);

  // Recalculate current stock from mixture object (which is updated on save)
  const currentLiter = useMemo(() => mixture?.totalLiter || 0, [mixture]);

  const handleSubmit = useCallback(() => {
    if (!mixtureId || !mixture) return;
    const amount = Number(form.amountLiter);
    if (Number.isNaN(amount) || amount <= 0) return;
    if (amount > currentLiter) return;
    if (requiresMachine && (!form.machineId || !form.machineType)) return;

    const newTransaction: MixtureTransaction = {
      id: uuidv4(),
      mixtureId,
      date: form.date,
      type: 'out',
      amountLiter: amount,
      machineType: form.machineType,
      machineId: form.machineId,
      orderId: form.orderId || undefined,
      note: form.note,
      createdAt: Date.now(),
    };

    const updatedTx = [newTransaction, ...transactions]; // Newest first for local state

    // Update mixture inventory
    const allMixtures = JSON.parse(localStorage.getItem(MIXTURES_STORAGE_KEY) || '[]') as Mixture[];
    const updatedMixtures = allMixtures.map(m => {
      if (m.id === mixtureId) {
        return {
          ...m,
          totalLiter: Math.max(0, m.totalLiter - amount),
        };
      }
      return m;
    });

    setMixtures(updatedMixtures);
    localStorage.setItem(MIXTURES_STORAGE_KEY, JSON.stringify(updatedMixtures));

    setTransactions(updatedTx);
    persistTransactions(updatedTx);
    setOpen(false);
    resetForm();
  }, [mixtureId, mixture, form, currentLiter, requiresMachine, transactions, persistTransactions, resetForm]);

  const handleDelete = useCallback(() => {
    if (!selectedTx) return;

    const updatedTx = transactions.filter(tx => tx.id !== selectedTx.id);
    setTransactions(updatedTx);
    persistTransactions(updatedTx);

    // We do NOT revert the stock change on delete to avoid complexity with "already consumed" batches,
    // or we SHOULD? "return to stock"? 
    // User said "not let it be lower than 0".
    // If we delete an 'out' transaction, logic dictates we should put it back.
    // Let's implement return to stock for correctness.
    if (selectedTx.type === 'out') {
      const allMixtures = JSON.parse(localStorage.getItem(MIXTURES_STORAGE_KEY) || '[]') as Mixture[];
      const updatedMixtures = allMixtures.map(m => {
        if (m.id === mixtureId) {
          return {
            ...m,
            totalLiter: m.totalLiter + selectedTx.amountLiter,
          };
        }
        return m;
      });
      setMixtures(updatedMixtures);
      localStorage.setItem(MIXTURES_STORAGE_KEY, JSON.stringify(updatedMixtures));
    }

    setDeleteOpen(false);
    setSelectedTx(null);
  }, [selectedTx, transactions, persistTransactions, mixtureId]);


  const formatMachineName = useCallback((machineType: MachineTypeValue, machineId: string) => {
    if (!machineType || !machineId) return t('razvaritelTransactionsPage.unknown');

    const machineList = getMachines(machineType as MachineType);
    const machine = machineList.find(m => m.id === machineId);
    return machine?.name || machineId;
  }, [getMachines, t]);

  const formatOrderName = useCallback((orderId?: string) => {
    if (!orderId) return '';

    const order = orders.find(o => o.id === orderId);
    return order ? `${order.orderNumber} - ${order.clientName}` : orderId;
  }, [orders]);


  return (
    <DashboardContent>
      <Container maxWidth="xl">
        <CustomBreadcrumbs
          heading={t('mixtureTransactionsPage.title')}
          links={[
            { name: 'Dashboard', href: '/' },
            { name: 'Ombor', href: '/ombor' },
            { name: t('razvaritelAralashmasiPage.breadcrumbTitle'), href: paths.dashboard.inventory.razvaritelAralashmasi },
            { name: t('mixtureTransactionsPage.title') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />





        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h6">{mixture?.name || 'Loading...'}</Typography>
              <Typography variant="body2" color="text.secondary">
                Available: {currentLiter.toFixed(2)} L
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.inventory.razvaritelAralashmasi)}
              >
                {t('razvaritelTransactionsPage.back')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
                disabled={currentLiter <= 0}
              >
                {t('razvaritelTransactionsPage.add')}
              </Button>
            </Stack>
          </Stack>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('razvaritelTransactionsPage.table.date')}</TableCell>
                  <TableCell>{t('razvaritelTransactionsPage.table.type')}</TableCell>
                  <TableCell>{t('razvaritelTransactionsPage.table.machine')}</TableCell>
                  <TableCell>{t('razvaritelTransactionsPage.table.amount')}</TableCell>
                  <TableCell>{t('razvaritelTransactionsPage.table.note')}</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mergedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('razvaritelTransactionsPage.empty')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  mergedTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>
                        <Chip
                          label={t('razvaritelTransactionsPage.typeOut')}
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {formatMachineName(tx.machineType, tx.machineId)}
                        {tx.orderId && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {formatOrderName(tx.orderId)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{tx.amountLiter} L</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {tx.note || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                          onClick={() => {
                            setSelectedTx(tx);
                            setDeleteOpen(true);
                          }}
                        >
                          {t('razvaritelTransactionsPage.form.delete')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Add Transaction Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Add New Transaction
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('razvaritelTransactionsPage.form.date')}
                  value={form.date}
                  onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label={t('razvaritelTransactionsPage.form.amount')}
                  value={form.amountLiter}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm(prev => ({ ...prev, amountLiter: value }));
                  }}
                  error={Boolean(Number(form.amountLiter) > currentLiter)}
                  helperText={
                    Number(form.amountLiter) > currentLiter
                      ? t('validation.exceedsStockL', { available: currentLiter.toFixed(2) })
                      : ''
                  }
                  inputProps={{
                    min: 0,
                    step: 0.1,
                    max: currentLiter
                  }}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  select
                  label={t('razvaritelTransactionsPage.form.machineType')}
                  value={form.machineType}
                  onChange={(e) => {
                    setForm(prev => ({
                      ...prev,
                      machineType: e.target.value as MachineTypeValue,
                      machineId: ''
                    }));
                  }}
                >
                  <MenuItem value="pechat">Pechat</MenuItem>
                  <MenuItem value="reska">Reska</MenuItem>
                  <MenuItem value="laminatsiya">Laminatsiya</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  select
                  label={t('razvaritelTransactionsPage.form.machine')}
                  value={form.machineId}
                  onChange={(e) => setForm(prev => ({ ...prev, machineId: e.target.value }))}
                  disabled={!form.machineType}
                >
                  {machines.map((machine) => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name || machine.id}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Autocomplete
                fullWidth
                options={orders}
                getOptionLabel={(order) => `${order.orderNumber} - ${order.clientName} (${order.title})`}
                value={orders.find(o => o.id === form.orderId) || null}
                onChange={(_, newValue) => setForm(prev => ({ ...prev, orderId: newValue?.id || null }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Order (Optional)"
                  />
                )}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('razvaritelTransactionsPage.form.note')}
                value={form.note}
                onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>
              {t('razvaritelTransactionsPage.form.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={
                !mixture ||
                Number(form.amountLiter) <= 0 ||
                Number(form.amountLiter) > currentLiter ||
                (requiresMachine && (!form.machineType || !form.machineId))
              }
            >
              {t('razvaritelTransactionsPage.form.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>{t('razvaritelTransactionsPage.deleteTitle')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('razvaritelTransactionsPage.deleteConfirm')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>
              {t('razvaritelTransactionsPage.form.cancel')}
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              {t('razvaritelTransactionsPage.form.delete')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardContent>
  );
}
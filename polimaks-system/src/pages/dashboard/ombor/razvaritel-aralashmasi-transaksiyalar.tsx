/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router';

import Autocomplete from '@mui/material/Autocomplete';
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

  const [mixtures, setMixtures] = useState<Mixture[]>(initialMixtures);
  const [transactions, setTransactions] = useState<MixtureTransaction[]>(initialTransactions);
  const [orders] = useState<OrderBookItem[]>(initialOrders);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<MixtureTransaction | null>(null);

  // Form state
  const [selectedMixture, setSelectedMixture] = useState<string>('');
  const [txType, setTxType] = useState<'in' | 'out'>('out');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txMachineType, setTxMachineType] = useState<MachineTypeValue>('');
  const [txMachineId, setTxMachineId] = useState<string>('');
  const [txOrderId, setTxOrderId] = useState<string>('');
  const [txNote, setTxNote] = useState<string>('');

  const saveTxToStorage = useCallback((txList: MixtureTransaction[]) => {
    try {
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(txList));
    } catch (error) {
      console.error('Failed to save mixture transactions:', error);
    }
  }, []);

  const saveMixturesToStorage = useCallback((mixtureList: Mixture[]) => {
    try {
      localStorage.setItem(MIXTURES_STORAGE_KEY, JSON.stringify(mixtureList));
    } catch (error) {
      console.error('Failed to save mixtures:', error);
    }
  }, []);

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
    if (!txMachineType) return [];
    return getMachines(txMachineType as MachineType);
  }, [txMachineType, getMachines]);

  const resetForm = useCallback(() => {
    setSelectedMixture('');
    setTxType('out');
    setTxDate(new Date().toISOString().slice(0, 10));
    setTxAmount('');
    setTxMachineType('');
    setTxMachineId('');
    setTxOrderId('');
    setTxNote('');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedMixture || txAmount === '' || typeof txAmount !== 'number') return;

    const mixture = mixtures.find(m => m.id === selectedMixture);
    if (!mixture) return;

    const newTransaction: MixtureTransaction = {
      id: uuidv4(),
      mixtureId: selectedMixture,
      date: txDate,
      type: txType,
      amountLiter: txAmount,
      machineType: txMachineType,
      machineId: txMachineId,
      orderId: txOrderId || undefined,
      note: txNote,
      createdAt: Date.now(),
    };

    const updatedTx = [...transactions, newTransaction];

    // Update mixture inventory for out transactions
    if (txType === 'out') {
      const updatedMixtures = mixtures.map(m => {
        if (m.id === selectedMixture) {
          return {
            ...m,
            totalLiter: Math.max(0, m.totalLiter - txAmount),
          };
        }
        return m;
      });
      setMixtures(updatedMixtures);
      saveMixturesToStorage(updatedMixtures);
    }

    setTransactions(updatedTx);
    saveTxToStorage(updatedTx);
    setOpen(false);
    resetForm();
  }, [selectedMixture, txAmount, txDate, txType, txMachineType, txMachineId, txOrderId, txNote, transactions, mixtures, saveTxToStorage, saveMixturesToStorage, resetForm]);

  const handleDelete = useCallback(() => {
    if (!selectedTx) return;

    const updatedTx = transactions.filter(tx => tx.id !== selectedTx.id);
    setTransactions(updatedTx);
    saveTxToStorage(updatedTx);
    setDeleteOpen(false);
    setSelectedTx(null);
  }, [selectedTx, transactions, saveTxToStorage]);

  const formatMixtureName = useCallback((mixtureId: string) => {
    const mixture = mixtures.find(m => m.id === mixtureId);
    return mixture?.name || t('razvaritelTransactionsPage.unknown');
  }, [mixtures, t]);

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

  // Sort transactions by date (newest first)
  const sortedTransactions = useMemo(() => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [transactions]);

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
            <Typography variant="h6">{t('mixtureTransactionsPage.title')}</Typography>
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
              >
                {t('razvaritelTransactionsPage.add')}
              </Button>
            </Stack>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('mixtureTransactionsPage.subtitle')}
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('razvaritelTransactionsPage.table.date')}</TableCell>
                  <TableCell>{t('razvaritelTransactionsPage.table.type')}</TableCell>
                  <TableCell>Mixture</TableCell>
                  <TableCell>{t('razvaritelTransactionsPage.table.machine')}</TableCell>
                  <TableCell>{t('razvaritelTransactionsPage.table.amount')}</TableCell>
                  <TableCell>{t('razvaritelTransactionsPage.table.note')}</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('razvaritelTransactionsPage.empty')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>
                        <Chip
                          label={tx.type === 'in' ? t('razvaritelTransactionsPage.typeIn') : t('razvaritelTransactionsPage.typeOut')}
                          color={tx.type === 'in' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatMixtureName(tx.mixtureId)}
                        </Typography>
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
                <Autocomplete
                  fullWidth
                  options={mixtures}
                  getOptionLabel={(mixture) => mixture.name}
                  value={mixtures.find(m => m.id === selectedMixture) || null}
                  onChange={(_, newValue) => setSelectedMixture(newValue?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Mixture"
                      required
                    />
                  )}
                />
                <TextField
                  fullWidth
                  select
                  label={t('razvaritelTransactionsPage.form.type')}
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as 'in' | 'out')}
                >
                  <MenuItem value="in">{t('razvaritelTransactionsPage.typeIn')}</MenuItem>
                  <MenuItem value="out">{t('razvaritelTransactionsPage.typeOut')}</MenuItem>
                </TextField>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('razvaritelTransactionsPage.form.date')}
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label={t('razvaritelTransactionsPage.form.amount')}
                  value={txAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTxAmount(value === '' ? '' : Number(value));
                  }}
                  error={txType === 'out' && selectedMixture && typeof txAmount === 'number' && txAmount > 0 && (() => {
                    const mixture = mixtures.find(m => m.id === selectedMixture);
                    return mixture ? txAmount > mixture.totalLiter : false;
                  })()}
                  helperText={
                    txType === 'out' && selectedMixture && (() => {
                      const mixture = mixtures.find(m => m.id === selectedMixture);
                      if (mixture) {
                        return typeof txAmount === 'number' && txAmount > mixture.totalLiter 
                          ? `Cannot exceed available quantity: ${mixture.totalLiter}L`
                          : `Available: ${mixture.totalLiter}L`;
                      }
                      return '';
                    })()
                  }
                  inputProps={{ 
                    min: 0, 
                    step: 0.1,
                    max: txType === 'out' && selectedMixture ? (() => {
                      const mixture = mixtures.find(m => m.id === selectedMixture);
                      return mixture?.totalLiter || 0;
                    })() : undefined
                  }}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  select
                  label={t('razvaritelTransactionsPage.form.machineType')}
                  value={txMachineType}
                  onChange={(e) => {
                    setTxMachineType(e.target.value as MachineTypeValue);
                    setTxMachineId('');
                  }}
                >
                  <MenuItem value="">{t('razvaritelTransactionsPage.form.machineType')}</MenuItem>
                  <MenuItem value="pechat">Pechat</MenuItem>
                  <MenuItem value="reska">Reska</MenuItem>
                  <MenuItem value="laminatsiya">Laminatsiya</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  select
                  label={t('razvaritelTransactionsPage.form.machine')}
                  value={txMachineId}
                  onChange={(e) => setTxMachineId(e.target.value)}
                  disabled={!txMachineType}
                >
                  <MenuItem value="">{t('razvaritelTransactionsPage.form.machine')}</MenuItem>
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
                value={orders.find(o => o.id === txOrderId) || null}
                onChange={(_, newValue) => setTxOrderId(newValue?.id || '')}
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
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
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
                !selectedMixture || 
                txAmount === '' || 
                typeof txAmount !== 'number' ||
                (txType === 'out' && (() => {
                  const mixture = mixtures.find(m => m.id === selectedMixture);
                  return mixture ? txAmount > mixture.totalLiter : false;
                })())
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
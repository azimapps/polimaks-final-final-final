/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate } from 'react-router';

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
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
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

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import seedData from 'src/data/kley.json';
import pechatSeed from 'src/data/stanok-pechat.json';
import reskaSeed from 'src/data/stanok-reska.json';
import laminatsiyaSeed from 'src/data/stanok-laminatsiya.json';
import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';
type MachineType = 'pechat' | 'reska' | 'laminatsiya';
type MachineTypeValue = MachineType | '';

type KleyItem = {
  id: string;
  receivedDate: string;
  numberIdentifier: string;
  type: string;
  supplier: string;
  name: string;
  barrels: number;
  netWeight: number;
  grossWeight: number;
  totalNetWeight: number;
  totalGrossWeight: number;
  price: number;
  priceCurrency: Currency;
  description: string;
};

type KleyTransaction = {
  id: string;
  kleyId: string;
  date: string;
  type: 'in' | 'out';
  amountBarrels: number;
  machineType: MachineTypeValue;
  machineId: string;
  note: string;
  createdAt: number;
};

const STORAGE_KEY = 'ombor-kley';
const TX_STORAGE_KEY = 'ombor-kley-transactions';

type Machine = { id: string; name?: string };

const MACHINE_SOURCE: Record<MachineType, { storageKey: string; seed: Machine[] }> = {
  pechat: { storageKey: 'stanok-pechat', seed: pechatSeed as any as Machine[] },
  reska: { storageKey: 'stanok-reska', seed: reskaSeed as any as Machine[] },
  laminatsiya: { storageKey: 'stanok-laminatsiya', seed: laminatsiyaSeed as any as Machine[] },
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const normalizeItems = (items: (Partial<KleyItem> & { id?: string })[]): KleyItem[] =>
  items.map((item, index) => {
    const currency: Currency = ['UZS', 'USD', 'RUB', 'EUR'].includes(
      item.priceCurrency as Currency
    )
      ? (item.priceCurrency as Currency)
      : 'UZS';

    return {
      id: item.id || `kley-${index}`,
      receivedDate: item.receivedDate || todayISO(),
      numberIdentifier: item.numberIdentifier || '',
      type: item.type || '',
      supplier: item.supplier || '',
      name: item.name || '',
      barrels: typeof item.barrels === 'number' ? item.barrels : Number(item.barrels) || 0,
      netWeight: typeof item.netWeight === 'number' ? item.netWeight : Number(item.netWeight) || 0,
      grossWeight:
        typeof item.grossWeight === 'number' ? item.grossWeight : Number(item.grossWeight) || 0,
      totalNetWeight:
        typeof item.totalNetWeight === 'number'
          ? item.totalNetWeight
          : Number(item.totalNetWeight) || 0,
      totalGrossWeight:
        typeof item.totalGrossWeight === 'number'
          ? item.totalGrossWeight
          : Number(item.totalGrossWeight) || 0,
      price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
      priceCurrency: currency,
      description: item.description || '',
    };
  });

const readKleyItems = (): KleyItem[] => {
  if (typeof window === 'undefined') return normalizeItems(seedData as KleyItem[]);
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return normalizeItems(seedData as KleyItem[]);
  try {
    return normalizeItems(JSON.parse(stored) as KleyItem[]);
  } catch {
    return normalizeItems(seedData as KleyItem[]);
  }
};

const readMachines = (type: MachineType): Machine[] => {
  const { storageKey, seed } = MACHINE_SOURCE[type];
  if (typeof window === 'undefined') return seed;
  const stored = localStorage.getItem(storageKey);
  if (!stored) return seed;
  try {
    const parsed = JSON.parse(stored) as Machine[];
    return Array.isArray(parsed) && parsed.length ? parsed : seed;
  } catch {
    return seed;
  }
};

const readTransactions = (): KleyTransaction[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TX_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as KleyTransaction[];
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.map((tx, idx) => {
      const fallback = now + idx;
      const parsedTime = Date.parse(tx.date || '');
      const createdAt =
        typeof tx.createdAt === 'number' && !Number.isNaN(tx.createdAt)
          ? tx.createdAt
          : !Number.isNaN(parsedTime) && parsedTime > 0
            ? parsedTime
            : fallback;
      return { ...tx, createdAt };
    });
  } catch {
    return [];
  }
};

const persistTransactions = (tx: KleyTransaction[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(tx));
};

export default function KleyTransactionsPage() {
  const { kleyId } = useParams();
  const { t } = useTranslate('pages');
  const navigate = useNavigate();

  const items = useMemo(() => readKleyItems(), []);
  const item = useMemo(
    () => items.find((it) => it.id === kleyId) ?? null,
    [items, kleyId]
  );

  const heading = t('kleyTransactionsPage.title', {
    number: item?.numberIdentifier || t('kleyTransactionsPage.unknown'),
  });
  const pageTitle = `${heading} | ${CONFIG.appName}`;

  const [transactions, setTransactions] = useState<KleyTransaction[]>(() =>
    readTransactions().filter((tx) => tx.kleyId === kleyId)
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<KleyTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<KleyTransaction | null>(null);
  const [form, setForm] = useState<{
    type: 'in' | 'out';
    amountBarrels: string;
    date: string;
    machineType: MachineTypeValue;
    machineId: string;
    note: string;
  }>({
    type: 'in',
    amountBarrels: '',
    date: todayISO(),
    machineType: '',
    machineId: '',
    note: '',
  });

  const requiresMachine = form.type === 'out';

  const machines = useMemo(
    () => (requiresMachine && form.machineType ? readMachines(form.machineType) : []),
    [form.machineType, requiresMachine]
  );

  useEffect(() => {
    if (!requiresMachine || !machines.length) return;
    setForm((prev) => ({
      ...prev,
      machineId: machines.some((m) => m.id === prev.machineId) ? prev.machineId : machines[0].id,
    }));
  }, [machines, requiresMachine]);

  useEffect(() => {
    // refresh transactions if navigating between items without remount
    setTransactions(readTransactions().filter((tx) => tx.kleyId === kleyId));
    setEditingTx(null);
    setDialogOpen(false);
  }, [kleyId]);

  const persistForItem = useCallback(
    (next: KleyTransaction[]) => {
      const others = readTransactions().filter((tx) => tx.kleyId !== kleyId);
      persistTransactions([...others, ...next]);
    },
    [kleyId]
  );

  const saveTransaction = useCallback(() => {
    if (!item || !kleyId) return;
    const amount = Number(form.amountBarrels);
    if (Number.isNaN(amount) || amount <= 0) return;
    if (requiresMachine && (!form.machineId || !form.machineType)) return;

    const payload: KleyTransaction = {
      id: editingTx?.id || uuidv4(),
      kleyId,
      date: form.date || todayISO(),
      type: form.type,
      amountBarrels: amount,
      machineType: requiresMachine ? form.machineType : '',
      machineId: requiresMachine ? form.machineId : '',
      note: form.note.trim(),
      createdAt: editingTx?.createdAt ?? Date.now(),
    };

    setTransactions((prev) => {
      const next = editingTx
        ? prev.map((tx) => (tx.id === editingTx.id ? payload : tx))
        : [...prev, payload];
      persistForItem(next);
      return next;
    });
    setForm((prev) => ({ ...prev, amountBarrels: '', note: '' }));
    setEditingTx(null);
    setDialogOpen(false);
  }, [
    editingTx,
    form.amountBarrels,
    form.date,
    form.machineId,
    form.machineType,
    form.note,
    form.type,
    item,
    kleyId,
    persistForItem,
    requiresMachine,
  ]);

  const startEdit = (tx: KleyTransaction) => {
    setEditingTx(tx);
    setForm({
      type: tx.type,
      amountBarrels: String(tx.amountBarrels),
      date: tx.date,
      machineType: tx.machineType,
      machineId: tx.machineId,
      note: tx.note,
    });
    setDialogOpen(true);
  };

  const deleteTransaction = (tx: KleyTransaction) => {
    setPendingDelete(tx);
    setConfirmOpen(true);
  };

  const canSave =
    Boolean(item) &&
    Number(form.amountBarrels) > 0 &&
    (!requiresMachine || (Boolean(form.machineType) && Boolean(form.machineId))) &&
    Boolean(form.date);

  const mergedTransactions = useMemo<KleyTransaction[]>(() => {
    if (!item) return transactions;
    const initial: KleyTransaction = {
      id: `${item.id}-initial`,
      kleyId: item.id,
      date: item.receivedDate,
      type: 'in',
      amountBarrels: item.barrels,
      machineType: 'pechat',
      machineId: '',
      note: t('kleyTransactionsPage.generatedFromStock'),
      createdAt: Date.parse(item.receivedDate) || 0,
    };
    return [initial, ...transactions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [item, t, transactions]);

  const currentBarrels = useMemo(
    () =>
      mergedTransactions.reduce(
        (sum, tx) => (tx.type === 'in' ? sum + tx.amountBarrels : sum - tx.amountBarrels),
        0
      ),
    [mergedTransactions]
  );

  const currentTotalNetWeight = useMemo(
    () => (item ? currentBarrels * item.netWeight : 0),
    [currentBarrels, item]
  );

  const currentTotalGrossWeight = useMemo(
    () => (item ? currentBarrels * item.grossWeight : 0),
    [currentBarrels, item]
  );

  useEffect(() => {
    if (!item || typeof window === 'undefined') return;
    const stored = readKleyItems();
    const updated = stored.map((it) =>
      it.id === item.id
        ? {
            ...it,
            barrels: Math.max(0, Number(currentBarrels.toFixed(3))),
            totalNetWeight: Math.max(0, Number(currentTotalNetWeight.toFixed(3))),
            totalGrossWeight: Math.max(0, Number(currentTotalGrossWeight.toFixed(3))),
          }
        : it
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [currentBarrels, currentTotalGrossWeight, currentTotalNetWeight, item]);

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('kleyPage.currency.uzs');
      case 'USD':
        return t('kleyPage.currency.usd');
      case 'RUB':
        return t('kleyPage.currency.rub');
      case 'EUR':
        return t('kleyPage.currency.eur');
      default:
        return code;
    }
  };

  const totalPrice = item ? currentTotalGrossWeight * item.price : 0;

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography variant="h4">{heading}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {item ? t('kleyTransactionsPage.subtitle') : t('kleyTransactionsPage.notFound')}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.inventory.kley)}
              >
                {t('kleyTransactionsPage.back')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:import-bold" />}
                disabled={!item}
                onClick={() => setDialogOpen(true)}
              >
                {t('kleyTransactionsPage.add')}
              </Button>
            </Stack>
          </Stack>

          <Card sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">{t('kleyTransactionsPage.summaryTitle')}</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
                <Detail label={t('kleyPage.receivedDate')} value={item?.receivedDate} />
                <Detail label={t('kleyPage.numberIdentifier')} value={item?.numberIdentifier} />
                <Detail label={t('kleyPage.type')} value={item?.type} />
                <Detail label={t('kleyPage.supplier')} value={item?.supplier} />
                <Detail label={t('kleyPage.name')} value={item?.name} />
                <Detail label={t('kleyPage.barrels')} value={item ? currentBarrels.toLocaleString() : undefined} />
                <Detail
                  label={t('kleyPage.netWeight')}
                  value={item ? `${item.netWeight.toLocaleString()} ${t('kleyPage.kg')}` : undefined}
                />
                <Detail
                  label={t('kleyPage.grossWeight')}
                  value={item ? `${item.grossWeight.toLocaleString()} ${t('kleyPage.kg')}` : undefined}
                />
                <Detail
                  label={t('kleyPage.totalNetWeight')}
                  value={item ? `${currentTotalNetWeight.toLocaleString()} ${t('kleyPage.kg')}` : undefined}
                />
                <Detail
                  label={t('kleyPage.totalGrossWeight')}
                  value={item ? `${currentTotalGrossWeight.toLocaleString()} ${t('kleyPage.kg')}` : undefined}
                />
                <Detail
                  label={t('kleyPage.price')}
                  value={item ? `${item.price.toLocaleString()} ${currencyLabel(item.priceCurrency)}` : undefined}
                />
                <Detail
                  label={t('kleyPage.totalPrice')}
                  value={item ? `${totalPrice.toLocaleString()} ${currencyLabel(item.priceCurrency)}` : undefined}
                />
              </Stack>
            </Stack>
          </Card>

          <Card>
            <TableContainer>
              <Table size="medium" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 140 }}>{t('kleyTransactionsPage.table.date')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('kleyTransactionsPage.table.type')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('kleyTransactionsPage.table.machine')}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{t('kleyTransactionsPage.table.amount')}</TableCell>
                    <TableCell>{t('kleyTransactionsPage.table.note')}</TableCell>
                    <TableCell align="right" sx={{ width: 100 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!item ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('kleyTransactionsPage.notFound')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : mergedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Box
                          sx={{
                            py: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('kleyTransactionsPage.empty')}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    mergedTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Typography variant="body2">{tx.date}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              tx.type === 'in'
                                ? t('kleyTransactionsPage.typeIn')
                                : t('kleyTransactionsPage.typeOut')
                            }
                            color={tx.type === 'in' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {tx.machineType}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {tx.machineId || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{tx.amountBarrels.toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {tx.note || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              color="inherit"
                              onClick={() => startEdit(tx)}
                              sx={{ minWidth: 0, p: 0.75 }}
                            >
                              <Iconify icon="solar:pen-bold" width={18} height={18} />
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => deleteTransaction(tx)}
                              sx={{ minWidth: 0, p: 0.75 }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} height={18} />
                            </Button>
                          </Stack>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTx ? t('kleyTransactionsPage.form.edit') : t('kleyTransactionsPage.add')}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t('kleyTransactionsPage.form.type')}
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value as 'in' | 'out' }))
                  }
                >
                  <MenuItem value="in">{t('kleyTransactionsPage.typeIn')}</MenuItem>
                  <MenuItem value="out">{t('kleyTransactionsPage.typeOut')}</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="date"
                  fullWidth
                  label={t('kleyTransactionsPage.form.date')}
                  InputLabelProps={{ shrink: true }}
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </Grid>
              {requiresMachine ? (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={t('kleyTransactionsPage.form.machineType')}
                      value={form.machineType}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          machineType: e.target.value as MachineType,
                          machineId: '',
                        }))
                      }
                    >
                      <MenuItem value="pechat">Pechat</MenuItem>
                      <MenuItem value="reska">Reska</MenuItem>
                      <MenuItem value="laminatsiya">Laminatsiya</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label={t('kleyTransactionsPage.form.machine')}
                      value={form.machineId}
                      onChange={(e) => setForm((prev) => ({ ...prev, machineId: e.target.value }))}
                      disabled={!machines.length}
                    >
                      {machines.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.name || m.id}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              ) : null}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('kleyTransactionsPage.form.amount')}
                  value={form.amountBarrels}
                  onChange={(e) => setForm((prev) => ({ ...prev, amountBarrels: e.target.value }))}
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('kleyTransactionsPage.form.note')}
                  value={form.note}
                  onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                />
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('kleyTransactionsPage.form.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            {t('kleyTransactionsPage.form.cancel')}
          </Button>
          <Button onClick={saveTransaction} variant="contained" disabled={!canSave}>
            {t('kleyTransactionsPage.form.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('kleyTransactionsPage.deleteTitle')}</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>{t('kleyTransactionsPage.deleteConfirm')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            {t('kleyTransactionsPage.form.cancel')}
          </Button>
          <Button
            onClick={() => {
              if (!pendingDelete) return;
              setTransactions((prev) => {
                const next = prev.filter((itemTx) => itemTx.id !== pendingDelete.id);
                persistForItem(next);
                return next;
              });
              setPendingDelete(null);
              setConfirmOpen(false);
            }}
            color="error"
            variant="contained"
          >
            {t('kleyTransactionsPage.form.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Box sx={{ minWidth: 180 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="subtitle2">{value ?? '—'}</Typography>
    </Box>
  );
}

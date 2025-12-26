/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState, useEffect, useCallback } from 'react';
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
import seedData from 'src/data/silindir.json';
import pechatSeed from 'src/data/stanok-pechat.json';
import reskaSeed from 'src/data/stanok-reska.json';
import laminatsiyaSeed from 'src/data/stanok-laminatsiya.json';
import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';
type Origin = 'china' | 'germany';
type MachineType = 'pechat' | 'reska' | 'laminatsiya';
type MachineTypeValue = MachineType | '';

type SilindirItem = {
  id: string;
  origin: Origin;
  seriyaNumber: string;
  length: number;
  diameter: number;
  quantity: number;
  usage: number;
  usageLimit: number;
  price: number;
  priceCurrency: Currency;
  createdDate: string;
  description: string;
};

type SilindirTransaction = {
  id: string;
  silindirId: string;
  date: string;
  type: 'in' | 'out';
  amountQty: number;
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

const STORAGE_KEY = 'ombor-silindir';
const TX_STORAGE_KEY = 'ombor-silindir-transactions';
const ORDERS_STORAGE_KEY = 'clients-order-book';

type Machine = { id: string; name?: string };

const MACHINE_SOURCE: Record<MachineType, { storageKey: string; seed: Machine[] }> = {
  pechat: { storageKey: 'stanok-pechat', seed: pechatSeed as any as Machine[] },
  reska: { storageKey: 'stanok-reska', seed: reskaSeed as any as Machine[] },
  laminatsiya: { storageKey: 'stanok-laminatsiya', seed: laminatsiyaSeed as any as Machine[] },
};

const normalizeItems = (items: (Partial<SilindirItem> & { id?: string })[]): SilindirItem[] =>
  items.map((item, index) => {
    const currency: Currency = ['UZS', 'USD', 'RUB', 'EUR'].includes(
      item.priceCurrency as Currency
    )
      ? (item.priceCurrency as Currency)
      : 'UZS';

    return {
      id: item.id || `silindir-${index}`,
      origin: (item.origin as Origin) || 'china',
      seriyaNumber: item.seriyaNumber || '',
      length: typeof item.length === 'number' ? item.length : Number(item.length) || 0,
      diameter: typeof item.diameter === 'number' ? item.diameter : Number(item.diameter) || 0,
      quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 0,
      usage: typeof item.usage === 'number' ? item.usage : Number(item.usage) || 0,
      usageLimit: typeof item.usageLimit === 'number' ? item.usageLimit : Number(item.usageLimit) || 0,
      price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
      priceCurrency: currency,
      createdDate: item.createdDate || new Date().toISOString().slice(0, 10),
      description: item.description || '',
    };
  });

const readSilindirItems = (): SilindirItem[] => {
  if (typeof window === 'undefined') return normalizeItems(seedData as SilindirItem[]);
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return normalizeItems(seedData as SilindirItem[]);
  try {
    return normalizeItems(JSON.parse(stored) as SilindirItem[]);
  } catch {
    return normalizeItems(seedData as SilindirItem[]);
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

const readOrders = (): OrderBookItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as OrderBookItem[]) : [];
  } catch {
    return [];
  }
};

const readTransactions = (): SilindirTransaction[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TX_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as SilindirTransaction[];
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

const persistTransactions = (tx: SilindirTransaction[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(tx));
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function SilindirTransactionsPage() {
  const { silindirId } = useParams();
  const { t } = useTranslate('pages');
  const navigate = useNavigate();

  const items = useMemo(() => readSilindirItems(), []);
  const item = useMemo(
    () => items.find((it) => it.id === silindirId) ?? null,
    [items, silindirId]
  );
  
  const allOrders = useMemo(() => readOrders(), []);

  const heading = t('silindirTransactionsPage.title', {
    seriya: item?.seriyaNumber || t('silindirTransactionsPage.unknown'),
  });
  const pageTitle = `${heading} | ${CONFIG.appName}`;

  const [transactions, setTransactions] = useState<SilindirTransaction[]>(() =>
    readTransactions().filter((tx) => tx.silindirId === silindirId)
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SilindirTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<SilindirTransaction | null>(null);
  const [form, setForm] = useState<{
    type: 'in' | 'out';
    amountQty: string;
    date: string;
    machineType: MachineTypeValue;
    machineId: string;
    orderId: string | null;
    note: string;
  }>({
    type: 'in',
    amountQty: '',
    date: todayISO(),
    machineType: '',
    machineId: '',
    orderId: null,
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
    setTransactions(readTransactions().filter((tx) => tx.silindirId === silindirId));
    setEditingTx(null);
    setDialogOpen(false);
  }, [silindirId]);

  const persistForItem = useCallback(
    (next: SilindirTransaction[]) => {
      const others = readTransactions().filter((tx) => tx.silindirId !== silindirId);
      persistTransactions([...others, ...next]);
    },
    [silindirId]
  );

  const saveTransaction = useCallback(() => {
    if (!item || !silindirId) return;
    const amount = Number(form.amountQty);
    if (Number.isNaN(amount) || amount <= 0) return;
    if (requiresMachine && (!form.machineId || !form.machineType)) return;

    const payload: SilindirTransaction = {
      id: editingTx?.id || uuidv4(),
      silindirId,
      date: form.date || todayISO(),
      type: form.type,
      amountQty: amount,
      machineType: requiresMachine ? form.machineType : '',
      machineId: requiresMachine ? form.machineId : '',
      orderId: form.orderId || undefined,
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
    setForm((prev) => ({ ...prev, amountQty: '', note: '', orderId: null }));
    setEditingTx(null);
    setDialogOpen(false);
  }, [
    editingTx,
    form.amountQty,
    form.date,
    form.machineId,
    form.machineType,
    form.note,
    form.orderId,
    form.type,
    item,
    silindirId,
    persistForItem,
    requiresMachine,
  ]);

  const startEdit = (tx: SilindirTransaction) => {
    setEditingTx(tx);
    setForm({
      type: tx.type,
      amountQty: String(tx.amountQty),
      date: tx.date,
      machineType: tx.machineType,
      machineId: tx.machineId,
      orderId: tx.orderId || null,
      note: tx.note,
    });
    setDialogOpen(true);
  };

  const deleteTransaction = (tx: SilindirTransaction) => {
    setPendingDelete(tx);
    setConfirmOpen(true);
  };

  const canSave =
    Boolean(item) &&
    Number(form.amountQty) > 0 &&
    (!requiresMachine || (Boolean(form.machineType) && Boolean(form.machineId))) &&
    Boolean(form.date);

  const mergedTransactions = useMemo<SilindirTransaction[]>(() => {
    if (!item) return transactions;
    const initial: SilindirTransaction = {
      id: `${item.id}-initial`,
      silindirId: item.id,
      date: item.createdDate,
      type: 'in',
      amountQty: item.quantity,
      machineType: 'pechat',
      machineId: '',
      note: t('silindirTransactionsPage.generatedFromStock'),
      createdAt: Date.parse(item.createdDate) || 0,
    };
    return [initial, ...transactions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [item, t, transactions]);

  const currentQty = useMemo(
    () =>
      mergedTransactions.reduce(
        (sum, tx) => (tx.type === 'in' ? sum + tx.amountQty : sum - tx.amountQty),
        0
      ),
    [mergedTransactions]
  );

  useEffect(() => {
    if (!item || typeof window === 'undefined') return;
    const stored = readSilindirItems();
    const updated = stored.map((it) =>
      it.id === item.id
        ? {
            ...it,
            quantity: Math.max(0, Number(currentQty.toFixed(3))),
          }
        : it
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [currentQty, item]);

  const originLabel = (origin: Origin) => {
    switch (origin) {
      case 'china':
        return t('silindirPage.origin.china');
      case 'germany':
        return t('silindirPage.origin.germany');
      default:
        return origin;
    }
  };

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('silindirPage.currency.uzs');
      case 'USD':
        return t('silindirPage.currency.usd');
      case 'RUB':
        return t('silindirPage.currency.rub');
      case 'EUR':
        return t('silindirPage.currency.eur');
      default:
        return code;
    }
  };

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
                {item
                  ? t('silindirTransactionsPage.subtitle')
                  : t('silindirTransactionsPage.notFound')}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.inventory.silindir)}
              >
                {t('silindirTransactionsPage.back')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:import-bold" />}
                disabled={!item}
                onClick={() => setDialogOpen(true)}
              >
                {t('silindirTransactionsPage.add')}
              </Button>
            </Stack>
          </Stack>

          <Card sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">{t('silindirTransactionsPage.summaryTitle')}</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
                <Detail label={t('silindirPage.seriya')} value={item?.seriyaNumber} />
                <Detail label={t('silindirPage.originLabel')} value={item ? originLabel(item.origin) : undefined} />
                <Detail
                  label={t('silindirPage.length')}
                  value={item ? `${item.length.toLocaleString()} ${t('silindirPage.mm')}` : undefined}
                />
                <Detail
                  label={t('silindirPage.diameter')}
                  value={item ? `${item.diameter.toLocaleString()} ${t('silindirPage.mm')}` : undefined}
                />
                <Detail label={t('silindirPage.quantity')} value={item ? currentQty.toLocaleString() : undefined} />
                <Detail
                  label={t('silindirPage.usage')}
                  value={
                    item
                      ? `${item.usage.toLocaleString()} / ${item.usageLimit.toLocaleString()} ${t('silindirPage.usageUnit')}`
                      : undefined
                  }
                />
                <Detail
                  label={t('silindirPage.price')}
                  value={
                    item
                      ? `${item.price.toLocaleString()} ${currencyLabel(item.priceCurrency)}`
                      : undefined
                  }
                />
              </Stack>
            </Stack>
          </Card>

          <Card>
            <TableContainer>
              <Table size="medium" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 140 }}>{t('silindirTransactionsPage.table.date')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('silindirTransactionsPage.table.type')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('silindirTransactionsPage.table.machine')}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>{t('orderBookPage.orderNumber')}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{t('silindirTransactionsPage.table.amount')}</TableCell>
                    <TableCell>{t('silindirTransactionsPage.table.note')}</TableCell>
                    <TableCell align="right" sx={{ width: 100 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!item ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('silindirTransactionsPage.notFound')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : mergedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Box
                          sx={{
                            py: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('silindirTransactionsPage.empty')}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    mergedTransactions.map((tx) => {
                      const relatedOrder = allOrders.find(o => o.id === tx.orderId);
                      return (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <Typography variant="body2">{tx.date}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                tx.type === 'in'
                                  ? t('silindirTransactionsPage.typeIn')
                                  : t('silindirTransactionsPage.typeOut')
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
                            <Typography variant="body2">
                              {relatedOrder ? relatedOrder.orderNumber : '—'}
                            </Typography>
                            {relatedOrder && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                {relatedOrder.clientName}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{tx.amountQty.toLocaleString()}</Typography>
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      </Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTx ? t('silindirTransactionsPage.form.edit') : t('silindirTransactionsPage.add')}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t('silindirTransactionsPage.form.type')}
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value as 'in' | 'out' }))
                  }
                >
                  <MenuItem value="in">{t('silindirTransactionsPage.typeIn')}</MenuItem>
                  <MenuItem value="out">{t('silindirTransactionsPage.typeOut')}</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="date"
                  fullWidth
                  label={t('silindirTransactionsPage.form.date')}
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
                      label={t('silindirTransactionsPage.form.machineType')}
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
                      label={t('silindirTransactionsPage.form.machine')}
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
                  label={t('silindirTransactionsPage.form.amount')}
                  value={form.amountQty}
                  onChange={(e) => setForm((prev) => ({ ...prev, amountQty: e.target.value }))}
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              
              {form.type === 'out' ? (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={allOrders}
                    getOptionLabel={(option) => `${option.orderNumber} - ${option.clientName}`}
                    value={allOrders.find((o) => o.id === form.orderId) || null}
                    onChange={(event, newValue) => {
                      setForm((prev) => ({ ...prev, orderId: newValue ? newValue.id : null }));
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {option.orderNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {option.clientName} | {option.title}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('orderBookPage.orderNumber')}
                        placeholder={allOrders.length === 0 ? "No orders available" : "Search order..."}
                      />
                    )}
                  />
                </Grid>
              ) : (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('silindirTransactionsPage.form.note')}
                    value={form.note}
                    onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('silindirTransactionsPage.form.note')}
                  value={form.note}
                  onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('silindirTransactionsPage.form.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            {t('silindirTransactionsPage.form.cancel')}
          </Button>
          <Button onClick={saveTransaction} variant="contained" disabled={!canSave}>
            {t('silindirTransactionsPage.form.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('silindirTransactionsPage.deleteTitle')}</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            {t('silindirTransactionsPage.deleteConfirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            {t('silindirTransactionsPage.form.cancel')}
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
            {t('silindirTransactionsPage.form.delete')}
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

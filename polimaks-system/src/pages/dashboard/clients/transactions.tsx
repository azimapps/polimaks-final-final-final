import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
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
  CLIENTS_KEY,
  ORDER_BOOK_KEY,
  readClients,
  formatAmount,
  CURRENCY_OPTIONS,
  readTransactions,
  persistTransactions,
  convertToDisplayCurrency,
  readOrderBookPromises,
} from './transactions-data';

import type { ClientSummary, ClientTransaction } from './transactions-data';

type TransactionForm = {
  clientId: string;
  amount: string;
  currency: string;
  date: string;
  notes: string;
};

const createEmptyForm = (clientId: string) => ({
  clientId,
  amount: '',
  currency: 'UZS',
  date: new Date().toISOString().split('T')[0],
  notes: '',
});

type ClientsTransactionsSectionProps = {
  embedded?: boolean;
};

export function ClientsTransactionsSection({ embedded = false }: ClientsTransactionsSectionProps) {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();

  const [clients, setClients] = useState<ClientSummary[]>(() => readClients());
  const [transactions, setTransactions] = useState<ClientTransaction[]>(() => readTransactions());
  const [orderPromises, setOrderPromises] = useState<ClientTransaction[]>(() =>
    readOrderBookPromises()
  );
  const [form, setForm] = useState<TransactionForm>(() => createEmptyForm(''));
  const [displayCurrency, setDisplayCurrency] = useState<string>(CURRENCY_OPTIONS[0]);
  const transactionDialog = useBoolean();

  useEffect(() => {
    if (!form.clientId && clients.length > 0) {
      setForm((prev) => ({ ...prev, clientId: clients[0].id }));
    }
  }, [clients, form.clientId]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleStorage = (event: StorageEvent) => {
      if (event?.key === CLIENTS_KEY) {
        setClients(readClients());
      }
      if (event?.key === ORDER_BOOK_KEY) {
        setOrderPromises(readOrderBookPromises());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const allTransactions = useMemo(
    () => [...transactions, ...orderPromises],
    [transactions, orderPromises]
  );

  const addTransaction = useCallback(() => {
    const amount = Number(form.amount);
    if (!form.clientId || Number.isNaN(amount) || amount <= 0) return;
    const payload: ClientTransaction = {
      id: uuidv4(),
      clientId: form.clientId,
      type: 'payment',
      amount,
      currency: form.currency.trim() || 'UZS',
      date: form.date || new Date().toISOString().split('T')[0],
      notes: form.notes.trim(),
    };

    setTransactions((prev) => {
      const next = [...prev, payload];
      persistTransactions(next);
      return next;
    });

    setForm((prev) => ({
      ...prev,
      amount: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    }));
    transactionDialog.onFalse();
  }, [form, transactionDialog]);

  const canSaveTransaction =
    Boolean(form.clientId && form.currency.trim() && form.date) && Number(form.amount) > 0;

  const clientSummaries = useMemo(() => {
    const paidMap = new Map<string, number>();
    const promiseMap = new Map<string, number>();

    clients.forEach((client) => {
      paidMap.set(client.id, 0);
      promiseMap.set(client.id, 0);
    });

    allTransactions.forEach((tx) => {
      if (!tx.clientId) return;
      const paid = paidMap.get(tx.clientId) ?? 0;
      const promise = promiseMap.get(tx.clientId) ?? 0;

      const converted = convertToDisplayCurrency(tx.amount, tx.currency, displayCurrency);
      if (tx.type === 'payment') {
        paidMap.set(tx.clientId, paid + converted);
      } else {
        promiseMap.set(tx.clientId, promise + converted);
      }

    });

    return clients.map((client) => {
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
              color: 'warning' as const,
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
  }, [clients, allTransactions, displayCurrency, t]);

  const pageTitle = `${t('clientsTransactionsPage.title')} | ${CONFIG.appName}`;

  const content = (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            label={t('clientsTransactionsPage.badge')}
            color="primary"
            size="small"
            sx={{ fontWeight: 600, letterSpacing: 0.2 }}
          />
          <Typography variant="h3">{t('clientsTransactionsPage.title')}</Typography>
        </Stack>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 720 }}>
          {t('clientsTransactionsPage.subtitle')}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('clientsTransactionsPage.caption')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('clientsTransactionsPage.displayCurrencyCaption', { currency: displayCurrency })}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <TextField
            select
            size="small"
            label={t('clientsTransactionsPage.displayCurrencyLabel')}
            value={displayCurrency}
            onChange={(event) => setDisplayCurrency(event.target.value as string)}
            sx={{ minWidth: 160 }}
          >
            {CURRENCY_OPTIONS.map((code) => (
              <MenuItem key={code} value={code}>
                {code}
              </MenuItem>
            ))}
          </TextField>
          <Button
            type="button"
            variant="contained"
            startIcon={<Iconify icon="solar:cart-plus-bold" />}
            onClick={transactionDialog.onTrue}
          >
            {t('clientsTransactionsPage.addTransaction')}
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1">{t('clientsTransactionsPage.clientsTitle')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {clients.length} {t('clientsTransactionsPage.clientsLabel')}
            </Typography>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('clientsTransactionsPage.tableClient')}</TableCell>
                  <TableCell>{t('clientsTransactionsPage.tableBalance')}</TableCell>
                  <TableCell align="right">{t('clientsTransactionsPage.tableActions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', py: 3 }}>
                        {t('clientsTransactionsPage.noClients')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientSummaries.map(({ client, paid, promised, balance, status }) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{client.fullName}</Typography>
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
                        <Button
                          type="button"
                          size="small"
                          variant="contained"
                          color="secondary"
                          onClick={() =>
                            navigate(paths.dashboard.clients.transactionsClient(client.id))
                          }
                          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                        >
                          {t('clientsTransactionsPage.viewHistory')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <>
      {!embedded ? (
        <>
          <title>{pageTitle}</title>
          <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
            {content}
          </Container>
        </>
      ) : (
        content
      )}

      <Dialog open={transactionDialog.value} onClose={transactionDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{t('clientsTransactionsPage.addTransaction')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              label={t('clientsTransactionsPage.formClient')}
              value={form.clientId}
              onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
              disabled={clients.length === 0}
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.fullName || client.id}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label={t('clientsTransactionsPage.formAmount')}
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              inputProps={{ min: 0, step: 1 }}
            />
            <TextField
              select
              fullWidth
              label={t('clientsTransactionsPage.formCurrency')}
              value={form.currency}
              onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            >
              {['UZS', 'USD', 'EUR', 'RUB'].map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="date"
              label={t('clientsTransactionsPage.formDate')}
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label={t('clientsTransactionsPage.formNotes')}
              multiline
              minRows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={transactionDialog.onFalse} color="inherit">
            {t('clientsTransactionsPage.formCancel')}
          </Button>
          <Button onClick={addTransaction} disabled={!canSaveTransaction} variant="contained">
            {t('clientsTransactionsPage.formSave')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function ClientsTransactionsPage() {
  return <ClientsTransactionsSection />;
}

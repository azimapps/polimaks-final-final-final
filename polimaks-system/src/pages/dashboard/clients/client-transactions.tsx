import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';
import { useParams, useNavigate } from 'react-router';
import { useMemo, useState, useCallback } from 'react';

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
  readClients,
  formatAmount,
  CURRENCY_OPTIONS,
  readTransactions,
  persistTransactions,
  convertToDisplayCurrency,
} from './transactions-data';

import type {
  ClientSummary,
  TransactionType,
  ClientTransaction,
} from './transactions-data';

type TransactionForm = {
  type: TransactionType;
  amount: string;
  currency: string;
  date: string;
  notes: string;
};

const formatRate = (value: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: value < 1 ? 2 : 0,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);

const srOnlyStyles = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute' as const,
  width: 1,
};

const createDetailForm = (): TransactionForm => ({
  type: 'promise',
  amount: '',
  currency: 'UZS',
  date: new Date().toISOString().split('T')[0],
  notes: '',
});

export default function ClientTransactionsDetailPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();
  const { clientId } = useParams();

  const clients = useMemo<ClientSummary[]>(() => readClients(), []);
  const [transactions, setTransactions] = useState<ClientTransaction[]>(() => readTransactions());
  const transactionDialog = useBoolean();
  const [form, setForm] = useState<TransactionForm>(createDetailForm());
  const [displayCurrency, setDisplayCurrency] = useState<string>(CURRENCY_OPTIONS[0]);

  const client = useMemo(
    () => clients.find((item) => item.id === clientId) ?? null,
    [clients, clientId]
  );

  const clientTransactions = useMemo(
    () => transactions.filter((tx) => tx.clientId === clientId),
    [transactions, clientId]
  );

  const currencies = useMemo(
    () => Array.from(new Set(clientTransactions.map((tx) => tx.currency).filter(Boolean))),
    [clientTransactions]
  );

  const convertedSummary = useMemo(() => {
    let paid = 0;
    let promised = 0;

    clientTransactions.forEach((tx) => {
      const value = convertToDisplayCurrency(tx.amount, tx.currency, displayCurrency);
      if (tx.type === 'payment') paid += value;
      else promised += value;
    });

    return {
      paid,
      promised,
      balance: paid - promised,
    };
  }, [clientTransactions, displayCurrency]);

  const exchangeRates = useMemo(
    () =>
      currencies
        .filter((code) => code && code !== displayCurrency)
        .map((code) => ({
          code,
          value: convertToDisplayCurrency(1, code, displayCurrency),
        })),
    [currencies, displayCurrency]
  );

  const status = useMemo(() => {
    if (convertedSummary.balance === 0) {
      return {
        label: t('clientsTransactionsPage.statusBalanced'),
        color: 'success' as const,
        caption: t('clientsTransactionsPage.balanceBalanced'),
      };
    }

    if (convertedSummary.balance > 0) {
      return {
        label: t('clientsTransactionsPage.statusWeOwe'),
        color: 'warning' as const,
        caption: t('clientsTransactionsPage.balanceWeOwe', {
          amount: formatAmount(convertedSummary.balance),
        }),
      };
    }

    return {
      label: t('clientsTransactionsPage.statusTheyOwe'),
      color: 'error' as const,
      caption: t('clientsTransactionsPage.balanceClientOwes', {
        amount: formatAmount(Math.abs(convertedSummary.balance)),
      }),
    };
  }, [convertedSummary.balance, t]);

  const pageTitle = `${t('clientsTransactionsPage.detailTitle', {
    client: client?.fullName ?? t('clientsTransactionsPage.detailGeneric'),
  })} | ${CONFIG.appName}`;

  const canSave = Boolean(Number(form.amount) > 0 && form.currency && form.date && clientId);

  const addTransaction = useCallback(() => {
    if (!clientId) return;
    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount <= 0) return;

    const payload: ClientTransaction = {
      id: uuidv4(),
      clientId,
      type: form.type,
      amount,
      currency: form.currency,
      date: form.date || new Date().toISOString().split('T')[0],
      notes: form.notes.trim(),
    };

    setTransactions((prev) => {
      const next = [...prev, payload];
      persistTransactions(next);
      return next;
    });

    setForm(createDetailForm());
    transactionDialog.onFalse();
  }, [clientId, form, transactionDialog]);

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              component="button"
              onClick={() => navigate(paths.dashboard.clients.transactions)}
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              variant="text"
            >
              {t('clientsTransactionsPage.detailBack')}
            </Button>
            <Stack spacing={0.5}>
              <Typography variant="h4">
                {client?.fullName || t('clientsTransactionsPage.detailGeneric')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('clientsTransactionsPage.detailSubtitle')}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
              <Button
                type="button"
                variant="contained"
                startIcon={<Iconify icon="solar:cart-plus-bold" />}
                onClick={() => {
                  setForm(createDetailForm());
                  transactionDialog.onTrue();
                }}
              >
                {t('clientsTransactionsPage.addTransaction')}
              </Button>
            </Stack>
            {client ? (
              <Chip
                label={status.label}
                color={status.color}
                variant="outlined"
                sx={{ ml: 2 }}
              />
            ) : null}
          </Stack>

          {client ? (
            <>
              <Card sx={{ p: 2.5 }}>
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                    flexWrap="wrap"
                  >
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle1">
                        {t('clientsTransactionsPage.detailSummary')}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('clientsTransactionsPage.detailBalanceLabel')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {displayCurrency}
                        </Typography>
                      </Stack>
                    </Stack>
                    <TextField
                      select
                      size="small"
                      label={t('clientsTransactionsPage.displayCurrencyLabel')}
                      value={displayCurrency}
                      onChange={(event) => setDisplayCurrency(event.target.value)}
                      sx={{ minWidth: 140 }}
                      InputLabelProps={{ shrink: true }}
                    >
                      {CURRENCY_OPTIONS.map((code) => (
                        <MenuItem key={code} value={code}>
                          {code}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {formatAmount(convertedSummary.balance)} {displayCurrency}
                  </Typography>
                  <Stack direction="row" spacing={4}>
                    <Stack spacing={0.35}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('clientsTransactionsPage.detailPaidLabel')}
                      </Typography>
                      <Typography variant="h6">
                        {formatAmount(convertedSummary.paid)} {displayCurrency}
                      </Typography>
                    </Stack>
                    <Stack spacing={0.35}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('clientsTransactionsPage.detailPromisedLabel')}
                      </Typography>
                      <Typography variant="h6">
                        {formatAmount(convertedSummary.promised)} {displayCurrency}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {status.caption}
                  </Typography>
                  {exchangeRates.length > 0 && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {t('clientsTransactionsPage.detailExchangeRatesLabel')}:{' '}
                      {exchangeRates
                        .map(
                          (rate) =>
                            `1 ${rate.code} = ${formatRate(rate.value)} ${displayCurrency}`
                        )
                        .join(' · ')}
                    </Typography>
                  )}
                </Stack>
              </Card>

              <Card sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1">
                    {t('clientsTransactionsPage.detailTableTitle')}
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('clientsTransactionsPage.tableDate')}</TableCell>
                          <TableCell>{t('clientsTransactionsPage.detailTableDetails')}</TableCell>
                          <TableCell>{t('clientsTransactionsPage.tableNotes')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {clientTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <Typography
                                variant="body2"
                                sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}
                              >
                                {t('clientsTransactionsPage.detailNoTransactions')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          clientTransactions
                            .slice()
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((tx) => (
                              <TableRow key={tx.id}>
                                <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Box
                                      sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 0.75,
                                        bgcolor: tx.type === 'payment' ? 'success.main' : 'warning.main',
                                      }}
                                      aria-label={
                                        tx.type === 'payment'
                                          ? t('clientsTransactionsPage.types.payment')
                                          : t('clientsTransactionsPage.types.promise')
                                      }
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {formatAmount(tx.amount)} {tx.currency}
                                    </Typography>
                                    <Typography component="span" sx={srOnlyStyles}>
                                      {tx.type === 'payment'
                                        ? t('clientsTransactionsPage.types.payment')
                                        : t('clientsTransactionsPage.types.promise')}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {tx.notes || '—'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              </Card>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('clientsTransactionsPage.detailMissing')}
            </Typography>
          )}
        </Stack>
      </Container>

      <Dialog open={transactionDialog.value} onClose={transactionDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{t('clientsTransactionsPage.addTransaction')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              label={t('clientsTransactionsPage.formType')}
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value as TransactionType }))
              }
            >
              <MenuItem value="promise">{t('clientsTransactionsPage.types.promise')}</MenuItem>
              <MenuItem value="payment">{t('clientsTransactionsPage.types.payment')}</MenuItem>
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
            >
              {CURRENCY_OPTIONS.map((code) => (
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
          <Button onClick={addTransaction} disabled={!canSave} variant="contained">
            {t('clientsTransactionsPage.formSave')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

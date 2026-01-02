import type { UseDateRangePickerReturn } from 'src/components/custom-date-range-picker';

import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { fNumber } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { CustomDateRangePicker } from 'src/components/custom-date-range-picker';

import { useFinanceRates } from './use-finance-rates';
import { useFinanceAnalytics } from './use-finance-analytics';

import type { Currency } from './use-finance-rates';

type Method = 'cash' | 'transfer';

type FinanceMethodSummaryProps = {
  method: Method;
  rangePicker: UseDateRangePickerReturn;
};

const SUPPORTED: Currency[] = ['UZS', 'USD'];
const MANUAL_CURRENCIES: Currency[] = ['UZS', 'USD'];

export function FinanceMethodSummary({ method, rangePicker }: FinanceMethodSummaryProps) {
  const { t } = useTranslate('pages');
  const paletteTheme = useTheme();

  const { rangeStart, rangeEnd, dayBeforeStart } = useMemo(() => {
    const start = rangePicker.startDate ?? dayjs();
    const end = rangePicker.endDate ?? start;
    const [rangeStartDate, rangeEndDate] = start.isAfter(end) ? [end, start] : [start, end];
    return {
      rangeStart: rangeStartDate.format('YYYY-MM-DD'),
      rangeEnd: rangeEndDate.format('YYYY-MM-DD'),
      dayBeforeStart: rangeStartDate.subtract(1, 'day').format('YYYY-MM-DD'),
    };
  }, [rangePicker.startDate, rangePicker.endDate]);

  const { openingBalance, rangeNet, finalBalance } = useFinanceAnalytics(method, rangeStart, rangeEnd, dayBeforeStart);

  const { setRateOverride, hasManualRate } = useFinanceRates();
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const { getRateForDate } = useFinanceRates();

  const rangeNetColor = rangeNet.UZS >= 0 && rangeNet.USD >= 0 ? 'success.main' : 'error.main'; // Simplified color logic or keep per-item

  const rangeLabel = rangePicker.error ? t('finance.analytics.dateRange') : rangePicker.label || '';
  const rateDialogDates = useMemo(() => {
    const dates: string[] = [];
    if (!rangeStart || !rangeEnd) return dates;
    let cursor = dayjs(rangeStart);
    const end = dayjs(rangeEnd);
    const today = dayjs();

    while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
      if (cursor.isAfter(today, 'day')) break;
      dates.push(cursor.format('YYYY-MM-DD'));
      cursor = cursor.add(1, 'day');
    }
    return dates;
  }, [rangeEnd, rangeStart]);

  const handleRateChange = (date: string, currency: Currency, raw: string) => {
    if (!raw.trim()) {
      setRateOverride(date, currency, null);
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    setRateOverride(date, currency, parsed);
  };

  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <TextField
            label={t('finance.analytics.dateRange')}
            value={rangeLabel}
            onClick={rangePicker.onOpen}
            size="small"
            InputProps={{ readOnly: true }}
            sx={{ minWidth: 240, cursor: 'pointer', '& input': { cursor: 'pointer' } }}
          />

          <Stack direction="row" alignItems="center" spacing={1}>
            <Button
              size="small"
              variant="soft"
              color="primary"
              startIcon={<Iconify icon="solar:settings-bold" />}
              onClick={() => setRateDialogOpen(true)}
            >
              {t('finance.analytics.rateManager')}
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="stretch"
          justifyContent="space-between"
        >
          {[
            { label: 'finance.analytics.startBalance', value: openingBalance },
            { label: 'finance.analytics.rangeNet', value: rangeNet, isNet: true },
            { label: 'finance.analytics.finishingBalance', value: finalBalance },
          ].map(({ label, value, isNet }) => (
            <Box
              key={label}
              sx={{
                flex: 1,
                minWidth: 180,
                p: 2,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {t(label)}
              </Typography>

              <Stack spacing={0.5}>
                {SUPPORTED.map((currency) => {
                  const amount = value[currency as keyof typeof value] || 0;
                  const color = isNet ? (amount >= 0 ? 'success.main' : 'error.main') : 'text.primary';

                  return (
                    <Stack key={currency} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" color={color}>
                        {fNumber(amount, { maximumFractionDigits: 0 })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {currency}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>

      <Dialog open={rateDialogOpen} onClose={() => setRateDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('finance.analytics.rateDialogTitle')}
          <IconButton onClick={() => setRateDialogOpen(false)}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('finance.analytics.rateDialogHint')}
          </Typography>

          <TableContainer
            variant="outlined"
            component={Paper}
            sx={{
              boxShadow: 'none',
              borderRadius: 2,
              border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
            }}
          >
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  {MANUAL_CURRENCIES.map((currency) => (
                    <TableCell key={`head-${currency}`} align="center" sx={{ fontWeight: 600 }}>
                      {currency}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rateDialogDates.map((date) => (
                  <TableRow key={date} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {dayjs(date).format('DD MMM YYYY')}
                    </TableCell>
                    {MANUAL_CURRENCIES.map((currency) => {
                      const isUzs = currency === 'UZS';
                      const fieldValue = isUzs ? 1 : getRateForDate(currency, date);
                      const isManual = !isUzs && hasManualRate(date) && fieldValue !== null;
                      const isPast = dayjs(date).isBefore(dayjs(), 'day');
                      const isDisabled = isUzs || (isPast && currency === 'USD');

                      return (
                        <TableCell key={`${date}-${currency}`} align="center">
                          <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={Number.isFinite(fieldValue) ? String(Math.round(fieldValue)) : ''}
                            onChange={(event) => !isDisabled && handleRateChange(date, currency, event.target.value)}
                            onFocus={(event) => event.target.select()}
                            type="number"
                            disabled={isDisabled}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Typography variant="caption" color="text.disabled">
                                    {currency}
                                  </Typography>
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              maxWidth: 140,
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: isManual ? (theme) => alpha(theme.palette.primary.main, 0.04) : 'transparent',
                                '& fieldset': {
                                  borderColor: isManual ? 'primary.main' : alpha(paletteTheme.palette.grey[500], 0.2),
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: 'primary.main',
                                },
                                '&.Mui-disabled': {
                                  backgroundColor: (theme) => alpha(theme.palette.action.disabledBackground, 0.02),
                                }
                              },
                              '& input': { textAlign: 'center', fontWeight: 'bold' },
                            }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRateDialogOpen(false)} variant="outlined" color="inherit">
            {t('finance.analytics.rateDialogClose')}
          </Button>
          <Button onClick={() => setRateDialogOpen(false)} variant="contained" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <CustomDateRangePicker
        variant="range"
        title={t('finance.analytics.dateRange')}
        open={rangePicker.open}
        startDate={rangePicker.startDate}
        endDate={rangePicker.endDate}
        onChangeStartDate={rangePicker.onChangeStartDate}
        onChangeEndDate={rangePicker.onChangeEndDate}
        onClose={rangePicker.onClose}
        error={rangePicker.error}
        maxDate={dayjs()}
      />
    </Card>
  );
}

export default FinanceMethodSummary;

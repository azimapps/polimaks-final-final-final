import type { PaperProps } from '@mui/material';
import type { DialogProps } from '@mui/material/Dialog';
import type { Theme, SxProps } from '@mui/material/styles';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormHelperText from '@mui/material/FormHelperText';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';

import type { UseDateRangePickerReturn } from './use-date-range-picker';

// ----------------------------------------------------------------------

export type CustomDateRangePickerProps = DialogProps &
  UseDateRangePickerReturn & {
    onSubmit?: () => void;
  };

type RangePickersDayProps = PickersDayProps<any> & {
  isHighlighting?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
  isRange?: boolean;
};

function RangePickersDay({
  isHighlighting = false,
  isStart = false,
  isEnd = false,
  isRange = false,
  ...other
}: RangePickersDayProps) {
  const isRangeEdge = isStart || isEnd;

  return (
    <PickersDay
      {...other}
      disableMargin
      selected={isRangeEdge}
      sx={(theme) => ({
        ...(isRange &&
          isHighlighting && {
            borderRadius: 0,
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            '&:hover, &:focus': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
            },
          }),
        ...(isRangeEdge && {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          '&:hover, &:focus': {
            backgroundColor: theme.palette.primary.dark,
          },
        }),
        ...(isRange &&
          isStart && {
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderTopLeftRadius: '50%',
            borderBottomLeftRadius: '50%',
          }),
        ...(isRange &&
          isEnd && {
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: '50%',
            borderBottomRightRadius: '50%',
          }),
      })}
    />
  );
}

export function CustomDateRangePicker({
  open,
  error,
  onClose,
  onSubmit,
  /********/
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
  /********/
  slotProps,
  variant = 'input',
  title = 'Select date range',
  ...other
}: CustomDateRangePickerProps) {
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const isCalendarView = variant === 'calendar';
  const isRangeView = variant === 'range';

  const handleRangeSelect = useCallback(
    (newValue: PickersDayProps<any>['day'] | null) => {
      if (!newValue) return;
      if (!startDate || (startDate && endDate)) {
        onChangeStartDate(newValue);
        onChangeEndDate(null);
        return;
      }
      if (startDate && !endDate) {
        if (newValue.isBefore(startDate, 'day')) {
          onChangeEndDate(startDate);
          onChangeStartDate(newValue);
          return;
        }
        onChangeEndDate(newValue);
      }
    },
    [endDate, onChangeEndDate, onChangeStartDate, startDate]
  );

  const handleSubmit = useCallback(() => {
    onClose();
    onSubmit?.();
  }, [onClose, onSubmit]);

  const contentStyles: SxProps<Theme> = {
    py: 1,
    gap: 3,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    ...(isCalendarView && mdUp && { flexDirection: 'row' }),
  };

  const blockStyles: SxProps<Theme> = {
    borderRadius: 2,
    border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
  };

  const disableApply = Boolean(error || !startDate || !endDate);

  const dialogPaperSx = (slotProps?.paper as PaperProps)?.sx;

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={onClose}
      maxWidth={isCalendarView ? false : 'xs'}
      slotProps={{
        ...slotProps,
        paper: {
          ...slotProps?.paper,
          sx: [
            { ...(isCalendarView && { maxWidth: 720 }) },
            ...(Array.isArray(dialogPaperSx) ? dialogPaperSx : [dialogPaperSx]),
          ],
        },
      }}
      {...other}
    >
      <DialogTitle sx={{ pb: 2 }}>{title}</DialogTitle>

      <DialogContent sx={{ ...(isCalendarView && mdUp && { overflow: 'unset' }) }}>
        <Box sx={contentStyles}>
          {isCalendarView ? (
            <>
              <Box sx={blockStyles}>
                <DateCalendar value={startDate} onChange={onChangeStartDate} />
              </Box>

              <Box sx={blockStyles}>
                <DateCalendar value={endDate} onChange={onChangeEndDate} />
              </Box>
            </>
          ) : isRangeView ? (
            <Box sx={blockStyles}>
              <DateCalendar
                value={endDate ?? startDate}
                onChange={handleRangeSelect}
                slots={{ day: RangePickersDay }}
                slotProps={{
                  day: ({ day }) => {
                    const isRange = Boolean(startDate && endDate);
                    const isStart = Boolean(startDate && day.isSame(startDate, 'day'));
                    const isEnd = Boolean(endDate && day.isSame(endDate, 'day'));
                    const isHighlighting = Boolean(
                      isRange && startDate && endDate && day.isAfter(startDate, 'day') && day.isBefore(endDate, 'day')
                    );
                    return {
                      isEnd,
                      isRange,
                      isStart,
                      isHighlighting,
                    } as Partial<PickersDayProps<any>> & RangePickersDayProps;
                  },
                }}
              />
            </Box>
          ) : (
            <>
              <DatePicker label="Start date" value={startDate} onChange={onChangeStartDate} />
              <DatePicker label="End date" value={endDate} onChange={onChangeEndDate} />
            </>
          )}
        </Box>

        {error && (
          <FormHelperText error sx={{ px: 2 }}>
            End date must be later than start date
          </FormHelperText>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={disableApply} variant="contained" onClick={handleSubmit}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}

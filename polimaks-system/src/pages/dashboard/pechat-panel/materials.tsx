import { v4 as uuidv4 } from 'uuid';
import { useMemo, useState, useEffect, type MouseEvent, type ChangeEvent } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import kraskaSeed from 'src/data/kraska.json';
import plyonkaSeed from 'src/data/plyonka.json';
import silindirSeed from 'src/data/silindir.json';
import machineSeed from 'src/data/stanok-pechat.json';
import razvaritelSeed from 'src/data/razvaritel.json';
import suyuqKraskaSeed from 'src/data/suyuq-kraska.json';

import { Iconify } from 'src/components/iconify';
import { FlagIcon } from 'src/components/flag-icon';
import { CustomPopover } from 'src/components/custom-popover';

type Machine = {
  id: string;
  language_code: string;
  name: string;
};

type PlyonkaItem = {
  id: string;
  seriyaNumber?: string;
  category?: string;
  subcategory?: string;
};

type KraskaItem = {
  id: string;
  seriyaNumber?: string;
  colorName?: string;
  marka?: string;
};

type SuyuqKraskaItem = {
  id: string;
  seriyaNumber?: string;
  colorName?: string;
  marka?: string;
};

type RazvaritelItem = {
  id: string;
  seriyaNumber?: string;
  type?: string;
};

type SilindirItem = {
  id: string;
  seriyaNumber?: string;
  origin?: 'china' | 'germany';
  length?: number;
  diameter?: number;
};

type BaseTx = {
  id: string;
  date: string;
  type: 'in' | 'out';
  machineType?: string;
  machineId?: string;
  note?: string;
  createdAt?: number;
};

type PlyonkaTx = BaseTx & { plyonkaId: string; amountKg?: number };
type KraskaTx = BaseTx & { kraskaId: string; amountKg?: number };
type SuyuqKraskaTx = BaseTx & { suyuqKraskaId: string; amountKg?: number };
type RazvaritelTx = BaseTx & { razvaritelId: string; amountLiter?: number };
type SilindirTx = BaseTx & { silindirId: string; amountQty?: number };

type MaterialInfo = {
  label: string;
  value: string;
};

type StockItemRow = {
  id: string;
  materialLabel: string;
  itemLabel: string;
  totalAmount: number;
  unit: string;
  amountLabel: string;
  info: MaterialInfo[];
};

const STORAGE_KEY = 'stanok-pechat';
const PECHAT_SELECTED_MACHINE_KEY = 'pechat-panel-selected-machine';

const LANGUAGE_OPTIONS = [
  { code: 'cn', labelKey: 'languages.cn', country: 'CN' },
  { code: 'de', labelKey: 'languages.de', country: 'DE' },
  { code: 'uz', labelKey: 'languages.uz', country: 'UZ' },
  { code: 'ru', labelKey: 'languages.ru', country: 'RU' },
  { code: 'en', labelKey: 'languages.en', country: 'GB' },
];

const readLocalArray = <T,>(key: string, fallback: T[]): T[] => {
  if (typeof window === 'undefined') return fallback;
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    const parsed = JSON.parse(stored) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readTransactions = <T,>(key: string): T[] => readLocalArray<T>(key, []);

const formatAmount = (value: number, unit: string) => (unit ? `${value} ${unit}` : `${value}`);

export default function PechatPanelMaterialsPage() {
  const { t } = useTranslate('pages');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(PECHAT_SELECTED_MACHINE_KEY) || '';
  });

  useEffect(() => {
    const loadMachines = () =>
      setMachines(readLocalArray<Machine>(STORAGE_KEY, machineSeed as Machine[]));

    loadMachines();

    if (typeof window === 'undefined') return undefined;
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEY) loadMachines();
      if (event.key === PECHAT_SELECTED_MACHINE_KEY && event.newValue) {
        setSelectedMachineId(event.newValue);
      }
    };
    const handlePanelSelection = () => {
      const stored = localStorage.getItem(PECHAT_SELECTED_MACHINE_KEY) || '';
      if (stored) setSelectedMachineId(stored);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('pechat-panel-machine-change', handlePanelSelection);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('pechat-panel-machine-change', handlePanelSelection);
    };
  }, []);

  useEffect(() => {
    if (!machines.length) {
      setSelectedMachineId('');
      return;
    }
    if (!selectedMachineId || !machines.some((item) => item.id === selectedMachineId)) {
      setSelectedMachineId(machines[0]?.id || '');
    }
  }, [machines, selectedMachineId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedMachineId) return;
    localStorage.setItem(PECHAT_SELECTED_MACHINE_KEY, selectedMachineId);
    window.dispatchEvent(new Event('pechat-panel-machine-change'));
  }, [selectedMachineId]);

  const machine = useMemo(
    () => machines.find((item) => item.id === selectedMachineId) ?? null,
    [machines, selectedMachineId]
  );

  const getCountryCode = (code: string) =>
    LANGUAGE_OPTIONS.find((opt) => opt.code === code)?.country ?? '';

  const rows = useMemo<StockItemRow[]>(() => {
    if (!selectedMachineId) return [];

    const unknownLabel = t('pechatMaterialsPage.unknown');
    const formatSize = (value?: number) =>
      typeof value === 'number' && value > 0 ? `${value} ${t('silindirPage.mm')}` : unknownLabel;

    const itemsById = <T extends { id: string }>(items: T[]) =>
      new Map(items.map((item) => [item.id, item]));

    const plyonkaItems = itemsById(
      readLocalArray<PlyonkaItem>('ombor-plyonka', plyonkaSeed as PlyonkaItem[])
    );
    const kraskaItems = itemsById(
      readLocalArray<KraskaItem>('ombor-kraska', kraskaSeed as KraskaItem[])
    );
    const suyuqKraskaItems = itemsById(
      readLocalArray<SuyuqKraskaItem>('ombor-suyuq-kraska', suyuqKraskaSeed as SuyuqKraskaItem[])
    );
    const razvaritelItems = itemsById(
      readLocalArray<RazvaritelItem>('ombor-razvaritel', razvaritelSeed as RazvaritelItem[])
    );
    const silindirItems = itemsById(
      readLocalArray<SilindirItem>('ombor-silindir', silindirSeed as SilindirItem[])
    );

    const resultMap = new Map<string, StockItemRow>();

    const addToMap = (
      itemId: string,
      amount: number,
      base: Omit<StockItemRow, 'totalAmount' | 'amountLabel'>
    ) => {
      const existing = resultMap.get(itemId);
      if (existing) {
        existing.totalAmount += amount;
      } else {
        resultMap.set(itemId, {
          ...base,
          totalAmount: amount,
          amountLabel: '', // updated later
        });
      }
    };

    const handlePlyonka = () => {
      const txs = readTransactions<PlyonkaTx>('ombor-plyonka-transactions');
      txs.forEach((tx) => {
        if (tx.type !== 'out' || tx.machineType !== 'pechat' || tx.machineId !== selectedMachineId)
          return;
        const item = plyonkaItems.get(tx.plyonkaId);
        const parts = [
          item?.seriyaNumber || unknownLabel,
          item?.category || '',
          item?.subcategory || '',
        ].filter(Boolean);
        const label = parts.join(' / ');

        addToMap(tx.plyonkaId, Number(tx.amountKg) || 0, {
          id: `plyonka-${tx.plyonkaId}`,
          materialLabel: t('plyonkaPage.title'),
          itemLabel: label,
          unit: t('plyonkaPage.kg'),
          info: [
            { label: t('plyonkaPage.seriya'), value: item?.seriyaNumber || unknownLabel },
            { label: t('plyonkaPage.category'), value: item?.category || unknownLabel },
            { label: t('plyonkaPage.subcategory'), value: item?.subcategory || unknownLabel },
          ],
        } as any);
      });
    };

    const handleKraska = () => {
      const txs = readTransactions<KraskaTx>('ombor-kraska-transactions');
      txs.forEach((tx) => {
        if (tx.type !== 'out' || tx.machineType !== 'pechat' || tx.machineId !== selectedMachineId)
          return;
        const item = kraskaItems.get(tx.kraskaId);
        const parts = [
          item?.seriyaNumber || unknownLabel,
          item?.colorName || '',
          item?.marka || '',
        ].filter(Boolean);
        const label = parts.join(' / ');

        addToMap(tx.kraskaId, Number(tx.amountKg) || 0, {
          id: `kraska-${tx.kraskaId}`,
          materialLabel: t('kraskaPage.title'),
          itemLabel: label,
          unit: t('kraskaPage.kg'),
          info: [
            { label: t('kraskaPage.seriya'), value: item?.seriyaNumber || unknownLabel },
            { label: t('kraskaPage.colorName'), value: item?.colorName || unknownLabel },
            { label: t('kraskaPage.marka'), value: item?.marka || unknownLabel },
          ],
        } as any);
      });
    };

    const handleSuyuqKraska = () => {
      const txs = readTransactions<SuyuqKraskaTx>('ombor-suyuq-kraska-transactions');
      txs.forEach((tx) => {
        if (tx.type !== 'out' || tx.machineType !== 'pechat' || tx.machineId !== selectedMachineId)
          return;
        const item = suyuqKraskaItems.get(tx.suyuqKraskaId);
        const parts = [
          item?.seriyaNumber || unknownLabel,
          item?.colorName || '',
          item?.marka || '',
        ].filter(Boolean);
        const label = parts.join(' / ');

        addToMap(tx.suyuqKraskaId, Number(tx.amountKg) || 0, {
          id: `suyuq-kraska-${tx.suyuqKraskaId}`,
          materialLabel: t('suyuqKraskaPage.title'),
          itemLabel: label,
          unit: t('suyuqKraskaPage.kg'),
          info: [
            { label: t('suyuqKraskaPage.seriya'), value: item?.seriyaNumber || unknownLabel },
            { label: t('suyuqKraskaPage.colorName'), value: item?.colorName || unknownLabel },
            { label: t('suyuqKraskaPage.marka'), value: item?.marka || unknownLabel },
          ],
        } as any);
      });
    };

    const handleRazvaritel = () => {
      const txs = readTransactions<RazvaritelTx>('ombor-razvaritel-transactions');
      txs.forEach((tx) => {
        if (tx.type !== 'out' || tx.machineType !== 'pechat' || tx.machineId !== selectedMachineId)
          return;
        const item = razvaritelItems.get(tx.razvaritelId);
        const parts = [item?.seriyaNumber || unknownLabel, item?.type || ''].filter(Boolean);
        const label = parts.join(' / ');

        addToMap(tx.razvaritelId, Number(tx.amountLiter) || 0, {
          id: `razvaritel-${tx.razvaritelId}`,
          materialLabel: t('razvaritelPage.title'),
          itemLabel: label,
          unit: t('razvaritelPage.liter'),
          info: [
            { label: t('razvaritelPage.seriya'), value: item?.seriyaNumber || unknownLabel },
            { label: t('razvaritelPage.type'), value: item?.type || unknownLabel },
          ],
        } as any);
      });
    };

    const handleSilindir = () => {
      const txs = readTransactions<SilindirTx>('ombor-silindir-transactions');
      txs.forEach((tx) => {
        if (tx.type !== 'out' || tx.machineType !== 'pechat' || tx.machineId !== selectedMachineId)
          return;
        const item = silindirItems.get(tx.silindirId);
        const originLabel = item?.origin ? t(`silindirPage.origin.${item.origin}`) : '';
        const sizeParts = [
          typeof item?.length === 'number' && item.length > 0 ? `${item.length}` : '',
          typeof item?.diameter === 'number' && item.diameter > 0 ? `${item.diameter}` : '',
        ].filter(Boolean);
        const sizeLabel = sizeParts.length ? `${sizeParts.join('x')} ${t('silindirPage.mm')}` : '';
        const parts = [item?.seriyaNumber || unknownLabel, originLabel, sizeLabel].filter(Boolean);
        const label = parts.join(' / ');

        addToMap(tx.silindirId, Number(tx.amountQty) || 0, {
          id: `silindir-${tx.silindirId}`,
          materialLabel: t('silindirPage.title'),
          itemLabel: label,
          unit: '',
          info: [
            { label: t('silindirPage.seriya'), value: item?.seriyaNumber || unknownLabel },
            { label: t('silindirPage.originLabel'), value: originLabel || unknownLabel },
            { label: t('silindirPage.length'), value: formatSize(item?.length) },
            { label: t('silindirPage.diameter'), value: formatSize(item?.diameter) },
          ],
        } as any);
      });
    };

    handlePlyonka();
    handleKraska();
    handleSuyuqKraska();
    handleRazvaritel();
    handleSilindir();

    const results = Array.from(resultMap.values())
      .filter((row) => row.totalAmount > 0)
      .map((row) => ({
        ...row,
        amountLabel: formatAmount(row.totalAmount, row.unit),
      }));

    return results;
  }, [selectedMachineId, t]);

  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLElement | null>(null);
  const [infoRow, setInfoRow] = useState<StockItemRow | null>(null);
  const infoOpen = Boolean(infoAnchorEl);

  const handleOpenInfo = (event: MouseEvent<HTMLButtonElement>, row: StockItemRow) => {
    setInfoRow(row);
    setInfoAnchorEl(event.currentTarget);
  };

  const handleCloseInfo = () => {
    setInfoAnchorEl(null);
    setInfoRow(null);
  };

  const heading = t('pechatMaterialsPage.title', {
    machine: machine?.name || selectedMachineId || t('pechatMaterialsPage.unknown'),
  });
  const pageTitle = `${heading} | ${CONFIG.appName}`;
  const languageLabel = machine?.language_code ? t(`languages.${machine.language_code}`) : '-';

  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [usageTarget, setUsageTarget] = useState<StockItemRow | null>(null);
  const [usageAmount, setUsageAmount] = useState('');
  const [usageNote, setUsageNote] = useState('');

  const handleOpenUsage = (row: StockItemRow) => {
    setUsageTarget(row);
    setUsageAmount('');
    setUsageNote('');
    setUsageDialogOpen(true);
  };

  const handleCloseUsage = () => {
    setUsageDialogOpen(false);
    setUsageTarget(null);
  };

  const handleSaveUsage = () => {
    if (!usageTarget || !machine || !selectedMachineId) return;

    const amount = Number(usageAmount);
    if (isNaN(amount) || amount <= 0 || amount > usageTarget.totalAmount) return;

    const baseTx = {
      id: uuidv4(),
      date: new Date().toISOString().slice(0, 10),
      type: 'out',
      machineType: 'pechat', // Assuming this page is for Pechat machines
      machineId: selectedMachineId,
      note: usageNote,
      createdAt: Date.now(),
    };

    let storageKey = '';
    let newTx: any = {};

    if (usageTarget.id.startsWith('plyonka-')) {
      storageKey = 'ombor-plyonka-transactions';
      newTx = { ...baseTx, plyonkaId: usageTarget.id.replace('plyonka-', ''), amountKg: amount };
    } else if (usageTarget.id.startsWith('kraska-')) {
      storageKey = 'ombor-kraska-transactions';
      newTx = { ...baseTx, kraskaId: usageTarget.id.replace('kraska-', ''), amountKg: amount };
    } else if (usageTarget.id.startsWith('suyuq-kraska-')) {
      storageKey = 'ombor-suyuq-kraska-transactions';
      newTx = { ...baseTx, suyuqKraskaId: usageTarget.id.replace('suyuq-kraska-', ''), amountKg: amount };
    } else if (usageTarget.id.startsWith('razvaritel-')) {
      storageKey = 'ombor-razvaritel-transactions';
      newTx = { ...baseTx, razvaritelId: usageTarget.id.replace('razvaritel-', ''), amountLiter: amount };
    } else if (usageTarget.id.startsWith('silindir-')) {
      storageKey = 'ombor-silindir-transactions';
      newTx = { ...baseTx, silindirId: usageTarget.id.replace('silindir-', ''), amountQty: amount };
    }

    if (storageKey) {
      const existingTxs = readTransactions<any>(storageKey);
      const updatedTxs = [...existingTxs, newTx];
      localStorage.setItem(storageKey, JSON.stringify(updatedTxs));

      // Dispatch storage event to update UI immediately
      window.dispatchEvent(new Event('storage'));
      // Also force re-render if needed, but storage event listener normally handles it
    }

    handleCloseUsage();
  };

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">{heading}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {t('pechatMaterialsPage.subtitle')}
            </Typography>
          </Box>

          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>{t('pechatPanel.machineLabel')}</InputLabel>
                <Select
                  value={selectedMachineId}
                  label={t('pechatPanel.machineLabel')}
                  onChange={(event) => setSelectedMachineId(event.target.value as string)}
                >
                  {machines.length === 0 && (
                    <MenuItem value="">
                      <em>{t('pechatPanel.noMachines')}</em>
                    </MenuItem>
                  )}
                  {machines.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name || item.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!machine ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {machines.length ? t('pechatMaterialsPage.notFound') : t('pechatPanel.noMachines')}
                </Typography>
              ) : (
                <>
                  <Typography variant="subtitle1">
                    {t('pechatMaterialsPage.summaryTitle')}
                  </Typography>
                  <Divider />
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <FlagIcon
                        code={getCountryCode(machine.language_code)}
                        sx={{ width: 46, height: 30, borderRadius: 0.75 }}
                      />
                      <Box>
                        <Typography variant="subtitle1">{machine.name || '-'}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('pechatPage.languageCode')}: {languageLabel}
                        </Typography>
                      </Box>
                    </Stack>
                    <Divider
                      flexItem
                      orientation="vertical"
                      sx={{ display: { xs: 'none', sm: 'block' } }}
                    />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('pechatMaterialsPage.machineId')}: {machine.id}
                    </Typography>
                  </Stack>
                </>
              )}
            </Stack>
          </Card>

          <Card>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 140 }}>
                      {t('pechatMaterialsPage.table.material')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      {t('pechatMaterialsPage.table.item')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      {t('pechatMaterialsPage.table.amount')}
                    </TableCell>
                    <TableCell align="right">{t('pechatMaterialsPage.table.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
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
                            {t('pechatMaterialsPage.empty')}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Chip size="small" label={row.materialLabel} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2">{row.itemLabel || '-'}</Typography>
                            {row.info.length > 0 && (
                              <Tooltip title={t('pechatMaterialsPage.info')}>
                                <IconButton
                                  size="small"
                                  onClick={(event) => handleOpenInfo(event, row)}
                                  aria-label={t('pechatMaterialsPage.info')}
                                >
                                  <Iconify icon="eva:info-outline" width={16} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>{row.amountLabel}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="soft"
                            color="error"
                            size="small"
                            onClick={() => handleOpenUsage(row)}
                          >
                            Chiqim (Use)
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <CustomPopover
              open={infoOpen}
              anchorEl={infoAnchorEl}
              onClose={handleCloseInfo}
              slotProps={{
                arrow: { placement: 'top-left' },
                paper: { sx: { p: 2, minWidth: 240, maxWidth: 320 } },
              }}
            >
              {infoRow && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">{infoRow.materialLabel}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {infoRow.itemLabel || '-'}
                  </Typography>
                  <Divider />
                  <Stack spacing={0.75}>
                    {infoRow.info.map((detail, index) => (
                      <Stack
                        key={`${detail.label}-${index}`}
                        direction="row"
                        spacing={2}
                        justifyContent="space-between"
                      >
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {detail.label}
                        </Typography>
                        <Typography variant="body2">{detail.value}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              )}
            </CustomPopover>
          </Card>
        </Stack>
      </Container>

      <Dialog open={usageDialogOpen} onClose={handleCloseUsage} maxWidth="sm" fullWidth>
        <DialogTitle>Materiadan foydalanish (Chiqim)</DialogTitle>
        <DialogContent>
          {usageTarget && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="subtitle2">
                {usageTarget.materialLabel}: {usageTarget.itemLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mavjud: {usageTarget.amountLabel}
              </Typography>

              <TextField
                fullWidth
                label="Miqdor"
                type="number"
                value={usageAmount}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsageAmount(e.target.value)}
                inputProps={{ max: usageTarget.totalAmount, min: 0 }}
                helperText={
                  Number(usageAmount) > usageTarget.totalAmount
                    ? `Mavjud miqdordan oshib ketdi (${usageTarget.totalAmount})`
                    : ''
                }
                error={Number(usageAmount) > usageTarget.totalAmount}
              />

              <TextField
                fullWidth
                label="Izoh (Log)"
                multiline
                rows={3}
                value={usageNote}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsageNote(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUsage}>Bekor qilish</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSaveUsage}
            disabled={
              !usageAmount ||
              Number(usageAmount) <= 0 ||
              Number(usageAmount) > (usageTarget?.totalAmount || 0)
            }
          >
            Tasdiqlash
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

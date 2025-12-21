import { useLocation } from 'react-router';
import React, { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
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
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import kraskaSeed from 'src/data/kraska.json';
import plyonkaSeed from 'src/data/plyonka.json';
import silindirSeed from 'src/data/silindir.json';
import razvaritelSeed from 'src/data/razvaritel.json';
import suyuqKraskaSeed from 'src/data/suyuq-kraska.json';
import stanokPechatSeed from 'src/data/stanok-pechat.json';
import brigadaPechatSeed from 'src/data/stanok-brigada-pechat.json';

import { Iconify } from 'src/components/iconify';

type PlanStatus = 'in_progress' | 'finished';

type PlanItem = {
  id: string;
  orderId?: string;
  orderNumber: string;
  clientName: string;
  title: string;
  quantityKg: number;
  orderDate?: string;
  startDate: string;
  endDate: string;
  machineType: string;
  machineId: string;
  machineName?: string;
  groupId: string;
  groupName?: string;
  status?: PlanStatus;
  material?: string;
  subMaterial?: string;
  admin?: string;
  filmThickness?: number;
  filmWidth?: number;
  cylinderLength?: number;
  cylinderCount?: number;
  cylinderAylanasi?: number;
  pricePerKg?: number;
  priceCurrency?: string;
  note?: string;
  materialsUsed?: MaterialUsage[];
};

type MaterialUsage = {
  materialId: string;
  materialLabel: string;
  itemLabel: string;
  amount: number;
  unitLabel: string;
  note?: string;
};

type MaterialUsageForm = {
  id: string;
  materialId: string;
  amount: string;
  note: string;
};

type MaterialOption = {
  id: string;
  label: string;
  materialLabel: string;
  itemLabel: string;
  unitLabel: string;
  available?: number;
};

type PlyonkaItem = {
  id: string;
  seriyaNumber?: string;
  category?: string;
  subcategory?: string;
  totalKg?: number;
};

type KraskaItem = {
  id: string;
  seriyaNumber?: string;
  colorName?: string;
  marka?: string;
  totalKg?: number;
};

type SuyuqKraskaItem = {
  id: string;
  seriyaNumber?: string;
  colorName?: string;
  marka?: string;
  totalKg?: number;
};

type RazvaritelItem = {
  id: string;
  seriyaNumber?: string;
  type?: string;
  totalLiter?: number;
};

type SilindirItem = {
  id: string;
  seriyaNumber?: string;
  origin?: 'china' | 'germany';
  length?: number;
  diameter?: number;
  quantity?: number;
};

type BaseTx = {
  id: string;
  date: string;
  type: 'in' | 'out';
  machineType?: string;
  machineId?: string;
};

type PlyonkaTx = BaseTx & { plyonkaId: string; amountKg?: number };
type KraskaTx = BaseTx & { kraskaId: string; amountKg?: number };
type SuyuqKraskaTx = BaseTx & { suyuqKraskaId: string; amountKg?: number };
type RazvaritelTx = BaseTx & { razvaritelId: string; amountLiter?: number };
type SilindirTx = BaseTx & { silindirId: string; amountQty?: number };

type MaterialItemWithId = { id: string };

const buildUsageId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const ORDER_PLAN_STORAGE_KEY = 'orderPlansV2';
const LEGACY_ORDER_PLAN_STORAGE_KEY = 'orderPlans';
const PLAN_SEED: PlanItem[] = [
  {
    id: 'pechat-plan-1',
    orderNumber: 'PP-001',
    clientName: 'Demo klient',
    title: 'Bosma partiya',
    quantityKg: 900,
    startDate: '2024-01-05',
    endDate: '2024-01-06',
    machineType: 'pechat',
    machineId: 'pechat-1',
    machineName: 'Bosma stanogi 1',
    groupId: 'brigada-pechat-1',
    groupName: 'Pechat Alpha',
    status: 'in_progress',
  },
];

const resolveStatus = (status?: string): PlanItem['status'] => {
  if (status === 'finished' || status === 'completed') return 'finished';
  return 'in_progress';
};

const normalizePlanItem = (raw: any, index: number): PlanItem => ({
  id: raw?.id || `plan-${index}`,
  orderId: raw?.orderId || '',
  orderNumber: raw?.orderNumber || '',
  clientName: raw?.clientName || '',
  title: raw?.title || '',
  quantityKg: Number(raw?.quantityKg) || 0,
  orderDate: raw?.orderDate || raw?.date,
  startDate: raw?.startDate || '',
  endDate: raw?.endDate || '',
  machineType: raw?.machineType || '',
  machineId: raw?.machineId || '',
  machineName: raw?.machineName || '',
  groupId: raw?.groupId || '',
  groupName: raw?.groupName || '',
  status: resolveStatus(raw?.status),
  material: raw?.material,
  subMaterial: raw?.subMaterial,
  admin: raw?.admin,
  filmThickness: Number(raw?.filmThickness) || undefined,
  filmWidth: Number(raw?.filmWidth) || undefined,
  cylinderLength: Number(raw?.cylinderLength) || undefined,
  cylinderCount: Number(raw?.cylinderCount) || undefined,
  cylinderAylanasi: Number(raw?.cylinderAylanasi) || undefined,
  pricePerKg: Number(raw?.pricePerKg) || undefined,
  priceCurrency: raw?.priceCurrency,
  note: raw?.note,
  materialsUsed: Array.isArray(raw?.materialsUsed) ? raw.materialsUsed : [],
});

const loadPlanItems = (): PlanItem[] => {
  if (typeof window === 'undefined') return PLAN_SEED;

  try {
    const stored = localStorage.getItem(ORDER_PLAN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as any[];
      const normalized = parsed.map((item, idx) => normalizePlanItem(item, idx));
      const pechatPlans = normalized.filter((plan) => plan.machineType === 'pechat');
      if (pechatPlans.length) return pechatPlans;
    }

    const legacy = localStorage.getItem(LEGACY_ORDER_PLAN_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as any[];
      const normalized = parsed.map((item, idx) => normalizePlanItem(item, idx));
      const pechatPlans = normalized.filter((plan) => plan.machineType === 'pechat');
      if (pechatPlans.length) return pechatPlans;
    }
  } catch {
    // ignore parse errors
  }

  return PLAN_SEED;
};

const readLocalArray = <T,>(key: string, fallback: T[]): T[] => {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
};

const readTransactions = <T,>(key: string): T[] => readLocalArray<T>(key, []);

const buildMaterialOptions = (machineId: string | undefined, t: (key: string, vars?: any) => string) => {
  if (!machineId) return [];

  const unknownLabel = t('pechatMaterialsPage.unknown');
  const itemsById = <T extends MaterialItemWithId>(items: T[]) =>
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

  const options = new Map<string, MaterialOption>();
  const totals = new Map<string, number>();
  const addOption = (key: string, option: MaterialOption) => {
    if (!options.has(key)) options.set(key, option);
  };
  const addTotal = (key: string, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    totals.set(key, (totals.get(key) || 0) + amount);
  };

  const handlePlyonka = () => {
    const txs = readTransactions<PlyonkaTx>('ombor-plyonka-transactions');
    txs.forEach((tx) => {
      if (tx.type !== 'out' || tx.machineType !== 'pechat' || tx.machineId !== machineId) return;
      const item = plyonkaItems.get(tx.plyonkaId);
      const parts = [
        item?.seriyaNumber || unknownLabel,
        item?.category || '',
        item?.subcategory || '',
      ].filter(Boolean);
      const itemLabel = parts.join(' / ') || unknownLabel;
      const materialLabel = t('plyonkaPage.title');
      const key = `plyonka:${item?.id || tx.plyonkaId}`;
      addOption(key, {
        id: key,
        label: `${materialLabel} / ${itemLabel}`,
        materialLabel,
        itemLabel,
        unitLabel: t('plyonkaPage.kg'),
      });
      addTotal(key, Number(tx.amountKg) || 0);
    });
  };

  const handleKraska = () => {
    const txs = readTransactions<KraskaTx>('ombor-kraska-transactions');
    txs.forEach((tx) => {
      if (tx.type !== 'out' || tx.machineType !== 'pechat' || tx.machineId !== machineId) return;
      const item = kraskaItems.get(tx.kraskaId);
      const parts = [
        item?.seriyaNumber || unknownLabel,
        item?.colorName || '',
        item?.marka || '',
      ].filter(Boolean);
      const itemLabel = parts.join(' / ') || unknownLabel;
      const materialLabel = t('kraskaPage.title');
      const key = `kraska:${item?.id || tx.kraskaId}`;
      addOption(key, {
        id: key,
        label: `${materialLabel} / ${itemLabel}`,
        materialLabel,
        itemLabel,
        unitLabel: t('kraskaPage.kg'),
      });
      addTotal(key, Number(tx.amountKg) || 0);
    });
  };

  const handleSuyuqKraska = () => {
    const txs = readTransactions<SuyuqKraskaTx>('ombor-suyuq-kraska-transactions');
    txs.forEach((tx) => {
      if (tx.type !== 'out' || tx.machineType !== 'pechat' || tx.machineId !== machineId) return;
      const item = suyuqKraskaItems.get(tx.suyuqKraskaId);
      const parts = [
        item?.seriyaNumber || unknownLabel,
        item?.colorName || '',
        item?.marka || '',
      ].filter(Boolean);
      const itemLabel = parts.join(' / ') || unknownLabel;
      const materialLabel = t('suyuqKraskaPage.title');
      const key = `suyuq-kraska:${item?.id || tx.suyuqKraskaId}`;
      addOption(key, {
        id: key,
        label: `${materialLabel} / ${itemLabel}`,
        materialLabel,
        itemLabel,
        unitLabel: t('suyuqKraskaPage.kg'),
      });
      addTotal(key, Number(tx.amountKg) || 0);
    });
  };

  const handleRazvaritel = () => {
    const txs = readTransactions<RazvaritelTx>('ombor-razvaritel-transactions');
    txs.forEach((tx) => {
      if (tx.type !== 'out' || tx.machineType !== 'pechat' || tx.machineId !== machineId) return;
      const item = razvaritelItems.get(tx.razvaritelId);
      const parts = [item?.seriyaNumber || unknownLabel, item?.type || ''].filter(Boolean);
      const itemLabel = parts.join(' / ') || unknownLabel;
      const materialLabel = t('razvaritelPage.title');
      const key = `razvaritel:${item?.id || tx.razvaritelId}`;
      addOption(key, {
        id: key,
        label: `${materialLabel} / ${itemLabel}`,
        materialLabel,
        itemLabel,
        unitLabel: t('razvaritelPage.liter'),
      });
      addTotal(key, Number(tx.amountLiter) || 0);
    });
  };

  const handleSilindir = () => {
    const txs = readTransactions<SilindirTx>('ombor-silindir-transactions');
    txs.forEach((tx) => {
      if (tx.type !== 'out' || tx.machineType !== 'pechat' || tx.machineId !== machineId) return;
      const item = silindirItems.get(tx.silindirId);
      const originLabel = item?.origin ? t(`silindirPage.origin.${item.origin}`) : '';
      const sizeParts = [
        typeof item?.length === 'number' && item.length > 0 ? `${item.length}` : '',
        typeof item?.diameter === 'number' && item.diameter > 0 ? `${item.diameter}` : '',
      ].filter(Boolean);
      const sizeLabel = sizeParts.length ? `${sizeParts.join('x')} ${t('silindirPage.mm')}` : '';
      const parts = [item?.seriyaNumber || unknownLabel, originLabel, sizeLabel].filter(Boolean);
      const itemLabel = parts.join(' / ') || unknownLabel;
      const materialLabel = t('silindirPage.title');
      const key = `silindir:${item?.id || tx.silindirId}`;
      addOption(key, {
        id: key,
        label: `${materialLabel} / ${itemLabel}`,
        materialLabel,
        itemLabel,
        unitLabel: t('orderPlanPage.pcs'),
      });
      addTotal(key, Number(tx.amountQty) || 0);
    });
  };

  handlePlyonka();
  handleKraska();
  handleSuyuqKraska();
  handleRazvaritel();
  handleSilindir();

  return Array.from(options.values())
    .map((option) => ({
      ...option,
      available: totals.get(option.id) || 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export default function PechatPanelOverviewPage() {
  const { t } = useTranslate('pages');
  const title = `${t('pechatPanel.title')} | ${CONFIG.appName}`;

  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [brigadas, setBrigadas] = useState<any[]>([]);
  const [selectedBrigadaId, setSelectedBrigadaId] = useState<string>('');
  const [plans, setPlans] = useState<PlanItem[]>(() => loadPlanItems());
  const [detailPlan, setDetailPlan] = useState<PlanItem | null>(null);
  const { pathname } = useLocation();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusPlan, setStatusPlan] = useState<PlanItem | null>(null);
  const [statusValue, setStatusValue] = useState<PlanStatus>('in_progress');
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([]);
  const [usageRows, setUsageRows] = useState<MaterialUsageForm[]>([]);

  const materialOptionMap = useMemo(
    () => new Map(materialOptions.map((option) => [option.id, option])),
    [materialOptions]
  );

  const usageTotals = useMemo(() => {
    const totals = new Map<string, number>();
    usageRows.forEach((row) => {
      const amount = Number(row.amount);
      if (!row.materialId || Number.isNaN(amount)) return;
      totals.set(row.materialId, (totals.get(row.materialId) || 0) + amount);
    });
    return totals;
  }, [usageRows]);

  const hasUsageErrors = useMemo(() => {
    for (const row of usageRows) {
      if (!row.materialId) continue;
      const option = materialOptionMap.get(row.materialId);
      if (!option || typeof option.available !== 'number') continue;
      const total = usageTotals.get(row.materialId) || 0;
      if (total > option.available) return true;
    }
    return false;
  }, [materialOptionMap, usageRows, usageTotals]);

  useEffect(() => {
    const loadMachines = () =>
      setMachines(readLocalArray('stanok-pechat', stanokPechatSeed as any[]));
    const loadBrigadas = () => {
      setBrigadas(
        selectedMachineId
          ? readLocalArray(`stanok-brigada-pechat-${selectedMachineId}`, brigadaPechatSeed as any[])
          : readLocalArray('stanok-brigada-pechat', brigadaPechatSeed as any[])
      );
    };
    const loadPlansFromStorage = () => setPlans(loadPlanItems());

    loadMachines();
    loadBrigadas();
    loadPlansFromStorage();

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === 'stanok-pechat') loadMachines();
      if (event.key.startsWith('stanok-brigada-pechat')) loadBrigadas();
      if (
        event.key === ORDER_PLAN_STORAGE_KEY ||
        event.key === LEGACY_ORDER_PLAN_STORAGE_KEY ||
        event.key === null
      ) {
        loadPlansFromStorage();
      }
    };

    const onFocus = () => {
      loadMachines();
      loadBrigadas();
      loadPlansFromStorage();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
      window.addEventListener('focus', onFocus);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [selectedMachineId]);

  useEffect(() => {
    if (!selectedMachineId && machines[0]?.id) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  useEffect(() => {
    const nextBrigadas = selectedMachineId
      ? readLocalArray(`stanok-brigada-pechat-${selectedMachineId}`, brigadaPechatSeed as any[])
      : readLocalArray('stanok-brigada-pechat', brigadaPechatSeed as any[]);
    setBrigadas(nextBrigadas);
  }, [selectedMachineId]);

  useEffect(() => {
    if (!brigadas.length) {
      setSelectedBrigadaId('');
      return;
    }
    if (!selectedBrigadaId || !brigadas.some((b: any) => b.id === selectedBrigadaId)) {
      setSelectedBrigadaId(brigadas[0]?.id || '');
    }
  }, [brigadas, selectedBrigadaId]);

  const persistPlans = (next: PlanItem[]) => {
    setPlans(next);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ORDER_PLAN_STORAGE_KEY);
        const parsed = stored ? (JSON.parse(stored) as any[]) : [];
        const otherPlans = parsed.filter((plan) => plan?.machineType !== 'pechat');
        localStorage.setItem(ORDER_PLAN_STORAGE_KEY, JSON.stringify([...otherPlans, ...next]));
      } catch {
        localStorage.setItem(ORDER_PLAN_STORAGE_KEY, JSON.stringify(next));
      }
    }
  };

  const selectionPlans = useMemo(
    () =>
      plans.filter(
        (plan) =>
          plan.machineType === 'pechat' &&
          (!selectedMachineId || plan.machineId === selectedMachineId) &&
          (!selectedBrigadaId || plan.groupId === selectedBrigadaId)
      ),
    [plans, selectedMachineId, selectedBrigadaId]
  );

  const filteredPlans = useMemo(
    () => {
      const statusFilter: PlanStatus = pathname.endsWith('/yakunlangan') ? 'finished' : 'in_progress';
      return selectionPlans.filter((plan) => (plan.status || 'in_progress') === statusFilter);
    },
    [pathname, selectionPlans]
  );

  const isInProgressRoute = pathname.endsWith('/jarayonda');

  const handleOpenDetails = (plan: PlanItem) => {
    setDetailPlan(plan);
  };

  const handleCloseDetails = () => {
    setDetailPlan(null);
  };

  const handleOpenStatusDialog = (plan: PlanItem) => {
    const options = buildMaterialOptions(plan.machineId || selectedMachineId, t);
    const usedTotals = new Map<string, number>();
    plans.forEach((item) => {
      if (item.id === plan.id) return;
      if (item.machineId !== plan.machineId) return;
      (item.materialsUsed || []).forEach((usage) => {
        usedTotals.set(usage.materialId, (usedTotals.get(usage.materialId) || 0) + usage.amount);
      });
    });
    const adjustedOptions = options.map((option) => ({
      ...option,
      available: Math.max(0, (option.available || 0) - (usedTotals.get(option.id) || 0)),
    }));
    const existingUsage = (plan.materialsUsed || []).map((item, index) => ({
      id: buildUsageId(`usage-${index}`),
      materialId: item.materialId,
      amount: item.amount ? String(item.amount) : '',
      note: item.note || '',
    }));

    setMaterialOptions(adjustedOptions);
    setUsageRows(
      existingUsage.length
        ? existingUsage
        : [{ id: buildUsageId('usage'), materialId: '', amount: '', note: '' }]
    );
    setStatusPlan(plan);
    setStatusValue(plan.status || 'in_progress');
    setStatusDialogOpen(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setStatusPlan(null);
  };

  const handleAddUsageRow = () => {
    setUsageRows((prev) => [
      ...prev,
      { id: buildUsageId('usage'), materialId: '', amount: '', note: '' },
    ]);
  };

  const handleRemoveUsageRow = (id: string) => {
    setUsageRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateUsageRow = (id: string, next: Partial<MaterialUsageForm>) => {
    setUsageRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...next } : row)));
  };

  const handleSaveStatus = () => {
    if (!statusPlan) return;
    const usedMaterials = usageRows
      .map((row): MaterialUsage | null => {
        const option = materialOptionMap.get(row.materialId);
        const amount = Number(row.amount);
        if (!option || Number.isNaN(amount) || amount <= 0) return null;
        const note = row.note?.trim();
        return {
          materialId: option.id,
          materialLabel: option.materialLabel,
          itemLabel: option.itemLabel,
          amount,
          unitLabel: option.unitLabel,
          ...(note ? { note } : {}),
        };
      })
      .filter((item): item is MaterialUsage => item !== null);

    if (!hasUsageErrors) {
      const updatedPlans = plans.map((plan) =>
        plan.id === statusPlan.id
          ? { ...plan, status: statusValue, materialsUsed: usedMaterials }
          : plan
      );
      persistPlans(updatedPlans);
      handleCloseStatusDialog();
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  const machineTypeLabel = (value?: string) => {
    if (!value) return '';
    if (value === 'pechat') return 'Pechat';
    if (value === 'reska') return 'Reska';
    if (value === 'laminatsiya') return 'Laminatsiya';
    return value;
  };

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <div>
            <Typography variant="h3" gutterBottom>
              {t('pechatPanel.overview.heading')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('pechatPanel.overview.description')}
            </Typography>
          </div>
        </Stack>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <FormControl fullWidth>
                <InputLabel>{t('pechatPanel.machineLabel')}</InputLabel>
                <Select
                  value={selectedMachineId}
                  label={t('pechatPanel.machineLabel')}
                  onChange={(e) => setSelectedMachineId(e.target.value as string)}
                >
                  {machines.length === 0 && (
                    <MenuItem value="">
                      <em>{t('pechatPanel.noMachines')}</em>
                    </MenuItem>
                  )}
                  {machines.map((machine: any) => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name || machine.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!brigadas.length}>
                <InputLabel>{t('pechatPanel.brigadaLabel')}</InputLabel>
                <Select
                  value={selectedBrigadaId}
                  label={t('pechatPanel.brigadaLabel')}
                  onChange={(e) => setSelectedBrigadaId(e.target.value as string)}
                >
                  {brigadas.length === 0 && (
                    <MenuItem value="">
                      <em>{t('pechatPanel.noBrigadas')}</em>
                    </MenuItem>
                  )}
                  {brigadas.map((brigada: any) => (
                    <MenuItem key={brigada.id} value={brigada.id}>
                      {brigada.name || brigada.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {selectedMachineId
                ? t('pechatPanel.overview.selection', {
                    machine: machines.find((m: any) => m.id === selectedMachineId)?.name || selectedMachineId,
                    brigada:
                      brigadas.find((b: any) => b.id === selectedBrigadaId)?.name ||
                      selectedBrigadaId ||
                      t('pechatPanel.noBrigadas'),
                  })
                : t('pechatPanel.noMachines')}
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('orderPlanPage.orderNumber')}</TableCell>
                    <TableCell>{t('orderPlanPage.client')}</TableCell>
                    <TableCell>{t('orderPlanPage.title')}</TableCell>
                    <TableCell align="right">{t('orderPlanPage.quantityKg')}</TableCell>
                    <TableCell>{t('orderPlanPage.date')}</TableCell>
                    <TableCell align="center">{t('orderPlanPage.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.disabled' }}>
                        {t('orderPlanPage.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => (
                      <React.Fragment key={plan.id}>
                        <TableRow hover>
                          <TableCell>{plan.orderNumber}</TableCell>
                          <TableCell>{plan.clientName}</TableCell>
                          <TableCell>{plan.title}</TableCell>
                          <TableCell align="right">{plan.quantityKg}</TableCell>
                          <TableCell>
                            {plan.startDate
                              ? new Date(plan.startDate).toLocaleDateString()
                              : t('orderPlanPage.date')}
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton
                                size="small"
                                aria-label={t('orderPlanPage.details')}
                                onClick={() => handleOpenDetails(plan)}
                              >
                                <Iconify icon="eva:info-outline" />
                              </IconButton>
                              {isInProgressRoute && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenStatusDialog(plan)}
                                >
                                  {t('pechatPanel.changeStatus')}
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Card>
      </Container>

      <Dialog open={Boolean(detailPlan)} onClose={handleCloseDetails} fullWidth maxWidth="md">
        <DialogTitle>{t('orderPlanPage.details')}</DialogTitle>
        <DialogContent dividers>
          {detailPlan && (
            <Stack spacing={2.5}>
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <DetailItem label={t('orderPlanPage.orderNumber')} value={detailPlan.orderNumber} />
                <DetailItem label={t('orderPlanPage.client')} value={detailPlan.clientName} />
                <DetailItem label={t('orderPlanPage.title')} value={detailPlan.title} />
                <DetailItem
                  label={t('orderPlanPage.quantityKg')}
                  value={
                    detailPlan.quantityKg
                      ? `${detailPlan.quantityKg} ${t('orderPlanPage.kg')}`
                      : ''
                  }
                />
                <DetailItem label={t('orderPlanPage.orderDate')} value={formatDate(detailPlan.orderDate)} />
                <DetailItem label={t('orderPlanPage.date')} value={formatDate(detailPlan.startDate)} />
                <DetailItem label={t('orderPlanPage.endDate')} value={formatDate(detailPlan.endDate)} />
                <DetailItem label={t('orderPlanPage.machineTypeLabel')} value={machineTypeLabel(detailPlan.machineType)} />
                <DetailItem label={t('orderPlanPage.machineLabel')} value={detailPlan.machineName || detailPlan.machineId} />
                <DetailItem label={t('pechatPanel.brigadaLabel')} value={detailPlan.groupName || detailPlan.groupId} />
                <DetailItem
                  label={t('orderPlanPage.material')}
                  value={
                    detailPlan.material
                      ? `${detailPlan.material}${detailPlan.subMaterial ? ` · ${detailPlan.subMaterial}` : ''}`
                      : ''
                  }
                />
                <DetailItem label={t('orderPlanPage.subMaterial')} value={detailPlan.subMaterial} />
                <DetailItem
                  label={t('orderPlanPage.filmThickness')}
                  value={
                    detailPlan.filmThickness
                      ? `${detailPlan.filmThickness} ${t('orderPlanPage.microns')}`
                      : ''
                  }
                />
                <DetailItem
                  label={t('orderPlanPage.filmWidth')}
                  value={
                    detailPlan.filmWidth ? `${detailPlan.filmWidth} ${t('orderPlanPage.mm')}` : ''
                  }
                />
                <DetailItem
                  label={t('orderPlanPage.cylinderLength')}
                  value={
                    detailPlan.cylinderLength
                      ? `${detailPlan.cylinderLength} ${t('orderPlanPage.mm')}`
                      : ''
                  }
                />
                <DetailItem
                  label={t('orderPlanPage.cylinderCount')}
                  value={
                    detailPlan.cylinderCount
                      ? `${detailPlan.cylinderCount} ${t('orderPlanPage.pcs')}`
                      : ''
                  }
                />
                <DetailItem
                  label={t('silindirPage.diameter')}
                  value={
                    detailPlan.cylinderAylanasi
                      ? `${detailPlan.cylinderAylanasi} ${t('orderPlanPage.mm')}`
                      : ''
                  }
                />
                <DetailItem label={t('orderPlanPage.responsiblePerson')} value={detailPlan.admin} />
                <DetailItem label={t('orderPlanPage.notes')} value={detailPlan.note} />
              </Box>
              <Divider />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('pechatPanel.overview.selection', {
                  machine:
                    machines.find((m: any) => m.id === detailPlan.machineId)?.name ||
                    detailPlan.machineName ||
                    detailPlan.machineId,
                  brigada:
                    brigadas.find((b: any) => b.id === detailPlan.groupId)?.name ||
                    detailPlan.groupName ||
                    detailPlan.groupId ||
                    t('pechatPanel.noBrigadas'),
                })}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>{t('orderPlanPage.cancel')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog} fullWidth maxWidth="md">
        <DialogTitle>{t('pechatPanel.statusDialogTitle')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel>{t('orderPlanPage.statusLabel')}</InputLabel>
              <Select
                value={statusValue}
                label={t('orderPlanPage.statusLabel')}
                onChange={(event) => setStatusValue(event.target.value as PlanStatus)}
              >
                <MenuItem value="in_progress">{t('orderPlanPage.status.inProgress')}</MenuItem>
                <MenuItem value="finished">{t('orderPlanPage.status.finished')}</MenuItem>
              </Select>
            </FormControl>

            <Stack spacing={1}>
              <Typography variant="subtitle2">{t('pechatPanel.materialsUsed')}</Typography>
              {materialOptions.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('pechatPanel.noMaterials')}
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {usageRows.map((row) => {
                    const selectedOption = materialOptionMap.get(row.materialId);
                    const selectedTotal = row.materialId ? usageTotals.get(row.materialId) || 0 : 0;
                    const exceedsAvailable =
                      selectedOption && typeof selectedOption.available === 'number'
                        ? selectedTotal > selectedOption.available
                        : false;
                    return (
                      <Box
                        key={row.id}
                        sx={{
                          display: 'grid',
                          gap: 2,
                          alignItems: 'center',
                          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr auto' },
                        }}
                      >
                        <FormControl fullWidth>
                          <InputLabel>{t('pechatMaterialsPage.table.material')}</InputLabel>
                          <Select
                            value={row.materialId}
                            label={t('pechatMaterialsPage.table.material')}
                            onChange={(event) =>
                              updateUsageRow(row.id, { materialId: event.target.value })
                            }
                          >
                            <MenuItem value="">
                              <em>{t('pechatPanel.selectMaterial')}</em>
                            </MenuItem>
                            {materialOptions.map((option) => (
                              <MenuItem key={option.id} value={option.id}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <TextField
                          label={t('pechatMaterialsPage.table.amount')}
                          type="number"
                          value={row.amount}
                          onChange={(event) => updateUsageRow(row.id, { amount: event.target.value })}
                          inputProps={{ min: 0, step: 'any' }}
                          error={exceedsAvailable}
                          helperText={
                            exceedsAvailable
                              ? t('pechatPanel.maxAmount', {
                                  amount: selectedOption?.available,
                                  unit: selectedOption?.unitLabel || '',
                                })
                              : undefined
                          }
                          FormHelperTextProps={{ sx: { mt: 0 } }}
                          InputProps={{
                            endAdornment: selectedOption?.unitLabel ? (
                              <InputAdornment position="end">
                                {selectedOption.unitLabel}
                              </InputAdornment>
                            ) : null,
                          }}
                        />

                        <TextField
                          label={t('pechatMaterialsPage.table.note')}
                          value={row.note}
                          onChange={(event) => updateUsageRow(row.id, { note: event.target.value })}
                        />

                        <IconButton color="error" onClick={() => handleRemoveUsageRow(row.id)}>
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Stack>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleAddUsageRow}
              disabled={materialOptions.length === 0}
            >
              {t('pechatPanel.addMaterial')}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>{t('orderPlanPage.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveStatus} disabled={hasUsageErrors}>
            {t('orderPlanPage.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

type DetailItemProps = { label: string; value?: string };

function DetailItem({ label, value }: DetailItemProps) {
  if (!value) return null;
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

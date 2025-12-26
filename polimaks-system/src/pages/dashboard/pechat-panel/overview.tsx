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
  numberOfColors?: number;
  colorValues?: string[];
  colorMeasurements?: Map<string, number[]>;
  totalMeters?: number;
  totalKg?: number;
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
const PECHAT_SELECTED_MACHINE_KEY = 'pechat-panel-selected-machine';
const ORDER_BOOK_STORAGE_KEY = 'clients-order-book';

type OrderBookItem = {
  id: string;
  orderNumber: string;
  numberOfColors?: number;
};
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
  numberOfColors: typeof raw?.numberOfColors === 'number' ? raw.numberOfColors : Number(raw?.numberOfColors) || 1,
  colorValues: Array.isArray(raw?.colorValues) ? raw.colorValues : [],
  colorMeasurements: raw?.colorMeasurements instanceof Map ? raw.colorMeasurements : new Map(),
  totalMeters: typeof raw?.totalMeters === 'number' ? raw.totalMeters : Number(raw?.totalMeters) || 0,
  totalKg: typeof raw?.totalKg === 'number' ? raw.totalKg : Number(raw?.totalKg) || 0,
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

const TRANSACTION_STORAGE_KEYS = [
  'ombor-plyonka-transactions',
  'ombor-kraska-transactions',
  'ombor-suyuq-kraska-transactions',
  'ombor-razvaritel-transactions',
  'ombor-silindir-transactions',
];

const buildUsageTotals = (items: MaterialUsage[]) => {
  const totals = new Map<string, number>();
  items.forEach((usage) => {
    totals.set(usage.materialId, (totals.get(usage.materialId) || 0) + usage.amount);
  });
  return totals;
};

const buildUsageNotes = (items: MaterialUsage[]) => {
  const notes = new Map<string, string[]>();
  items.forEach((usage) => {
    const note = usage.note?.trim();
    if (!note) return;
    const values = notes.get(usage.materialId) || [];
    if (!values.includes(note)) values.push(note);
    notes.set(usage.materialId, values);
  });
  const merged = new Map<string, string>();
  notes.forEach((values, materialId) => {
    merged.set(materialId, values.join('; '));
  });
  return merged;
};

const getMaterialKeyFromTransaction = (storageKey: string, transaction: any) => {
  if (storageKey === 'ombor-plyonka-transactions') return `plyonka:${transaction.plyonkaId}`;
  if (storageKey === 'ombor-kraska-transactions') return `kraska:${transaction.kraskaId}`;
  if (storageKey === 'ombor-suyuq-kraska-transactions') {
    return `suyuq-kraska:${transaction.suyuqKraskaId}`;
  }
  if (storageKey === 'ombor-razvaritel-transactions') {
    return `razvaritel:${transaction.razvaritelId}`;
  }
  if (storageKey === 'ombor-silindir-transactions') return `silindir:${transaction.silindirId}`;
  return '';
};

const createMaterialTransaction = (
  materialId: string,
  amount: number,
  note: string,
  machineId: string,
  planId: string
) => {
  const [materialType, itemId] = materialId.split(':');
  if (!materialType || !itemId) return null;
  const materialKey = `${materialType}:${itemId}`;
  const base = {
    id: buildUsageId('tx'),
    date: new Date().toISOString().slice(0, 10),
    type: 'out' as const,
    machineType: 'pechat' as const,
    machineId,
    note,
    createdAt: Date.now(),
    source: 'pechat-plan',
    planId,
  };

  if (materialType === 'plyonka') {
    return {
      storageKey: 'ombor-plyonka-transactions',
      materialKey,
      transaction: { ...base, plyonkaId: itemId, amountKg: amount },
    };
  }
  if (materialType === 'kraska') {
    return {
      storageKey: 'ombor-kraska-transactions',
      materialKey,
      transaction: { ...base, kraskaId: itemId, amountKg: amount },
    };
  }
  if (materialType === 'suyuq-kraska') {
    return {
      storageKey: 'ombor-suyuq-kraska-transactions',
      materialKey,
      transaction: { ...base, suyuqKraskaId: itemId, amountKg: amount },
    };
  }
  if (materialType === 'razvaritel') {
    return {
      storageKey: 'ombor-razvaritel-transactions',
      materialKey,
      transaction: { ...base, razvaritelId: itemId, amountLiter: amount },
    };
  }
  if (materialType === 'silindir') {
    return {
      storageKey: 'ombor-silindir-transactions',
      materialKey,
      transaction: { ...base, silindirId: itemId, amountQty: amount },
    };
  }

  return null;
};

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

const loadOrderBook = (): OrderBookItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ORDER_BOOK_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as OrderBookItem[];
  } catch {
    return [];
  }
};

export default function PechatPanelOverviewPage() {
  const { t } = useTranslate('pages');
  const title = `${t('pechatPanel.title')} | ${CONFIG.appName}`;

  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(PECHAT_SELECTED_MACHINE_KEY) || '';
  });
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
  const [colorValues, setColorValues] = useState<string[]>([]);
  const [numberOfColors, setNumberOfColors] = useState<number>(1);
  const [availableColors, setAvailableColors] = useState<{
    id: string; 
    colorName: string; 
    seriya?: string; 
    marka?: string; 
    amount?: number; 
    unit?: string;
  }[]>([]);
  const [colorMeasurements, setColorMeasurements] = useState<Map<string, number[]>>(new Map());
  const [totalMeters, setTotalMeters] = useState('');
  const [totalKg, setTotalKg] = useState('');
  const [dispatchDestination, setDispatchDestination] = useState<'laminatsiya' | 'reska' | 'angren' | ''>('');
  const [selectedBrigadaForDispatch, setSelectedBrigadaForDispatch] = useState('');
  
  // Calculation results dialog
  const [calculationResults, setCalculationResults] = useState<{
    colorResults: { colorName: string; suyuqUsed: number; razvaritelUsed: number; totalCost: number }[];
    totalCost: number;
  } | null>(null);
  const [showCalculationDialog, setShowCalculationDialog] = useState(false);

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
    if (typeof window === 'undefined' || !selectedMachineId) return;
    localStorage.setItem(PECHAT_SELECTED_MACHINE_KEY, selectedMachineId);
    window.dispatchEvent(new Event('pechat-panel-machine-change'));
  }, [selectedMachineId]);

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

  // Reload colors when machine changes
  useEffect(() => {
    loadAvailableColors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMachineId]);

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

    // Load number of colors from order book data
    const orderBook = loadOrderBook();
    const orderItem = orderBook.find(order => 
      order.id === plan.orderId || order.orderNumber === plan.orderNumber
    );
    const colorsCount = orderItem?.numberOfColors || plan.numberOfColors || 1;
    const existingColors = plan.colorValues || [];
    const initialColors = Array.from({ length: colorsCount }, (_, i) => 
      existingColors[i] || ''
    );

    setMaterialOptions(adjustedOptions);
    setUsageRows(
      existingUsage.length
        ? existingUsage
        : [{ id: buildUsageId('usage'), materialId: '', amount: '', note: '' }]
    );
    setNumberOfColors(colorsCount);
    setColorValues(initialColors);
    
    // Load available colors from stanok materials
    loadAvailableColors();
    
    // Initialize color measurements if not already set
    const existingMeasurements = plan.colorMeasurements || new Map();
    setColorMeasurements(new Map(existingMeasurements));
    
    // Initialize total values
    setTotalMeters(plan.totalMeters?.toString() || '');
    setTotalKg(plan.totalKg?.toString() || '');
    
    // Reset dispatch selections
    setDispatchDestination('');
    setSelectedBrigadaForDispatch('');
    
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

  const updateColorValue = (index: number, value: string) => {
    setColorValues((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const loadAvailableColors = () => {
    const colors: {
      id: string; 
      colorName: string; 
      seriya?: string; 
      marka?: string; 
      amount?: number; 
      unit?: string;
    }[] = [];
    const machineId = selectedMachineId || 'pechat-1';
    
    console.log('Loading colors for machine:', machineId);
    
    try {
      // Load kraska (paint) items from ombor to get color names
      const kraskaItems = new Map();
      const kraskaData = JSON.parse(localStorage.getItem('ombor-kraska') || '[]');
      if (Array.isArray(kraskaData)) {
        kraskaData.forEach((item: any) => {
          if (item?.id) {
            kraskaItems.set(item.id, item);
          }
        });
      }
      
      // Load suyuq kraska items from ombor to get color names
      const suyuqKraskaItems = new Map();
      const suyuqKraskaData = JSON.parse(localStorage.getItem('ombor-suyuq-kraska') || '[]');
      if (Array.isArray(suyuqKraskaData)) {
        suyuqKraskaData.forEach((item: any) => {
          if (item?.id) {
            suyuqKraskaItems.set(item.id, item);
          }
        });
      }
      
      // Load kraska transactions for this machine
      const kraskaTxs = JSON.parse(localStorage.getItem('ombor-kraska-transactions') || '[]');
      console.log('Kraska transactions:', kraskaTxs);
      
      if (Array.isArray(kraskaTxs)) {
        kraskaTxs.forEach((tx: any) => {
          console.log('Checking transaction:', tx);
          if (tx.type === 'out' && tx.machineType === 'pechat' && tx.machineId === machineId) {
            const item = kraskaItems.get(tx.kraskaId);
            console.log('Found matching transaction, item:', item);
            if (item?.colorName) {
              if (!colors.find(c => c.id === item.id)) {
                colors.push({
                  id: item.id, 
                  colorName: item.colorName,
                  seriya: item.seriyaNumber,
                  marka: item.marka,
                  amount: tx.amountKg,
                  unit: 'kg'
                });
              }
            }
          }
        });
      }
      
      // Load suyuq kraska transactions for this machine  
      const suyuqTxs = JSON.parse(localStorage.getItem('ombor-suyuq-kraska-transactions') || '[]');
      console.log('Suyuq kraska transactions:', suyuqTxs);
      
      if (Array.isArray(suyuqTxs)) {
        suyuqTxs.forEach((tx: any) => {
          if (tx.type === 'out' && tx.machineType === 'pechat' && tx.machineId === machineId) {
            const item = suyuqKraskaItems.get(tx.suyuqKraskaId);
            console.log('Found matching suyuq transaction, item:', item);
            if (item?.colorName) {
              if (!colors.find(c => c.id === item.id)) {
                colors.push({
                  id: item.id, 
                  colorName: item.colorName,
                  seriya: item.seriyaNumber,
                  marka: item.marka,
                  amount: tx.amountKg,
                  unit: 'kg'
                });
              }
            }
          }
        });
      }
      
    } catch (e) {
      console.error('Error loading colors:', e);
    }
    
    console.log('Final colors loaded:', colors);
    setAvailableColors(colors);
  };

  const updateColorMeasurement = (colorId: string, index: number, value: string) => {
    setColorMeasurements(prev => {
      const newMap = new Map(prev);
      const measurements = newMap.get(colorId) || [0, 0, 0, 0];
      measurements[index] = parseFloat(value) || 0;
      newMap.set(colorId, measurements);
      return newMap;
    });
  };

  // Calculation functions for material usage
  const calculateMaterialUsage = () => {
    const results: { colorName: string; suyuqUsed: number; razvaritelUsed: number; totalCost: number }[] = [];
    let totalCost = 0;

    // Get material prices
    const suyuqKraskaItems = JSON.parse(localStorage.getItem('ombor-suyuq-kraska') || '[]');
    const razvaritelItems = JSON.parse(localStorage.getItem('ombor-razvaritel') || '[]');

    availableColors.forEach(color => {
      const measurements = colorMeasurements.get(color.id) || [0, 0, 0, 0];
      const [suyuqIshlatilgan, quyuqIshlatilgan, razvaritel, qolganSuyuq] = measurements;

      // Formula for suyuq kraska: Ishlatilgan suyuq kraska * 0.67 + quyuq kraska - qolgan suyuq kraska * 0.67
      const suyuqUsed = suyuqIshlatilgan * 0.67 + quyuqIshlatilgan - qolganSuyuq * 0.67;

      // Formula for razvaritel: Ishlatilgan suyuq kraska * 0.33 + razvaritel - qolgan suyuq kraska * 0.33
      const razvaritelUsed = suyuqIshlatilgan * 0.33 + razvaritel - qolganSuyuq * 0.33;

      // Calculate cost
      let colorCost = 0;
      
      // Find suyuq kraska price
      const suyuqItem = suyuqKraskaItems.find((item: any) => item.colorName === color.colorName);
      if (suyuqItem && suyuqItem.pricePerKg && suyuqUsed > 0) {
        colorCost += suyuqUsed * suyuqItem.pricePerKg;
      }

      // Find razvaritel price (assuming EAF type for now)
      const razvaritelItem = razvaritelItems.find((item: any) => item.type === 'eaf');
      if (razvaritelItem && razvaritelItem.pricePerLiter && razvaritelUsed > 0) {
        colorCost += razvaritelUsed * razvaritelItem.pricePerLiter;
      }

      results.push({
        colorName: color.colorName,
        suyuqUsed: Math.max(0, suyuqUsed),
        razvaritelUsed: Math.max(0, razvaritelUsed),
        totalCost: colorCost
      });

      totalCost += colorCost;
    });

    return { colorResults: results, totalCost };
  };

  const handleDispatchProduct = (plan: PlanItem) => {
    try {
      const productData = {
        id: `finished-${plan.id}-${Date.now()}`,
        sourceOrderId: plan.id,
        orderNumber: plan.orderNumber,
        clientName: plan.clientName,
        title: plan.title,
        totalKg: parseFloat(totalKg) || plan.quantityKg || 0,
        totalMeter: parseFloat(totalMeters) || 0,
        colorMeasurements: Object.fromEntries(colorMeasurements),
        colorValues: colorValues.filter(color => color.trim() !== ''),
        completedDate: new Date().toISOString().slice(0, 10),
        pricePerKg: plan.pricePerKg || 0,
        priceCurrency: plan.priceCurrency || 'UZS',
        description: `Pechat jarayonidan yakunlandi. ${plan.note || ''}`
      };

      if (dispatchDestination === 'angren') {
        // Send to Angren warehouse
        const angrenStorage = JSON.parse(localStorage.getItem('ombor-tayyor-mahsulotlar-angren') || '[]');
        angrenStorage.push({ ...productData, location: 'angren' });
        localStorage.setItem('ombor-tayyor-mahsulotlar-angren', JSON.stringify(angrenStorage));
        
        console.log('Product dispatched to Angren warehouse:', productData);
      } else if (dispatchDestination === 'laminatsiya' || dispatchDestination === 'reska') {
        // Add to next stage planning
        const nextStorageKey = dispatchDestination === 'laminatsiya' ? 
          'buyurtma-planlashtirish-laminatsiya' : 
          'buyurtma-planlashtirish-reska';
        
        const nextStagePlanning = JSON.parse(localStorage.getItem(nextStorageKey) || '[]');
        
        const nextPlan = {
          ...plan,
          id: `${dispatchDestination}-${plan.id}-${Date.now()}`,
          machineType: dispatchDestination,
          groupId: selectedBrigadaForDispatch,
          status: 'in_progress',
          sourceStage: 'pechat',
          receivedDate: new Date().toISOString().slice(0, 10),
          pechatResults: {
            totalKg: parseFloat(totalKg) || 0,
            totalMeters: parseFloat(totalMeters) || 0,
            colorMeasurements: Object.fromEntries(colorMeasurements)
          }
        };
        
        nextStagePlanning.push(nextPlan);
        localStorage.setItem(nextStorageKey, JSON.stringify(nextStagePlanning));
        
        console.log(`Product dispatched to ${dispatchDestination}:`, nextPlan);
      }

      // Also store in pechat-paneli yakunlangan
      const yakunlanganStorage = JSON.parse(localStorage.getItem('pechat-paneli-yakunlangan') || '[]');
      yakunlanganStorage.push({
        ...productData,
        dispatchedTo: dispatchDestination,
        brigada: selectedBrigadaForDispatch,
        finishedAt: new Date().toISOString()
      });
      localStorage.setItem('pechat-paneli-yakunlangan', JSON.stringify(yakunlanganStorage));
      
      // Reset dispatch selections
      setDispatchDestination('');
      setSelectedBrigadaForDispatch('');
      
    } catch (error) {
      console.error('Error dispatching product:', error);
    }
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
      const planId = statusPlan.id;
      const planMachineId = statusPlan.machineId || selectedMachineId;
      const notesByMaterial = buildUsageNotes(usedMaterials);
      const nextTotals = buildUsageTotals(usedMaterials);
      const nextTransactionsByStorage = new Map<string, any[]>();
      const existingStorage = new Map<
        string,
        { all: any[]; planByMaterial: Map<string, any> }
      >();

      const ensureStorage = (storageKey: string) => {
        if (existingStorage.has(storageKey)) return existingStorage.get(storageKey)!;
        const all = readLocalArray<any>(storageKey, []);
        const planByMaterial = new Map<string, any>();
        all
          .filter((tx) => tx?.source === 'pechat-plan' && tx?.planId === planId)
          .forEach((tx) => {
            const materialKey = getMaterialKeyFromTransaction(storageKey, tx);
            if (materialKey) planByMaterial.set(materialKey, tx);
          });
        const entry = { all, planByMaterial };
        existingStorage.set(storageKey, entry);
        return entry;
      };

      nextTotals.forEach((amount, materialId) => {
        if (amount <= 0) return;
        const note = notesByMaterial.get(materialId) || statusPlan.orderNumber || '';
        const result = createMaterialTransaction(materialId, amount, note, planMachineId, planId);
        if (!result) return;
        const storage = ensureStorage(result.storageKey);
        const existingTx = storage.planByMaterial.get(result.materialKey);
        const transaction = existingTx
          ? {
              ...result.transaction,
              id: existingTx.id,
              date: existingTx.date,
              createdAt: existingTx.createdAt,
            }
          : result.transaction;
        const bucket = nextTransactionsByStorage.get(result.storageKey) || [];
        bucket.push(transaction);
        nextTransactionsByStorage.set(result.storageKey, bucket);
      });

      TRANSACTION_STORAGE_KEYS.forEach((storageKey) => {
        const storage = ensureStorage(storageKey);
        const withoutPlan = storage.all.filter(
          (tx) => !(tx?.source === 'pechat-plan' && tx?.planId === planId)
        );
        const next = [...withoutPlan, ...(nextTransactionsByStorage.get(storageKey) || [])];
        localStorage.setItem(storageKey, JSON.stringify(next));
      });

      // Calculate material usage and costs
      const calculations = calculateMaterialUsage();
      
      const updatedPlans = plans.map((plan) =>
        plan.id === statusPlan.id
          ? { 
              ...plan, 
              status: statusValue, 
              materialsUsed: usedMaterials,
              numberOfColors,
              colorValues: colorValues.filter(color => color.trim() !== ''),
              colorMeasurements: new Map(colorMeasurements),
              totalMeters: parseFloat(totalMeters) || 0,
              totalKg: parseFloat(totalKg) || 0,
              calculatedMaterialUsage: calculations // Store the calculation results
            }
          : plan
      );
      persistPlans(updatedPlans);
      
      // Handle dispatch if status is finished and destination is selected
      if (statusValue === 'finished' && dispatchDestination) {
        handleDispatchProduct(statusPlan);
      }
      
      // Store and show calculation results
      setCalculationResults(calculations);
      handleCloseStatusDialog();
      setShowCalculationDialog(true);
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

            <Stack spacing={2}>
              <Typography variant="subtitle2">
                {t('pechatPanel.colorMeasurements.title')}
              </Typography>
              {availableColors.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  No color data found in stanok materials storage for {selectedMachineId || 'this machine'}.
                </Typography>
              ) : (
                availableColors.map((color, colorIndex) => {
                  const measurements = colorMeasurements.get(color.id) || [0, 0, 0, 0];
                  return (
                    <Stack key={color.id} spacing={1}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {colorIndex + 1}-{color.colorName}:
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          {color.seriya && `Seriya: ${color.seriya}`}
                          {color.marka && ` | Marka: ${color.marka}`}
                          {color.amount && ` | Ishlatilgan: ${color.amount} ${color.unit}`}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'grid', 
                        gap: 2, 
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                        mt: 1
                      }}>
                        {[
                          { label: t('pechatPanel.colorMeasurements.liquidPaintUsed'), short: 'Suyuq (ish.)' },
                          { label: t('pechatPanel.colorMeasurements.thickPaintUsed'), short: 'Quyuq (ish.)' },
                          { label: t('pechatPanel.colorMeasurements.thinner'), short: 'Razvaritel' },
                          { label: t('pechatPanel.colorMeasurements.liquidPaintRemaining'), short: 'Qolgan' }
                        ].map((item, measureIndex) => (
                          <Box key={measureIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ minWidth: '80px', fontSize: '0.75rem' }}>
                              {item.short}:
                            </Typography>
                            <TextField
                              placeholder="0"
                              type="number"
                              size="small"
                              value={measurements[measureIndex] || ''}
                              onChange={(event) => updateColorMeasurement(color.id, measureIndex, event.target.value)}
                              inputProps={{ min: 0, step: 'any' }}
                              sx={{ 
                                flex: 1,
                                '& .MuiInputBase-input': { 
                                  textAlign: 'center',
                                  padding: '6px 8px'
                                },
                                '& .MuiOutlinedInput-root': {
                                  height: '32px'
                                }
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Stack>
                  );
                })
              )}
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">
                {t('pechatPanel.totalProduction.title')}
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gap: 2, 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }
              }}>
                <TextField
                  label={t('pechatPanel.totalProduction.meters')}
                  type="number"
                  value={totalMeters}
                  onChange={(event) => setTotalMeters(event.target.value)}
                  inputProps={{ min: 0, step: 'any' }}
                  size="small"
                />
                <TextField
                  label={t('pechatPanel.totalProduction.kg')}
                  type="number"
                  value={totalKg}
                  onChange={(event) => setTotalKg(event.target.value)}
                  inputProps={{ min: 0, step: 'any' }}
                  size="small"
                />
              </Box>
            </Stack>

            {statusValue === 'finished' && (
              <Stack spacing={2} sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                  Yuborish (Dispatch)
                </Typography>
                
                <FormControl fullWidth size="small">
                  <InputLabel>Qayerga yuborish?</InputLabel>
                  <Select
                    value={dispatchDestination}
                    label="Qayerga yuborish?"
                    onChange={(event) => {
                      setDispatchDestination(event.target.value as any);
                      setSelectedBrigadaForDispatch(''); // Reset brigada when destination changes
                    }}
                  >
                    <MenuItem value="">Tanlang...</MenuItem>
                    <MenuItem value="laminatsiya">Laminatsiya</MenuItem>
                    <MenuItem value="reska">Reska</MenuItem>
                    <MenuItem value="angren">Angren ombori</MenuItem>
                  </Select>
                </FormControl>

                {(dispatchDestination === 'laminatsiya' || dispatchDestination === 'reska') && (
                  <FormControl fullWidth size="small">
                    <InputLabel>Brigada tanlang</InputLabel>
                    <Select
                      value={selectedBrigadaForDispatch}
                      label="Brigada tanlang"
                      onChange={(event) => setSelectedBrigadaForDispatch(event.target.value)}
                    >
                      <MenuItem value="">Brigadani tanlang...</MenuItem>
                      {/* TODO: Load brigadas for selected machine type */}
                      <MenuItem value="brigada-1">Brigada 1</MenuItem>
                      <MenuItem value="brigada-2">Brigada 2</MenuItem>
                      <MenuItem value="brigada-3">Brigada 3</MenuItem>
                    </Select>
                  </FormControl>
                )}
                
                {dispatchDestination && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {dispatchDestination === 'angren' 
                      ? 'Mahsulot Angren omboriga yuboriladi'
                      : `Mahsulot ${dispatchDestination} bo'limiga yuboriladi`
                    }
                    {selectedBrigadaForDispatch && ` (${selectedBrigadaForDispatch})`}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>{t('orderPlanPage.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveStatus} disabled={hasUsageErrors}>
            {t('orderPlanPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Calculation Results Dialog */}
      <Dialog 
        open={showCalculationDialog} 
        onClose={() => setShowCalculationDialog(false)} 
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle>Material xarajatlari hisobi</DialogTitle>
        <DialogContent dividers>
          {calculationResults && (
            <Stack spacing={3}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Quyidagi formulalar asosida hisoblangan:
              </Typography>
              
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Suyuq kraska: (Ishlatilgan × 0.67) + Quyuq - (Qolgan × 0.67)
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Razvaritel: (Ishlatilgan × 0.33) + Razvaritel - (Qolgan × 0.33)
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rang</TableCell>
                      <TableCell align="right">Suyuq kraska (kg)</TableCell>
                      <TableCell align="right">Razvaritel (l)</TableCell>
                      <TableCell align="right">Xarajat</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculationResults.colorResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {result.colorName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {result.suyuqUsed.toFixed(2)} kg
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {result.razvaritelUsed.toFixed(2)} l
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {result.totalCost.toFixed(2)} USD
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'background.neutral' }}>
                      <TableCell colSpan={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Jami xarajat:
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {calculationResults.totalCost.toFixed(2)} USD
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ 
                p: 2, 
                border: 1, 
                borderColor: 'success.main', 
                borderRadius: 1,
                bgcolor: 'success.lighter'
              }}>
                <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 'medium' }}>
                  ✅ Hisob-kitob muvaffaqiyatli saqlandi va material xarajatlari bazaga qo&apos;shildi.
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCalculationDialog(false)} variant="contained">
            Yopish
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

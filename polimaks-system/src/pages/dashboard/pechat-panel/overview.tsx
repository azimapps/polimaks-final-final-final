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
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
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
  formulaDetails?: FormulaDetail[];
  totalMeters?: number;
  totalKg?: number;
  completedAt?: string;
};

type FormulaDetail = {
  colorId: string;
  colorName: string;
  seriya?: string;
  marka?: string;
  measurements: {
    ishlatilganSuyuq: number;
    quyuqKraska: number;
    razvaritel: number;
    qolganSuyuq: number;
    qolganMahsulot: number;
  };
  formulas: {
    quyuqKraska: FormulaCalculation;
    razvaritel: FormulaCalculation;
  };
};

type FormulaCalculation = {
  formula: string;
  calculation: string;
  step1: number;
  step2: number;
  step3: number;
  result: number;
};

type MaterialUsage = {
  materialId: string;
  materialLabel: string;
  itemLabel: string;
  amount: number;
  unitLabel: string;
  note?: string;
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
  type: 'in' | 'out' | 'return';
  machineType?: string;
  machineId?: string;
  orderId?: string;
  source?: string;
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
  const [materialUsage, setMaterialUsage] = useState<Map<string, number>>(new Map());
  const [availableSuyuqKraska, setAvailableSuyuqKraska] = useState<any[]>([]);
  const [availableKraska, setAvailableKraska] = useState<any[]>([]);
  const [availableRazvaritelAralashmasi, setAvailableRazvaritelAralashmasi] = useState<any[]>([]);
  const [totalMeters, setTotalMeters] = useState('');
  const [totalKg, setTotalKg] = useState('');
  const [dispatchDestination, setDispatchDestination] = useState<'laminatsiya' | 'reska' | 'angren' | ''>('');
  const [selectedBrigadaForDispatch, setSelectedBrigadaForDispatch] = useState('');
  


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

  // Load available materials for dropdowns
  const loadAvailableMaterials = (plan?: PlanItem) => {
    const planMachineId = plan?.machineId || selectedMachineId;
    const planOrderId = plan?.orderId;
    
    console.log('Loading materials for:', { planMachineId, planOrderId });
    
    if (!planMachineId) return;

    // Load suyuq kraska from transactions
    const suyuqKraskaItems = new Map();
    const suyuqKraskaData = readLocalArray('ombor-suyuq-kraska', []);
    suyuqKraskaData.forEach((item: any) => {
      if (item?.id) suyuqKraskaItems.set(item.id, item);
    });
    
    const suyuqKraskaTxs = readLocalArray('ombor-suyuq-kraska-transactions', []);
    console.log('Suyuq kraska transactions:', suyuqKraskaTxs);
    const availableSuyuq = suyuqKraskaTxs
      .filter((tx: any) => 
        ['out'].includes(tx.type) && 
        tx.machineType === 'pechat' && 
        tx.machineId === planMachineId &&
        (!planOrderId || tx.orderId === planOrderId)
      )
      .map((tx: any) => {
        const item = suyuqKraskaItems.get(tx.suyuqKraskaId);
        return {
          ...item,
          txId: tx.id,
          amount: tx.amountKg,
          type: tx.type
        };
      })
      .filter((item: any) => item && item.id);

    // Load kraska from transactions  
    const kraskaItems = new Map();
    const kraskaData = readLocalArray('ombor-kraska', []);
    kraskaData.forEach((item: any) => {
      if (item?.id) kraskaItems.set(item.id, item);
    });
    
    const kraskaTxs = readLocalArray('ombor-kraska-transactions', []);
    console.log('Kraska transactions:', kraskaTxs);
    const availableKraskaList = kraskaTxs
      .filter((tx: any) => 
        ['out', 'return'].includes(tx.type) && 
        tx.machineType === 'pechat' && 
        tx.machineId === planMachineId &&
        (!planOrderId || tx.orderId === planOrderId)
      )
      .map((tx: any) => {
        const item = kraskaItems.get(tx.kraskaId);
        return {
          ...item,
          txId: tx.id,
          amount: tx.amountKg,
          type: tx.type
        };
      })
      .filter((item: any) => item && item.id);

    // Load razvaritel aralashmasi from transactions
    const mixtureItems = new Map();
    const mixtureData = readLocalArray('ombor-razvaritel-mixtures', []);
    console.log('Mixture items:', mixtureData);
    mixtureData.forEach((item: any) => {
      if (item?.id) mixtureItems.set(item.id, item);
    });
    
    const mixtureTxs = readLocalArray('ombor-mixture-transactions', []);
    console.log('Mixture transactions:', mixtureTxs);
    const availableMixtures = mixtureTxs
      .filter((tx: any) => 
        ['out'].includes(tx.type) && 
        tx.machineType === 'pechat' && 
        tx.machineId === planMachineId &&
        (!planOrderId || tx.orderId === planOrderId)
      )
      .map((tx: any) => {
        const item = mixtureItems.get(tx.mixtureId);
        console.log('Mapping transaction to item:', tx, item);
        return {
          ...item,
          txId: tx.id,
          amount: tx.amountLiter,
          type: tx.type
        };
      })
      .filter((item: any) => item && item.id);

    console.log('Final results:', { availableSuyuq, availableKraskaList, availableMixtures });

    setAvailableSuyuqKraska(availableSuyuq);
    setAvailableKraska(availableKraskaList);
    setAvailableRazvaritelAralashmasi(availableMixtures);

  };

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
    // Load available materials from transactions
    loadAvailableMaterials(plan);
    
    // Initialize total values
    setTotalMeters(plan.totalMeters?.toString() || '');
    setTotalKg(plan.totalKg?.toString() || '');
    
    // Reset selections
    setMaterialUsage(new Map());
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
        materialUsage: Object.fromEntries(materialUsage),
        materialValues: Array.from(materialUsage.keys()),
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
            materialUsage: Object.fromEntries(materialUsage)
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

    const updatedPlans = plans.map((plan) =>
      plan.id === statusPlan.id
        ? { 
            ...plan, 
            status: statusValue,
            materialUsage: Object.fromEntries(materialUsage),
            totalMeters: parseFloat(totalMeters) || 0,
            totalKg: parseFloat(totalKg) || 0,
            completedAt: statusValue === 'finished' ? new Date().toISOString() : plan.completedAt
          }
        : plan
    );
    persistPlans(updatedPlans);
    
    // Handle dispatch if status is finished and destination is selected
    if (statusValue === 'finished' && dispatchDestination) {
      handleDispatchProduct(statusPlan);
    }
    
    handleCloseStatusDialog();
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
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('pechatPanel.materialSelection.title')}
              </Typography>
              
              {/* Top Section: Kraska and Razvaritel */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* Kraska */}
                {availableKraska.length > 0 && (
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                      {t('pechatPanel.materialSelection.kraskaTitle')}
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: 1 
                    }}>
                      {availableKraska.map((item) => (
                        <Box key={item.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box 
                              sx={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: '50%', 
                                backgroundColor: item.colorCode || '#cccccc',
                                border: '1px solid #ddd',
                                flexShrink: 0
                              }} 
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500, display: 'block' }} noWrap>
                                {item.seriyaNumber || item.id} - {item.colorName || t('razvaritelTransactionsPage.unknown')}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'primary.main' }}>
                                {t('pechatPanel.materialSelection.available')}: {item.amount}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Razvaritel Aralashmasi */}
                {availableRazvaritelAralashmasi.length > 0 && (
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                      {t('pechatPanel.materialSelection.razvaritelAralashmasiTitle')}
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: 1 
                    }}>
                      {availableRazvaritelAralashmasi.map((item) => (
                        <Box key={item.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500, display: 'block' }} noWrap>
                                {item.name || item.id}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'primary.main' }}>
                                {t('pechatPanel.materialSelection.available')}: {item.amount}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Divider */}
              {availableSuyuqKraska.length > 0 && (availableKraska.length > 0 || availableRazvaritelAralashmasi.length > 0) && (
                <Divider sx={{ my: 1 }} />
              )}

              {/* Suyuq Kraska Section with 4 Fields */}
              {availableSuyuqKraska.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
                    {t('pechatPanel.materialSelection.suyuqKraskaTitle')}
                  </Typography>
                  <Stack spacing={2}>
                    {availableSuyuqKraska.map((item) => (
                      <Box key={item.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        {/* Header with color and name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Box 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: '50%', 
                              backgroundColor: item.colorCode || '#cccccc',
                              border: '1px solid #ddd',
                              flexShrink: 0
                            }} 
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                            {item.seriyaNumber || item.id} - {item.colorName || t('razvaritelTransactionsPage.unknown')}
                          </Typography>
                          <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: 'primary.main', display: 'block' }}>
                              {t('pechatPanel.materialSelection.available')}: {item.amount}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: (() => {
                                const totalUsed = (materialUsage.get(`suyuq-used:${item.id}`) || 0) + 
                                                 (materialUsage.get(`leftover:${item.id}`) || 0);
                                return totalUsed > (item.amount || 0) ? 'error.main' : 'text.secondary';
                              })(),
                              display: 'block'
                            }}>
                              Used: {((materialUsage.get(`suyuq-used:${item.id}`) || 0) + 
                                     (materialUsage.get(`leftover:${item.id}`) || 0)).toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* 2x2 Grid of Fields */}
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: 1.5 
                        }}>
                          <TextField
                            label="Suyuq (ish)"
                            size="small"
                            type="number"
                            placeholder="0"
                            value={materialUsage.get(`suyuq-used:${item.id}`) || ''}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              const leftover = (materialUsage.get(`leftover:${item.id}`) || 0);
                              if (newValue + leftover <= (item.amount || 0)) {
                                setMaterialUsage(prev => new Map(prev.set(`suyuq-used:${item.id}`, newValue)));
                              }
                            }}
                            inputProps={{ min: 0, step: 0.1 }}
                            error={(() => {
                              const totalUsed = (materialUsage.get(`suyuq-used:${item.id}`) || 0) + 
                                               (materialUsage.get(`leftover:${item.id}`) || 0);
                              return totalUsed > (item.amount || 0);
                            })()}
                            sx={{ 
                              '& .MuiInputBase-input': { 
                                textAlign: 'center', 
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                          <TextField
                            label="Kraska"
                            size="small"
                            type="number"
                            placeholder="0"
                            value={materialUsage.get(`quyuq-used:${item.id}`) || ''}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              setMaterialUsage(prev => new Map(prev.set(`quyuq-used:${item.id}`, newValue)));
                            }}
                            inputProps={{ min: 0, step: 0.1 }}
                            sx={{ 
                              '& .MuiInputBase-input': { 
                                textAlign: 'center', 
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                          <TextField
                            label="Razvaritel Aralashmasi"
                            size="small"
                            type="number"
                            placeholder="0"
                            value={materialUsage.get(`razvaritel-used:${item.id}`) || ''}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              setMaterialUsage(prev => new Map(prev.set(`razvaritel-used:${item.id}`, newValue)));
                            }}
                            inputProps={{ min: 0, step: 0.1 }}
                            sx={{ 
                              '& .MuiInputBase-input': { 
                                textAlign: 'center', 
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                          <TextField
                            label="Qolgan"
                            size="small"
                            type="number"
                            placeholder="0"
                            value={materialUsage.get(`leftover:${item.id}`) || ''}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              const suyuqUsed = (materialUsage.get(`suyuq-used:${item.id}`) || 0);
                              if (newValue + suyuqUsed <= (item.amount || 0)) {
                                setMaterialUsage(prev => new Map(prev.set(`leftover:${item.id}`, newValue)));
                              }
                            }}
                            inputProps={{ min: 0, step: 0.1 }}
                            error={(() => {
                              const totalUsed = (materialUsage.get(`suyuq-used:${item.id}`) || 0) + 
                                               (materialUsage.get(`leftover:${item.id}`) || 0);
                              return totalUsed > (item.amount || 0);
                            })()}
                            sx={{ 
                              '& .MuiInputBase-input': { 
                                textAlign: 'center', 
                                fontSize: '0.875rem'
                              }
                            }}
                          />
                        </Box>
                        
                        {/* Calculation Results */}
                        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main' }}>
                            {t('pechatPanel.materialSelection.calculations')}
                          </Typography>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            {/* Color Usage Calculation */}
                            <Box sx={{ 
                              p: 1.5, 
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', 
                              borderRadius: 1, 
                              border: (theme) => `1px solid ${theme.palette.divider}` 
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                  {t('pechatPanel.materialSelection.colorUsed')}:
                                </Typography>
                                <Tooltip 
                                  title={
                                    <Box sx={{ p: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {t('pechatPanel.materialSelection.formula')}:
                                      </Typography>
                                      <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
                                        Suyuq kraska × 0.67 + Kraska - Qolgan × 0.67
                                      </Typography>
                                      
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {t('pechatPanel.materialSelection.calculation')}:
                                      </Typography>
                                      <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                        {(() => {
                                          const suyuqUsed = materialUsage.get(`suyuq-used:${item.id}`) || 0;
                                          const quyuqUsed = materialUsage.get(`quyuq-used:${item.id}`) || 0;
                                          const leftover = materialUsage.get(`leftover:${item.id}`) || 0;
                                          const step1 = (suyuqUsed * 0.67).toFixed(2);
                                          const step2 = (leftover * 0.67).toFixed(2);
                                          const result = ((suyuqUsed * 0.67) + quyuqUsed - (leftover * 0.67)).toFixed(2);
                                          return (
                                            <>
                                              <Typography variant="body2">{suyuqUsed} × 0.67 + {quyuqUsed} - {leftover} × 0.67</Typography>
                                              <Typography variant="body2">= {step1} + {quyuqUsed} - {step2}</Typography>
                                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>= {result}</Typography>
                                            </>
                                          );
                                        })()}
                                      </Box>
                                    </Box>
                                  }
                                  arrow
                                  placement="top"
                                >
                                  <Iconify 
                                    icon="eva:info-outline" 
                                    width={16} 
                                    sx={{ color: 'text.secondary', cursor: 'help' }} 
                                  />
                                </Tooltip>
                              </Box>
                              <Typography variant="h6" sx={{ 
                                color: (theme) => theme.palette.mode === 'dark' ? 'success.light' : 'success.dark',
                                fontWeight: 'bold'
                              }}>
                                {(() => {
                                  const suyuqUsed = materialUsage.get(`suyuq-used:${item.id}`) || 0;
                                  const quyuqUsed = materialUsage.get(`quyuq-used:${item.id}`) || 0;
                                  const leftover = materialUsage.get(`leftover:${item.id}`) || 0;
                                  return ((suyuqUsed * 0.67) + quyuqUsed - (leftover * 0.67)).toFixed(2);
                                })()}
                              </Typography>
                            </Box>
                            
                            {/* Razvaritel Usage Calculation */}
                            <Box sx={{ 
                              p: 1.5, 
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', 
                              borderRadius: 1, 
                              border: (theme) => `1px solid ${theme.palette.divider}` 
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                  {t('pechatPanel.materialSelection.razvaritelUsed')}:
                                </Typography>
                                <Tooltip 
                                  title={
                                    <Box sx={{ p: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {t('pechatPanel.materialSelection.formula')}:
                                      </Typography>
                                      <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
                                        Suyuq kraska × 0.33 + Razvaritel Aralashmasi - Qolgan × 0.33
                                      </Typography>
                                      
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {t('pechatPanel.materialSelection.calculation')}:
                                      </Typography>
                                      <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                        {(() => {
                                          const suyuqUsed = materialUsage.get(`suyuq-used:${item.id}`) || 0;
                                          const razvaritelUsed = materialUsage.get(`razvaritel-used:${item.id}`) || 0;
                                          const leftover = materialUsage.get(`leftover:${item.id}`) || 0;
                                          const step1 = (suyuqUsed * 0.33).toFixed(2);
                                          const step2 = (leftover * 0.33).toFixed(2);
                                          const result = ((suyuqUsed * 0.33) + razvaritelUsed - (leftover * 0.33)).toFixed(2);
                                          return (
                                            <>
                                              <Typography variant="body2">{suyuqUsed} × 0.33 + {razvaritelUsed} - {leftover} × 0.33</Typography>
                                              <Typography variant="body2">= {step1} + {razvaritelUsed} - {step2}</Typography>
                                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>= {result}</Typography>
                                            </>
                                          );
                                        })()}
                                      </Box>
                                    </Box>
                                  }
                                  arrow
                                  placement="top"
                                >
                                  <Iconify 
                                    icon="eva:info-outline" 
                                    width={16} 
                                    sx={{ color: 'text.secondary', cursor: 'help' }} 
                                  />
                                </Tooltip>
                              </Box>
                              <Typography variant="h6" sx={{ 
                                color: (theme) => theme.palette.mode === 'dark' ? 'info.light' : 'info.dark',
                                fontWeight: 'bold'
                              }}>
                                {(() => {
                                  const suyuqUsed = materialUsage.get(`suyuq-used:${item.id}`) || 0;
                                  const razvaritelUsed = materialUsage.get(`razvaritel-used:${item.id}`) || 0;
                                  const leftover = materialUsage.get(`leftover:${item.id}`) || 0;
                                  return ((suyuqUsed * 0.33) + razvaritelUsed - (leftover * 0.33)).toFixed(2);
                                })()}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* No Materials Message */}
              {availableSuyuqKraska.length === 0 && availableKraska.length === 0 && availableRazvaritelAralashmasi.length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                  {t('pechatPanel.materialSelection.noSuyuqKraska')}
                </Typography>
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
          <Button variant="contained" onClick={handleSaveStatus}>
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

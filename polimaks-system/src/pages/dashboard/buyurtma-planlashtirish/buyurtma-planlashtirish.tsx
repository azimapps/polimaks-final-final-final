/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
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

import { Iconify } from 'src/components/iconify';

import brigadaPechatSeed from 'src/data/stanok-brigada-pechat.json';
import brigadaReskaSeed from 'src/data/stanok-brigada-reska.json';
import brigadaLaminatsiyaSeed from 'src/data/stanok-brigada-laminatsiya.json';
import stanokPechatSeed from 'src/data/stanok-pechat.json';
import stanokReskaSeed from 'src/data/stanok-reska.json';
import stanokLaminatsiyaSeed from 'src/data/stanok-laminatsiya.json';

type Material = 'BOPP' | 'CPP' | 'PE' | 'PET';
type Currency = 'USD' | 'EUR' | 'RUB' | 'UZS';
type MachineType = 'pechat' | 'reska' | 'laminatsiya';
type Machine = { id: string; name: string };
type SortOption = 'default' | 'cylinderAsc' | 'cylinderDesc';
type PlanStatus = 'in_progress' | 'finished';

type MaterialUsage = {
  materialId: string;
  materialLabel: string;
  itemLabel: string;
  amount: number;
  unitLabel: string;
  note?: string;
};

type OrderBookItem = {
  id: string;
  date: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  title: string;
  quantityKg: number;
  material: Material;
  subMaterial: string;
  filmThickness: number;
  filmWidth: number;
  cylinderLength: number;
  cylinderCount: number;
  cylinderAylanasi?: number;
  pricePerKg?: number;
  priceCurrency?: Currency;
  admin?: string;
  startDate: string;
  endDate: string;
  numberOfColors?: number;
};

type BrigadaGroup = {
  id: string;
  name: string;
  leader?: string;
};

type PlanItem = {
  id: string;
  orderId: string;
  orderNumber: string;
  clientName: string;
  title: string;
  quantityKg: number;
  material: Material | '';
  subMaterial?: string;
  machineType: MachineType;
  groupId: string;
  groupName: string;
  machineId: string;
  machineName: string;
  orderDate?: string;
  startDate: string;
  endDate: string;
  status: PlanStatus;
  filmThickness?: number;
  filmWidth?: number;
  cylinderLength?: number;
  cylinderCount?: number;
  cylinderAylanasi?: number;
  pricePerKg?: number;
  priceCurrency?: Currency;
  admin?: string;
  note: string;
  materialsUsed?: MaterialUsage[];
  numberOfColors?: number;
};

type FormState = {
  id?: string;
  orderId: string;
  machineType: MachineType | '';
  groupId: string;
  machineId: string;
  startDate: string;
  endDate: string;
  status: PlanStatus;
  note: string;
};

const ORDER_BOOK_STORAGE_KEY = 'clients-order-book';
const PLAN_STORAGE_KEY = 'orderPlansV2';
const LEGACY_PLAN_STORAGE_KEY = 'orderPlans';

const BRIGADA_STORAGE_KEYS: Record<MachineType, string> = {
  pechat: 'stanok-brigada-pechat',
  reska: 'stanok-brigada-reska',
  laminatsiya: 'stanok-brigada-laminatsiya',
};

const MACHINE_STORAGE_KEYS: Record<MachineType, string> = {
  pechat: 'stanok-pechat',
  reska: 'stanok-reska',
  laminatsiya: 'stanok-laminatsiya',
};

const MACHINE_OPTIONS: { value: MachineType; label: string }[] = [
  { value: 'pechat', label: 'Pechat' },
  { value: 'reska', label: 'Reska' },
  { value: 'laminatsiya', label: 'Laminatsiya' },
];

const STATUS_OPTIONS: { value: PlanStatus; labelKey: string }[] = [
  { value: 'in_progress', labelKey: 'orderPlanPage.status.inProgress' },
  { value: 'finished', labelKey: 'orderPlanPage.status.finished' },
];

const ORDER_BOOK_SEED: OrderBookItem[] = [
  {
    id: 'order-1',
    date: '2024-12-01',
    orderNumber: 'ORD-2024-001',
    clientId: 'client-1',
    clientName: 'PoliTex Group',
    title: 'Упаковочная пленка BOPP',
    quantityKg: 1500,
    material: 'BOPP',
    subMaterial: 'prazrachniy',
    filmThickness: 20,
    filmWidth: 1000,
    cylinderLength: 320,
    cylinderCount: 8,
    cylinderAylanasi: 200,
    pricePerKg: 3.2,
    priceCurrency: 'USD',
    admin: 'Nodir',
    startDate: '2024-12-05',
    endDate: '2024-12-15',
    numberOfColors: 3,
  },
  {
    id: 'order-2',
    date: '2024-12-02',
    orderNumber: 'ORD-2024-002',
    clientId: 'client-2',
    clientName: 'GreenPack LLC',
    title: 'Прозрачная пленка CPP',
    quantityKg: 800,
    material: 'CPP',
    subMaterial: 'beliy',
    filmThickness: 25,
    filmWidth: 800,
    cylinderLength: 280,
    cylinderCount: 6,
    cylinderAylanasi: 180,
    pricePerKg: 28500,
    priceCurrency: 'UZS',
    admin: 'Dilshod',
    startDate: '2024-12-10',
    endDate: '2024-12-20',
    numberOfColors: 2,
  },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatPrice = (value?: number, currency?: Currency) => {
  if (!value || value <= 0) return '—';
  const formatter = new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : currency === 'EUR' ? 'EUR' : 'UZS',
    maximumFractionDigits: currency === 'USD' || currency === 'EUR' ? 2 : 0,
  });
  return formatter.format(value);
};

const normalizeOrderBookItem = (item: Partial<OrderBookItem>, index: number): OrderBookItem => ({
  id: item.id || `order-${index}`,
  date: item.date || todayISO(),
  orderNumber: item.orderNumber || `ORD-${Date.now()}`,
  clientId: item.clientId || '',
  clientName: item.clientName || '',
  title: item.title || '',
  quantityKg: typeof item.quantityKg === 'number' ? item.quantityKg : Number(item.quantityKg) || 0,
  material: (item.material as Material) || 'BOPP',
  subMaterial: item.subMaterial || '',
  filmThickness:
    typeof item.filmThickness === 'number' ? item.filmThickness : Number(item.filmThickness) || 0,
  filmWidth: typeof item.filmWidth === 'number' ? item.filmWidth : Number(item.filmWidth) || 0,
  cylinderLength:
    typeof item.cylinderLength === 'number'
      ? item.cylinderLength
      : Number(item.cylinderLength) || 0,
  cylinderCount:
    typeof item.cylinderCount === 'number' ? item.cylinderCount : Number(item.cylinderCount) || 0,
  cylinderAylanasi:
    typeof item.cylinderAylanasi === 'number'
      ? item.cylinderAylanasi
      : Number(item.cylinderAylanasi) || 0,
  pricePerKg:
    typeof item.pricePerKg === 'number' ? item.pricePerKg : Number(item.pricePerKg) || 0,
  priceCurrency: (item.priceCurrency as Currency) || 'UZS',
  admin: item.admin || '',
  startDate: item.startDate || item.date || todayISO(),
  endDate: item.endDate || item.date || todayISO(),
  numberOfColors: typeof item.numberOfColors === 'number' ? item.numberOfColors : Number(item.numberOfColors) || 1,
});

const resolvePlanStatus = (status?: string): PlanStatus => {
  if (status === 'finished' || status === 'completed') return 'finished';
  return 'in_progress';
};

const normalizePlanItem = (raw: any, index: number): PlanItem => ({
  id: raw?.id || `plan-${index}`,
  orderId: raw?.orderId || '',
  orderNumber: raw?.orderNumber || '',
  clientName: raw?.clientName || raw?.client || '',
  title: raw?.title || '',
  quantityKg: Number(raw?.quantityKg) || 0,
  material: raw?.material || '',
  subMaterial: raw?.subMaterial || '',
  machineType: (raw?.machineType as MachineType) || 'pechat',
  machineId: raw?.machineId || '',
  machineName: raw?.machineName || '',
  groupId: raw?.groupId || '',
  groupName: raw?.groupName || raw?.printingMachine || '',
  orderDate: raw?.orderDate || raw?.date || '',
  startDate: raw?.startDate || raw?.date || todayISO(),
  endDate: raw?.endDate || raw?.date || todayISO(),
  status: resolvePlanStatus(raw?.status),
  filmThickness: Number(raw?.filmThickness) || 0,
  filmWidth: Number(raw?.filmWidth) || 0,
  cylinderLength: Number(raw?.cylinderLength) || 0,
  cylinderCount: Number(raw?.cylinderCount) || 0,
  cylinderAylanasi: Number(raw?.cylinderAylanasi) || 0,
  pricePerKg: Number(raw?.pricePerKg) || 0,
  priceCurrency: (raw?.priceCurrency as Currency) || 'UZS',
  admin: raw?.admin || '',
  note: raw?.note ?? raw?.notes ?? '',
  materialsUsed: Array.isArray(raw?.materialsUsed) ? raw.materialsUsed : [],
});

const normalizeBrigadaGroup = (raw: any, index: number): BrigadaGroup => ({
  id: raw?.id || `group-${index}`,
  name: raw?.name || `Group ${index + 1}`,
  leader: raw?.leader || raw?.people?.[0]?.workerId || raw?.people?.[0]?.name,
});

const loadOrderBookItems = (): OrderBookItem[] => {
  if (typeof window === 'undefined') {
    return ORDER_BOOK_SEED.map((item, idx) => normalizeOrderBookItem(item, idx));
  }
  try {
    const stored = localStorage.getItem(ORDER_BOOK_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as OrderBookItem[];
      const normalized = parsed.map((item, idx) => normalizeOrderBookItem(item, idx));
      if (normalized.length) return normalized;
    }
  } catch {
    // ignore parsing errors
  }
  return ORDER_BOOK_SEED.map((item, idx) => normalizeOrderBookItem(item, idx));
};

const loadPlans = (): PlanItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PLAN_STORAGE_KEY);
    if (stored) {
      return (JSON.parse(stored) as any[]).map((item, idx) => normalizePlanItem(item, idx));
    }
    const legacy = localStorage.getItem(LEGACY_PLAN_STORAGE_KEY);
    if (legacy) {
      const converted = (JSON.parse(legacy) as any[]).map((item, idx) =>
        normalizePlanItem(item, idx)
      );
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(converted));
      return converted;
    }
  } catch {
    // ignore parse issues
  }
  return [];
};

const loadBrigadaGroups = (machineType: MachineType, machineId?: string): BrigadaGroup[] => {
  if (typeof window !== 'undefined') {
    try {
      const baseKey = BRIGADA_STORAGE_KEYS[machineType];
      const keysToTry = machineId ? [`${baseKey}-${machineId}`, baseKey] : [baseKey];
      for (const key of keysToTry) {
        const stored = localStorage.getItem(key);
        if (!stored) continue;
        const parsed = JSON.parse(stored) as any[];
        const normalized = parsed.map((item, idx) => normalizeBrigadaGroup(item, idx));
        if (normalized.length) return normalized;
      }
    } catch {
      // ignore parsing errors
    }
  }

  const seedMap: Record<MachineType, any[]> = {
    pechat: brigadaPechatSeed as any[],
    reska: brigadaReskaSeed as any[],
    laminatsiya: brigadaLaminatsiyaSeed as any[],
  };
  return seedMap[machineType].map((item, idx) => normalizeBrigadaGroup(item, idx));
};

const loadMachines = (machineType: MachineType): Machine[] => {
  const seedMap: Record<MachineType, any[]> = {
    pechat: stanokPechatSeed as any[],
    reska: stanokReskaSeed as any[],
    laminatsiya: stanokLaminatsiyaSeed as any[],
  };

  const resolveSeed = (): Machine[] =>
    seedMap[machineType].map((item, idx) => ({
      id: item?.id || `machine-${idx}`,
      name: item?.name || `Machine ${idx + 1}`,
    }));

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(MACHINE_STORAGE_KEYS[machineType]);
      if (stored) {
        const parsed = JSON.parse(stored) as any[];
        const normalized = parsed.map((item, idx) => ({
          id: item?.id || `machine-${idx}`,
          name: item?.name || `Machine ${idx + 1}`,
        }));
        if (normalized.length) return normalized;
      }
    } catch {
      // ignore parse errors
    }
  }

  return resolveSeed();
};

const defaultFormState: FormState = {
  orderId: '',
  machineType: '',
  groupId: '',
  machineId: '',
  startDate: todayISO(),
  endDate: todayISO(),
  status: 'in_progress',
  note: '',
};

// ----------------------------------------------------------------------

export default function BuyurtmaPlanlashtirish() {
  const { t } = useTranslate('pages');

  const [plans, setPlans] = useState<PlanItem[]>(() => loadPlans());
  const [orders, setOrders] = useState<OrderBookItem[]>(() => loadOrderBookItems());
  const [selectedOrder, setSelectedOrder] = useState<OrderBookItem | null>(null);
  const [availableGroups, setAvailableGroups] = useState<BrigadaGroup[]>([]);
  const [availableMachines, setAvailableMachines] = useState<Machine[]>([]);

  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [activePlan, setActivePlan] = useState<PlanItem | null>(null);
  const editDialog = useBoolean();
  const detailDialog = useBoolean();
  const [detailPlan, setDetailPlan] = useState<PlanItem | null>(null);

  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [sortOption, setSortOption] = useState<SortOption>('default');

  const title = `${t('buyurtmaPlanlashtirish.title')} | ${CONFIG.appName}`;

  const persistPlans = (next: PlanItem[]) => {
    setPlans(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, plan: PlanItem) => {
    setMenuAnchorEl(event.currentTarget);
    setActivePlan(plan);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setActivePlan(null);
  };

  const handleEdit = () => {
    if (activePlan) {
      const orderFromBook =
        orders.find((item) => item.id === activePlan.orderId) ||
        orders.find((item) => item.orderNumber === activePlan.orderNumber) ||
        null;
      setSelectedOrder(orderFromBook);
      setAvailableGroups(loadBrigadaGroups(activePlan.machineType, activePlan.machineId));
      setAvailableMachines(loadMachines(activePlan.machineType));
      setFormData({
        id: activePlan.id,
        orderId: orderFromBook?.id || activePlan.orderId,
        machineType: activePlan.machineType,
        machineId: activePlan.machineId,
        groupId: activePlan.groupId,
        startDate: activePlan.startDate,
        endDate: activePlan.endDate,
        status: activePlan.status || 'in_progress',
        note: activePlan.note,
      });
      editDialog.onTrue();
    }
    handleCloseMenu();
  };

  const handleViewDetails = (plan: PlanItem) => {
    setDetailPlan(plan);
    detailDialog.onTrue();
  };

  const handleDelete = () => {
    if (activePlan) {
      const updated = plans.filter((plan) => plan.id !== activePlan.id);
      persistPlans(updated);
    }
    handleCloseMenu();
  };

  const handleAdd = () => {
    setFormData(defaultFormState);
    setSelectedOrder(null);
    setAvailableGroups([]);
    setAvailableMachines([]);
    editDialog.onTrue();
  };

  const handleSave = () => {
    if (!selectedOrder || !formData.machineType || !formData.groupId || !formData.machineId) {
      return;
    }

    const existingPlan = formData.id ? plans.find((plan) => plan.id === formData.id) : null;
    const groupName = availableGroups.find((group) => group.id === formData.groupId)?.name || '';
    const machineName =
      availableMachines.find((machine) => machine.id === formData.machineId)?.name || '';

    const planToSave: PlanItem = {
      id: formData.id || uuidv4(),
      orderId: selectedOrder.id,
      orderNumber: selectedOrder.orderNumber,
      clientName: selectedOrder.clientName,
      title: selectedOrder.title,
      quantityKg: selectedOrder.quantityKg,
      material: selectedOrder.material,
      subMaterial: selectedOrder.subMaterial,
      machineType: formData.machineType,
      machineId: formData.machineId,
      machineName,
      groupId: formData.groupId,
      groupName,
      orderDate: selectedOrder.date,
      startDate: formData.startDate || selectedOrder.startDate || todayISO(),
      endDate: formData.endDate || formData.startDate || selectedOrder.endDate || todayISO(),
      status: formData.status,
      filmThickness: selectedOrder.filmThickness,
      filmWidth: selectedOrder.filmWidth,
      cylinderLength: selectedOrder.cylinderLength,
      cylinderCount: selectedOrder.cylinderCount,
      cylinderAylanasi: selectedOrder.cylinderAylanasi,
      pricePerKg: selectedOrder.pricePerKg,
      priceCurrency: selectedOrder.priceCurrency,
      admin: selectedOrder.admin,
      note: formData.note,
      materialsUsed: existingPlan?.materialsUsed || [],
      numberOfColors: selectedOrder.numberOfColors,
    };

    if (formData.id) {
      const updated = plans.map((plan) => (plan.id === formData.id ? planToSave : plan));
      persistPlans(updated);
    } else {
      persistPlans([...plans, planToSave]);
    }

    editDialog.onFalse();
  };

  const canSubmit =
    !!selectedOrder && !!formData.machineType && !!formData.groupId && !!formData.machineId;
  const sortedPlans = useMemo(() => {
    if (sortOption === 'cylinderAsc' || sortOption === 'cylinderDesc') {
      return plans
        .map((plan, index) => ({ plan, index }))
        .sort((a, b) => {
          const aLen = Number(a.plan.cylinderLength) || 0;
          const bLen = Number(b.plan.cylinderLength) || 0;
          const delta = sortOption === 'cylinderAsc' ? aLen - bLen : bLen - aLen;
          if (delta !== 0) return delta;
          return a.index - b.index;
        })
        .map((item) => item.plan);
    }
    return plans;
  }, [plans, sortOption]);

  const getStatusLabel = (status: PlanStatus) => {
    const entry = STATUS_OPTIONS.find((option) => option.value === status);
    return entry ? t(entry.labelKey) : status;
  };

  const getStatusColor = (status: PlanStatus) =>
    status === 'finished' ? 'success' : 'warning';

  useEffect(() => {
    if (!formData.machineType) {
      setAvailableMachines([]);
      setAvailableGroups([]);
      setFormData((prev) =>
        prev.machineId || prev.groupId ? { ...prev, machineId: '', groupId: '' } : prev
      );
      return;
    }

    const machines = loadMachines(formData.machineType);
    setAvailableMachines(machines);
    setFormData((prev) => {
      if (prev.machineId && machines.some((m) => m.id === prev.machineId)) return prev;
      return { ...prev, machineId: machines[0]?.id || '' };
    });
  }, [formData.machineType]);

  useEffect(() => {
    if (!formData.machineType || !formData.machineId) {
      setAvailableGroups([]);
      setFormData((prev) => (prev.groupId ? { ...prev, groupId: '' } : prev));
      return;
    }
    const groups = loadBrigadaGroups(formData.machineType, formData.machineId);
    setAvailableGroups(groups);
    setFormData((prev) => {
      if (prev.groupId && groups.some((g) => g.id === prev.groupId)) return prev;
      return { ...prev, groupId: groups[0]?.id || '' };
    });
  }, [formData.machineType, formData.machineId]);

  // Ensure Order Book stays in sync with latest localStorage (e.g., if user edits on /clients/order-book)
  useEffect(() => {
    if (typeof window === 'undefined') return () => {};
    const handleStorage = () => setOrders(loadOrderBookItems());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <>
      <title>{title}</title>

      <Container maxWidth={false} sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <div>
            <Typography variant="h3" gutterBottom>
              {t('buyurtmaPlanlashtirish.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('buyurtmaPlanlashtirish.subtitle')}
            </Typography>
          </div>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>{t('orderPlanPage.sortLabel')}</InputLabel>
              <Select
                value={sortOption}
                label={t('orderPlanPage.sortLabel')}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
              >
                <MenuItem value="default">{t('orderPlanPage.sortDefault')}</MenuItem>
                <MenuItem value="cylinderAsc">{t('orderPlanPage.sortCylinderAsc')}</MenuItem>
                <MenuItem value="cylinderDesc">{t('orderPlanPage.sortCylinderDesc')}</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleAdd}
            >
              {t('orderPlanPage.add')}
            </Button>
          </Stack>
        </Stack>

        <Card>
          <TableContainer sx={{ overflow: 'auto' }}>
            <Table size="medium" sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 160, py: 2 }}>{t('orderPlanPage.orderNumber')}</TableCell>
                  <TableCell sx={{ minWidth: 220, py: 2 }}>{t('orderPlanPage.client')}</TableCell>
                  <TableCell sx={{ minWidth: 140, py: 2 }}>Stanok</TableCell>
                  <TableCell sx={{ minWidth: 150, py: 2 }}>Brigada</TableCell>
                  <TableCell sx={{ minWidth: 120, py: 2 }}>Boshlanish</TableCell>
                  <TableCell sx={{ minWidth: 120, py: 2 }}>Yakun</TableCell>
                  <TableCell sx={{ minWidth: 140, py: 2 }}>{t('orderPlanPage.statusLabel')}</TableCell>
                  <TableCell sx={{ minWidth: 200, py: 2 }}>Izoh</TableCell>
                  <TableCell sx={{ minWidth: 80, py: 2 }}>{t('orderPlanPage.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                        {t('orderPlanPage.empty')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedPlans.map((plan) => (
                    <TableRow key={plan.id} hover>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="subtitle2">{plan.orderNumber}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {plan.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2">{plan.clientName}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {plan.quantityKg} {t('orderPlanPage.kg')} · {plan.material}
                          {plan.numberOfColors ? ` · ${plan.numberOfColors} rang${plan.numberOfColors > 1 ? 'lar' : ''}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="subtitle2">
                          {MACHINE_OPTIONS.find((m) => m.value === plan.machineType)?.label || '-'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {plan.machineName || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>{plan.groupName || '-'}</TableCell>
                      <TableCell sx={{ py: 2 }}>{formatDate(plan.startDate)}</TableCell>
                      <TableCell sx={{ py: 2 }}>{formatDate(plan.endDate)}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          size="small"
                          variant="soft"
                          color={getStatusColor(plan.status)}
                          label={getStatusLabel(plan.status)}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: plan.note ? 'text.primary' : 'text.disabled' }}
                        >
                          {plan.note || 'Izoh kiritilmagan'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <IconButton
                          onClick={() => handleViewDetails(plan)}
                          sx={{ mr: 0.5 }}
                          color="primary"
                        >
                          <Iconify icon="solar:info-circle-bold" />
                        </IconButton>
                        <IconButton onClick={(e) => handleOpenMenu(e, plan)}>
                          <Iconify icon="eva:more-vertical-fill" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Actions Menu */}
        <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleCloseMenu}>
          <MenuItem
            onClick={() => {
              if (activePlan) handleViewDetails(activePlan);
              handleCloseMenu();
            }}
          >
            <Iconify icon="solar:eye-bold" sx={{ mr: 1 }} />
            Tafsilotlar
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <Iconify icon="solar:pen-bold" sx={{ mr: 1 }} />
            {t('orderPlanPage.edit')}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
            {t('orderPlanPage.delete')}
          </MenuItem>
        </Menu>

        {/* Add/Edit Dialog */}
        <Dialog open={editDialog.value} onClose={editDialog.onFalse} maxWidth="md" fullWidth>
          <DialogTitle>{formData.id ? t('orderPlanPage.edit') : t('orderPlanPage.add')}</DialogTitle>

          <DialogContent dividers>
            <Stack spacing={3}>
              <Autocomplete
                fullWidth
                options={orders}
                value={selectedOrder}
                onChange={(_e, value) => {
                  setSelectedOrder(value);
                  setFormData((prev) => ({
                    ...prev,
                    orderId: value?.id || '',
                    startDate: value?.startDate || prev.startDate || todayISO(),
                    endDate: value?.endDate || value?.startDate || prev.endDate || todayISO(),
                  }));
                }}
                getOptionLabel={(option) =>
                  `${option.orderNumber} · ${option.clientName} · ${option.title}`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buyurtma (Order Book)"
                    placeholder="ORD-2024-001 · Client · Mahsulot"
                  />
                )}
                noOptionsText="Order Book bo'sh. /clients/order-book ga kirib buyurtma qo'shing."
              />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('orderPlanPage.machineTypeLabel')}</InputLabel>
                    <Select
                      value={formData.machineType || ''}
                      label={t('orderPlanPage.machineTypeLabel')}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          machineType: e.target.value as MachineType,
                          machineId: '',
                        }))
                      }
                    >
                      {MACHINE_OPTIONS.map((machine) => (
                        <MenuItem key={machine.value} value={machine.value}>
                          {machine.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth disabled={!formData.machineType}>
                    <InputLabel>{t('orderPlanPage.machineLabel')}</InputLabel>
                    <Select
                      value={formData.machineId}
                      label={t('orderPlanPage.machineLabel')}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          machineId: e.target.value,
                        }))
                      }
                    >
                      {availableMachines.length === 0 && (
                        <MenuItem value="">
                          <em>{t('orderPlanPage.selectMachine')}</em>
                        </MenuItem>
                      )}
                      {availableMachines.map((machine) => (
                        <MenuItem key={machine.id} value={machine.id}>
                          {machine.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth disabled={!formData.machineType}>
                    <InputLabel>Brigada</InputLabel>
                    <Select
                      value={formData.groupId}
                      label="Brigada"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          groupId: e.target.value,
                        }))
                      }
                    >
                      {availableGroups.length === 0 && (
                        <MenuItem value="">
                          <em>Avval stanokni tanlang</em>
                        </MenuItem>
                      )}
                      {availableGroups.map((group) => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('orderPlanPage.statusLabel')}</InputLabel>
                    <Select
                      value={formData.status}
                      label={t('orderPlanPage.statusLabel')}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as PlanStatus,
                        }))
                      }
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Boshlanish"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Yakun / Deadline"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Izoh"
                    multiline
                    rows={3}
                    value={formData.note}
                    onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Reja bo'yicha qo'shimcha izoh..."
                  />
                </Grid>
              </Grid>

              {selectedOrder && (
                <Card variant="outlined">
                  <Stack spacing={1.25} sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Buyurtma ma&apos;lumotlari</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Mijoz
                        </Typography>
                        <Typography variant="subtitle2">{selectedOrder.clientName}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Mahsulot
                        </Typography>
                        <Typography variant="subtitle2">{selectedOrder.title}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Hajm
                        </Typography>
                        <Typography variant="subtitle2">
                          {selectedOrder.quantityKg} {t('orderPlanPage.kg')}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Ranglar soni
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                          {selectedOrder.numberOfColors || 1} rang{(selectedOrder.numberOfColors || 1) > 1 ? 'lar' : ''}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Material
                        </Typography>
                        <Typography variant="subtitle2">
                          {selectedOrder.material}{' '}
                          {selectedOrder.subMaterial ? `· ${selectedOrder.subMaterial}` : ''}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Stack>
                </Card>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={editDialog.onFalse}>{t('orderPlanPage.cancel')}</Button>
            <Button variant="contained" onClick={handleSave} disabled={!canSubmit}>
              {t('orderPlanPage.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailDialog.value} onClose={detailDialog.onFalse} maxWidth="md" fullWidth>
          <DialogTitle>Buyurtma tafsilotlari</DialogTitle>
          <DialogContent dividers>
            {detailPlan ? (
              <Stack spacing={2.5}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Sana (Order Book)
                    </Typography>
                    <Typography variant="subtitle2">
                      {detailPlan.orderDate ? formatDate(detailPlan.orderDate) : '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Буюртма рақами
                    </Typography>
                    <Typography variant="subtitle2">{detailPlan.orderNumber}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Клиент
                    </Typography>
                    <Typography variant="subtitle2">{detailPlan.clientName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Номи
                    </Typography>
                    <Typography variant="subtitle2">{detailPlan.title}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Миқдор (кг)
                    </Typography>
                    <Typography variant="subtitle2">{detailPlan.quantityKg}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Ранглар сони
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      {detailPlan.numberOfColors || 1} ранг{(detailPlan.numberOfColors || 1) > 1 ? 'лар' : ''}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Нарх (кг учун)
                    </Typography>
                    <Typography variant="subtitle2">
                      {formatPrice(detailPlan.pricePerKg, detailPlan.priceCurrency)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Жами қиймат
                    </Typography>
                    <Typography variant="subtitle2">
                      {detailPlan.pricePerKg && detailPlan.quantityKg
                        ? formatPrice(detailPlan.pricePerKg * detailPlan.quantityKg, detailPlan.priceCurrency)
                        : '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Админ
                    </Typography>
                    <Typography variant="subtitle2">{detailPlan.admin || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Материал
                    </Typography>
                    <Typography variant="subtitle2">
                      {detailPlan.material} {detailPlan.subMaterial ? `· ${detailPlan.subMaterial}` : ''}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Плёнка қалинлиги (мкм)
                    </Typography>
                    <Typography variant="subtitle2">
                      {detailPlan.filmThickness ? `${detailPlan.filmThickness} мкм` : '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Плёнка кенглиги (мм)
                    </Typography>
                    <Typography variant="subtitle2">
                      {detailPlan.filmWidth ? `${detailPlan.filmWidth} мм` : '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Силиндр узунлиги (мм)
                    </Typography>
                    <Typography variant="subtitle2">
                      {detailPlan.cylinderLength ? `${detailPlan.cylinderLength} мм` : '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Силиндрлар сони
                    </Typography>
                    <Typography variant="subtitle2">
                      {detailPlan.cylinderCount ? `${detailPlan.cylinderCount}` : '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Cylinder aylanasi (мм)
                    </Typography>
                    <Typography variant="subtitle2">
                      {detailPlan.cylinderAylanasi ? `${detailPlan.cylinderAylanasi} мм` : '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Бошланиш сана
                    </Typography>
                    <Typography variant="subtitle2">{formatDate(detailPlan.startDate)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('orderPlanPage.statusLabel')}
                    </Typography>
                    <Typography variant="subtitle2">
                      {detailPlan.status ? getStatusLabel(detailPlan.status) : '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Тугаш сана
                    </Typography>
                    <Typography variant="subtitle2">{formatDate(detailPlan.endDate)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Stanok / Brigada
                    </Typography>
                    <Typography variant="subtitle2">
                      {MACHINE_OPTIONS.find((m) => m.value === detailPlan.machineType)?.label || '-'} ·{' '}
                      {detailPlan.machineName || '—'} · {detailPlan.groupName || '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Изох
                    </Typography>
                    <Typography variant="body2">
                      {detailPlan.note || 'Izoh kiritilmagan'}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Maʼlumot topilmadi.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={detailDialog.onFalse}>Yopish</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

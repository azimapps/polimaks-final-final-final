/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';

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
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
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

import { Iconify } from 'src/components/iconify';

import plyonkaSeed from 'src/data/plyonka.json';
import kraskaSeed from 'src/data/kraska.json';
import suyuqKraskaSeed from 'src/data/suyuq-kraska.json';
import razvaritelSeed from 'src/data/razvaritel.json';
import silindirSeed from 'src/data/silindir.json';
import type { Client } from './clients';

type Material = 'BOPP' | 'CPP' | 'PE' | 'PET';
type Currency = 'USD' | 'EUR' | 'RUB' | 'UZS';
type MachineType = 'pechat' | 'reska' | 'laminatsiya';
type PlanStatus = 'in_progress' | 'finished';

type OrderBookItem = {
  id: string;
  date: string; // ISO date - order creation
  orderNumber: string;
  clientId: string;
  clientName: string;
  title: string;
  quantityKg: number;
  material: Material;
  subMaterial: string;
  filmThickness: number; // microns
  filmWidth: number; // mm
  cylinderLength: number; // mm
  cylinderCount: number;
  cylinderAylanasi: number; // mm
  startDate: string; // ISO date - production start
  endDate: string; // ISO date - production end
  pricePerKg: number;
  priceCurrency: Currency;
  admin: string;
  numberOfColors: number; // Number of colors in the order
};

type MaterialUsage = {
  materialId: string;
  materialLabel: string;
  itemLabel: string;
  amount: number;
  unitLabel: string;
  note?: string;
};

type PlanItem = {
  id: string;
  orderId: string;
  orderNumber: string;
  machineType: MachineType;
  machineName?: string;
  groupName?: string;
  startDate?: string;
  endDate?: string;
  status?: PlanStatus;
  materialsUsed?: MaterialUsage[];
};

type UsageRow = {
  id: string;
  planLabel: string;
  materialLabel: string;
  itemLabel: string;
  amount: number;
  unitLabel: string;
  unitPrice?: number;
  currency?: Currency;
  totalPrice?: number;
  note?: string;
};

type PlyonkaItem = {
  id: string;
  pricePerKg?: number;
  priceCurrency?: Currency;
};

type KraskaItem = {
  id: string;
  pricePerKg?: number;
  priceCurrency?: Currency;
};

type SuyuqKraskaItem = {
  id: string;
  pricePerKg?: number;
  priceCurrency?: Currency;
};

type RazvaritelItem = {
  id: string;
  pricePerLiter?: number;
  priceCurrency?: Currency;
};

type SilindirItem = {
  id: string;
  price?: number;
  priceCurrency?: Currency;
};

type FinishedProductItem = {
  id: string;
  receivedDate: string;
  numberIdentifier: string;
  type: string;
  supplier: string;
  client: string;
  name: string;
  quantity: number;
  netWeight: number;
  grossWeight: number;
  totalNetWeight: number;
  totalGrossWeight: number;
  price: number;
  priceCurrency: Currency;
  description: string;
};

const MATERIALS: Material[] = ['BOPP', 'CPP', 'PE', 'PET'];
const PRICE_CURRENCIES: Currency[] = ['USD', 'EUR', 'RUB', 'UZS'];

const MATERIAL_CATEGORIES: Record<Material, string[]> = {
  BOPP: ['prazrachniy', 'metal', 'jemchuk', 'jemchuk metal'],
  CPP: ['prazrachniy', 'beliy', 'metal'],
  PE: ['prazrachniy', 'beliy'],
  PET: ['prazrachniy', 'metal', 'beliy'],
};

const STORAGE_KEY = 'clients-order-book';
const CLIENTS_STORAGE_KEY = 'clients-main';
const PLAN_STORAGE_KEY = 'orderPlansV2';
const FINISHED_STORAGE_KEY = 'ombor-tayyor-mahsulotlar-angren';

const todayISO = () => new Date().toISOString().slice(0, 10);

const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = now.getTime().toString().slice(-4);
  return `ORD-${year}-${timestamp}`;
};

const readLocalArray = <T,>(key: string, fallback: T[]): T[] => {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const formatMoney = (value?: number, currency?: Currency) => {
  if (!currency || typeof value !== 'number' || value <= 0) return '—';
  const formatter = new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'USD' || currency === 'EUR' ? 2 : 0,
  });
  return formatter.format(value);
};

const machineTypeLabel = (value?: MachineType) => {
  if (value === 'pechat') return 'Pechat';
  if (value === 'reska') return 'Reska';
  if (value === 'laminatsiya') return 'Laminatsiya';
  return value || '';
};

const normalizeItems = (items: (Partial<OrderBookItem> & { id?: string; client?: string })[]): OrderBookItem[] =>
  items.map((item, index) => {
    const material = (item.material as Material) || 'BOPP';
    const priceCurrency = (item.priceCurrency as Currency) || 'USD';
    return {
      id: item.id || `order-${index}`,
      date: item.date || todayISO(),
      orderNumber: item.orderNumber || generateOrderNumber(),
      clientId: item.clientId || '',
      clientName: item.clientName || (item as any).client || '',
      title: item.title || '',
      quantityKg: typeof item.quantityKg === 'number' ? item.quantityKg : Number(item.quantityKg) || 0,
      material,
      subMaterial: item.subMaterial || MATERIAL_CATEGORIES[material][0],
      filmThickness:
        typeof item.filmThickness === 'number' ? item.filmThickness : Number(item.filmThickness) || 0,
      filmWidth: typeof item.filmWidth === 'number' ? item.filmWidth : Number(item.filmWidth) || 0,
      cylinderLength:
        typeof item.cylinderLength === 'number' ? item.cylinderLength : Number(item.cylinderLength) || 0,
      cylinderCount:
        typeof item.cylinderCount === 'number' ? item.cylinderCount : Number(item.cylinderCount) || 0,
      cylinderAylanasi:
        typeof item.cylinderAylanasi === 'number'
          ? item.cylinderAylanasi
          : Number(item.cylinderAylanasi) || 0,
      startDate: item.startDate || todayISO(),
      endDate: item.endDate || todayISO(),
      pricePerKg:
        typeof item.pricePerKg === 'number' ? item.pricePerKg : Number(item.pricePerKg) || 0,
      priceCurrency,
      admin: item.admin || '',
      numberOfColors: typeof item.numberOfColors === 'number' ? item.numberOfColors : Number(item.numberOfColors) || 1,
    };
  });

const seedData: OrderBookItem[] = [
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
    startDate: '2024-12-05',
    endDate: '2024-12-15',
    pricePerKg: 3.2,
    priceCurrency: 'USD',
    admin: 'Nodir',
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
    startDate: '2024-12-10',
    endDate: '2024-12-20',
    pricePerKg: 28500,
    priceCurrency: 'UZS',
    admin: 'Dilshod',
    numberOfColors: 2,
  },
];

export default function ClientsOrderBookPage() {
  const { t } = useTranslate('pages');

  const title = `${t('clients.items.order_book.title')} | ${CONFIG.appName}`;

  const availableClients = useMemo<Client[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Client[];
          return parsed.map((c) => ({
            ...c,
            complaints: (c.complaints ?? []).map((comp: any) => ({
              id: comp.id || '',
              message: comp.message || '',
              createdAt: comp.createdAt || new Date().toISOString(),
              status: comp.status === 'resolved' ? 'resolved' : 'open',
              resolvedAt: comp.resolvedAt || null,
            })),
            monthlyPlans: (c.monthlyPlans ?? []).map((plan: any) => ({
              id: plan.id || '',
              month: plan.month || '',
              limitKg: Number(plan.limitKg) || 0,
            })),
          }));
        } catch {
          // ignore parsing errors
        }
      }
    }
    return [];
  }, []);

  const initialData = useMemo<OrderBookItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return normalizeItems(JSON.parse(stored) as OrderBookItem[]);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return normalizeItems(seedData as OrderBookItem[]);
  }, []);

  const [items, setItems] = useState<OrderBookItem[]>(initialData);
  const [editing, setEditing] = useState<OrderBookItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<OrderBookItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OrderBookItem | null>(null);
  const [pendingFinish, setPendingFinish] = useState<OrderBookItem | null>(null);
  const [detailItem, setDetailItem] = useState<OrderBookItem | null>(null);
  const [detailPlans, setDetailPlans] = useState<PlanItem[]>([]);
  const [detailMaterials, setDetailMaterials] = useState<UsageRow[]>([]);
  const [form, setForm] = useState<
    Omit<
      OrderBookItem,
      | 'id'
      | 'quantityKg'
      | 'filmThickness'
      | 'filmWidth'
      | 'cylinderLength'
      | 'cylinderCount'
      | 'cylinderAylanasi'
      | 'pricePerKg'
      | 'numberOfColors'
    > & {
      quantityKg: string;
      filmThickness: string;
      filmWidth: string;
      cylinderLength: string;
      cylinderCount: string;
      cylinderAylanasi: string;
      pricePerKg: string;
      numberOfColors: string;
    }
  >({
    date: todayISO(),
    orderNumber: generateOrderNumber(),
    clientId: '',
    clientName: '',
    title: '',
    quantityKg: '',
    material: 'BOPP',
    subMaterial: MATERIAL_CATEGORIES.BOPP[0],
    filmThickness: '',
    filmWidth: '',
    cylinderLength: '',
    cylinderCount: '',
    cylinderAylanasi: '',
    startDate: todayISO(),
    endDate: todayISO(),
    pricePerKg: '',
    priceCurrency: 'USD',
    admin: '',
    numberOfColors: '1',
  });
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const dialog = useBoolean();
  const deleteDialog = useBoolean();
  const finishDialog = useBoolean();
  const infoDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: OrderBookItem[]) => OrderBookItem[]) => {
    setItems((prev) => {
      const next = normalizeItems(updater(prev));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setSelectedClient(null);
    setForm({
      date: todayISO(),
      orderNumber: generateOrderNumber(),
      clientId: '',
      clientName: '',
      title: '',
      quantityKg: '',
      material: 'BOPP',
      subMaterial: MATERIAL_CATEGORIES.BOPP[0],
      filmThickness: '',
      filmWidth: '',
      cylinderLength: '',
      cylinderCount: '',
      cylinderAylanasi: '',
      startDate: todayISO(),
      endDate: todayISO(),
      pricePerKg: '',
      priceCurrency: PRICE_CURRENCIES[0],
      admin: '',
      numberOfColors: '1',
    });
    dialog.onTrue();
  };

  const openEdit = (item: OrderBookItem) => {
    setEditing(item);
    const existingClient = availableClients.find(c => c.id === item.clientId);
    setSelectedClient(existingClient || null);
    setForm({
      date: item.date || todayISO(),
      orderNumber: item.orderNumber,
      clientId: item.clientId,
      clientName: item.clientName,
      title: item.title,
      quantityKg: item.quantityKg ? String(item.quantityKg) : '',
      material: item.material,
      subMaterial: item.subMaterial,
      filmThickness: item.filmThickness ? String(item.filmThickness) : '',
      filmWidth: item.filmWidth ? String(item.filmWidth) : '',
      cylinderLength: item.cylinderLength ? String(item.cylinderLength) : '',
      cylinderCount: item.cylinderCount ? String(item.cylinderCount) : '',
      cylinderAylanasi: item.cylinderAylanasi ? String(item.cylinderAylanasi) : '',
      startDate: item.startDate || todayISO(),
      endDate: item.endDate || todayISO(),
      pricePerKg: item.pricePerKg ? String(item.pricePerKg) : '',
      priceCurrency: item.priceCurrency,
      admin: item.admin || '',
      numberOfColors: item.numberOfColors ? String(item.numberOfColors) : '1',
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const quantityKgNum = parseFloat(form.quantityKg) || 0;
    const filmThicknessNum = parseFloat(form.filmThickness) || 0;
    const filmWidthNum = parseFloat(form.filmWidth) || 0;
    const cylinderLengthNum = parseFloat(form.cylinderLength) || 0;
    const cylinderCountNum = parseInt(form.cylinderCount, 10) || 0;
    const cylinderAylanasiNum = parseFloat(form.cylinderAylanasi) || 0;
    const pricePerKgNum = parseFloat(form.pricePerKg) || 0;
    const numberOfColorsNum = parseInt(form.numberOfColors, 10) || 1;

    const payload: OrderBookItem = {
      id: editing ? editing.id : uuidv4(),
      date: form.date || todayISO(),
      orderNumber: form.orderNumber.trim() || generateOrderNumber(),
      clientId: form.clientId,
      clientName: form.clientName.trim(),
      title: form.title.trim(),
      quantityKg: quantityKgNum,
      material: form.material,
      subMaterial: form.subMaterial,
      filmThickness: filmThicknessNum,
      filmWidth: filmWidthNum,
      cylinderLength: cylinderLengthNum,
      cylinderCount: cylinderCountNum,
      cylinderAylanasi: cylinderAylanasiNum,
      startDate: form.startDate || todayISO(),
      endDate: form.endDate || todayISO(),
      pricePerKg: pricePerKgNum,
      priceCurrency: form.priceCurrency,
      admin: form.admin.trim(),
      numberOfColors: numberOfColorsNum,
    };

    if (editing) {
      setItemsAndPersist((prev) => prev.map((it) => (it.id === editing.id ? payload : it)));
    } else {
      setItemsAndPersist((prev) => [...prev, payload]);
    }
    dialog.onFalse();
  };

  const handleDelete = () => {
    if (pendingDelete) {
      setItemsAndPersist((prev) => prev.filter((it) => it.id !== pendingDelete.id));
    }
    deleteDialog.onFalse();
    setPendingDelete(null);
    setMenuItem(null);
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: OrderBookItem) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const buildPriceLookup = () => {
    const map = new Map<string, { price?: number; currency?: Currency; unitLabel: string }>();
    const plyonkaItems = readLocalArray<PlyonkaItem>('ombor-plyonka', plyonkaSeed as PlyonkaItem[]);
    const kraskaItems = readLocalArray<KraskaItem>('ombor-kraska', kraskaSeed as KraskaItem[]);
    const suyuqKraskaItems = readLocalArray<SuyuqKraskaItem>(
      'ombor-suyuq-kraska',
      suyuqKraskaSeed as SuyuqKraskaItem[]
    );
    const razvaritelItems = readLocalArray<RazvaritelItem>(
      'ombor-razvaritel',
      razvaritelSeed as RazvaritelItem[]
    );
    const silindirItems = readLocalArray<SilindirItem>('ombor-silindir', silindirSeed as SilindirItem[]);

    plyonkaItems.forEach((item) => {
      map.set(`plyonka:${item.id}`, {
        price: item.pricePerKg,
        currency: item.priceCurrency,
        unitLabel: t('plyonkaPage.kg'),
      });
    });
    kraskaItems.forEach((item) => {
      map.set(`kraska:${item.id}`, {
        price: item.pricePerKg,
        currency: item.priceCurrency,
        unitLabel: t('kraskaPage.kg'),
      });
    });
    suyuqKraskaItems.forEach((item) => {
      map.set(`suyuq-kraska:${item.id}`, {
        price: item.pricePerKg,
        currency: item.priceCurrency,
        unitLabel: t('suyuqKraskaPage.kg'),
      });
    });
    razvaritelItems.forEach((item) => {
      map.set(`razvaritel:${item.id}`, {
        price: item.pricePerLiter,
        currency: item.priceCurrency,
        unitLabel: t('razvaritelPage.liter'),
      });
    });
    silindirItems.forEach((item) => {
      map.set(`silindir:${item.id}`, {
        price: item.price,
        currency: item.priceCurrency,
        unitLabel: t('orderPlanPage.pcs'),
      });
    });

    return map;
  };

  const buildUsageRows = (plans: PlanItem[]) => {
    const priceLookup = buildPriceLookup();
    return plans.flatMap((plan) => {
      const planLabelParts = [
        machineTypeLabel(plan.machineType),
        plan.machineName,
        plan.groupName ? `(${plan.groupName})` : '',
      ].filter(Boolean);
      const planLabel = planLabelParts.join(' ');
      return (plan.materialsUsed || []).map((usage, index) => {
        const priceInfo = priceLookup.get(usage.materialId);
        const unitPrice = priceInfo?.price;
        const currency = priceInfo?.currency;
        const amount =
          typeof usage.amount === 'number' ? usage.amount : Number(usage.amount) || 0;
        const totalPrice =
          typeof unitPrice === 'number' && amount > 0 ? unitPrice * amount : undefined;
        return {
          id: `${plan.id}-${usage.materialId}-${index}`,
          planLabel: planLabel || t('orderBookPage.planFallback'),
          materialLabel: usage.materialLabel,
          itemLabel: usage.itemLabel,
          amount,
          unitLabel: usage.unitLabel,
          unitPrice,
          currency,
          totalPrice,
          note: usage.note,
        };
      });
    });
  };

  const openInfo = (item: OrderBookItem) => {
    const storedPlans = readLocalArray<PlanItem>(PLAN_STORAGE_KEY, []);
    const relatedPlans = storedPlans.filter(
      (plan) => plan?.orderId === item.id || plan?.orderNumber === item.orderNumber
    );
    setDetailItem(item);
    setDetailPlans(relatedPlans);
    setDetailMaterials(buildUsageRows(relatedPlans));
    infoDialog.onTrue();
  };

  const closeInfo = () => {
    infoDialog.onFalse();
    setDetailItem(null);
    setDetailPlans([]);
    setDetailMaterials([]);
  };

  const openFinish = (item: OrderBookItem) => {
    setPendingFinish(item);
    finishDialog.onTrue();
  };

  const handleFinish = () => {
    if (!pendingFinish || typeof window === 'undefined') {
      finishDialog.onFalse();
      setPendingFinish(null);
      return;
    }

    const existing = readLocalArray<FinishedProductItem>(FINISHED_STORAGE_KEY, []);
    if (!existing.some((entry) => entry.numberIdentifier === pendingFinish.orderNumber)) {
      const quantity = pendingFinish.quantityKg || 0;
      const price = pendingFinish.pricePerKg || 0;
      const payload: FinishedProductItem = {
        id: uuidv4(),
        receivedDate: pendingFinish.endDate || todayISO(),
        numberIdentifier: pendingFinish.orderNumber,
        type: [pendingFinish.material, pendingFinish.subMaterial].filter(Boolean).join(' '),
        supplier: '',
        client: pendingFinish.clientName,
        name: pendingFinish.title,
        quantity,
        netWeight: quantity,
        grossWeight: quantity,
        totalNetWeight: quantity,
        totalGrossWeight: quantity,
        price,
        priceCurrency: pendingFinish.priceCurrency || 'UZS',
        description: `${pendingFinish.orderNumber} - ${pendingFinish.title}`.trim(),
      };
      localStorage.setItem(FINISHED_STORAGE_KEY, JSON.stringify([...existing, payload]));
    }

    finishDialog.onFalse();
    setPendingFinish(null);
    setMenuItem(null);
  };

  const onMaterialChange = (material: Material) => {
    const defaultSubMaterial = MATERIAL_CATEGORIES[material][0];
    setForm((prev) => ({ ...prev, material, subMaterial: defaultSubMaterial }));
  };

  const canSave =
    form.clientName.trim() &&
    form.title.trim() &&
    form.material &&
    form.subMaterial &&
    parseFloat(form.quantityKg) > 0 &&
    parseFloat(form.filmThickness) > 0 &&
    parseFloat(form.filmWidth) > 0 &&
    parseFloat(form.cylinderLength) > 0 &&
    parseInt(form.cylinderCount, 10) > 0 &&
    parseFloat(form.pricePerKg) > 0 &&
    parseInt(form.numberOfColors, 10) > 0 &&
    form.startDate &&
    form.endDate &&
    form.startDate <= form.endDate;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{t('orderBookPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('orderBookPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('orderBookPage.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table
                size="medium"
                sx={{
                  minWidth: 2100,
                  '& th, & td': { py: 1.5, px: 1.25 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 120 }}>{t('orderBookPage.date')}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>{t('orderBookPage.orderNumber')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('orderBookPage.client')}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{t('orderBookPage.orderTitle')}</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>{t('orderBookPage.quantityKg')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('orderBookPage.pricePerKg')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('orderBookPage.totalCost')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('orderBookPage.admin')}</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>{t('orderBookPage.material')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('orderBookPage.filmThickness')}</TableCell>
                    <TableCell sx={{ minWidth: 130 }}>{t('orderBookPage.filmWidth')}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>{t('orderBookPage.cylinderLength')}</TableCell>
                    <TableCell sx={{ minWidth: 130 }}>{t('orderBookPage.cylinderCount')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Cylinder aylanasi</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Ranglar soni</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>{t('orderBookPage.startDate')}</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>{t('orderBookPage.endDate')}</TableCell>
                    <TableCell align="right" sx={{ width: 80 }}>
                      {t('orderBookPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={18}>
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
                            {t('orderBookPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('orderBookPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const totalCost = item.quantityKg * item.pricePerKg;
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="body2">{item.date}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.orderNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.clientName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">{item.title}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.quantityKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              {t('orderBookPage.kg')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.pricePerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              {item.priceCurrency} / {t('orderBookPage.kg')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              {item.priceCurrency}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.admin}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.material} - {item.subMaterial}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.filmThickness} {t('orderBookPage.microns')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.filmWidth} {t('orderBookPage.mm')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.cylinderLength} {t('orderBookPage.mm')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.cylinderCount} {t('orderBookPage.pcs')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.cylinderAylanasi
                                ? `${item.cylinderAylanasi} ${t('orderBookPage.mm')}`
                                : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {item.numberOfColors} rang{item.numberOfColors > 1 ? 'lar' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.startDate}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.endDate}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
                              <IconButton onClick={() => openInfo(item)} size="small">
                                <Iconify icon="solar:info-circle-bold" />
                              </IconButton>
                              <IconButton onClick={(e) => openMenu(e, item)} size="small">
                                <Iconify icon="eva:more-vertical-fill" />
                              </IconButton>
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editing ? t('orderBookPage.edit') : t('orderBookPage.add')}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              {/* Row 1 */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('orderBookPage.date')}
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value || todayISO() }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('orderBookPage.orderNumber')}
                  value={form.orderNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, orderNumber: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  fullWidth
                  options={availableClients}
                  value={selectedClient}
                  onChange={(event, newValue) => {
                    setSelectedClient(newValue);
                    setForm((prev) => ({ 
                      ...prev, 
                      clientId: newValue?.id || '',
                      clientName: newValue ? `${newValue.fullName}${newValue.company ? ` (${newValue.company})` : ''}` : ''
                    }));
                  }}
                  getOptionLabel={(option) => 
                    `${option.fullName}${option.company ? ` (${option.company})` : ''}`
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('orderBookPage.client')}
                      placeholder="Search clients..."
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText="No clients found. Add clients from the Clients page."
                />
              </Grid>

              {/* Row 2 */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderBookPage.orderTitle')}
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.quantityKg')}
                  value={form.quantityKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantityKg: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('orderBookPage.quantityKg') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.pricePerKg')}
                  value={form.pricePerKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, pricePerKg: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('orderBookPage.pricePerKg') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  label={t('orderBookPage.material')}
                  value={form.material}
                  onChange={(e) => onMaterialChange(e.target.value as Material)}
                >
                  {MATERIALS.map((material) => (
                    <MenuItem key={material} value={material}>
                      {material}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  label={t('orderBookPage.priceCurrency')}
                  value={form.priceCurrency}
                  onChange={(e) => setForm((prev) => ({ ...prev, priceCurrency: e.target.value as Currency }))}
                >
                  {PRICE_CURRENCIES.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  label={t('orderBookPage.subMaterial')}
                  value={form.subMaterial}
                  onChange={(e) => setForm((prev) => ({ ...prev, subMaterial: e.target.value }))}
                >
                  {MATERIAL_CATEGORIES[form.material].map((subMaterial) => (
                    <MenuItem key={subMaterial} value={subMaterial}>
                      {subMaterial}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Row 3 */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.filmThickness')}
                  value={form.filmThickness}
                  onChange={(e) => setForm((prev) => ({ ...prev, filmThickness: e.target.value }))}
                  inputProps={{ min: 0, step: '0.1', placeholder: t('orderBookPage.filmThickness') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.filmWidth')}
                  value={form.filmWidth}
                  onChange={(e) => setForm((prev) => ({ ...prev, filmWidth: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('orderBookPage.filmWidth') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.cylinderLength')}
                  value={form.cylinderLength}
                  onChange={(e) => setForm((prev) => ({ ...prev, cylinderLength: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('orderBookPage.cylinderLength') }}
                />
              </Grid>

              {/* Row 4 */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orderBookPage.cylinderCount')}
                  value={form.cylinderCount}
                  onChange={(e) => setForm((prev) => ({ ...prev, cylinderCount: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: t('orderBookPage.cylinderCount') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cylinder aylanasi (мм)"
                  value={form.cylinderAylanasi}
                  onChange={(e) => setForm((prev) => ({ ...prev, cylinderAylanasi: e.target.value }))}
                  inputProps={{ min: 0, step: '1', placeholder: 'Cylinder aylanasi' }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Ranglar soni"
                  value={form.numberOfColors}
                  onChange={(e) => setForm((prev) => ({ ...prev, numberOfColors: e.target.value }))}
                  inputProps={{ min: 1, step: '1', placeholder: 'Ranglar soni' }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('orderBookPage.startDate')}
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value || todayISO() }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('orderBookPage.endDate')}
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value || todayISO() }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('orderBookPage.admin')}
                  value={form.admin}
                  onChange={(e) => setForm((prev) => ({ ...prev, admin: e.target.value }))}
                  placeholder={t('orderBookPage.admin')}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('orderBookPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('orderBookPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('orderBookPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('orderBookPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('orderBookPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('orderBookPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('orderBookPage.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={finishDialog.value} onClose={finishDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('orderBookPage.finishConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('orderBookPage.finishHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={finishDialog.onFalse} color="inherit">
            {t('orderBookPage.cancel')}
          </Button>
          <Button onClick={handleFinish} variant="contained">
            {t('orderBookPage.finish')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={infoDialog.value} onClose={closeInfo} maxWidth="lg" fullWidth>
        <DialogTitle>{t('orderBookPage.infoTitle')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {detailItem && (
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('orderBookPage.orderNumber')}
                  </Typography>
                  <Typography variant="subtitle1">{detailItem.orderNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('orderBookPage.client')}
                  </Typography>
                  <Typography variant="subtitle1">{detailItem.clientName || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('orderBookPage.orderTitle')}
                  </Typography>
                  <Typography variant="subtitle1">{detailItem.title || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('orderBookPage.quantityKg')}
                  </Typography>
                  <Typography variant="subtitle1">
                    {detailItem.quantityKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                    {t('orderBookPage.kg')}
                  </Typography>
                </Box>
              </Box>
            )}

            <Divider />

            <Typography variant="subtitle1">{t('orderBookPage.plansTitle')}</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('orderPlanPage.machineTypeLabel')}</TableCell>
                    <TableCell>{t('orderPlanPage.machineLabel')}</TableCell>
                    <TableCell>{t('pechatPanel.brigadaLabel')}</TableCell>
                    <TableCell>{t('orderBookPage.startDate')}</TableCell>
                    <TableCell>{t('orderBookPage.endDate')}</TableCell>
                    <TableCell>{t('orderPlanPage.statusLabel')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('orderBookPage.noPlans')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    detailPlans.map((plan) => {
                      const statusLabel =
                        plan.status === 'finished'
                          ? t('orderPlanPage.status.finished')
                          : t('orderPlanPage.status.inProgress');
                      return (
                        <TableRow key={plan.id}>
                          <TableCell>
                            <Typography variant="body2">{machineTypeLabel(plan.machineType) || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{plan.machineName || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{plan.groupName || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{plan.startDate || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{plan.endDate || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={statusLabel}
                              color={plan.status === 'finished' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />

            <Typography variant="subtitle1">{t('orderBookPage.materialsTitle')}</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('orderBookPage.plan')}</TableCell>
                    <TableCell>{t('orderBookPage.material')}</TableCell>
                    <TableCell>{t('orderBookPage.amount')}</TableCell>
                    <TableCell>{t('orderBookPage.unitPrice')}</TableCell>
                    <TableCell>{t('orderBookPage.totalPrice')}</TableCell>
                    <TableCell>{t('orderBookPage.note')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('orderBookPage.noMaterials')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    detailMaterials.map((usage) => (
                      <TableRow key={usage.id}>
                        <TableCell>
                          <Typography variant="body2">{usage.planLabel}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {[usage.materialLabel, usage.itemLabel].filter(Boolean).join(' / ') || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {usage.amount} {usage.unitLabel || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {usage.unitPrice ? formatMoney(usage.unitPrice, usage.currency) : '—'}
                            {usage.unitPrice ? ` / ${usage.unitLabel || ''}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {usage.totalPrice ? formatMoney(usage.totalPrice, usage.currency) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{usage.note || '—'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeInfo} color="inherit">
            {t('orderBookPage.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (menuItem) openEdit(menuItem);
            closeMenu();
          }}
        >
          <Iconify icon="solar:pen-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {t('orderBookPage.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuItem) openFinish(menuItem);
            closeMenu();
          }}
        >
          <Iconify icon="solar:check-circle-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {t('orderBookPage.finish')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuItem) {
              setPendingDelete(menuItem);
              deleteDialog.onTrue();
            }
            closeMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {t('orderBookPage.delete')}
        </MenuItem>
      </Menu>
    </>
  );
}

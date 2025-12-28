/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

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
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import plyonkaSeed from 'src/data/plyonka.json';
import kraskaSeed from 'src/data/kraska.json';
import suyuqKraskaSeed from 'src/data/suyuq-kraska.json';
import razvaritelSeed from 'src/data/razvaritel.json';
import silindirSeed from 'src/data/silindir.json';

type Material = 'BOPP' | 'CPP' | 'PE' | 'PET';
type Currency = 'USD' | 'EUR' | 'RUB' | 'UZS';
type MachineType = 'pechat' | 'reska' | 'laminatsiya';
type PlanStatus = 'in_progress' | 'finished';

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
  cylinderAylanasi: number; 
  startDate: string; 
  endDate: string; 
  pricePerKg: number;
  priceCurrency: Currency;
  admin: string;
  numberOfColors: number; 
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

const STORAGE_KEY = 'clients-order-book';
const PLAN_STORAGE_KEY = 'orderPlansV2';

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

const normalizeOrderItems = (items: any[]): OrderBookItem[] =>
  items.map((item, index) => {
    const material = (item.material as Material) || 'BOPP';
    const priceCurrency = (item.priceCurrency as Currency) || 'USD';
    return {
      id: item.id || `order-${index}`,
      date: item.date || new Date().toISOString().slice(0, 10),
      orderNumber: item.orderNumber || `ORD-${index}`,
      clientId: item.clientId || '',
      clientName: item.clientName || (item as any).client || '',
      title: item.title || '',
      quantityKg: typeof item.quantityKg === 'number' ? item.quantityKg : Number(item.quantityKg) || 0,
      material,
      subMaterial: item.subMaterial || '',
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
      startDate: item.startDate || new Date().toISOString().slice(0, 10),
      endDate: item.endDate || new Date().toISOString().slice(0, 10),
      pricePerKg:
        typeof item.pricePerKg === 'number' ? item.pricePerKg : Number(item.pricePerKg) || 0,
      priceCurrency,
      admin: item.admin || '',
      numberOfColors: typeof item.numberOfColors === 'number' ? item.numberOfColors : Number(item.numberOfColors) || 1,
    };
  });

export default function IshlabChiqarishHisobotlar() {
  const { t } = useTranslate('pages');

  const title = `${t('ishlabChiqarish.items.hisobotlar.title')} | ${CONFIG.appName}`;

  const orderBookItems = useMemo<OrderBookItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return normalizeOrderItems(JSON.parse(stored));
    } catch {
      return [];
    }
  }, []);

  const allPlans = useMemo<PlanItem[]>(() => readLocalArray<PlanItem>(PLAN_STORAGE_KEY, []), []);

  const [detailItem, setDetailItem] = useState<OrderBookItem | null>(null);
  const [detailPlans, setDetailPlans] = useState<PlanItem[]>([]);
  const [detailMaterials, setDetailMaterials] = useState<UsageRow[]>([]);

  const infoDialog = useBoolean();
  const financialDialog = useBoolean();
  const formulaDialog = useBoolean();

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
          planLabel: planLabel || 'Noma&apos;lum plan',
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

  const calculateFinancialMetrics = (item: OrderBookItem) => {
    const relatedPlans = allPlans.filter(
      (plan) => plan?.orderId === item.id || plan?.orderNumber === item.orderNumber
    );
    const materialUsages = buildUsageRows(relatedPlans);
    
    // Calculate total material costs
    const totalMaterialCost = materialUsages.reduce((sum, usage) => {
      if (usage.totalPrice && usage.currency === item.priceCurrency) {
        return sum + usage.totalPrice;
      }
      return sum;
    }, 0);

    // Revenue calculations
    const totalRevenue = item.quantityKg * item.pricePerKg;
    const totalProfit = totalRevenue - totalMaterialCost;
    const profitPerKg = item.quantityKg > 0 ? totalProfit / item.quantityKg : 0;
    const costPerKg = item.quantityKg > 0 ? totalMaterialCost / item.quantityKg : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalMaterialCost,
      totalRevenue,
      totalProfit,
      profitPerKg,
      costPerKg,
      profitMargin,
      materialUsages,
      relatedPlans
    };
  };

  const openInfo = (item: OrderBookItem) => {
    const relatedPlans = allPlans.filter(
      (plan) => plan?.orderId === item.id || plan?.orderNumber === item.orderNumber
    );
    setDetailItem(item);
    setDetailPlans(relatedPlans);
    setDetailMaterials(buildUsageRows(relatedPlans));
    infoDialog.onTrue();
  };

  const openFinancial = (item: OrderBookItem) => {
    const relatedPlans = allPlans.filter(
      (plan) => plan?.orderId === item.id || plan?.orderNumber === item.orderNumber
    );
    setDetailItem(item);
    setDetailPlans(relatedPlans);
    setDetailMaterials(buildUsageRows(relatedPlans));
    financialDialog.onTrue();
  };

  const openFormulaDetails = (item: OrderBookItem) => {
    const relatedPlans = allPlans.filter(
      (plan) => plan?.orderId === item.id || plan?.orderNumber === item.orderNumber
    );
    setDetailItem(item);
    setDetailPlans(relatedPlans);
    setDetailMaterials(buildUsageRows(relatedPlans));
    formulaDialog.onTrue();
  };

  const closeInfo = () => {
    infoDialog.onFalse();
    setDetailItem(null);
    setDetailPlans([]);
    setDetailMaterials([]);
  };

  const closeFinancial = () => {
    financialDialog.onFalse();
    setDetailItem(null);
    setDetailPlans([]);
    setDetailMaterials([]);
  };

  const closeFormula = () => {
    formulaDialog.onFalse();
    setDetailItem(null);
    setDetailPlans([]);
    setDetailMaterials([]);
  };

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">{t('ishlabChiqarish.items.hisobotlar.title')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Buyurtma kitobidan yuklab olingan ishlab chiqarish hisobotlari
            </Typography>
          </Box>

          <Card>
            <TableContainer>
              <Table
                size="medium"
                sx={{
                  minWidth: 1800,
                  '& th, & td': { py: 1.5, px: 1.25 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 150 }}>Buyurtma raqami</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Mijoz</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Miqdori (kg)</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Sotuv narxi</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Material xarajati</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Xarajat / kg</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Foyda / kg</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Umumiy foyda</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Foyda foizi</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      Amallar
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderBookItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
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
                            Buyurtma kitobida ma&apos;lumotlar topilmadi
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderBookItems.map((item) => {
                      const financialMetrics = calculateFinancialMetrics(item);
                      const totalRevenue = item.quantityKg * item.pricePerKg;
                      
                      return (
                        <TableRow 
                          key={item.id} 
                          hover 
                          onClick={() => openFormulaDetails(item)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.orderNumber}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {item.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.clientName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.quantityKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'primary.main', display: 'block' }}>
                              {item.numberOfColors} rang{item.numberOfColors > 1 ? 'lar' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              {item.priceCurrency}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {item.pricePerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              {item.priceCurrency}/kg
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                              {financialMetrics.totalMaterialCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              {item.priceCurrency}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'warning.main' }}>
                              {financialMetrics.costPerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              {item.priceCurrency}/kg
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ 
                              color: financialMetrics.profitPerKg >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 600
                            }}>
                              {financialMetrics.profitPerKg >= 0 ? '+' : ''}{financialMetrics.profitPerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              {item.priceCurrency}/kg
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ 
                              color: financialMetrics.totalProfit >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 600
                            }}>
                              {financialMetrics.totalProfit >= 0 ? '+' : ''}{financialMetrics.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              {item.priceCurrency}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${financialMetrics.profitMargin >= 0 ? '+' : ''}${financialMetrics.profitMargin.toFixed(1)}%`}
                              color={financialMetrics.profitMargin >= 0 ? 'success' : 'error'}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5}>
                              <IconButton 
                                onClick={(e) => { e.stopPropagation(); openFinancial(item); }} 
                                size="small" 
                                title="Moliyaviy tahlil"
                              >
                                <Iconify icon="solar:verified-check-bold" />
                              </IconButton>
                              <IconButton 
                                onClick={(e) => { e.stopPropagation(); openInfo(item); }} 
                                size="small" 
                                title="Batafsil ma'lumot"
                              >
                                <Iconify icon="solar:info-circle-bold" />
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

      {/* General Info Dialog */}
      <Dialog open={infoDialog.value} onClose={closeInfo} maxWidth="md" fullWidth>
        <DialogTitle>Buyurtma ma&apos;lumotlari - {detailItem?.orderNumber}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {detailItem && (
              <>
                {/* Basic Info Grid */}
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Buyurtma raqami
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {detailItem.orderNumber}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Mijoz
                    </Typography>
                    <Typography variant="subtitle1">{detailItem.clientName || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Buyurtma nomi
                    </Typography>
                    <Typography variant="subtitle1">{detailItem.title || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Miqdori
                    </Typography>
                    <Typography variant="subtitle1">
                      {detailItem.quantityKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Material
                    </Typography>
                    <Typography variant="subtitle1">
                      {detailItem.material} - {detailItem.subMaterial}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Ranglar soni
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      {detailItem.numberOfColors} rang{detailItem.numberOfColors > 1 ? 'lar' : ''}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Qalinligi
                    </Typography>
                    <Typography variant="subtitle1">
                      {detailItem.filmThickness} mikron
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Eni
                    </Typography>
                    <Typography variant="subtitle1">
                      {detailItem.filmWidth} mm
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Silindir uzunligi
                    </Typography>
                    <Typography variant="subtitle1">
                      {detailItem.cylinderLength} mm
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Silindir soni
                    </Typography>
                    <Typography variant="subtitle1">
                      {detailItem.cylinderCount} dona
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Boshlanish sanasi
                    </Typography>
                    <Typography variant="subtitle1">
                      {detailItem.startDate}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Tugash sanasi
                    </Typography>
                    <Typography variant="subtitle1">
                      {detailItem.endDate}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Admin
                    </Typography>
                    <Typography variant="subtitle1">
                      {detailItem.admin || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Yaratilgan sana
                    </Typography>
                    <Typography variant="subtitle1">
                      {detailItem.date}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Production Plans Summary */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Ishlab chiqarish holati
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {detailPlans.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Ishlab chiqarish rejalari mavjud emas
                      </Typography>
                    ) : (
                      detailPlans.map((plan) => (
                        <Chip
                          key={plan.id}
                          label={`${machineTypeLabel(plan.machineType)} - ${plan.status === 'finished' ? 'Tugallangan' : 'Jarayonda'}`}
                          color={plan.status === 'finished' ? 'success' : 'warning'}
                          size="small"
                        />
                      ))
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeInfo} color="inherit">
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Financial Analysis Dialog */}
      <Dialog open={financialDialog.value} onClose={closeFinancial} maxWidth="lg" fullWidth>
        <DialogTitle>Moliyaviy tahlil - {detailItem?.orderNumber}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {detailItem && (
              <>
                {/* Summary Cards */}
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' } }}>
                  {(() => {
                    const metrics = calculateFinancialMetrics(detailItem);
                    const totalRevenue = detailItem.quantityKg * detailItem.pricePerKg;
                    
                    return (
                      <>
                        <Card sx={{ 
                          p: 2, 
                          border: 1, 
                          borderColor: 'primary.main', 
                          bgcolor: 'background.paper',
                          '& .MuiTypography-h6': { color: 'primary.main' }
                        }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Umumiy sotuv
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })} {detailItem.priceCurrency}
                          </Typography>
                        </Card>
                        
                        <Card sx={{ 
                          p: 2, 
                          border: 1, 
                          borderColor: 'error.main', 
                          bgcolor: 'background.paper',
                          '& .MuiTypography-h6': { color: 'error.main' }
                        }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Material xarajati
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {metrics.totalMaterialCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} {detailItem.priceCurrency}
                          </Typography>
                        </Card>
                        
                        <Card sx={{ 
                          p: 2, 
                          border: 1, 
                          borderColor: metrics.totalProfit >= 0 ? 'success.main' : 'error.main', 
                          bgcolor: 'background.paper',
                          '& .MuiTypography-h6': { color: metrics.totalProfit >= 0 ? 'success.main' : 'error.main' }
                        }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Sof foyda
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {metrics.totalProfit >= 0 ? '+' : ''}{metrics.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })} {detailItem.priceCurrency}
                          </Typography>
                        </Card>
                        
                        <Card sx={{ 
                          p: 2, 
                          border: 1, 
                          borderColor: metrics.profitMargin >= 0 ? 'success.main' : 'warning.main', 
                          bgcolor: 'background.paper',
                          '& .MuiTypography-h6': { color: metrics.profitMargin >= 0 ? 'success.main' : 'warning.main' }
                        }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Foyda foizi
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {metrics.profitMargin.toFixed(1)}%
                          </Typography>
                        </Card>
                      </>
                    );
                  })()}
                </Box>

                <Divider />

                {/* Per KG Analysis */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Kg boshiga tahlil
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
                    {(() => {
                      const metrics = calculateFinancialMetrics(detailItem);
                      return (
                        <>
                          <Box sx={{ 
                            p: 2, 
                            border: 1, 
                            borderColor: 'primary.main', 
                            borderRadius: 1,
                            bgcolor: 'background.paper'
                          }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Sotuv narxi / kg
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {detailItem.pricePerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} {detailItem.priceCurrency}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            p: 2, 
                            border: 1, 
                            borderColor: 'warning.main', 
                            borderRadius: 1,
                            bgcolor: 'background.paper'
                          }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Xarajat / kg
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                              {metrics.costPerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} {detailItem.priceCurrency}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            p: 2, 
                            border: 1, 
                            borderColor: metrics.profitPerKg >= 0 ? 'success.main' : 'error.main', 
                            borderRadius: 1,
                            bgcolor: 'background.paper'
                          }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Foyda / kg
                            </Typography>
                            <Typography variant="subtitle1" sx={{ 
                              fontWeight: 600, 
                              color: metrics.profitPerKg >= 0 ? 'success.main' : 'error.main' 
                            }}>
                              {metrics.profitPerKg >= 0 ? '+' : ''}{metrics.profitPerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} {detailItem.priceCurrency}
                            </Typography>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>
                </Box>

                <Divider />

                {/* Material Breakdown */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Material xarajatlari tafsiloti
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Reja</TableCell>
                          <TableCell>Material</TableCell>
                          <TableCell>Miqdor</TableCell>
                          <TableCell>Birlik narxi</TableCell>
                          <TableCell>Umumiy narx</TableCell>
                          <TableCell>Izoh</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailMaterials.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6}>
                              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                                Material ma&apos;lumotlari topilmadi
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
                                <Typography variant="body2" sx={{ 
                                  fontWeight: usage.totalPrice ? 600 : 'normal',
                                  color: usage.totalPrice ? 'text.primary' : 'text.secondary'
                                }}>
                                  {usage.totalPrice ? formatMoney(usage.totalPrice, usage.currency) : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  {usage.note || '—'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Quick Financial Insights */}
                <Box sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  p: 2, 
                  borderRadius: 1,
                  bgcolor: 'background.paper'
                }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Moliyaviy ko&apos;rsatkichlar
                  </Typography>
                  {(() => {
                    const metrics = calculateFinancialMetrics(detailItem);
                    const insights = [];
                    
                    if (metrics.profitMargin >= 20) {
                      insights.push({ text: 'Yuqori foyda darajasi - zarar yo\'q', color: 'success.main', icon: '✅' });
                    } else if (metrics.profitMargin >= 10) {
                      insights.push({ text: 'O\'rtacha foyda darajasi - yaxshilash mumkin', color: 'warning.main', icon: '⚠️' });
                    } else if (metrics.profitMargin >= 0) {
                      insights.push({ text: 'Past foyda darajasi - xarajatlarni kamaytirish kerak', color: 'error.main', icon: '🔴' });
                    } else {
                      insights.push({ text: 'Zarar darajasida - xarajatlarni qayta ko\'rib chiqing', color: 'error.main', icon: '❌' });
                    }
                    
                    if (metrics.costPerKg > detailItem.pricePerKg * 0.7) {
                      insights.push({ text: 'Material xarajati juda yuqori (70% dan ko\'p)', color: 'warning.main', icon: '⚠️' });
                    } else {
                      insights.push({ text: 'Material xarajati maqbul darajada', color: 'success.main', icon: '✅' });
                    }
                    
                    return (
                      <Stack spacing={1.5}>
                        {insights.map((insight, index) => (
                          <Box key={index} sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 1.5,
                            borderRadius: 1,
                            border: 1,
                            borderColor: insight.color,
                            bgcolor: 'background.default'
                          }}>
                            <Typography variant="body2" sx={{ fontSize: '1.1em' }}>
                              {insight.icon}
                            </Typography>
                            <Typography variant="body2" sx={{ color: insight.color, fontWeight: 500 }}>
                              {insight.text}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    );
                  })()}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFinancial} color="inherit">
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Formula Details Dialog */}
      <Dialog open={formulaDialog.value} onClose={closeFormula} maxWidth="lg" fullWidth>
        <DialogTitle>Formula hisobotlari - {detailItem?.orderNumber}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {detailItem && detailPlans.length > 0 && (
              <>
                {detailPlans
                  .filter(plan => plan.formulaDetails && plan.formulaDetails.length > 0)
                  .map((plan) => (
                    <Card key={plan.id} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                      <Stack spacing={2}>
                        {/* Plan Header */}
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {machineTypeLabel(plan.machineType)} - {plan.machineName || plan.groupName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Status: {plan.status === 'finished' ? 'Tugallangan' : 'Jarayonda'}
                            {plan.completedAt && ` | Tugash vaqti: ${new Date(plan.completedAt).toLocaleDateString()}`}
                          </Typography>
                        </Box>

                        <Divider />

                        {/* Formula Details for each color */}
                        {plan.formulaDetails?.map((colorDetail, index) => (
                          <Box key={colorDetail.colorId} sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                            <Stack spacing={2}>
                              {/* Color Header */}
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {index + 1}-{colorDetail.colorName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                  {colorDetail.seriya && `Seriya: ${colorDetail.seriya}`}
                                  {colorDetail.marka && ` | Marka: ${colorDetail.marka}`}
                                </Typography>
                              </Box>

                              {/* Measurements Input Values */}
                              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                <Box sx={{ p: 1.5, backgroundColor: 'background.paper', borderRadius: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 500 }}>
                                    Ishlatilgan suyuq:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {parseFloat(colorDetail.measurements.ishlatilganSuyuq.toFixed(2))} kg
                                  </Typography>
                                </Box>
                                <Box sx={{ p: 1.5, backgroundColor: 'background.paper', borderRadius: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 500 }}>
                                    Qolgan suyuq:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {parseFloat(colorDetail.measurements.qolganSuyuq.toFixed(2))} kg
                                  </Typography>
                                </Box>
                                <Box sx={{ p: 1.5, backgroundColor: 'background.paper', borderRadius: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 500 }}>
                                    Razvaritel:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {parseFloat(colorDetail.measurements.razvaritel.toFixed(2))} kg
                                  </Typography>
                                </Box>
                                <Box sx={{ p: 1.5, backgroundColor: 'background.paper', borderRadius: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>
                                    Qolgan mahsulot:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {parseFloat(colorDetail.measurements.qolganMahsulot.toFixed(2))} kg
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Formula Calculations */}
                              <Box sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                  Formula hisobotlari:
                                </Typography>
                                
                                <Stack spacing={2}>
                                  {/* Quyuq kraska formula */}
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500 }}>
                                      1. Quyuq kraska formulasi:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
                                      {colorDetail.formulas.quyuqKraska.formula}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 500, mt: 0.5 }}>
                                      {colorDetail.formulas.quyuqKraska.calculation} = {parseFloat(colorDetail.formulas.quyuqKraska.result.toFixed(2))} kg
                                    </Typography>
                                  </Box>

                                  {/* Razvaritel formula */}
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500 }}>
                                      2. Razvaritel formulasi:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
                                      {colorDetail.formulas.razvaritel.formula}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 500, mt: 0.5 }}>
                                      {colorDetail.formulas.razvaritel.calculation} = {parseFloat(colorDetail.formulas.razvaritel.result.toFixed(2))} kg
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                            </Stack>
                          </Box>
                        ))}

                        {/* Production Summary */}
                        {plan.totalMeters || plan.totalKg ? (
                          <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              Ishlab chiqarish natijalari:
                            </Typography>
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                              {plan.totalMeters && (
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Umumiy metr:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {parseFloat(plan.totalMeters.toFixed(2))} m
                                  </Typography>
                                </Box>
                              )}
                              {plan.totalKg && (
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Umumiy kilogram:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {parseFloat(plan.totalKg.toFixed(2))} kg
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        ) : null}
                      </Stack>
                    </Card>
                  ))}

                {detailPlans.filter(plan => !plan.formulaDetails || plan.formulaDetails.length === 0).length > 0 && (
                  <Box sx={{ p: 3, textAlign: 'center', backgroundColor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      Ba&apos;zi planlar uchun formula ma&apos;lumotlari mavjud emas
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                      Formula ma&apos;lumotlari faqat yangi saqlangan planlar uchun ko&apos;rsatiladi
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {detailPlans.length === 0 && (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Ushbu buyurtma uchun ishlab chiqarish rejalari topilmadi
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFormula} color="inherit">
            Yopish
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
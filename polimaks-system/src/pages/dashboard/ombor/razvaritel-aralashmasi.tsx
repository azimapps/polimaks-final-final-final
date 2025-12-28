import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { useTranslate } from 'src/locales';
import razvaritelData from 'src/data/razvaritel.json';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';

type RazvaritelType = 'eaf' | 'etilin' | 'metoksil';

interface RazvaritelItem {
  id: string;
  type: RazvaritelType;
  totalLiter: number;
  pricePerLiter: number;
  priceCurrency: string;
  seriyaNumber: string;
  supplier: string;
  description: string;
}

interface MixtureComponent {
  razvaritelId: string;
  quantity: number;
}

interface Mixture {
  id: string;
  name: string;
  eafComponent: MixtureComponent | null;
  etilinComponent: MixtureComponent | null;
  metoksilComponent: MixtureComponent | null;
  totalLiter: number;
  totalKg: number;
  pricePerLiter: number;
  pricePerKg: number;
  createdDate: string;
}

const getDensity = (type: RazvaritelType): number => {
  switch (type) {
    case 'eaf':
      return 0.78;
    case 'etilin':
      return 0.88;
    case 'metoksil':
      return 0.89;
    default:
      return 0.8;
  }
};

const RAZVARITEL_STORAGE_KEY = 'ombor-razvaritel';
const MIXTURES_STORAGE_KEY = 'ombor-razvaritel-mixtures';

const normalizeRazvaritelItems = (items: any[]): RazvaritelItem[] =>
  items.map((item, index) => ({
    id: item.id || `razvaritel-${index}`,
    type: (item.type as RazvaritelType) || 'eaf',
    totalLiter: typeof item.totalLiter === 'number' ? item.totalLiter : Number(item.totalLiter) || 0,
    pricePerLiter:
      typeof item.pricePerLiter === 'number'
        ? item.pricePerLiter
        : Number(item.pricePerLiter) || 0,
    priceCurrency: item.priceCurrency || 'USD',
    seriyaNumber: item.seriyaNumber || '',
    createdDate: item.createdDate || new Date().toISOString().slice(0, 10),
    supplier: item.supplier || '',
    description: item.description || '',
  }));

const calculateKgFromLiter = (liter: number, type: RazvaritelType): number => liter * getDensity(type);

export default function RazvaritelAralashmasiPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();
  
  // Load razvaritel data from the same source as /ombor/razvaritel
  const initialRazvaritelData = useMemo<RazvaritelItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(RAZVARITEL_STORAGE_KEY);
      if (stored) {
        try {
          return normalizeRazvaritelItems(JSON.parse(stored) as RazvaritelItem[]);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return normalizeRazvaritelItems(razvaritelData as RazvaritelItem[]);
  }, []);

  const [razvaritelItems, setRazvaritelItems] = useState<RazvaritelItem[]>(initialRazvaritelData);
  
  // Load mixtures from localStorage
  const initialMixtures = useMemo<Mixture[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MIXTURES_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as Mixture[];
        } catch {
          // ignore corrupted data
        }
      }
    }
    return [];
  }, []);
  
  const [mixtures, setMixtures] = useState<Mixture[]>(initialMixtures);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedMixture, setSelectedMixture] = useState<Mixture | null>(null);
  const [editingMixture, setEditingMixture] = useState<Mixture | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuMixture, setMenuMixture] = useState<Mixture | null>(null);
  
  const [selectedEaf, setSelectedEaf] = useState('');
  const [selectedEtilin, setSelectedEtilin] = useState('');
  const [selectedMetoksil, setSelectedMetoksil] = useState('');
  
  const [eafQuantity, setEafQuantity] = useState<number | ''>('');
  const [etilinQuantity, setEtilinQuantity] = useState<number | ''>('');
  const [metoksilQuantity, setMetoksilQuantity] = useState<number | ''>('');
  
  const [mixtureName, setMixtureName] = useState('');

  const eafItems = razvaritelItems.filter(item => item.type === 'eaf');
  const etilinItems = razvaritelItems.filter(item => item.type === 'etilin');
  const metoksilItems = razvaritelItems.filter(item => item.type === 'metoksil');

  const getSelectedItem = (id: string) => razvaritelItems.find(item => item.id === id);

  const validateQuantity = (quantity: number | '', selectedId: string): { isValid: boolean; error?: string } => {
    if (quantity === '' || quantity === 0) return { isValid: true };
    
    const item = getSelectedItem(selectedId);
    if (!item) return { isValid: false, error: t('razvaritelAralashmasiPage.validation.productNotSelected') };
    
    if (typeof quantity === 'number' && quantity > item.totalLiter) {
      return { 
        isValid: false, 
        error: `${t('razvaritelAralashmasiPage.validation.exceededQuantity')} ${item.totalLiter}L` 
      };
    }
    
    return { isValid: true };
  };

  const getQuantityError = (quantity: number | '', selectedId: string) => {
    if (!selectedId) return '';
    return validateQuantity(quantity, selectedId).error || '';
  };

  const updateRazvaritelInventory = (updates: { id: string; quantityUsed: number }[]) => {
    const updatedItems = razvaritelItems.map(item => {
      const update = updates.find(u => u.id === item.id);
      if (update) {
        return {
          ...item,
          totalLiter: Math.max(0, item.totalLiter - update.quantityUsed)
        };
      }
      return item;
    });

    // Update local state
    setRazvaritelItems(updatedItems);
    
    // Update localStorage to sync with /ombor/razvaritel page
    try {
      localStorage.setItem(RAZVARITEL_STORAGE_KEY, JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Failed to update razvaritel inventory:', error);
    }
  };

  const saveMixturesToStorage = (mixturesToSave: Mixture[]) => {
    try {
      localStorage.setItem(MIXTURES_STORAGE_KEY, JSON.stringify(mixturesToSave));
    } catch (error) {
      console.error('Failed to save mixtures:', error);
    }
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, mixture: Mixture) => {
    setMenuAnchor(event.currentTarget);
    setMenuMixture(mixture);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuMixture(null);
  };

  const handleEditMixture = (mixture: Mixture) => {
    setEditingMixture(mixture);
    setMixtureName(mixture.name);
    
    // Set component selections and quantities based on mixture
    if (mixture.eafComponent) {
      setSelectedEaf(mixture.eafComponent.razvaritelId);
      setEafQuantity(mixture.eafComponent.quantity);
    } else {
      setSelectedEaf('');
      setEafQuantity('');
    }
    
    if (mixture.etilinComponent) {
      setSelectedEtilin(mixture.etilinComponent.razvaritelId);
      setEtilinQuantity(mixture.etilinComponent.quantity);
    } else {
      setSelectedEtilin('');
      setEtilinQuantity('');
    }
    
    if (mixture.metoksilComponent) {
      setSelectedMetoksil(mixture.metoksilComponent.razvaritelId);
      setMetoksilQuantity(mixture.metoksilComponent.quantity);
    } else {
      setSelectedMetoksil('');
      setMetoksilQuantity('');
    }
    
    setOpen(true);
    closeMenu();
  };

  const handleDeleteMixture = () => {
    if (menuMixture) {
      const updatedMixtures = mixtures.filter(m => m.id !== menuMixture.id);
      setMixtures(updatedMixtures);
      saveMixturesToStorage(updatedMixtures);
      setDeleteOpen(false);
      closeMenu();
    }
  };

  const calculateTotals = () => {
    const eafNum = typeof eafQuantity === 'number' ? eafQuantity : 0;
    const etilinNum = typeof etilinQuantity === 'number' ? etilinQuantity : 0;
    const metoksilNum = typeof metoksilQuantity === 'number' ? metoksilQuantity : 0;
    
    const totalLiter = eafNum + etilinNum + metoksilNum;
    
    let totalKg = 0;
    let totalCost = 0;
    
    // Calculate weight and cost for each component
    if (eafNum > 0) {
      const eafItem = getSelectedItem(selectedEaf);
      if (eafItem) {
        totalKg += calculateKgFromLiter(eafNum, 'eaf');
        totalCost += eafNum * eafItem.pricePerLiter;
      }
    }
    if (etilinNum > 0) {
      const etilinItem = getSelectedItem(selectedEtilin);
      if (etilinItem) {
        totalKg += calculateKgFromLiter(etilinNum, 'etilin');
        totalCost += etilinNum * etilinItem.pricePerLiter;
      }
    }
    if (metoksilNum > 0) {
      const metoksilItem = getSelectedItem(selectedMetoksil);
      if (metoksilItem) {
        totalKg += calculateKgFromLiter(metoksilNum, 'metoksil');
        totalCost += metoksilNum * metoksilItem.pricePerLiter;
      }
    }
    
    const calculatedPricePerLiter = totalLiter > 0 ? totalCost / totalLiter : 0;
    const calculatedPricePerKg = totalKg > 0 ? totalCost / totalKg : 0;
    
    return { totalLiter, totalKg, calculatedPricePerLiter, calculatedPricePerKg, totalCost };
  };

  const handleCreateMixture = () => {
    if (!mixtureName.trim()) return;
    
    // Validate all quantities
    const eafValid = validateQuantity(eafQuantity, selectedEaf);
    const etilinValid = validateQuantity(etilinQuantity, selectedEtilin);
    const metoksilValid = validateQuantity(metoksilQuantity, selectedMetoksil);
    
    if (!eafValid.isValid || !etilinValid.isValid || !metoksilValid.isValid) {
      return; // Don't create if validation fails
    }
    
    const { totalLiter, totalKg, calculatedPricePerLiter, calculatedPricePerKg } = calculateTotals();
    const eafNum = typeof eafQuantity === 'number' ? eafQuantity : 0;
    const etilinNum = typeof etilinQuantity === 'number' ? etilinQuantity : 0;
    const metoksilNum = typeof metoksilQuantity === 'number' ? metoksilQuantity : 0;
    
    // Prepare inventory updates for decrementing used quantities
    const inventoryUpdates = [];
    if (selectedEaf && eafNum > 0) {
      inventoryUpdates.push({ id: selectedEaf, quantityUsed: eafNum });
    }
    if (selectedEtilin && etilinNum > 0) {
      inventoryUpdates.push({ id: selectedEtilin, quantityUsed: etilinNum });
    }
    if (selectedMetoksil && metoksilNum > 0) {
      inventoryUpdates.push({ id: selectedMetoksil, quantityUsed: metoksilNum });
    }
    
    // Update inventory only for new mixtures (not when editing)
    if (!editingMixture && inventoryUpdates.length > 0) {
      updateRazvaritelInventory(inventoryUpdates);
    }
    
    const mixtureData: Mixture = {
      id: editingMixture ? editingMixture.id : `mixture-${Date.now()}`,
      name: mixtureName,
      eafComponent: selectedEaf && eafNum > 0 ? { razvaritelId: selectedEaf, quantity: eafNum } : null,
      etilinComponent: selectedEtilin && etilinNum > 0 ? { razvaritelId: selectedEtilin, quantity: etilinNum } : null,
      metoksilComponent: selectedMetoksil && metoksilNum > 0 ? { razvaritelId: selectedMetoksil, quantity: metoksilNum } : null,
      totalLiter,
      totalKg,
      pricePerLiter: calculatedPricePerLiter,
      pricePerKg: calculatedPricePerKg,
      createdDate: editingMixture ? editingMixture.createdDate : new Date().toISOString().slice(0, 10),
    };
    
    let updatedMixtures: Mixture[];
    if (editingMixture) {
      updatedMixtures = mixtures.map(m => m.id === editingMixture.id ? mixtureData : m);
    } else {
      updatedMixtures = [...mixtures, mixtureData];
    }
    
    setMixtures(updatedMixtures);
    saveMixturesToStorage(updatedMixtures);
    
    // Reset form
    setMixtureName('');
    setSelectedEaf('');
    setSelectedEtilin('');
    setSelectedMetoksil('');
    setEafQuantity('');
    setEtilinQuantity('');
    setMetoksilQuantity('');
    setEditingMixture(null);
    setOpen(false);
  };

  const { totalLiter, totalKg, calculatedPricePerLiter, calculatedPricePerKg } = calculateTotals();

  return (
    <DashboardContent>
      <Container maxWidth="xl">
        <CustomBreadcrumbs
          heading={t('razvaritelAralashmasiPage.breadcrumbTitle')}
          links={[
            { name: 'Dashboard', href: '/' },
            { name: 'Ombor', href: '/ombor' },
            { name: t('razvaritelAralashmasiPage.breadcrumbTitle') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Box sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h6">{t('razvaritelAralashmasiPage.title')}</Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate(paths.dashboard.ombor.razvaritelAralashmasiTransactions)}
                >
                  {t('razvaritelAralashmasiPage.transactions')}
                </Button>
              </Stack>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => {
                  setEditingMixture(null);
                  setMixtureName('');
                  setSelectedEaf('');
                  setSelectedEtilin('');
                  setSelectedMetoksil('');
                  setEafQuantity('');
                  setEtilinQuantity('');
                  setMetoksilQuantity('');
                  setOpen(true);
                }}
              >
                {t('razvaritelAralashmasiPage.createNew')}
              </Button>
            </Stack>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('razvaritelAralashmasiPage.table.name')}</TableCell>
                    <TableCell>{t('razvaritelAralashmasiPage.table.totalLiters')}</TableCell>
                    <TableCell>{t('razvaritelAralashmasiPage.table.totalKg')}</TableCell>
                    <TableCell>{t('razvaritelAralashmasiPage.table.pricePerLiter')}</TableCell>
                    <TableCell>{t('razvaritelAralashmasiPage.table.pricePerKg')}</TableCell>
                    <TableCell>{t('razvaritelAralashmasiPage.table.date')}</TableCell>
                    <TableCell>{t('razvaritelAralashmasiPage.table.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mixtures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('razvaritelAralashmasiPage.table.emptyState')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    mixtures.map((mixture) => (
                      <TableRow key={mixture.id}>
                        <TableCell>{mixture.name}</TableCell>
                        <TableCell>{mixture.totalLiter.toFixed(2)} L</TableCell>
                        <TableCell>{mixture.totalKg.toFixed(2)} KG</TableCell>
                        <TableCell>${mixture.pricePerLiter.toFixed(2)}</TableCell>
                        <TableCell>${mixture.pricePerKg.toFixed(2)}</TableCell>
                        <TableCell>{mixture.createdDate}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={(e) => openMenu(e, mixture)}>
                            <Iconify icon="eva:more-vertical-fill" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingMixture ? t('razvaritelAralashmasiPage.dialogs.edit.title') : t('razvaritelAralashmasiPage.dialogs.create.title')}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label={t('razvaritelAralashmasiPage.form.mixtureName')}
                value={mixtureName}
                onChange={(e) => setMixtureName(e.target.value)}
              />

              <Stack direction="row" spacing={2}>
                {/* EAF Selection */}
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('razvaritelAralashmasiPage.form.eafRazvaritel')}</InputLabel>
                    <Select
                      value={selectedEaf}
                      onChange={(e) => setSelectedEaf(e.target.value)}
                    >
                      {eafItems.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.seriyaNumber} ({item.totalLiter}L {t('razvaritelAralashmasiPage.form.available')})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedEaf && (
                    <TextField
                      fullWidth
                      label={t('razvaritelAralashmasiPage.form.quantityL')}
                      type="number"
                      value={eafQuantity}
                      placeholder="0"
                      onChange={(e) => {
                        const value = e.target.value;
                        setEafQuantity(value === '' ? '' : Number(value));
                      }}
                      error={!!getQuantityError(eafQuantity, selectedEaf)}
                      inputProps={{ 
                        max: getSelectedItem(selectedEaf)?.totalLiter || 0,
                        min: 0 
                      }}
                      sx={{ mt: 2 }}
                      helperText={getQuantityError(eafQuantity, selectedEaf) || `${t('razvaritelAralashmasiPage.form.available')}: ${getSelectedItem(selectedEaf)?.totalLiter || 0}L`}
                    />
                  )}
                </Box>

                {/* Etilin Selection */}
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('razvaritelAralashmasiPage.form.etilinRazvaritel')}</InputLabel>
                    <Select
                      value={selectedEtilin}
                      onChange={(e) => setSelectedEtilin(e.target.value)}
                    >
                      {etilinItems.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.seriyaNumber} ({item.totalLiter}L {t('razvaritelAralashmasiPage.form.available')})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedEtilin && (
                    <TextField
                      fullWidth
                      label={t('razvaritelAralashmasiPage.form.quantityL')}
                      type="number"
                      value={etilinQuantity}
                      placeholder="0"
                      onChange={(e) => {
                        const value = e.target.value;
                        setEtilinQuantity(value === '' ? '' : Number(value));
                      }}
                      error={!!getQuantityError(etilinQuantity, selectedEtilin)}
                      inputProps={{ 
                        max: getSelectedItem(selectedEtilin)?.totalLiter || 0,
                        min: 0 
                      }}
                      sx={{ mt: 2 }}
                      helperText={getQuantityError(etilinQuantity, selectedEtilin) || `${t('razvaritelAralashmasiPage.form.available')}: ${getSelectedItem(selectedEtilin)?.totalLiter || 0}L`}
                    />
                  )}
                </Box>

                {/* Metoksil Selection */}
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('razvaritelAralashmasiPage.form.metoksilRazvaritel')}</InputLabel>
                    <Select
                      value={selectedMetoksil}
                      onChange={(e) => setSelectedMetoksil(e.target.value)}
                    >
                      {metoksilItems.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.seriyaNumber} ({item.totalLiter}L {t('razvaritelAralashmasiPage.form.available')})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedMetoksil && (
                    <TextField
                      fullWidth
                      label={t('razvaritelAralashmasiPage.form.quantityL')}
                      type="number"
                      value={metoksilQuantity}
                      placeholder="0"
                      onChange={(e) => {
                        const value = e.target.value;
                        setMetoksilQuantity(value === '' ? '' : Number(value));
                      }}
                      error={!!getQuantityError(metoksilQuantity, selectedMetoksil)}
                      inputProps={{ 
                        max: getSelectedItem(selectedMetoksil)?.totalLiter || 0,
                        min: 0 
                      }}
                      sx={{ mt: 2 }}
                      helperText={getQuantityError(metoksilQuantity, selectedMetoksil) || `${t('razvaritelAralashmasiPage.form.available')}: ${getSelectedItem(selectedMetoksil)?.totalLiter || 0}L`}
                    />
                  )}
                </Box>
              </Stack>


              {/* Totals Display */}
              {totalLiter > 0 && (
                <Card sx={{ p: 2, backgroundColor: 'background.neutral' }}>
                  <Typography variant="h6" gutterBottom>
                    {t('razvaritelAralashmasiPage.form.summary.title')}:
                  </Typography>
                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('razvaritelAralashmasiPage.form.summary.totalLiters')}:
                      </Typography>
                      <Typography variant="h6">
                        {totalLiter.toFixed(2)} L
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('razvaritelAralashmasiPage.form.summary.totalKg')}:
                      </Typography>
                      <Typography variant="h6">
                        {totalKg.toFixed(2)} KG
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('razvaritelAralashmasiPage.form.summary.pricePerLiter')}:
                      </Typography>
                      <Typography variant="h6">
                        ${calculatedPricePerLiter.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('razvaritelAralashmasiPage.form.summary.pricePerKg')}:
                      </Typography>
                      <Typography variant="h6">
                        ${calculatedPricePerKg.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>
              {t('razvaritelAralashmasiPage.buttons.cancel')}
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateMixture}
              disabled={
                !mixtureName.trim() || 
                totalLiter === 0 ||
                !!getQuantityError(eafQuantity, selectedEaf) ||
                !!getQuantityError(etilinQuantity, selectedEtilin) ||
                !!getQuantityError(metoksilQuantity, selectedMetoksil)
              }
            >
              {editingMixture ? t('razvaritelAralashmasiPage.buttons.save') : t('razvaritelAralashmasiPage.buttons.createMixture')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Mixture Dialog */}
        <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{t('razvaritelAralashmasiPage.dialogs.view.title')}</DialogTitle>
          <DialogContent>
            {selectedMixture && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedMixture.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('razvaritelAralashmasiPage.dialogs.view.createdDate')}: {selectedMixture.createdDate}
                  </Typography>
                </Box>

                <Card sx={{ p: 2, backgroundColor: 'background.neutral' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('razvaritelAralashmasiPage.dialogs.view.generalInfo')}
                  </Typography>
                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('razvaritelAralashmasiPage.dialogs.view.totalLiters')}:
                      </Typography>
                      <Typography variant="h6">
                        {selectedMixture.totalLiter.toFixed(2)} L
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('razvaritelAralashmasiPage.dialogs.view.totalKg')}:
                      </Typography>
                      <Typography variant="h6">
                        {selectedMixture.totalKg.toFixed(2)} KG
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('razvaritelAralashmasiPage.dialogs.view.pricePerLiter')}:
                      </Typography>
                      <Typography variant="h6">
                        ${selectedMixture.pricePerLiter.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('razvaritelAralashmasiPage.dialogs.view.pricePerKg')}:
                      </Typography>
                      <Typography variant="h6">
                        ${selectedMixture.pricePerKg.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('razvaritelAralashmasiPage.dialogs.view.components')}
                  </Typography>
                  <Stack spacing={2}>
                    {selectedMixture.eafComponent && (
                      <Card sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              EAF Razvaritel
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getSelectedItem(selectedMixture.eafComponent.razvaritelId)?.seriyaNumber || 'ID: ' + selectedMixture.eafComponent.razvaritelId}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1">
                              {selectedMixture.eafComponent.quantity} L
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ({calculateKgFromLiter(selectedMixture.eafComponent.quantity, 'eaf').toFixed(2)} kg)
                            </Typography>
                          </Box>
                        </Stack>
                      </Card>
                    )}

                    {selectedMixture.etilinComponent && (
                      <Card sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              Etilin Razvaritel
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getSelectedItem(selectedMixture.etilinComponent.razvaritelId)?.seriyaNumber || 'ID: ' + selectedMixture.etilinComponent.razvaritelId}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1">
                              {selectedMixture.etilinComponent.quantity} L
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ({calculateKgFromLiter(selectedMixture.etilinComponent.quantity, 'etilin').toFixed(2)} kg)
                            </Typography>
                          </Box>
                        </Stack>
                      </Card>
                    )}

                    {selectedMixture.metoksilComponent && (
                      <Card sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              Metoksil Razvaritel
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getSelectedItem(selectedMixture.metoksilComponent.razvaritelId)?.seriyaNumber || 'ID: ' + selectedMixture.metoksilComponent.razvaritelId}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1">
                              {selectedMixture.metoksilComponent.quantity} L
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ({calculateKgFromLiter(selectedMixture.metoksilComponent.quantity, 'metoksil').toFixed(2)} kg)
                            </Typography>
                          </Box>
                        </Stack>
                      </Card>
                    )}
                  </Stack>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewOpen(false)}>
              {t('razvaritelAralashmasiPage.buttons.close')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{t('razvaritelAralashmasiPage.dialogs.delete.title')}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('razvaritelAralashmasiPage.dialogs.delete.content')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)} color="inherit">
              {t('razvaritelAralashmasiPage.buttons.cancel')}
            </Button>
            <Button onClick={handleDeleteMixture} color="error" variant="contained">
              {t('razvaritelAralashmasiPage.buttons.delete')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Actions Menu */}
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              if (menuMixture) {
                setSelectedMixture(menuMixture);
                setViewOpen(true);
              }
              closeMenu();
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} height={18} style={{ marginRight: 8 }} />
            {t('razvaritelAralashmasiPage.menu.view')}
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuMixture) {
                handleEditMixture(menuMixture);
              }
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} height={18} style={{ marginRight: 8 }} />
            {t('razvaritelAralashmasiPage.menu.edit')}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDeleteOpen(true);
              closeMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} height={18} style={{ marginRight: 8 }} />
            {t('razvaritelAralashmasiPage.menu.delete')}
          </MenuItem>
        </Menu>
      </Container>
    </DashboardContent>
  );
}
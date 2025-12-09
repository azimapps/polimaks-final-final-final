/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';

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

type Material = 'BOPP' | 'CPP' | 'PE' | 'PET';
type OrderStatus = 'planning' | 'in_progress' | 'completed' | 'cancelled';

// OrderBook integration types
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
  startDate: string; // ISO date - production start
  endDate: string; // ISO date - production end
};

type OrderPlanItem = {
  id: string;
  date: string; // ISO date
  orderNumber: string;
  clientName: string;
  title: string;
  quantityKg: number;
  material: Material;
  subMaterial: string;
  filmThickness: number; // microns
  filmWidth: number; // mm
  cylinderLength: number; // mm
  cylinderCount: number;
  printingMachine: string;
  responsiblePerson: string;
  notes: string;
  status: OrderStatus;
};

const MATERIAL_CATEGORIES: Record<Material, string[]> = {
  BOPP: ['prazrachniy', 'metal', 'jemchuk', 'jemchuk metal'],
  CPP: ['prazrachniy', 'beliy', 'metal'],
  PE: ['prazrachniy', 'beliy'],
  PET: ['prazrachniy', 'metal', 'beliy'],
};

const PRINTING_MACHINES = [
  'Печатная машина №1',
  'Печатная машина №2',
  'Печатная машина №3',
  'Печатная машина №4',
  'Печатная машина №5',
];

const STATUS_COLORS: Record<OrderStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  planning: 'default',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

// OrderBook integration utilities
const ORDER_BOOK_STORAGE_KEY = 'clients-order-book';

const loadOrderBookItems = (): OrderBookItem[] => {
  try {
    const stored = localStorage.getItem(ORDER_BOOK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const convertOrderBookToOrderPlan = (orderBookItem: OrderBookItem): Omit<OrderPlanItem, 'id'> => ({
  date: orderBookItem.date,
  orderNumber: orderBookItem.orderNumber,
  clientName: orderBookItem.clientName,
  title: orderBookItem.title,
  quantityKg: orderBookItem.quantityKg,
  material: orderBookItem.material,
  subMaterial: orderBookItem.subMaterial,
  filmThickness: orderBookItem.filmThickness,
  filmWidth: orderBookItem.filmWidth,
  cylinderLength: orderBookItem.cylinderLength,
  cylinderCount: orderBookItem.cylinderCount,
  printingMachine: '', // New field - to be filled manually
  responsiblePerson: '', // New field - to be filled manually  
  notes: '', // New field - to be filled manually
  status: 'planning' as OrderStatus, // Default status
});

// ----------------------------------------------------------------------

export default function BuyurtmaPlanlashtirish() {
  const { t } = useTranslate('pages');
  
  const [orderPlans, setOrderPlans] = useState<OrderPlanItem[]>(() => {
    const saved = localStorage.getItem('orderPlans');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedOrder, setSelectedOrder] = useState<OrderPlanItem | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const editDialog = useBoolean();
  const importDialog = useBoolean();
  
  // Order Book integration state
  const [availableOrderBookItems, setAvailableOrderBookItems] = useState<OrderBookItem[]>([]);
  const [selectedOrderBookItems, setSelectedOrderBookItems] = useState<OrderBookItem[]>([]);
  const [importSearchQuery, setImportSearchQuery] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<Partial<OrderPlanItem>>({
    date: new Date().toISOString().split('T')[0],
    orderNumber: '',
    clientName: '',
    title: '',
    quantityKg: 0,
    material: 'BOPP',
    subMaterial: '',
    filmThickness: 0,
    filmWidth: 0,
    cylinderLength: 0,
    cylinderCount: 1,
    printingMachine: '',
    responsiblePerson: '',
    notes: '',
    status: 'planning',
  });

  const availableSubMaterials = useMemo(() => 
    formData.material ? MATERIAL_CATEGORIES[formData.material] || [] : [],
    [formData.material]
  );

  // Filter order book items based on search and exclude already imported orders
  const filteredOrderBookItems = useMemo(() => {
    const existingOrderNumbers = new Set(orderPlans.map(plan => plan.orderNumber));
    
    return availableOrderBookItems.filter(item => {
      // Exclude already imported orders
      if (existingOrderNumbers.has(item.orderNumber)) return false;
      
      // Apply search filter
      if (importSearchQuery.trim()) {
        const query = importSearchQuery.toLowerCase();
        return (
          item.orderNumber.toLowerCase().includes(query) ||
          item.clientName.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [availableOrderBookItems, orderPlans, importSearchQuery]);

  const title = `${t('buyurtmaPlanlashtirish.title')} | ${CONFIG.appName}`;

  // Save to localStorage whenever orderPlans changes
  const saveOrderPlans = (plans: OrderPlanItem[]) => {
    localStorage.setItem('orderPlans', JSON.stringify(plans));
    setOrderPlans(plans);
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, order: OrderPlanItem) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleEdit = () => {
    if (selectedOrder) {
      setFormData(selectedOrder);
      editDialog.onTrue();
    }
    handleCloseMenu();
  };

  const handleDelete = () => {
    if (selectedOrder) {
      const updatedPlans = orderPlans.filter((order) => order.id !== selectedOrder.id);
      saveOrderPlans(updatedPlans);
    }
    handleCloseMenu();
  };

  const handleAdd = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      orderNumber: `ORD-${Date.now()}`,
      clientName: '',
      title: '',
      quantityKg: 0,
      material: 'BOPP',
      subMaterial: '',
      filmThickness: 0,
      filmWidth: 0,
      cylinderLength: 0,
      cylinderCount: 1,
      printingMachine: '',
      responsiblePerson: '',
      notes: '',
      status: 'planning',
    });
    editDialog.onTrue();
  };

  const handleSave = () => {
    if (!formData.clientName || !formData.title || !formData.orderNumber) {
      return;
    }

    const orderToSave: OrderPlanItem = {
      id: formData.id || uuidv4(),
      date: formData.date || new Date().toISOString().split('T')[0],
      orderNumber: formData.orderNumber || '',
      clientName: formData.clientName || '',
      title: formData.title || '',
      quantityKg: formData.quantityKg || 0,
      material: formData.material || 'BOPP',
      subMaterial: formData.subMaterial || '',
      filmThickness: formData.filmThickness || 0,
      filmWidth: formData.filmWidth || 0,
      cylinderLength: formData.cylinderLength || 0,
      cylinderCount: formData.cylinderCount || 1,
      printingMachine: formData.printingMachine || '',
      responsiblePerson: formData.responsiblePerson || '',
      notes: formData.notes || '',
      status: formData.status || 'planning',
    };

    if (formData.id) {
      // Edit existing
      const updatedPlans = orderPlans.map((order) =>
        order.id === formData.id ? orderToSave : order
      );
      saveOrderPlans(updatedPlans);
    } else {
      // Add new
      saveOrderPlans([...orderPlans, orderToSave]);
    }

    editDialog.onFalse();
  };

  const handleMaterialChange = (material: Material) => {
    setFormData((prev) => ({
      ...prev,
      material,
      subMaterial: '', // Reset sub-material when main material changes
    }));
  };

  // Import from Order Book handlers
  const handleOpenImport = () => {
    const orderBookItems = loadOrderBookItems();
    setAvailableOrderBookItems(orderBookItems);
    setSelectedOrderBookItems([]);
    setImportSearchQuery('');
    importDialog.onTrue();
  };

  const handleSelectOrderBookItem = (item: OrderBookItem, isSelected: boolean) => {
    setSelectedOrderBookItems(prev => {
      if (isSelected) {
        return [...prev, item];
      } else {
        return prev.filter(selectedItem => selectedItem.id !== item.id);
      }
    });
  };

  const handleSelectAllOrderBookItems = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedOrderBookItems(filteredOrderBookItems);
    } else {
      setSelectedOrderBookItems([]);
    }
  };

  const handleImportOrders = () => {
    if (selectedOrderBookItems.length === 0) return;

    // Convert and add selected orders
    const newOrderPlans: OrderPlanItem[] = selectedOrderBookItems.map(orderBookItem => ({
      id: uuidv4(),
      ...convertOrderBookToOrderPlan(orderBookItem),
    }));

    saveOrderPlans([...orderPlans, ...newOrderPlans]);
    importDialog.onFalse();
    setSelectedOrderBookItems([]);
  };

  const getStatusLabel = (status: OrderStatus) => {
    const statusObj = t('orderPlanPage.status', { returnObjects: true }) as any;
    const labels = {
      planning: statusObj.planning || 'Planning',
      in_progress: statusObj.inProgress || 'In Progress', 
      completed: statusObj.completed || 'Completed',
      cancelled: statusObj.cancelled || 'Cancelled',
    };
    return labels[status] || status;
  };

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
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              startIcon={<Iconify icon="solar:import-bold" />}
              onClick={handleOpenImport}
            >
              {t('orderPlanPage.importFromOrderBook')}
            </Button>
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
          <TableContainer sx={{ overflow: 'auto', minWidth: 1200 }}>
            <Table size="medium" sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 100, py: 2 }}>{t('orderPlanPage.date')}</TableCell>
                  <TableCell sx={{ minWidth: 120, py: 2 }}>{t('orderPlanPage.orderNumber')}</TableCell>
                  <TableCell sx={{ minWidth: 150, py: 2 }}>{t('orderPlanPage.client')}</TableCell>
                  <TableCell sx={{ minWidth: 200, py: 2 }}>{t('orderPlanPage.title')}</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100, py: 2 }}>{t('orderPlanPage.quantityKg')}</TableCell>
                  <TableCell sx={{ minWidth: 120, py: 2 }}>{t('orderPlanPage.material')}</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100, py: 2 }}>{t('orderPlanPage.filmThickness')}</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100, py: 2 }}>{t('orderPlanPage.filmWidth')}</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100, py: 2 }}>{t('orderPlanPage.cylinderLength')}</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100, py: 2 }}>{t('orderPlanPage.cylinderCount')}</TableCell>
                  <TableCell sx={{ minWidth: 160, py: 2 }}>{t('orderPlanPage.printingMachine')}</TableCell>
                  <TableCell sx={{ minWidth: 150, py: 2 }}>{t('orderPlanPage.responsiblePerson')}</TableCell>
                  <TableCell sx={{ minWidth: 120, py: 2 }}>{t('orderPlanPage.status')}</TableCell>
                  <TableCell sx={{ minWidth: 80, py: 2 }}>{t('orderPlanPage.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                        {t('orderPlanPage.empty')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orderPlans.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell sx={{ py: 2 }}>
                        {new Date(order.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>{order.orderNumber}</TableCell>
                      <TableCell sx={{ py: 2 }}>{order.clientName}</TableCell>
                      <TableCell sx={{ py: 2 }}>{order.title}</TableCell>
                      <TableCell align="right" sx={{ py: 2 }}>{order.quantityKg} {t('orderPlanPage.kg')}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {order.material}
                        {order.subMaterial && (
                          <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                            {order.subMaterial}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2 }}>{order.filmThickness} {t('orderPlanPage.microns')}</TableCell>
                      <TableCell align="right" sx={{ py: 2 }}>{order.filmWidth} {t('orderPlanPage.mm')}</TableCell>
                      <TableCell align="right" sx={{ py: 2 }}>{order.cylinderLength} {t('orderPlanPage.mm')}</TableCell>
                      <TableCell align="right" sx={{ py: 2 }}>{order.cylinderCount} {t('orderPlanPage.pcs')}</TableCell>
                      <TableCell sx={{ py: 2 }}>{order.printingMachine}</TableCell>
                      <TableCell sx={{ py: 2 }}>{order.responsiblePerson}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip 
                          label={getStatusLabel(order.status)} 
                          color={STATUS_COLORS[order.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <IconButton onClick={(e) => handleOpenMenu(e, order)}>
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
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleCloseMenu}
        >
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
        <Dialog 
          open={editDialog.value} 
          onClose={editDialog.onFalse}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {formData.id ? t('orderPlanPage.edit') : t('orderPlanPage.add')}
          </DialogTitle>
          
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.date')}
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.orderNumber')}
                  value={formData.orderNumber || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, orderNumber: e.target.value }))}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.client')}
                  value={formData.clientName || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.title')}
                  value={formData.title || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.quantityKg')}
                  type="number"
                  value={formData.quantityKg || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantityKg: Number(e.target.value) }))}
                  slotProps={{
                    input: {
                      endAdornment: t('orderPlanPage.kg'),
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('orderPlanPage.material')}</InputLabel>
                  <Select
                    value={formData.material || 'BOPP'}
                    label={t('orderPlanPage.material')}
                    onChange={(e) => handleMaterialChange(e.target.value as Material)}
                  >
                    <MenuItem value="BOPP">BOPP</MenuItem>
                    <MenuItem value="CPP">CPP</MenuItem>
                    <MenuItem value="PE">PE</MenuItem>
                    <MenuItem value="PET">PET</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {availableSubMaterials.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('orderPlanPage.subMaterial')}</InputLabel>
                    <Select
                      value={formData.subMaterial || ''}
                      label={t('orderPlanPage.subMaterial')}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subMaterial: e.target.value }))}
                    >
                      <MenuItem value="">
                        <em>{t('orderPlanPage.selectSubMaterial')}</em>
                      </MenuItem>
                      {availableSubMaterials.map((subMaterial) => (
                        <MenuItem key={subMaterial} value={subMaterial}>
                          {subMaterial}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.filmThickness')}
                  type="number"
                  value={formData.filmThickness || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, filmThickness: Number(e.target.value) }))}
                  slotProps={{
                    input: {
                      endAdornment: t('orderPlanPage.microns'),
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.filmWidth')}
                  type="number"
                  value={formData.filmWidth || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, filmWidth: Number(e.target.value) }))}
                  slotProps={{
                    input: {
                      endAdornment: t('orderPlanPage.mm'),
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.cylinderLength')}
                  type="number"
                  value={formData.cylinderLength || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cylinderLength: Number(e.target.value) }))}
                  slotProps={{
                    input: {
                      endAdornment: t('orderPlanPage.mm'),
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.cylinderCount')}
                  type="number"
                  value={formData.cylinderCount || 1}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cylinderCount: Number(e.target.value) }))}
                  slotProps={{
                    input: {
                      endAdornment: t('orderPlanPage.pcs'),
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('orderPlanPage.printingMachine')}</InputLabel>
                  <Select
                    value={formData.printingMachine || ''}
                    label={t('orderPlanPage.printingMachine')}
                    onChange={(e) => setFormData((prev) => ({ ...prev, printingMachine: e.target.value }))}
                  >
                    <MenuItem value="">
                      <em>{t('orderPlanPage.selectMachine')}</em>
                    </MenuItem>
                    {PRINTING_MACHINES.map((machine) => (
                      <MenuItem key={machine} value={machine}>
                        {machine}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.responsiblePerson')}
                  value={formData.responsiblePerson || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, responsiblePerson: e.target.value }))}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('orderPlanPage.status')}</InputLabel>
                  <Select
                    value={formData.status || 'planning'}
                    label={t('orderPlanPage.status')}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as OrderStatus }))}
                  >
                    <MenuItem value="planning">{getStatusLabel('planning')}</MenuItem>
                    <MenuItem value="in_progress">{getStatusLabel('in_progress')}</MenuItem>
                    <MenuItem value="completed">{getStatusLabel('completed')}</MenuItem>
                    <MenuItem value="cancelled">{getStatusLabel('cancelled')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('orderPlanPage.notes')}
                  multiline
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={editDialog.onFalse}>
              {t('orderPlanPage.cancel')}
            </Button>
            <Button variant="contained" onClick={handleSave}>
              {t('orderPlanPage.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Import from Order Book Dialog */}
        <Dialog 
          open={importDialog.value} 
          onClose={importDialog.onFalse}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {t('orderPlanPage.importFromOrderBook')}
          </DialogTitle>
          
          <DialogContent dividers>
            <Stack spacing={3}>
              {/* Search */}
              <TextField
                fullWidth
                placeholder={t('orderPlanPage.searchOrders')}
                value={importSearchQuery}
                onChange={(e) => setImportSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', mr: 1 }} />,
                  }
                }}
              />

              {/* Selection Controls */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {selectedOrderBookItems.length > 0 
                    ? `${selectedOrderBookItems.length} ${t('orderPlanPage.ordersSelected')}`
                    : t('orderPlanPage.selectOrdersToImport')
                  }
                </Typography>
                
                {filteredOrderBookItems.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => handleSelectAllOrderBookItems(selectedOrderBookItems.length !== filteredOrderBookItems.length)}
                  >
                    {selectedOrderBookItems.length === filteredOrderBookItems.length 
                      ? t('orderPlanPage.deselectAll') 
                      : t('orderPlanPage.selectAll')
                    }
                  </Button>
                )}
              </Stack>

              {/* Order Book Items Table */}
              <Card>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" />
                        <TableCell>{t('orderPlanPage.orderNumber')}</TableCell>
                        <TableCell>{t('orderPlanPage.client')}</TableCell>
                        <TableCell>{t('orderPlanPage.title')}</TableCell>
                        <TableCell>{t('orderPlanPage.quantityKg')}</TableCell>
                        <TableCell>{t('orderPlanPage.material')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredOrderBookItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                              {availableOrderBookItems.length === 0 
                                ? t('orderPlanPage.noOrdersInOrderBook')
                                : t('orderPlanPage.noOrdersMatch')
                              }
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrderBookItems.map((item) => {
                          const isSelected = selectedOrderBookItems.some(selected => selected.id === item.id);
                          
                          return (
                            <TableRow key={item.id} hover selected={isSelected}>
                              <TableCell padding="checkbox">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => handleSelectOrderBookItem(item, e.target.checked)}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {item.orderNumber}
                                </Typography>
                              </TableCell>
                              <TableCell>{item.clientName}</TableCell>
                              <TableCell>{item.title}</TableCell>
                              <TableCell>{item.quantityKg} {t('orderPlanPage.kg')}</TableCell>
                              <TableCell>
                                {item.material}
                                {item.subMaterial && (
                                  <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                    {item.subMaterial}
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              {selectedOrderBookItems.length > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('orderPlanPage.importHint')}
                </Typography>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={importDialog.onFalse}>
              {t('orderPlanPage.cancel')}
            </Button>
            <Button 
              variant="contained" 
              onClick={handleImportOrders}
              disabled={selectedOrderBookItems.length === 0}
            >
              {t('orderPlanPage.importSelected')} ({selectedOrderBookItems.length})
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
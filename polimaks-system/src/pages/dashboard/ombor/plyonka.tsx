/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
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
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import seedData from 'src/data/plyonka.json';
import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

type CategoryKey = 'BOPP' | 'CPP' | 'PE' | 'PET';
type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';

type PlyonkaItem = {
  id: string;
  category: CategoryKey;
  subcategory: string;
  totalKg: number;
  thickness: number;
  width: number;
  pricePerKg: number;
  priceCurrency: Currency;
  seriyaNumber: string;
  createdDate: string;
  admin: string;
  description: string;
};

const CATEGORIES: Record<CategoryKey, string[]> = {
  BOPP: ['prazrachniy', 'metal', 'jemchuk', 'jemchuk metal'],
  CPP: ['prazrachniy', 'beliy', 'metal'],
  PE: ['prazrachniy', 'beliy'],
  PET: ['prazrachniy', 'metal', 'beliy'],
};

const STORAGE_KEY = 'ombor-plyonka';

const todayISO = () => new Date().toISOString().slice(0, 10);

const normalizeItems = (items: (Partial<PlyonkaItem> & { id?: string })[]): PlyonkaItem[] =>
  items.map((item, index) => {
    const currency: Currency = ['UZS', 'USD', 'RUB', 'EUR'].includes(
      item.priceCurrency as Currency
    )
      ? (item.priceCurrency as Currency)
      : 'UZS';

    return {
      id: item.id || `plyonka-${index}`,
      category: (item.category as CategoryKey) || 'BOPP',
      subcategory: item.subcategory || CATEGORIES.BOPP[0],
      totalKg: typeof item.totalKg === 'number' ? item.totalKg : Number(item.totalKg) || 0,
      thickness:
        typeof item.thickness === 'number' ? item.thickness : Number(item.thickness) || 0,
      width: typeof item.width === 'number' ? item.width : Number(item.width) || 0,
      pricePerKg:
        typeof item.pricePerKg === 'number' ? item.pricePerKg : Number(item.pricePerKg) || 0,
      priceCurrency: currency,
      seriyaNumber: item.seriyaNumber || '',
      createdDate: item.createdDate || todayISO(),
      admin: item.admin || '',
      description: item.description || '',
    };
  });

export default function PlyonkaPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();

  const title = `${t('inventory.items.plyonka.title')} | ${CONFIG.appName}`;

  const allCategoryValue = 'all';
  const allSubcategoryValue = 'all';

  const initialData = useMemo<PlyonkaItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return normalizeItems(JSON.parse(stored) as PlyonkaItem[]);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return normalizeItems(seedData as PlyonkaItem[]);
  }, []);

  const [items, setItems] = useState<PlyonkaItem[]>(initialData);
  const [editing, setEditing] = useState<PlyonkaItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<PlyonkaItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PlyonkaItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<CategoryKey | typeof allCategoryValue>(
    allCategoryValue
  );
  const [filterSubcategory, setFilterSubcategory] = useState<string>(allSubcategoryValue);
  const [transactionsTarget, setTransactionsTarget] = useState<PlyonkaItem | null>(null);
  const [form, setForm] = useState<
    Omit<PlyonkaItem, 'id' | 'totalKg' | 'pricePerKg' | 'thickness' | 'width'> & {
      totalKg: string;
      pricePerKg: string;
      thickness: string;
      width: string;
    }
  >({
    category: 'BOPP',
    subcategory: CATEGORIES.BOPP[0],
    totalKg: '',
    thickness: '',
    width: '',
    pricePerKg: '',
    priceCurrency: 'UZS',
    seriyaNumber: '',
    createdDate: todayISO(),
    admin: '',
    description: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();
  const transactionsDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: PlyonkaItem[]) => PlyonkaItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      category: 'BOPP',
      subcategory: CATEGORIES.BOPP[0],
      totalKg: '',
      thickness: '',
      width: '',
      pricePerKg: '',
      priceCurrency: 'UZS',
      seriyaNumber: '',
      createdDate: todayISO(),
      admin: '',
      description: '',
    });
    dialog.onTrue();
  };

  const openTransactionsSearch = () => {
    setTransactionsTarget(null);
    transactionsDialog.onTrue();
  };

  const openEdit = (item: PlyonkaItem) => {
    setEditing(item);
    setForm({
      category: item.category,
      subcategory: item.subcategory,
      totalKg: item.totalKg ? String(item.totalKg) : '',
      thickness: item.thickness ? String(item.thickness) : '',
      width: item.width ? String(item.width) : '',
      pricePerKg: item.pricePerKg ? String(item.pricePerKg) : '',
      priceCurrency: item.priceCurrency,
      seriyaNumber: item.seriyaNumber,
      createdDate: item.createdDate || todayISO(),
      admin: item.admin || '',
      description: item.description,
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    const totalKgNum = parseFloat(form.totalKg) || 0;
    const thicknessNum = parseFloat(form.thickness) || 0;
    const widthNum = parseFloat(form.width) || 0;
    const pricePerKgNum = parseFloat(form.pricePerKg) || 0;
    const payload: PlyonkaItem = {
      id: editing ? editing.id : uuidv4(),
      ...form,
      admin: form.admin.trim(),
      createdDate: form.createdDate || todayISO(),
      totalKg: totalKgNum,
      thickness: thicknessNum,
      width: widthNum,
      pricePerKg: pricePerKgNum,
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: PlyonkaItem) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const onCategoryChange = (category: CategoryKey) => {
    const defaultSub = CATEGORIES[category][0];
    setForm((prev) => ({ ...prev, category, subcategory: defaultSub }));
  };

  const onFilterCategoryChange = (value: CategoryKey | typeof allCategoryValue) => {
    setFilterCategory(value);
    setFilterSubcategory(allSubcategoryValue);
  };

  const subcategoryFilterOptions = useMemo(() => {
    if (filterCategory !== allCategoryValue) {
      return CATEGORIES[filterCategory];
    }
    return [];
  }, [filterCategory]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchCategory =
          filterCategory === allCategoryValue ? true : item.category === filterCategory;
        const matchSub =
          filterSubcategory === allSubcategoryValue ? true : item.subcategory === filterSubcategory;
        return matchCategory && matchSub;
      }),
    [filterCategory, filterSubcategory, items]
  );

  const canSave =
    form.category &&
    form.subcategory &&
    parseFloat(form.totalKg) > 0 &&
    parseFloat(form.thickness) > 0 &&
    parseFloat(form.width) > 0 &&
    parseFloat(form.pricePerKg) > 0 &&
    form.seriyaNumber.trim() &&
    form.admin.trim() &&
    form.createdDate;

  const currencyLabel = (code: Currency) => {
    switch (code) {
      case 'UZS':
        return t('plyonkaPage.currency.uzs');
      case 'USD':
        return t('plyonkaPage.currency.usd');
      case 'RUB':
        return t('plyonkaPage.currency.rub');
      case 'EUR':
        return t('plyonkaPage.currency.eur');
      default:
        return code;
    }
  };

  const transactionsFilterOptions = createFilterOptions<PlyonkaItem>({
    stringify: (option) =>
      `${option.id} ${option.seriyaNumber} ${option.category} ${option.subcategory} ${option.admin}`,
  });

  const formatTransactionsOption = (item: PlyonkaItem) => {
    const seriya = item.seriyaNumber || item.id;
    return `${seriya} · ${item.category} / ${item.subcategory}`;
  };

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{t('plyonkaPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('plyonkaPage.subtitle')}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button variant="outlined" onClick={openTransactionsSearch}>
                {t('plyonkaPage.transactions')}
              </Button>
              <Button variant="contained" onClick={openAdd}>
                {t('plyonkaPage.add')}
              </Button>
            </Stack>
          </Stack>

          <Card sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label={t('plyonkaPage.filterCategory')}
              value={filterCategory}
              onChange={(e) => onFilterCategoryChange(e.target.value as CategoryKey | typeof allCategoryValue)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value={allCategoryValue}>{t('plyonkaPage.allCategories')}</MenuItem>
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
            </TextField>

            {filterCategory !== allCategoryValue ? (
              <TextField
                select
                size="small"
                label={t('plyonkaPage.filterSubcategory')}
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value={allSubcategoryValue}>{t('plyonkaPage.allSubcategories')}</MenuItem>
                {subcategoryFilterOptions.map((sub) => (
                  <MenuItem key={sub} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
          </Card>

          <Card>
            <TableContainer>
              <Table
                size="medium"
                sx={{
                  minWidth: 1500,
                  '& th, & td': { py: 1.75, px: 1.5 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 180, whiteSpace: 'nowrap' }}>
                      {t('plyonkaPage.admin')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 180, whiteSpace: 'nowrap' }}>
                      {t('plyonkaPage.receivedDate')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 180, whiteSpace: 'nowrap' }}>
                      {t('plyonkaPage.seriya')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 170, whiteSpace: 'nowrap' }}>
                      {t('plyonkaPage.category')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200, whiteSpace: 'nowrap' }}>
                      {t('plyonkaPage.subcategory')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 160, whiteSpace: 'nowrap' }}>
                      {t('plyonkaPage.totalKg')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 160, whiteSpace: 'nowrap' }}>
                      {t('plyonkaPage.thickness')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 160, whiteSpace: 'nowrap' }}>
                      {t('plyonkaPage.width')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200, whiteSpace: 'nowrap' }}>
                      {t('plyonkaPage.price')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200, whiteSpace: 'nowrap' }}>
                      {t('plyonkaPage.totalPrice')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 320 }}>{t('plyonkaPage.description')}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      {t('plyonkaPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12}>
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
                            {t('plyonkaPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('plyonkaPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {item.admin || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.createdDate}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.seriyaNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{item.category}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {item.subcategory}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.totalKg.toLocaleString()} {t('plyonkaPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.thickness.toLocaleString()} {t('plyonkaPage.microns')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.width.toLocaleString()} {t('plyonkaPage.mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.pricePerKg.toLocaleString()} {currencyLabel(item.priceCurrency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(item.totalKg * item.pricePerKg).toLocaleString()}{' '}
                            {currencyLabel(item.priceCurrency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={(e) => openMenu(e, item)}>
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
        </Stack>
      </Container>

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? t('plyonkaPage.edit') : t('plyonkaPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t('plyonkaPage.category')}
                  value={form.category}
                  onChange={(e) => onCategoryChange(e.target.value as CategoryKey)}
                >
                  {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
                    <MenuItem key={key} value={key}>
                      {key}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t('plyonkaPage.subcategory')}
                  value={form.subcategory}
                  onChange={(e) => setForm((prev) => ({ ...prev, subcategory: e.target.value }))}
                >
                  {CATEGORIES[form.category].map((sub) => (
                    <MenuItem key={sub} value={sub}>
                      {sub}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('plyonkaPage.totalKg')}
                  value={form.totalKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalKg: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('plyonkaPage.totalKg') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('plyonkaPage.thickness')}
                  value={form.thickness}
                  onChange={(e) => setForm((prev) => ({ ...prev, thickness: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('plyonkaPage.thickness') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('plyonkaPage.width')}
                  value={form.width}
                  onChange={(e) => setForm((prev) => ({ ...prev, width: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('plyonkaPage.width') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('plyonkaPage.pricePerKg')}
                  value={form.pricePerKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, pricePerKg: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01', placeholder: t('plyonkaPage.pricePerKg') }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label={t('plyonkaPage.priceCurrency')}
                  value={form.priceCurrency}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, priceCurrency: e.target.value as Currency }))
                  }
                >
                  {(['UZS', 'USD', 'RUB', 'EUR'] as Currency[]).map((cur) => (
                    <MenuItem key={cur} value={cur}>
                      {currencyLabel(cur)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('plyonkaPage.receivedDate')}
                  value={form.createdDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, createdDate: e.target.value || todayISO() }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('plyonkaPage.seriya')}
                  value={form.seriyaNumber}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, seriyaNumber: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('plyonkaPage.admin')}
                  value={form.admin}
                  onChange={(e) => setForm((prev) => ({ ...prev, admin: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('plyonkaPage.description')}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {/* TODO: replace static JSON/local storage with real API endpoints when backend is available */}
              {t('plyonkaPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('plyonkaPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('plyonkaPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('plyonkaPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('plyonkaPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('plyonkaPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('plyonkaPage.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={transactionsDialog.value}
        onClose={transactionsDialog.onFalse}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('plyonkaPage.transactionsSearchTitle')}</DialogTitle>
        <DialogContent>
          <Autocomplete
            autoHighlight
            options={items}
            value={transactionsTarget}
            onChange={(_event, value) => {
              setTransactionsTarget(value);
              if (value?.id) {
                transactionsDialog.onFalse();
                navigate(paths.dashboard.inventory.plyonkaTransactions(value.id));
              }
            }}
            getOptionLabel={formatTransactionsOption}
            filterOptions={transactionsFilterOptions}
            noOptionsText={t('plyonkaPage.transactionsSearchEmpty')}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                label={t('plyonkaPage.transactionsSearchLabel')}
                placeholder={t('plyonkaPage.transactionsSearchPlaceholder')}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={transactionsDialog.onFalse} color="inherit">
            {t('plyonkaPage.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      <ActionsMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        onEdit={() => menuItem && openEdit(menuItem)}
        onDelete={() => {
          if (menuItem) {
            setPendingDelete(menuItem);
            deleteDialog.onTrue();
          }
        }}
        labels={{
          edit: t('plyonkaPage.edit'),
          delete: t('plyonkaPage.delete'),
        }}
      />
    </>
  );
}

type ActionsMenuProps = {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: VoidFunction;
  onEdit: VoidFunction;
  onDelete: VoidFunction;
  labels: { edit: string; delete: string };
};

function ActionsMenu({ anchorEl, open, onClose, onEdit, onDelete, labels }: ActionsMenuProps) {
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem
        onClick={() => {
          onEdit();
          onClose();
        }}
      >
        <Iconify icon="solar:pen-bold" width={18} height={18} style={{ marginRight: 8 }} />
        {labels.edit}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onDelete();
          onClose();
        }}
        sx={{ color: 'error.main' }}
      >
        <Iconify icon="solar:trash-bin-trash-bold" width={18} height={18} style={{ marginRight: 8 }} />
        {labels.delete}
      </MenuItem>
    </Menu>
  );
}

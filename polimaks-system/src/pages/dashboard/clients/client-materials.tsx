import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';

import {
  Box,
  Card,
  Stack,
  Table,
  Button,
  Dialog,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tooltip,
  InputAdornment,
} from '@mui/material';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import {
  CLIENTS_STORAGE_KEY,
  MATERIALS_STORAGE_KEY,
  formatPhone,
  normalizeRecords,
  persistMaterialsRecords,
  readClientsFromStorage,
  readMaterialsRecords,
  MATERIAL_TYPES,
  FILM_CATEGORIES,
  RAZVARITEL_TYPES,
  type TollingRecord,
} from './materials-data';
import type { Client } from './clients';

type FormState = {
  type: string;
  order: string;
  quantityKg: string;
  color: string;
  filmCategory: string;
  filmSubcategory: string;
  notes: string;
};

const createForm = (): FormState => ({
  type: MATERIAL_TYPES[0],
  order: '',
  quantityKg: '',
  color: '',
  filmCategory: FILM_CATEGORIES[0]?.value || '',
  filmSubcategory: FILM_CATEGORIES[0]?.subcategories?.[0] || '',
  notes: '',
});

export default function ClientMaterialsDetailPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();
  const { clientId } = useParams();

  const [clients, setClients] = useState<Client[]>(() => readClientsFromStorage());
  const [records, setRecords] = useState<TollingRecord[]>(() => readMaterialsRecords());
  const [form, setForm] = useState<FormState>(createForm());
  const [editing, setEditing] = useState<TollingRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TollingRecord | null>(null);
  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === MATERIALS_STORAGE_KEY) {
        setRecords(readMaterialsRecords());
      }
      if (event.key === CLIENTS_STORAGE_KEY) {
        setClients(readClientsFromStorage());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const client = useMemo(() => clients.find((c) => c.id === clientId) ?? null, [clients, clientId]);
  const clientRecords = useMemo(
    () => records.filter((record) => record.clientId === clientId),
    [records, clientId]
  );
  const isPaintType = useMemo(
    () => form.type === 'ombor/kraska' || form.type === 'ombor/suyuq-kraska',
    [form.type]
  );
  const isFilmType = useMemo(() => form.type === 'ombor/plyonka', [form.type]);
  const isRazvaritel = useMemo(() => form.type === 'ombor/razvaritel', [form.type]);
  const filmSubcategories = useMemo(() => {
    const current = FILM_CATEGORIES.find((cat) => cat.value === form.filmCategory);
    return current?.subcategories ?? [];
  }, [form.filmCategory]);

  const pageTitle = `${client?.fullName ?? t('clientsMaterialsPage.title')} | ${CONFIG.appName}`;

  const setRecordsAndPersist = (updater: (prev: TollingRecord[]) => TollingRecord[]) => {
    setRecords((prev) => {
      const next = normalizeRecords(updater(prev));
      persistMaterialsRecords(next);
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm(createForm());
    dialog.onTrue();
  };

  const openEdit = (record: TollingRecord) => {
    setEditing(record);
    const fallbackCategory = FILM_CATEGORIES[0];
    const fallbackSub = fallbackCategory?.subcategories?.[0] || '';
    setForm({
      type: record.type,
      order: record.order,
      quantityKg: record.quantityKg ? String(record.quantityKg) : '',
      color: record.color,
      filmCategory:
        record.type === 'ombor/plyonka'
          ? record.filmCategory || fallbackCategory?.value || ''
          : '',
      filmSubcategory:
        record.type === 'ombor/plyonka'
          ? record.filmSubcategory || fallbackSub
          : '',
      notes: record.notes,
    });
    dialog.onTrue();
  };

  const handleSave = () => {
    if (!clientId || !client) return;
    const payload: TollingRecord = {
      id: editing ? editing.id : uuidv4(),
      clientId,
      clientName: client.fullName,
      company: client.company,
      phone: formatPhone(client.phone),
      type: form.type,
      order: form.order.trim(),
      quantityKg: Number(form.quantityKg) || 0,
      color: isPaintType ? form.color.trim() : '',
      filmCategory: isFilmType ? form.filmCategory.trim() : '',
      filmSubcategory: isFilmType ? form.filmSubcategory.trim() : '',
      notes: form.notes.trim(),
    };

    setRecordsAndPersist((prev) =>
      editing ? prev.map((item) => (item.id === editing.id ? payload : item)) : [...prev, payload]
    );
    dialog.onFalse();
    setEditing(null);
  };

  const handleDelete = () => {
    if (pendingDelete) {
      setRecordsAndPersist((prev) => prev.filter((item) => item.id !== pendingDelete.id));
    }
    deleteDialog.onFalse();
    setPendingDelete(null);
  };

  const canSave =
    client &&
    form.type &&
    form.order.trim() &&
    form.notes.trim() &&
    (!isPaintType || form.color.trim()) &&
    (!isFilmType || (form.filmCategory.trim() && form.filmSubcategory.trim()));

  if (!client) {
    return (
      <>
        <title>{pageTitle}</title>
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
          <Stack spacing={2} alignItems="flex-start">
            <Button
              variant="text"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => navigate(paths.dashboard.clients.materials)}
            >
              {t('clientsDetail.back')}
            </Button>
            <Typography variant="h6">{t('clientsDetail.notFound')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('clientsDetail.notFoundHint')}
            </Typography>
          </Stack>
        </Container>
      </>
    );
  }

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              component="button"
              onClick={() => navigate(paths.dashboard.clients.materials)}
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            >
              {t('clientsDetail.back')}
            </Button>
            <Stack spacing={0.5}>
              <Typography variant="h4">{client.fullName}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('clientsMaterialsPage.historySubtitle')}
              </Typography>
            </Stack>
            <Button
              type="button"
              variant="contained"
              startIcon={<Iconify icon="solar:cart-plus-bold" />}
              sx={{ ml: 'auto' }}
              onClick={openAdd}
            >
              {t('clientsMaterialsPage.add')}
            </Button>
          </Stack>

          <Card sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">{t('clientsMaterialsPage.clientName')}</Typography>
                <Typography variant="body1">{client.fullName}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {client.company || t('clientsPage.notProvided')}
                </Typography>
              </Box>
              <Stack spacing={0.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                <Typography variant="subtitle2">{t('clientsPage.phone')}</Typography>
                <Typography variant="body1">
                  {client.phone || t('clientsPage.notProvided')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {client.notes || t('clientsPage.notProvided')}
                </Typography>
              </Stack>
            </Stack>
          </Card>

          <Card>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table
                size="small"
                sx={{
                  minWidth: 860,
                  '& th, & td': { py: 1.25, px: 1.25, borderBottomStyle: 'dashed' },
                  '& thead th': { textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.4, color: 'text.secondary' },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 220 }}>{t('clientsMaterialsPage.type')}</TableCell>
                    <TableCell sx={{ width: 280 }}>{t('clientsMaterialsPage.order')}</TableCell>
                    <TableCell>{t('clientsMaterialsPage.materialsColumn')}</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>
                      {t('clientsMaterialsPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientRecords.length === 0 ? (
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
                            {t('clientsMaterialsPage.emptyForClient')}
                          </Typography>
                          <Button size="small" variant="outlined" onClick={openAdd}>
                            {t('clientsMaterialsPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientRecords.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell sx={{ wordBreak: 'break-word' }}>
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2">
                              {t(`clientsMaterialsPage.typeLabels.${record.type}`, { defaultValue: record.type })}
                            </Typography>
                            {record.type === 'ombor/plyonka' ? (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {record.filmCategory || t('clientsMaterialsPage.category')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>·</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {record.filmSubcategory || t('clientsMaterialsPage.subcategory')}
                                </Typography>
                              </Stack>
                            ) : null}
                            {record.type === 'ombor/razvaritel' ? (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t('clientsMaterialsPage.razvaritelType')}: {record.color?.toUpperCase() || '-'}
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ wordBreak: 'break-word' }}>
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2">{record.order}</Typography>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t('clientsMaterialsPage.quantityLabel', { count: record.quantityKg || 0 })}
                              </Typography>
                              {record.type === 'ombor/kraska' || record.type === 'ombor/suyuq-kraska' ? (
                                <>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    •
                                  </Typography>
                                  <Box
                                    sx={{
                                      width: 16,
                                      height: 16,
                                      borderRadius: '50%',
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      bgcolor: record.color || 'transparent',
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {record.color || t('clientsPage.notProvided')}
                                  </Typography>
                                </>
                              ) : null}
                            </Stack>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ wordBreak: 'break-word' }}>
                          <Typography variant="body2">
                            {record.notes || t('clientsPage.notProvided')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title={t('clientsMaterialsPage.edit')}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  openEdit(record);
                                }}
                              >
                                <Iconify icon="solar:pen-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('clientsMaterialsPage.delete')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setPendingDelete(record);
                                  deleteDialog.onTrue();
                                }}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('clientsMaterialsPage.edit') : t('clientsMaterialsPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="tolling-type-label">{t('clientsMaterialsPage.type')}</InputLabel>
              <Select
                labelId="tolling-type-label"
                label={t('clientsMaterialsPage.type')}
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value,
                    color: '',
                    filmCategory: '',
                    filmSubcategory: '',
                  }))
                }
              >
                {MATERIAL_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(`clientsMaterialsPage.typeLabels.${type}`, { defaultValue: type })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={t('clientsMaterialsPage.order')}
              value={form.order}
              onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
              required
            />
            {isFilmType ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="film-category-label">{t('clientsMaterialsPage.category')}</InputLabel>
                  <Select
                    labelId="film-category-label"
                    label={t('clientsMaterialsPage.category')}
                    value={form.filmCategory}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      const subcats =
                        FILM_CATEGORIES.find((cat) => cat.value === nextCategory)?.subcategories || [];
                      setForm((prev) => ({
                        ...prev,
                        filmCategory: nextCategory,
                        filmSubcategory: subcats[0] || '',
                      }));
                    }}
                    required
                  >
                {FILM_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="film-subcategory-label">{t('clientsMaterialsPage.subcategory')}</InputLabel>
                  <Select
                    labelId="film-subcategory-label"
                    label={t('clientsMaterialsPage.subcategory')}
                    value={form.filmSubcategory}
                    onChange={(e) => setForm((prev) => ({ ...prev, filmSubcategory: e.target.value }))}
                    required
                  >
                    {filmSubcategories.map((sub) => (
                      <MenuItem key={sub} value={sub}>
                        {sub}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            ) : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label={t('clientsMaterialsPage.quantity')}
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={form.quantityKg}
                onChange={(e) => setForm((prev) => ({ ...prev, quantityKg: e.target.value }))}
              />
              {isPaintType ? (
                <TextField
                  fullWidth
                  label={t('clientsMaterialsPage.color')}
                  value={form.color}
                  type="color"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:palette-bold" width={18} />
                      </InputAdornment>
                    ),
                  }}
                  onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                  required
                />
              ) : isRazvaritel ? (
                <FormControl fullWidth>
                  <InputLabel id="razvaritel-type-label">{t('clientsMaterialsPage.razvaritelType')}</InputLabel>
                  <Select
                    labelId="razvaritel-type-label"
                    label={t('clientsMaterialsPage.razvaritelType')}
                    value={form.color || RAZVARITEL_TYPES[0]}
                    onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                  >
                    {RAZVARITEL_TYPES.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
            </Stack>
            <TextField
              fullWidth
              label={t('clientsMaterialsPage.materialsColumn')}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              minRows={3}
              placeholder={t('clientsMaterialsPage.notesHint')}
              required
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('clientsMaterialsPage.localHint')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('clientsMaterialsPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('clientsMaterialsPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('clientsMaterialsPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('clientsMaterialsPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('clientsMaterialsPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('clientsMaterialsPage.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

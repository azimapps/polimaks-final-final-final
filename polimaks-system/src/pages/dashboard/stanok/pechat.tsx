/* eslint-disable perfectionist/sort-imports */
import React, { useMemo, useState, useEffect } from 'react';
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
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
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

import { FlagIcon } from 'src/components/flag-icon';
import { Iconify } from 'src/components/iconify';
import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import { paths } from 'src/routes/paths';
import data from 'src/data/stanok-pechat.json';
import brigadaPechatSeed from 'src/data/stanok-brigada-pechat.json';

type Complaint = {
  id: string;
  message: string;
  createdAt: string;
  status: 'open' | 'resolved';
  resolvedAt: string | null;
};

type MonthlyPlan = {
  id: string;
  month: string; // YYYY-MM
  limitKg: number;
};

type Machine = {
  id: string;
  language_code: string;
  name: string;
  complaints?: Complaint[];
  monthlyPlans?: MonthlyPlan[];
};

const STORAGE_KEY = 'stanok-pechat';
const BRIGADA_STORAGE_KEY = 'stanok-brigada-pechat';
const ORDER_PLAN_STORAGE_KEY = 'orderPlansV2';
const LEGACY_ORDER_PLAN_STORAGE_KEY = 'orderPlans';

type PlanItem = {
  id: string;
  orderNumber: string;
  clientName: string;
  title: string;
  quantityKg: number;
  startDate: string;
  endDate: string;
  machineType: string;
  machineId: string;
  machineName?: string;
  groupId: string;
  groupName?: string;
  material?: string;
  subMaterial?: string;
  filmThickness?: number;
  filmWidth?: number;
  cylinderLength?: number;
  cylinderCount?: number;
  cylinderAylanasi?: number;
  note?: string;
};

const LANGUAGE_OPTIONS = [
  { code: 'cn', labelKey: 'languages.cn', country: 'CN' },
  { code: 'de', labelKey: 'languages.de', country: 'DE' },
  { code: 'uz', labelKey: 'languages.uz', country: 'UZ' },
  { code: 'ru', labelKey: 'languages.ru', country: 'RU' },
  { code: 'en', labelKey: 'languages.en', country: 'GB' },
];

const readLocalArray = (key: string, fallback: any[]) => {
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

const loadBrigadasFromStorage = (machineId?: string) => {
  const keysToTry = machineId
    ? [`${BRIGADA_STORAGE_KEY}-${machineId}`, BRIGADA_STORAGE_KEY]
    : [BRIGADA_STORAGE_KEY];
  for (const key of keysToTry) {
    const fromStorage = readLocalArray(key, []);
    if (fromStorage.length) return fromStorage;
  }
  return brigadaPechatSeed as any[];
};

const normalizePlanItem = (raw: any, index: number): PlanItem => ({
  id: raw?.id || `plan-${index}`,
  orderNumber: raw?.orderNumber || '',
  clientName: raw?.clientName || '',
  title: raw?.title || '',
  quantityKg: Number(raw?.quantityKg) || 0,
  startDate: raw?.startDate || '',
  endDate: raw?.endDate || '',
  machineType: raw?.machineType || '',
  machineId: raw?.machineId || '',
  machineName: raw?.machineName || '',
  groupId: raw?.groupId || '',
  groupName: raw?.groupName || '',
  material: raw?.material,
  subMaterial: raw?.subMaterial,
  filmThickness: Number(raw?.filmThickness) || undefined,
  filmWidth: Number(raw?.filmWidth) || undefined,
  cylinderLength: Number(raw?.cylinderLength) || undefined,
  cylinderCount: Number(raw?.cylinderCount) || undefined,
  cylinderAylanasi: Number(raw?.cylinderAylanasi) || undefined,
  note: raw?.note,
});

const loadPechatPlansFromStorage = () => {
  if (typeof window === 'undefined') return [] as PlanItem[];
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
  return [] as PlanItem[];
};

export default function PechatPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();

  const title = `${t('pechatPage.title')} | ${CONFIG.appName}`;

  const currentMonth = useMemo(() => {
    const now = new Date();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${now.getFullYear()}-${m}`;
  }, []);

  const initialData = useMemo<Machine[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Machine[];
          return parsed.map((m) => ({
            ...m,
            complaints: (m.complaints ?? []).map((comp: any) => ({
              id: comp.id ?? uuidv4(),
              message: comp.message ?? '',
              createdAt: comp.createdAt ?? new Date().toISOString(),
              status: comp.status === 'resolved' ? 'resolved' : 'open',
              resolvedAt: comp.resolvedAt ?? null,
            })),
            monthlyPlans: (m.monthlyPlans ?? []).map((plan: any) => ({
              id: plan.id ?? uuidv4(),
              month: plan.month ?? currentMonth,
              limitKg: Number(plan.limitKg) || 0,
            })),
          }));
        } catch {
          // fall through to seed data
        }
      }
    }
    return (data as Machine[]).map((m) => ({ ...m, complaints: [], monthlyPlans: [] }));
  }, [currentMonth]);

  const [items, setItems] = useState<Machine[]>(initialData);
  const [brigadas, setBrigadas] = useState<any[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedBrigadaId, setSelectedBrigadaId] = useState<string>('');
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [openPlanRows, setOpenPlanRows] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Machine | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Machine | null>(null);
  const [form, setForm] = useState({ language_code: '', name: '' });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<Machine | null>(null);

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: Machine[]) => Machine[]) => {
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
    setForm({ language_code: '', name: '' });
    dialog.onTrue();
  };

  const openEdit = (item: Machine) => {
    setEditing(item);
    setForm({ language_code: item.language_code, name: item.name });
    dialog.onTrue();
  };

  const handleSave = () => {
    // TODO: replace with real API calls once backend is ready (persist to server)
    if (editing) {
      setItemsAndPersist((prev) =>
        prev.map((it) =>
          it.id === editing.id
            ? { ...it, ...form, complaints: it.complaints ?? [], monthlyPlans: it.monthlyPlans ?? [] }
            : it
        )
      );
    } else {
      setItemsAndPersist((prev) => [
        ...prev,
        { id: uuidv4(), ...form, complaints: [], monthlyPlans: [] },
      ]);
    }
    dialog.onFalse();
  };

  const handleDelete = () => {
    // TODO: replace with real API calls once backend is ready (persist to server)
    if (pendingDelete) {
      setItemsAndPersist((prev) => prev.filter((it) => it.id !== pendingDelete.id));
    }
    deleteDialog.onFalse();
    setPendingDelete(null);
    setEditing(null);
  };

  const canSave = form.language_code.trim() && form.name.trim();

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  useEffect(() => {
    if (!selectedMachineId && items[0]?.id) {
      setSelectedMachineId(items[0].id);
    }
  }, [items, selectedMachineId]);

  useEffect(() => {
    const next = loadBrigadasFromStorage(selectedMachineId);
    setBrigadas(next);
  }, [selectedMachineId, items]);

  useEffect(() => {
    if (!brigadas.length) {
      setSelectedBrigadaId('');
      return;
    }
    if (!selectedBrigadaId || !brigadas.some((b: any) => b.id === selectedBrigadaId)) {
      setSelectedBrigadaId(brigadas[0]?.id || '');
    }
  }, [brigadas, selectedBrigadaId]);

  useEffect(() => {
    setPlans(loadPechatPlansFromStorage());
    if (typeof window === 'undefined') return () => {};
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === ORDER_PLAN_STORAGE_KEY || event.key === LEGACY_ORDER_PLAN_STORAGE_KEY) {
        setPlans(loadPechatPlansFromStorage());
      }
    };
    const onFocus = () => setPlans(loadPechatPlansFromStorage());
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const filteredPlans = useMemo(
    () =>
      plans.filter(
        (plan) =>
          plan.machineType === 'pechat' &&
          (!selectedMachineId || plan.machineId === selectedMachineId) &&
          (!selectedBrigadaId || plan.groupId === selectedBrigadaId)
      ),
    [plans, selectedMachineId, selectedBrigadaId]
  );

  const togglePlanRow = (id: string) =>
    setOpenPlanRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{t('pechatPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('pechatPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('pechatPage.add')}
            </Button>
          </Stack>

          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <FormControl fullWidth>
                  <InputLabel>{t('reskaPanel.machineLabel')}</InputLabel>
                  <Select
                    value={selectedMachineId}
                    label={t('reskaPanel.machineLabel')}
                    onChange={(e) => setSelectedMachineId(e.target.value as string)}
                  >
                    {items.length === 0 && (
                      <MenuItem value="">
                        <em>{t('reskaPanel.noMachines')}</em>
                      </MenuItem>
                    )}
                    {items.map((machine) => (
                      <MenuItem key={machine.id} value={machine.id}>
                        {machine.name || machine.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth disabled={!brigadas.length}>
                  <InputLabel>{t('reskaPanel.brigadaLabel')}</InputLabel>
                  <Select
                    value={selectedBrigadaId}
                    label={t('reskaPanel.brigadaLabel')}
                    onChange={(e) => setSelectedBrigadaId(e.target.value as string)}
                  >
                    {brigadas.length === 0 && (
                      <MenuItem value="">
                        <em>{t('reskaPanel.noBrigadas')}</em>
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
                  ? t('reskaPanel.overview.selection', {
                      machine:
                        items.find((m) => m.id === selectedMachineId)?.name || selectedMachineId,
                      brigada:
                        brigadas.find((b: any) => b.id === selectedBrigadaId)?.name ||
                        selectedBrigadaId ||
                        t('reskaPanel.noBrigadas'),
                    })
                  : t('reskaPanel.noMachines')}
              </Typography>
            </Stack>
          </Card>

          <Card>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell width={56} />
                    <TableCell sx={{ minWidth: 160 }}>{t('orderPlanPage.orderNumber')}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{t('orderPlanPage.client')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('orderPlanPage.title')}</TableCell>
                    <TableCell align="right" sx={{ minWidth: 120 }}>
                      {t('orderPlanPage.quantityKg')}
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('orderPlanPage.date')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
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
                            {t('orderPlanPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('pechatPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => {
                      const isOpen = openPlanRows[plan.id];
                      return (
                        <React.Fragment key={plan.id}>
                          <TableRow hover>
                            <TableCell width={56}>
                              <IconButton size="small" onClick={() => togglePlanRow(plan.id)}>
                                <Iconify icon={isOpen ? 'eva:arrow-upward-fill' : 'eva:arrow-downward-fill'} />
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2">{plan.orderNumber}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {plan.title}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2">{plan.clientName}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {plan.groupName || selectedBrigadaId || t('reskaPanel.brigadaLabel')}
                              </Typography>
                            </TableCell>
                            <TableCell>{plan.title}</TableCell>
                            <TableCell align="right">{plan.quantityKg}</TableCell>
                            <TableCell>
                              {plan.startDate
                                ? new Date(plan.startDate).toLocaleDateString()
                                : t('orderPlanPage.date')}
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                <Box sx={{ px: 2, py: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                                  <Stack spacing={1.25}>
                                    <Typography variant="subtitle2">{t('orderPlanPage.details') || 'Tafsilotlar'}</Typography>
                                    <Box
                                      sx={{
                                        display: 'grid',
                                        gap: 1.5,
                                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                      }}
                                    >
                                      <DetailItem label={t('reskaPanel.machineLabel')} value={plan.machineName || plan.machineId} />
                                      <DetailItem label={t('reskaPanel.brigadaLabel')} value={plan.groupName || plan.groupId} />
                                      <DetailItem label={t('orderPlanPage.date')} value={plan.startDate ? new Date(plan.startDate).toLocaleDateString() : ''} />
                                      <DetailItem label={t('orderPlanPage.endDate') || 'Yakun'} value={plan.endDate ? new Date(plan.endDate).toLocaleDateString() : ''} />
                                      <DetailItem
                                        label={t('orderPlanPage.material') || 'Material'}
                                        value={plan.material ? `${plan.material}${plan.subMaterial ? ` · ${plan.subMaterial}` : ''}` : ''}
                                      />
                                      <DetailItem
                                        label="Silindr"
                                        value={[
                                          plan.cylinderLength ? `L=${plan.cylinderLength} mm` : '',
                                          plan.cylinderCount ? `Soni=${plan.cylinderCount}` : '',
                                          plan.cylinderAylanasi ? `Ayln=${plan.cylinderAylanasi} mm` : '',
                                        ]
                                          .filter(Boolean)
                                          .join(' · ')}
                                      />
                                      <DetailItem
                                        label="Plyonka"
                                        value={[
                                          plan.filmThickness ? `${plan.filmThickness} mkm` : '',
                                          plan.filmWidth ? `${plan.filmWidth} mm` : '',
                                        ]
                                          .filter(Boolean)
                                          .join(' · ')}
                                      />
                                      <DetailItem label="Izoh" value={plan.note || ''} />
                                    </Box>
                                  </Stack>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      </Container>

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? t('pechatPage.edit') : t('pechatPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              select
              label={t('pechatPage.languageCode')}
              value={form.language_code}
              onChange={(e) => setForm((prev) => ({ ...prev, language_code: e.target.value }))}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FlagIcon code={option.country} sx={{ width: 38, height: 26, borderRadius: 0.75 }} />
                    <Typography variant="subtitle2">{t(option.labelKey)}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('pechatPage.name')}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {/* TODO: replace static JSON/local storage with real API endpoints when backend is available */}
            Data is saved in your browser for now; hook this up to your API later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('pechatPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('pechatPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('pechatPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('pechatPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('pechatPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('pechatPage.delete')}
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
        onProfile={() => menuItem && navigate(paths.dashboard.stanok.pechatProfile(menuItem.id))}
        onOpenBrigada={() => menuItem && navigate(paths.dashboard.stanok.brigadaPechat(menuItem.id))}
        onOpenMaterials={() => navigate(paths.dashboard.stanok.materialsPechat)}
        labels={{
          edit: t('pechatPage.edit'),
          delete: t('pechatPage.delete'),
          brigada: t('pechatPage.brigada'),
          materials: t('pechatPage.materials'),
          profile: t('pechatPage.profile'),
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
  onProfile: VoidFunction;
  onDelete: VoidFunction;
  onOpenBrigada: VoidFunction;
  onOpenMaterials: VoidFunction;
  labels: { edit: string; delete: string; brigada: string; materials: string; profile: string };
};

function ActionsMenu({
  anchorEl,
  open,
  onClose,
  onEdit,
  onDelete,
  onOpenBrigada,
  onOpenMaterials,
  onProfile,
  labels,
}: ActionsMenuProps) {
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem
        onClick={() => {
          onOpenBrigada();
          onClose();
        }}
      >
        <Iconify icon="solar:users-group-rounded-bold" width={18} height={18} style={{ marginRight: 8 }} />
        {labels.brigada}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onOpenMaterials();
          onClose();
        }}
      >
        <Iconify icon="solar:list-bold" width={18} height={18} style={{ marginRight: 8 }} />
        {labels.materials}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onProfile();
          onClose();
        }}
      >
        <Iconify icon="solar:user-rounded-bold" width={18} height={18} style={{ marginRight: 8 }} />
        {labels.profile}
      </MenuItem>
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

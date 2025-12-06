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

import { FlagIcon } from 'src/components/flag-icon';
import { Iconify } from 'src/components/iconify';
import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import { paths } from 'src/routes/paths';
import data from 'src/data/stanok-pechat.json';

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

const LANGUAGE_OPTIONS = [
  { code: 'cn', labelKey: 'languages.cn', country: 'CN' },
  { code: 'de', labelKey: 'languages.de', country: 'DE' },
  { code: 'uz', labelKey: 'languages.uz', country: 'UZ' },
  { code: 'ru', labelKey: 'languages.ru', country: 'RU' },
  { code: 'en', labelKey: 'languages.en', country: 'GB' },
];

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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: Machine) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const getCountryCode = (code: string) =>
    LANGUAGE_OPTIONS.find((opt) => opt.code === code)?.country ?? '';

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

          <Card>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 200 }}>{t('pechatPage.languageCode')}</TableCell>
                    <TableCell>{t('pechatPage.name')}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      {t('pechatPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
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
                            {t('pechatPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('pechatPage.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <FlagIcon
                            code={getCountryCode(item.language_code)}
                            sx={{ width: 42, height: 28, borderRadius: 0.75 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{item.name}</Typography>
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

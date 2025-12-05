/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState } from 'react';
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

import { Iconify } from 'src/components/iconify';
import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import data from 'src/data/staff-workers.json';

type Worker = {
  id: string;
  name: string;
  phone: string;
  description: string;
};

const STORAGE_KEY = 'staff-workers';

export default function StaffWorkerPage() {
  const { t } = useTranslate('pages');

  const title = `${t('staff.items.worker.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<Worker[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as Worker[];
        } catch {
          // ignore corrupted data
        }
      }
    }
    return data as Worker[];
  }, []);

  const [items, setItems] = useState<Worker[]>(initialData);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<Worker | null>(null);
  const [form, setForm] = useState<{ name: string; phone: string; description: string }>({
    name: '',
    phone: '',
    description: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: Worker[]) => Worker[]) => {
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
    setForm({ name: '', phone: '', description: '' });
    dialog.onTrue();
  };

  const openEdit = (item: Worker) => {
    setEditing(item);
    setForm({ name: item.name, phone: formatPhone(item.phone), description: item.description });
    dialog.onTrue();
  };

  const handleSave = () => {
    const payload: Worker = {
      id: editing ? editing.id : uuidv4(),
      name: form.name.trim(),
      phone: getRawPhone(form.phone),
      description: form.description.trim(),
    };

    if (editing) {
      setItemsAndPersist((prev) => prev.map((it) => (it.id === editing.id ? payload : it)));
    } else {
      setItemsAndPersist((prev) => [...prev, payload]);
    }
    dialog.onFalse();
  };

  const handleDelete = () => {
    if (menuItem) {
      setItemsAndPersist((prev) => prev.filter((it) => it.id !== menuItem.id));
    }
    deleteDialog.onFalse();
    setMenuItem(null);
    setEditing(null);
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: Worker) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const getRawPhone = (value: string) => value.replace(/\D/g, '').slice(0, 9);

  const formatPhone = (raw: string) => {
    const digits = getRawPhone(raw);
    const part1 = digits.slice(0, 2);
    const part2 = digits.slice(2, 5);
    const part3 = digits.slice(5, 7);
    const part4 = digits.slice(7, 9);
    let formatted = '';
    if (part1) formatted = `(${part1}`;
    if (part1 && part1.length === 2) formatted += ')';
    if (part2) formatted += ` ${part2}`;
    if (part3) formatted += `-${part3}`;
    if (part4) formatted += `-${part4}`;
    return formatted.trim();
  };

  const onPhoneChange = (value: string) => {
    const digits = getRawPhone(value);
    setForm((prev) => ({ ...prev, phone: formatPhone(digits) }));
  };

  const isPhoneValid = getRawPhone(form.phone).length === 9;

  const canSave = form.name.trim() && isPhoneValid;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{t('staff.items.worker.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('staff.items.worker.description')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('staff.items.worker.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 220 }}>{t('staff.items.worker.name')}</TableCell>
                    <TableCell sx={{ width: 200 }}>{t('staff.items.worker.phone')}</TableCell>
                    <TableCell>{t('staff.items.worker.descriptionLabel')}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      {t('staff.items.worker.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
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
                            {t('staff.items.worker.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('staff.items.worker.add')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{item.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatPhone(item.phone)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? t('staff.items.worker.edit') : t('staff.items.worker.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('staff.items.worker.name')}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              autoFocus
            />
            <TextField
              label={t('staff.items.worker.phone')}
              value={form.phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="(90) 123-45-67"
              helperText={
                isPhoneValid ? ' ' : t('staff.items.worker.phoneHint', { format: '(##) ###-##-##' })
              }
              error={!isPhoneValid}
              inputProps={{ inputMode: 'numeric' }}
            />
            <TextField
              label={t('staff.items.worker.descriptionLabel')}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              multiline
              minRows={2}
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
            {t('staff.items.worker.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('staff.items.worker.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('staff.items.worker.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('staff.items.worker.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('staff.items.worker.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('staff.items.worker.delete')}
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
            deleteDialog.onTrue();
          }
        }}
        labels={{ edit: t('staff.items.worker.edit'), delete: t('staff.items.worker.delete') }}
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

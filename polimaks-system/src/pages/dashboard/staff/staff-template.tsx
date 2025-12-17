/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
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

type StaffRole = 'crm' | 'accountant' | 'planner';

export type StaffMember = {
  id: string;
  name: string;
  phone: string;
  description: string;
};

type StaffSimplePageProps = {
  roleKey: StaffRole;
  storageKey: string;
  seed: StaffMember[];
};

export function StaffSimplePage({ roleKey, storageKey, seed }: StaffSimplePageProps) {
  const { t } = useTranslate('pages');

  const labels = useMemo(
    () => ({
      title: t(`staff.items.${roleKey}.title`),
      description: t(`staff.items.${roleKey}.description`),
      name: t(`staff.items.${roleKey}.name`),
      phone: t(`staff.items.${roleKey}.phone`),
      phoneHint: t(`staff.items.${roleKey}.phoneHint`),
      notes: t(`staff.items.${roleKey}.descriptionLabel`),
      add: t(`staff.items.${roleKey}.add`),
      edit: t(`staff.items.${roleKey}.edit`),
      save: t(`staff.items.${roleKey}.save`),
      cancel: t(`staff.items.${roleKey}.cancel`),
      delete: t(`staff.items.${roleKey}.delete`),
      deleteConfirm: t(`staff.items.${roleKey}.deleteConfirm`),
      deleteHint: t(`staff.items.${roleKey}.deleteHint`),
      empty: t(`staff.items.${roleKey}.empty`),
      actions: t(`staff.items.${roleKey}.actions`),
    }),
    [roleKey, t]
  );

  const title = `${labels.title} | ${CONFIG.appName}`;

  const initialData = useMemo<StaffMember[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as StaffMember[];
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch {
          // ignore corrupted data
        }
      }
    }
    return seed;
  }, [seed, storageKey]);

  const [items, setItems] = useState<StaffMember[]>(initialData);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StaffMember | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<{ name: string; phone: string; description: string }>({
    name: '',
    phone: '',
    description: '',
  });

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: StaffMember[]) => StaffMember[]) => {
    setItems((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', description: '' });
    dialog.onTrue();
  };

  const openEdit = (item: StaffMember) => {
    setEditing(item);
    setForm({ name: item.name, phone: formatPhone(item.phone), description: item.description });
    dialog.onTrue();
  };

  const handleSave = () => {
    const payload: StaffMember = {
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

  const confirmDelete = (item: StaffMember) => {
    setPendingDelete(item);
    deleteDialog.onTrue();
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: StaffMember) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const handleDeleteRequest = () => {
    if (menuItem) {
      confirmDelete(menuItem);
    }
    closeMenu();
  };

  const handleEditRequest = () => {
    if (menuItem) {
      openEdit(menuItem);
    }
    closeMenu();
  };

  const handleDelete = () => {
    if (pendingDelete) {
      setItemsAndPersist((prev) => prev.filter((it) => it.id !== pendingDelete.id));
    }
    setPendingDelete(null);
    deleteDialog.onFalse();
    setEditing(null);
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
              <Typography variant="h4">{labels.title}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {labels.description}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {labels.add}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 220 }}>{labels.name}</TableCell>
                    <TableCell sx={{ width: 200 }}>{labels.phone}</TableCell>
                    <TableCell>{labels.notes}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      {labels.actions}
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
                            {labels.empty}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {labels.add}
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
        <DialogTitle>{editing ? labels.edit : labels.add}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={labels.name}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              autoFocus
            />
            <TextField
              label={labels.phone}
              value={form.phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="(90) 123-45-67"
              helperText={isPhoneValid ? ' ' : labels.phoneHint}
              error={!isPhoneValid}
              inputProps={{ inputMode: 'numeric' }}
            />
            <TextField
              label={labels.notes}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              multiline
              minRows={2}
            />
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Data is saved in your browser for now; hook this up to your API later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {labels.cancel}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {labels.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{labels.deleteConfirm}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {labels.deleteHint}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPendingDelete(null);
              deleteDialog.onFalse();
            }}
            color="inherit"
          >
            {labels.cancel}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {labels.delete}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={handleEditRequest}>
          <Iconify icon="solar:pen-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {labels.edit}
        </MenuItem>
        <MenuItem onClick={handleDeleteRequest} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" width={18} height={18} style={{ marginRight: 8 }} />
          {labels.delete}
        </MenuItem>
      </Menu>
    </>
  );
}

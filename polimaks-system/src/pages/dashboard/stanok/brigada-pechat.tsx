/* eslint-disable perfectionist/sort-imports */
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router';
import { useMemo, useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Autocomplete from '@mui/material/Autocomplete';
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

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import data from 'src/data/stanok-brigada-pechat.json';
import workerSeed from 'src/data/staff-workers.json';

import { Iconify } from 'src/components/iconify';

type Person = {
  id: string;
  workerId: string;
  position: string;
};

type Group = {
  id: string;
  name: string;
  leader: string; // workerId
  people: Person[];
};

type Worker = {
  id: string;
  name: string;
  phone: string;
  description?: string;
};

const STORAGE_KEY = 'stanok-brigada-pechat';
const WORKER_STORAGE_KEY = 'staff-workers';

export default function BrigadaPechatPage() {
  const { t } = useTranslate('pages');
  const { machineId } = useParams();

  const storageKey = machineId ? `${STORAGE_KEY}-${machineId}` : STORAGE_KEY;

  const title = `${t('brigadaPage.title')} - ${t('pechatPage.title')} | ${CONFIG.appName}`;

  const workers = useMemo<Worker[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(WORKER_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as Worker[];
        } catch {
          // ignore corrupted data
        }
      }
    }
    return workerSeed as Worker[];
  }, []);

  const workerMap = useMemo(() => {
    const map = new Map<string, Worker>();
    workers.forEach((w) => map.set(w.id, w));
    return map;
  }, [workers]);

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 9);
    const part1 = digits.slice(0, 2);
    const part2 = digits.slice(2, 5);
    const part3 = digits.slice(5, 7);
    const part4 = digits.slice(7, 9);
    let formatted = '';
    if (part1) formatted = `(${part1}`;
    if (part1.length === 2) formatted += ')';
    if (part2) formatted += ` ${part2}`;
    if (part3) formatted += `-${part3}`;
    if (part4) formatted += `-${part4}`;
    return formatted.trim();
  };

  const normalizeGroup = (group: any): Group => {
    const people: Person[] = (group.people ?? []).map((p: any, idx: number) => ({
      id: p.id ?? `person-${idx}`,
      workerId: p.workerId ?? '',
      position: p.position ?? '',
    }));
    const leader = group.leader ?? people[0]?.workerId ?? '';
    return {
      id: group.id ?? uuidv4(),
      name: group.name ?? '',
      leader,
      people,
    };
  };

  const initialData = useMemo<Group[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return (JSON.parse(stored) as any[]).map(normalizeGroup);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return machineId ? [] : (data as any[]).map(normalizeGroup);
  }, [machineId, storageKey]);

  const [items, setItems] = useState<Group[]>(initialData);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState<{ name: string; leader: string; people: Person[] }>({
    name: '',
    leader: '',
    people: [],
  });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<Group | null>(null);

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

  const setItemsAndPersist = (updater: (prev: Group[]) => Group[]) => {
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
    setForm({ name: '', leader: '', people: [] });
    dialog.onTrue();
  };

  const openEdit = (item: Group) => {
    setEditing(item);
    setForm({ name: item.name, leader: item.leader, people: item.people });
    dialog.onTrue();
  };

  const handleSave = () => {
    const leader = form.leader || form.people[0]?.workerId || '';
    const payload = { ...form, leader };

    if (editing) {
      setItemsAndPersist((prev) => prev.map((it) => (it.id === editing.id ? { ...it, ...payload } : it)));
    } else {
      setItemsAndPersist((prev) => [...prev, { id: uuidv4(), ...payload }]);
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, item: Group) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const addPerson = () => {
    setForm((prev) => ({
      ...prev,
      people: [...prev.people, { id: uuidv4(), workerId: '', position: '' }],
    }));
  };

  const updatePerson = (personId: string, field: 'workerId' | 'position', value: string) => {
    setForm((prev) => ({
      ...prev,
      people: prev.people.map((p) => (p.id === personId ? { ...p, [field]: value } : p)),
    }));
  };

  const removePerson = (personId: string) => {
    setForm((prev) => {
      const nextPeople = prev.people.filter((p) => p.id !== personId);
      const nextLeader = nextPeople.find((p) => p.workerId === prev.leader)?.workerId
        ? prev.leader
        : nextPeople[0]?.workerId || '';
      return { ...prev, people: nextPeople, leader: nextLeader };
    });
  };

  const canSave =
    form.name.trim() && form.people.length > 0 && form.people.every((p) => p.workerId && p.position.trim());

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">
                {t('brigadaPage.title')} ({t('pechatPage.title')})
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('brigadaPage.subtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd}>
              {t('brigadaPage.add')}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 240 }}>{t('brigadaPage.name')}</TableCell>
                    <TableCell>{t('brigadaPage.people')}</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      {t('brigadaPage.actions')}
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
                            {t('brigadaPage.empty')}
                          </Typography>
                          <Button size="small" onClick={openAdd} variant="outlined">
                            {t('brigadaPage.add')}
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
                          <Stack spacing={0.75}>
                            {item.people.map((person) => {
                              const worker = workerMap.get(person.workerId);
                              return (
                                <Stack
                                  key={person.id}
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  sx={{ typography: 'body2', flexWrap: 'wrap', rowGap: 0.5 }}
                                >
                                  <Iconify icon="solar:user-rounded-bold" width={16} height={16} />
                                  <Typography variant="subtitle2">
                                    {worker?.name || t('brigadaPage.unnamed')}
                                  </Typography>
                                  {person.workerId === item.leader && (
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      alignItems="center"
                                      sx={{ color: 'warning.main' }}
                                    >
                                      <Iconify icon="solar:flag-bold" width={14} height={14} />
                                      <Typography
                                        variant="caption"
                                        sx={{ fontWeight: 700, color: 'warning.main' }}
                                      >
                                        {t('brigadaPage.leader')}
                                      </Typography>
                                    </Stack>
                                  )}
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    · {person.position}
                                  </Typography>
                                  {worker?.phone && (
                                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                      {formatPhone(worker.phone)}
                                    </Typography>
                                  )}
                                </Stack>
                              );
                            })}
                          </Stack>
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('brigadaPage.edit') : t('brigadaPage.add')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('brigadaPage.name')}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              autoFocus
            />

            <Divider flexItem sx={{ my: 1 }} />

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">{t('brigadaPage.people')}</Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={addPerson}
                startIcon={<Iconify icon="solar:add-circle-bold" />}
              >
                {t('brigadaPage.addPerson')}
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              {form.people.length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('brigadaPage.peopleEmpty')}
                </Typography>
              )}

              {form.people.map((person) => (
                <Grid container spacing={1} key={person.id} alignItems="center">
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <Autocomplete
                      options={workers}
                      getOptionLabel={(option) =>
                        `${option.name}${option.phone ? ` (${formatPhone(option.phone)})` : ''}`
                      }
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      value={workers.find((w) => w.id === person.workerId) || null}
                      onChange={(_, value) => updatePerson(person.id, 'workerId', value?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('brigadaPage.personName')}
                          placeholder={t('brigadaPage.unnamed')}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      label={t('brigadaPage.personPosition')}
                      value={person.position}
                      onChange={(e) => updatePerson(person.id, 'position', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton color="error" onClick={() => removePerson(person.id)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </Stack>

            <TextField
              select
              label={t('brigadaPage.leader')}
              value={form.leader}
              onChange={(e) => setForm((prev) => ({ ...prev, leader: e.target.value }))}
              helperText={t('brigadaPage.leaderHint')}
              disabled={form.people.length === 0}
            >
              {form.people.map((person) => {
                const worker = workerMap.get(person.workerId);
                return (
                  <MenuItem key={person.id} value={person.workerId}>
                    {worker?.name || t('brigadaPage.unnamed')}
                  </MenuItem>
                );
              })}
            </TextField>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {/* TODO: replace static JSON/local storage with real API endpoints when backend is available */}
            Data is saved in your browser for now; hook this up to your API later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('brigadaPage.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!canSave}>
            {t('brigadaPage.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('brigadaPage.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('brigadaPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse} color="inherit">
            {t('brigadaPage.cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('brigadaPage.delete')}
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
        labels={{ edit: t('brigadaPage.edit'), delete: t('brigadaPage.delete') }}
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

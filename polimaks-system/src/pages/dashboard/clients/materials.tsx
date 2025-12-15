/* eslint-disable perfectionist/sort-imports */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';

import {
  Box,
  Button,
  Card,
  Container,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import type { Client } from './clients';
import {
  CLIENTS_STORAGE_KEY,
  MATERIALS_STORAGE_KEY,
  formatPhone,
  getRawPhone,
  readClientsFromStorage,
  readMaterialsRecords,
  persistMaterialsRecords,
  type TollingRecord,
  MATERIAL_TYPES,
} from './materials-data';

type ClientForm = {
  fullName: string;
  phone: string;
  company: string;
  notes: string;
};

const createClientForm = (): ClientForm => ({
  fullName: '',
  phone: '',
  company: '',
  notes: '',
});

export default function ClientsMaterialsPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();

  const pageTitle = `${t('clients.items.materials.title')} | ${CONFIG.appName}`;

  const [clients, setClients] = useState<Client[]>(() => readClientsFromStorage());
  const [materials, setMaterials] = useState<TollingRecord[]>(() => readMaterialsRecords());
  const [form, setForm] = useState<ClientForm>(createClientForm());
  const [editing, setEditing] = useState<Client | null>(null);
  const dialog = useBoolean();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CLIENTS_STORAGE_KEY) {
        setClients(readClientsFromStorage());
      }
      if (event.key === MATERIALS_STORAGE_KEY) {
        setMaterials(readMaterialsRecords());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const persistClients = (updater: (prev: Client[]) => Client[]) => {
    setClients((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const recordsByClient = useMemo(() => {
    const map: Record<string, number> = {};
    materials.forEach((record) => {
      map[record.clientId] = (map[record.clientId] || 0) + 1;
    });
    return map;
  }, [materials]);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [clients]
  );

  const openAdd = () => {
    setEditing(null);
    setForm(createClientForm());
    dialog.onTrue();
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({
      fullName: client.fullName,
      phone: client.phone,
      company: client.company,
      notes: client.notes,
    });
    dialog.onTrue();
  };

  const updateRelatedMaterials = (payload: Client) => {
    setMaterials((prev) => {
      const next = prev.map((record) =>
        record.clientId === payload.id
          ? {
              ...record,
              clientName: payload.fullName,
              company: payload.company,
              phone: payload.phone,
            }
          : record
      );
      persistMaterialsRecords(next);
      return next;
    });
  };

  const handleSave = () => {
    const payload: Client = {
      id: editing ? editing.id : uuidv4(),
      fullName: form.fullName.trim(),
      phone: formatPhone(form.phone),
      company: form.company.trim(),
      notes: form.notes.trim(),
      complaints: [],
      monthlyPlans: [],
    };

    persistClients((prev) =>
      editing ? prev.map((client) => (client.id === editing.id ? payload : client)) : [...prev, payload]
    );
    if (editing) {
      updateRelatedMaterials(payload);
    }
    dialog.onFalse();
    setEditing(null);
  };

  const canSave = form.fullName.trim() && getRawPhone(form.phone).length === 9;

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">{t('clientsMaterialsPage.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('clientsMaterialsPage.listSubtitle')}
              </Typography>
            </Box>

            <Button variant="contained" onClick={openAdd} startIcon={<Iconify icon="solar:user-plus-bold" />}>
              {t('clientsMaterialsPage.addAccount')}
            </Button>
          </Stack>

          <Card>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table
                size="small"
                sx={{
                  minWidth: 1000,
                  '& th, & td': { py: 1.25, px: 1.25, verticalAlign: 'top' },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 240 }}>{t('clientsMaterialsPage.clientName')}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{t('clientsMaterialsPage.company')}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>{t('clientsMaterialsPage.phone')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('clientsMaterialsPage.recordsColumn')}</TableCell>
                    <TableCell align="right" sx={{ width: 200 }}>
                      {t('clientsMaterialsPage.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
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
                            {t('clientsMaterialsPage.listEmpty')}
                          </Typography>
                          <Button size="small" variant="outlined" onClick={openAdd}>
                            {t('clientsMaterialsPage.addAccount')}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedClients.map((client) => {
                      const recordCount = recordsByClient[client.id] || 0;
                      return (
                        <TableRow
                          key={client.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(paths.dashboard.clients.materialsClient(client.id))}
                        >
                          <TableCell>
                            <Stack spacing={0.25}>
                              <Typography variant="subtitle2">
                                {client.fullName || t('clientsPage.notProvided')}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {client.notes || t('clientsPage.notProvided')}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {client.company || t('clientsPage.notProvided')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {client.phone || t('clientsPage.notProvided')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">{recordCount}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {t('clientsMaterialsPage.recordsLabel', { count: recordCount })}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Tooltip title={t('clientsMaterialsPage.editAccount')}>
                                <IconButton
                                  color="inherit"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEdit(client);
                                  }}
                                >
                                  <Iconify icon="solar:pen-bold" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('clientsMaterialsPage.openHistory')}>
                                <IconButton
                                  color="primary"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    navigate(paths.dashboard.clients.materialsClient(client.id));
                                  }}
                                >
                                  <Iconify icon="solar:eye-bold" />
                                </IconButton>
                              </Tooltip>
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

      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? t('clientsMaterialsPage.editAccountTitle') : t('clientsMaterialsPage.addAccountTitle')}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label={t('clientsPage.fullName')}
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label={t('clientsPage.phone')}
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))}
              helperText={t('clientsPage.phoneHelper')}
              required
            />
            <TextField
              fullWidth
              label={t('clientsPage.company')}
              value={form.company}
              onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
            />
            <TextField
              fullWidth
              label={t('clientsPage.notes')}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              multiline
              minRows={3}
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
    </>
  );
}

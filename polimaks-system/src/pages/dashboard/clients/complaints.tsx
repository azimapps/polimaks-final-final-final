import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';

import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Dialog,
  TableRow,
  MenuItem,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

type Complaint = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
};

type StoredClient = {
  id: string;
  fullName: string;
};

const CLIENTS_STORAGE_KEY = 'clients-main';
const STORAGE_KEY = 'clients-complaints';

const readClients = (): StoredClient[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      id: item.id ?? '',
      fullName: item.fullName ?? '',
    }));
  } catch {
    return [];
  }
};

const readComplaints = (): Complaint[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any, index: number) => ({
      id: item.id ?? `complaint-${index}`,
      clientId: item.clientId ?? '',
      title: item.title ?? '',
      description: item.description ?? '',
      status: item.status === 'resolved' || item.status === 'in_progress' ? item.status : 'open',
      createdAt: item.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
};

const persistComplaints = (items: Complaint[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export default function ClientComplaintsPage() {
  const { t } = useTranslate('pages');
  const navigate = useNavigate();
  const { clientId } = useParams();

  const clients = useMemo(() => readClients(), []);
  const [complaints, setComplaints] = useState<Complaint[]>(() => readComplaints());
  const [form, setForm] = useState({ title: '', description: '', status: 'open' });
  const [editing, setEditing] = useState<Complaint | null>(null);
  const dialog = useBoolean();

  const client = useMemo(() => clients.find((c) => c.id === clientId) ?? null, [clients, clientId]);
  const filtered = useMemo(
    () => complaints.filter((item) => item.clientId === clientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [clientId, complaints]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setComplaints(readComplaints());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const pageTitle = `${client?.fullName ?? t('clientsPage.title')} — ${t('clientsComplaints.title', { defaultValue: 'Complaints' })} | ${CONFIG.appName}`;

  const addOrUpdateComplaint = () => {
    if (!clientId || !form.title.trim()) return;
    const base: Complaint = {
      id: editing?.id ?? uuidv4(),
      clientId,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status as Complaint['status'],
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    setComplaints((prev) => {
      const next = editing
        ? prev.map((c) => (c.id === editing.id ? base : c))
        : [base, ...prev];
      persistComplaints(next);
      return next;
    });
    dialog.onFalse();
    setEditing(null);
    setForm({ title: '', description: '', status: 'open' });
  };

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" rowGap={1}>
            <Button
              onClick={() => navigate(paths.dashboard.clients.root)}
              startIcon={<span aria-hidden>←</span>}
              color="inherit"
            >
              {t('clientsPage.title')}
            </Button>
            <Typography variant="h4">
              {t('clientsComplaints.title', { defaultValue: 'Complaints' })}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {client?.fullName || t('clientsTransactionsPage.detailGeneric')}
          </Typography>

          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
            <Stack spacing={0.25}>
              <Typography variant="subtitle1">
                {t('clientsComplaints.subtitle', { defaultValue: 'Track issues and resolutions.' })}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('clientsComplaints.caption', { defaultValue: 'Each complaint stores title, description, status, and time.' })}
              </Typography>
            </Stack>
            <Button variant="contained" onClick={dialog.onTrue}>
              {t('clientsComplaints.add', { defaultValue: 'Add complaint' })}
            </Button>
          </Stack>

          <Card>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 220 }}>{t('clientsComplaints.titleLabel', { defaultValue: 'Title' })}</TableCell>
                <TableCell>{t('clientsComplaints.description', { defaultValue: 'Description' })}</TableCell>
                <TableCell sx={{ width: 140 }}>{t('clientsComplaints.status', { defaultValue: 'Status' })}</TableCell>
                <TableCell sx={{ width: 220 }}>{t('clientsComplaints.createdAt', { defaultValue: 'Created at' })}</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>{t('clientsComplaints.actions', { defaultValue: 'Actions' })}</TableCell>
              </TableRow>
            </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Box sx={{ py: 4 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('clientsComplaints.empty', { defaultValue: 'No complaints yet.' })}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {item.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t(`clientsComplaints.statuses.${item.status}`, { defaultValue: item.status })}
                            color={
                              item.status === 'resolved'
                                ? 'success'
                                : item.status === 'in_progress'
                                  ? 'warning'
                                  : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditing(item);
                              setForm({
                                title: item.title,
                                description: item.description,
                                status: item.status,
                              });
                              dialog.onTrue();
                            }}
                          >
                            <Iconify icon="solar:pen-bold" width={18} height={18} />
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
        <DialogTitle>
          {editing
            ? t('clientsComplaints.edit', { defaultValue: 'Edit complaint' })
            : t('clientsComplaints.add', { defaultValue: 'Add complaint' })}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label={t('clientsComplaints.titleLabel', { defaultValue: 'Title' })}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t('clientsComplaints.description', { defaultValue: 'Description' })}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <TextField
              select
              fullWidth
              label={t('clientsComplaints.status', { defaultValue: 'Status' })}
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {['open', 'in_progress', 'resolved'].map((option) => (
                <MenuItem key={option} value={option}>
                  {t(`clientsComplaints.statuses.${option}`, { defaultValue: option })}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} color="inherit">
            {t('clientsComplaints.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button onClick={addOrUpdateComplaint} variant="contained" disabled={!form.title.trim()}>
            {t('clientsComplaints.save', { defaultValue: 'Save' })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

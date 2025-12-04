/* eslint-disable perfectionist/sort-imports */
import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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
import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import data from 'src/data/stanok-pechat.json';

type Machine = {
  id: string;
  language_code: string;
  name: string;
};

const LANGUAGE_OPTIONS = [
  { code: 'cn', labelKey: 'languages.cn', country: 'CN' },
  { code: 'de', labelKey: 'languages.de', country: 'DE' },
  { code: 'uz', labelKey: 'languages.uz', country: 'UZ' },
  { code: 'ru', labelKey: 'languages.ru', country: 'RU' },
  { code: 'en', labelKey: 'languages.en', country: 'GB' },
];

export default function PechatPage() {
  const { t } = useTranslate('pages');

  const title = `${t('pechatPage.title')} | ${CONFIG.appName}`;

  const initialData = useMemo<Machine[]>(() => data as Machine[], []);

  const [items, setItems] = useState<Machine[]>(initialData);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [form, setForm] = useState({ language_code: '', name: '' });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<Machine | null>(null);

  const dialog = useBoolean();
  const deleteDialog = useBoolean();

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
      setItems((prev) =>
        prev.map((it) => (it.id === editing.id ? { ...it, ...form } : it))
      );
    } else {
      setItems((prev) => [...prev, { id: uuidv4(), ...form }]);
    }
    dialog.onFalse();
  };

  const handleDelete = () => {
    // TODO: replace with real API calls once backend is ready (persist to server)
    if (editing) {
      setItems((prev) => prev.filter((it) => it.id !== editing.id));
    }
    deleteDialog.onFalse();
    dialog.onFalse();
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
                      {t('pechatPage.edit')}
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
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <FlagIcon
                              code={getCountryCode(item.language_code)}
                              sx={{ width: 38, height: 26, borderRadius: 0.75 }}
                            />
                            <Chip
                              label={item.language_code.toUpperCase()}
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: 14, py: 0.25 }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{item.name}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={(e) => openMenu(e, item)}>
                            <i className="ri-more-2-fill" />
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
                    <Typography variant="subtitle2">
                      {t(option.labelKey)} ({option.code.toUpperCase()})
                    </Typography>
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
            {/* TODO: replace static JSON with real API endpoints when backend is available */}
            Data lives in memory for now; hook this up to your API later.
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
            setEditing(menuItem);
            deleteDialog.onTrue();
          }
        }}
        labels={{ edit: t('pechatPage.edit'), delete: t('pechatPage.delete') }}
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
        <i className="ri-edit-line" />
        &nbsp;{labels.edit}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onDelete();
          onClose();
        }}
        sx={{ color: 'error.main' }}
      >
        <i className="ri-delete-bin-line" />
        &nbsp;{labels.delete}
      </MenuItem>
    </Menu>
  );
}

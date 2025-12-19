/* eslint-disable perfectionist/sort-imports */
import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import seedData from 'src/data/plyonka.json';
import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';

type Currency = 'UZS' | 'USD' | 'RUB' | 'EUR';

type PlyonkaItem = {
  id: string;
  category: string;
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

type PlyonkaTransaction = {
  id: string;
  date: string;
  type: 'in' | 'out';
  amountKg: number;
  note: string;
};

const STORAGE_KEY = 'ombor-plyonka';

const normalizeItems = (items: (Partial<PlyonkaItem> & { id?: string })[]): PlyonkaItem[] =>
  items.map((item, index) => {
    const currency: Currency = ['UZS', 'USD', 'RUB', 'EUR'].includes(
      item.priceCurrency as Currency
    )
      ? (item.priceCurrency as Currency)
      : 'UZS';

    return {
      id: item.id || `plyonka-${index}`,
      category: item.category || 'BOPP',
      subcategory: item.subcategory || 'prazrachniy',
      totalKg: typeof item.totalKg === 'number' ? item.totalKg : Number(item.totalKg) || 0,
      thickness:
        typeof item.thickness === 'number' ? item.thickness : Number(item.thickness) || 0,
      width: typeof item.width === 'number' ? item.width : Number(item.width) || 0,
      pricePerKg:
        typeof item.pricePerKg === 'number' ? item.pricePerKg : Number(item.pricePerKg) || 0,
      priceCurrency: currency,
      seriyaNumber: item.seriyaNumber || '',
      createdDate: item.createdDate || new Date().toISOString().slice(0, 10),
      admin: item.admin || '',
      description: item.description || '',
    };
  });

const readPlyonkaItems = (): PlyonkaItem[] => {
  if (typeof window === 'undefined') return normalizeItems(seedData as PlyonkaItem[]);
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return normalizeItems(seedData as PlyonkaItem[]);
  try {
    return normalizeItems(JSON.parse(stored) as PlyonkaItem[]);
  } catch {
    return normalizeItems(seedData as PlyonkaItem[]);
  }
};

export default function PlyonkaTransactionsPage() {
  const { plyonkaId } = useParams();
  const { t } = useTranslate('pages');
  const navigate = useNavigate();

  const items = useMemo(() => readPlyonkaItems(), []);
  const item = useMemo(
    () => items.find((it) => it.id === plyonkaId) ?? null,
    [items, plyonkaId]
  );

  const heading = t('plyonkaTransactionsPage.title', {
    seriya: item?.seriyaNumber || t('plyonkaTransactionsPage.unknown'),
  });
  const pageTitle = `${heading} | ${CONFIG.appName}`;

  const transactions = useMemo<PlyonkaTransaction[]>(() => {
    if (!item) return [];
    return [
      {
        id: `${item.id}-initial`,
        date: item.createdDate,
        type: 'in',
        amountKg: item.totalKg,
        note: t('plyonkaTransactionsPage.generatedFromStock'),
      },
    ];
  }, [item, t]);

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography variant="h4">{heading}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {item
                  ? t('plyonkaTransactionsPage.subtitle')
                  : t('plyonkaTransactionsPage.notFound')}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={() => navigate(paths.dashboard.inventory.plyonka)}
              >
                {t('plyonkaTransactionsPage.back')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:import-bold" />}
                disabled
              >
                {t('plyonkaTransactionsPage.add')}
              </Button>
            </Stack>
          </Stack>

          <Card sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">{t('plyonkaTransactionsPage.summaryTitle')}</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
                <Detail label={t('plyonkaPage.seriya')} value={item?.seriyaNumber} />
                <Detail label={t('plyonkaPage.category')} value={item?.category} />
                <Detail label={t('plyonkaPage.subcategory')} value={item?.subcategory} />
                <Detail label={t('plyonkaPage.admin')} value={item?.admin} />
                <Detail
                  label={t('plyonkaPage.receivedDate')}
                  value={item?.createdDate}
                />
                <Detail
                  label={t('plyonkaPage.totalKg')}
                  value={
                    item ? `${item.totalKg.toLocaleString()} ${t('plyonkaPage.kg')}` : undefined
                  }
                />
                <Detail
                  label={t('plyonkaPage.width')}
                  value={
                    item ? `${item.width.toLocaleString()} ${t('plyonkaPage.mm')}` : undefined
                  }
                />
                <Detail
                  label={t('plyonkaPage.thickness')}
                  value={
                    item ? `${item.thickness.toLocaleString()} ${t('plyonkaPage.microns')}` : undefined
                  }
                />
                <Detail
                  label={t('plyonkaPage.pricePerKg')}
                  value={
                    item
                      ? `${item.pricePerKg.toLocaleString()} ${item.priceCurrency}`
                      : undefined
                  }
                />
              </Stack>
            </Stack>
          </Card>

          <Card>
            <TableContainer>
              <Table size="medium" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 140 }}>{t('plyonkaTransactionsPage.table.date')}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{t('plyonkaTransactionsPage.table.type')}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{t('plyonkaTransactionsPage.table.amount')}</TableCell>
                    <TableCell>{t('plyonkaTransactionsPage.table.note')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!item ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('plyonkaTransactionsPage.notFound')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Box
                          sx={{
                            py: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('plyonkaTransactionsPage.empty')}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Typography variant="body2">{tx.date}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              tx.type === 'in'
                                ? t('plyonkaTransactionsPage.typeIn')
                                : t('plyonkaTransactionsPage.typeOut')
                            }
                            color={tx.type === 'in' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {tx.amountKg.toLocaleString()} {t('plyonkaPage.kg')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {tx.note || '—'}
                          </Typography>
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
    </>
  );
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Box sx={{ minWidth: 180 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="subtitle2">{value ?? '—'}</Typography>
    </Box>
  );
}

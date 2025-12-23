import type { SyntheticEvent } from 'react';

import { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { FinanceIncomeView } from '../income';
import { FinanceExpenseView } from '../expense';

type Method = 'cash' | 'transfer';
type Flow = 'income' | 'expense';

export default function FinanceMethodPage() {
  const { t } = useTranslate('pages');
  const { t: tNavbar } = useTranslate('navbar');
  const navigate = useNavigate();
  const { method, flow } = useParams() as { method?: string; flow?: string };

  const resolvedMethod: Method = method === 'transfer' || method === 'cash' ? method : 'cash';
  const resolvedFlow: Flow = flow === 'expense' || flow === 'income' ? flow : 'income';
  const [activeFlow, setActiveFlow] = useState<Flow>(resolvedFlow);

  useEffect(() => {
    setActiveFlow(resolvedFlow);
  }, [resolvedFlow]);

  const methodLabel = useMemo(
    () => (resolvedMethod === 'transfer' ? tNavbar('finance_transfer') : tNavbar('finance_cash')),
    [resolvedMethod, tNavbar]
  );
  const pageTitle = `${methodLabel} | ${CONFIG.appName}`;

  const basePath = resolvedMethod === 'transfer' ? paths.dashboard.finance.transfer : paths.dashboard.finance.cash;

  const handleTabChange = (_event: SyntheticEvent, value: Flow) => {
    setActiveFlow(value);
    navigate(value === 'expense' ? basePath.expense : basePath.income);
  };

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            {methodLabel}
          </Typography>
          <Tabs value={activeFlow} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab value="income" label={t('finance.income.title')} />
            <Tab value="expense" label={t('finance.expense.title')} />
          </Tabs>
        </Stack>

        <Box>
          {activeFlow === 'income' ? (
            <FinanceIncomeView embedded method={resolvedMethod} />
          ) : (
            <FinanceExpenseView embedded method={resolvedMethod} />
          )}
        </Box>
      </Container>
    </>
  );
}

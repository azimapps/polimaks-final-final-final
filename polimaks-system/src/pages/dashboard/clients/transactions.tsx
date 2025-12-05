import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function ClientsTransactionsPage() {
  const { t } = useTranslate('pages');

  const title = `${t('clients.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <SectionPlaceholder
          badge={t('clients.items.transactions.title')}
          title={t('clients.items.transactions.title')}
          description={t('clients.items.transactions.description')}
        />
      </Container>
    </>
  );
}

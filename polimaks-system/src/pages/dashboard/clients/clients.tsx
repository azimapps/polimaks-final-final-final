import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function ClientsPage() {
  const { t } = useTranslate('pages');

  const title = `${t('clients.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <SectionPlaceholder
          badge={t('clients.items.clients.title')}
          title={t('clients.items.clients.title')}
          description={t('clients.items.clients.description')}
        />
      </Container>
    </>
  );
}

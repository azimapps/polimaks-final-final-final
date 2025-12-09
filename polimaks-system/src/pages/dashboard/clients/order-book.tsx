import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function ClientsOrderBookPage() {
  const { t } = useTranslate('pages');

  const title = `${t('clients.items.order_book.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('clients.items.order_book.title')}
          title={t('clients.items.order_book.title')}
          description={t('clients.items.order_book.description')}
        />
      </Container>
    </>
  );
}
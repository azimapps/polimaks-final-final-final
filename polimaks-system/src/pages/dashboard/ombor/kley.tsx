import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function KleyPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.items.kley.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('inventory.title')}
          title={t('inventory.items.kley.title')}
          description={t('inventory.items.kley.description')}
        />
      </Container>
    </>
  );
}

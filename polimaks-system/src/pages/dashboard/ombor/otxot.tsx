import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function OtxotPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.items.otxot.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('inventory.title')}
          title={t('inventory.items.otxot.title')}
          description={t('inventory.items.otxot.description')}
        />
      </Container>
    </>
  );
}

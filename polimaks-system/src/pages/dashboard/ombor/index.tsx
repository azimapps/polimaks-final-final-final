import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function OmborIndexPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('inventory.title')}
          title={t('inventory.title')}
          description={t('inventory.subtitle')}
        />
      </Container>
    </>
  );
}

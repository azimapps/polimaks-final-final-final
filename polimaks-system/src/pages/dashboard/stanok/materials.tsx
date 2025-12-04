import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function MaterialsPage() {
  const { t } = useTranslate('pages');

  const title = `${t('pechatPage.materials')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('pechatPage.materials')}
          title={t('pechatPage.materials')}
          description={t('placeholder.description')}
        />
      </Container>
    </>
  );
}

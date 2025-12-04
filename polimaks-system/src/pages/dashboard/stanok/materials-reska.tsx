import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function MaterialsReskaPage() {
  const { t } = useTranslate('pages');

  const title = `${t('reskaPage.materials')} - ${t('reskaPage.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('reskaPage.title')}
          title={`${t('reskaPage.materials')} (${t('reskaPage.title')})`}
          description={t('placeholder.description')}
        />
      </Container>
    </>
  );
}

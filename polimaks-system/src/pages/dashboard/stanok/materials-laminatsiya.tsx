import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function MaterialsLaminatsiyaPage() {
  const { t } = useTranslate('pages');

  const title = `${t('laminatsiyaPage.materials')} - ${t('laminatsiyaPage.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('laminatsiyaPage.title')}
          title={`${t('laminatsiyaPage.materials')} (${t('laminatsiyaPage.title')})`}
          description={t('placeholder.description')}
        />
      </Container>
    </>
  );
}

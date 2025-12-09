import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function IshlabChiqarishIndexPage() {
  const { t } = useTranslate('pages');

  const title = `${t('ishlabChiqarish.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('ishlabChiqarish.title')}
          title={t('ishlabChiqarish.title')}
          description={t('ishlabChiqarish.subtitle')}
        />
      </Container>
    </>
  );
}
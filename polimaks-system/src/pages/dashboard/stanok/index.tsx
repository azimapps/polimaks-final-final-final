import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function StanokIndexPage() {
  const { t } = useTranslate('pages');

  const title = `${t('machines.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('machines.title')}
          title={t('machines.title')}
          description={t('machines.subtitle')}
        />
      </Container>
    </>
  );
}

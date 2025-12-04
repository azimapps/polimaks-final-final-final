import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function BrigadaPage() {
  const { t } = useTranslate('pages');

  const title = `${t('pechatPage.brigada')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('pechatPage.brigada')}
          title={t('pechatPage.brigada')}
          description={t('placeholder.description')}
        />
      </Container>
    </>
  );
}

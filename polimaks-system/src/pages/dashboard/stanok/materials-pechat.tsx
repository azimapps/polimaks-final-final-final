import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function MaterialsPechatPage() {
  const { t } = useTranslate('pages');

  const title = `${t('pechatPage.materials')} - ${t('pechatPage.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('pechatPage.title')}
          title={`${t('pechatPage.materials')} (${t('pechatPage.title')})`}
          description={t('placeholder.description')}
        />
      </Container>
    </>
  );
}

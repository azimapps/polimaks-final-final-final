import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function ReskaPage() {
  const { t } = useTranslate('pages');

  const title = `${t('machines.items.reska.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('machines.title')}
          title={t('machines.items.reska.title')}
          description={t('machines.items.reska.description')}
        />
      </Container>
    </>
  );
}

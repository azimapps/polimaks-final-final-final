import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function RazvaritelPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.items.razvaritel.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('inventory.title')}
          title={t('inventory.items.razvaritel.title')}
          description={t('inventory.items.razvaritel.description')}
        />
      </Container>
    </>
  );
}

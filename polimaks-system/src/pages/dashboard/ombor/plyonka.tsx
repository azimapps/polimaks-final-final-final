import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function PlyonkaPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.items.plyonka.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('inventory.title')}
          title={t('inventory.items.plyonka.title')}
          description={t('inventory.items.plyonka.description')}
        />
      </Container>
    </>
  );
}

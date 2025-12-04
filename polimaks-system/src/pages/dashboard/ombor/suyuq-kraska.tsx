import Container from '@mui/material/Container';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SectionPlaceholder } from '../components/section-placeholder';

export default function SuyuqKraskaPage() {
  const { t } = useTranslate('pages');

  const title = `${t('inventory.items.suyuq_kraska.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md">
        <SectionPlaceholder
          badge={t('inventory.title')}
          title={t('inventory.items.suyuq_kraska.title')}
          description={t('inventory.items.suyuq_kraska.description')}
        />
      </Container>
    </>
  );
}

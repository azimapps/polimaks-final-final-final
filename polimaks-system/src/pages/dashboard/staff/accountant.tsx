import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

export default function StaffAccountantPage() {
  const { t } = useTranslate('pages');

  const title = `${t('staff.items.accountant.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={1}>
          <Typography variant="h4">{t('staff.items.accountant.title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('staff.items.accountant.description')}
          </Typography>
        </Stack>
      </Container>
    </>
  );
}

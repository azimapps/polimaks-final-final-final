import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export default function ReskaQueuePage() {
  const { t } = useTranslate('pages');
  const title = `${t('reskaPanel.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <div>
            <Typography variant="h3" gutterBottom>
              {t('reskaPanel.queue.heading')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('reskaPanel.queue.description')}
            </Typography>
          </div>
        </Stack>

        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
            {t('reskaPanel.queue.heading')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('reskaPanel.queue.placeholder')}
          </Typography>
        </Card>
      </Container>
    </>
  );
}

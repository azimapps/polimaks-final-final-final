import { Box, Container, Typography } from '@mui/material';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export default function BuyurtmaPlanlashtirish() {
  const { t } = useTranslate('pages');

  const title = `${t('buyurtmaPlanlashtirish.title')} | ${CONFIG.appName}`;

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            minHeight: '60vh',
            textAlign: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h3" gutterBottom>
            {t('buyurtmaPlanlashtirish.title')}
          </Typography>
          
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            {t('buyurtmaPlanlashtirish.subtitle')}
          </Typography>

          <Typography variant="body1" sx={{ color: 'text.disabled', mt: 2 }}>
            {t('placeholder.description')}
          </Typography>
        </Box>
      </Container>
    </>
  );
}
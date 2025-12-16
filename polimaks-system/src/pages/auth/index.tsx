import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function RoleSelectPage() {
  const { t } = useTranslate('pages');
  const title = `${t('roleSelect.title')} | ${CONFIG.appName}`;

  const roles = [
    {
      key: 'ceo',
      heading: t('roleSelect.ceo.heading'),
      description: t('roleSelect.ceo.description'),
      cta: t('roleSelect.ceo.cta'),
      href: paths.dashboard.root,
    },
    {
      key: 'reska',
      heading: t('roleSelect.reska.heading'),
      description: t('roleSelect.reska.description'),
      cta: t('roleSelect.reska.cta'),
      href: paths.dashboard.reskaPanel.root,
    },
  ];

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3} sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h3">{t('roleSelect.title')}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('roleSelect.subtitle')}
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {roles.map((role) => (
            <Grid key={role.key} size={{ xs: 12, md: 6 }}>
              <Card
                variant="outlined"
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h5">{role.heading}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {role.description}
                  </Typography>
                </Stack>
                <Button
                  component={RouterLink}
                  href={role.href}
                  variant="contained"
                  color={role.key === 'reska' ? 'secondary' : 'primary'}
                >
                  {role.cta}
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}

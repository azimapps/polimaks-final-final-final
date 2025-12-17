import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

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

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          {roles.map((role) => (
            <Card
              key={role.key}
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
          ))}
        </Box>
      </Container>
    </>
  );
}

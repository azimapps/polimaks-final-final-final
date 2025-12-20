import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

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
      cta: t('roleSelect.ceo.cta'),
      href: paths.dashboard.root,
      color: 'primary' as const,
    },
    {
      key: 'reska',
      heading: t('roleSelect.reska.heading'),
      cta: t('roleSelect.reska.cta'),
      href: paths.dashboard.reskaPanel.root,
      color: 'secondary' as const,
    },
    {
      key: 'pechat',
      heading: t('roleSelect.pechat.heading'),
      cta: t('roleSelect.pechat.cta'),
      href: paths.dashboard.pechatPanel.root,
      color: 'info' as const,
    },
    {
      key: 'laminatsiya',
      heading: t('roleSelect.laminatsiya.heading'),
      cta: t('roleSelect.laminatsiya.cta'),
      href: paths.dashboard.laminatsiyaPanel.root,
      color: 'warning' as const,
    },
  ];

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={1.5} sx={{ textAlign: 'center', mb: 2.5 }}>
          <Typography variant="h3" sx={{ fontSize: { xs: '1.85rem', md: '2.2rem' } }}>
            {t('roleSelect.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('roleSelect.subtitle')}
          </Typography>
        </Stack>

        <Card variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 2, sm: 2.5 },
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            {roles.map((role) => (
              <Card
                key={role.key}
                variant="outlined"
                sx={(theme) => ({
                  p: { xs: 3, sm: 3.5 },
                  height: '100%',
                  minHeight: { xs: 150, sm: 180 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 2,
                  borderRadius: 2,
                  borderTop: '3px solid',
                  borderTopColor: theme.palette[role.color].main,
                })}
              >
                <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', sm: '1.3rem' } }}>
                  {role.heading}
                </Typography>
                <Button
                  component={RouterLink}
                  href={role.href}
                  variant="contained"
                  color={role.color || 'primary'}
                  size="medium"
                  fullWidth
                  sx={{ whiteSpace: 'normal' }}
                >
                  {role.cta}
                </Button>
              </Card>
            ))}
          </Box>
        </Card>
      </Container>
    </>
  );
}

import { Link } from 'react-router';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

export default function HomePage() {
  const { t } = useTranslate('pages');

  const title = `${t('home.title')} | ${CONFIG.appName}`;

  const sections = [
    {
      key: 'inventory' as const,
      title: t('home.inventoryCard.title'),
      body: t('home.inventoryCard.body'),
      path: paths.dashboard.inventory.root,
      color: 'primary' as const,
      items: [
        'plyonka',
        'kraska',
        'suyuq_kraska',
        'razvaritel',
        'silindir',
        'kley',
        'zapchastlar',
        'otxot',
        'tayyor_mahsulotlar',
      ],
    },
    {
      key: 'machines' as const,
      title: t('home.machinesCard.title'),
      body: t('home.machinesCard.body'),
      path: paths.dashboard.stanok.root,
      color: 'secondary' as const,
      items: ['pechat', 'reska', 'laminatsiya'],
    },
  ];

  const getItemLabel = (sectionKey: 'inventory' | 'machines', item: string) =>
    t(`${sectionKey}.items.${item}.title`);

  return (
    <>
      <title>{title}</title>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={4}>
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              {CONFIG.appName}
            </Typography>
            <Typography variant="h3">{t('home.title')}</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 720 }}>
              {t('home.subtitle')}
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {sections.map((section) => (
              <Grid key={section.key} size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                      {section.key === 'inventory' ? t('inventory.title') : t('machines.title')}
                    </Typography>
                    <Typography variant="h5">{section.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {section.body}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                    {section.items.map((item) => (
                      <Chip
                        key={item}
                        label={getItemLabel(section.key, item)}
                        color={section.color}
                        variant="outlined"
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    ))}
                  </Stack>

                  <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button component={Link} to={section.path} variant="contained" color={section.color}>
                      {t('home.cta')}
                    </Button>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {section.key === 'inventory'
                        ? t('inventory.subtitle')
                        : t('machines.subtitle')}
                    </Typography>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </>
  );
}

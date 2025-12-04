import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

// Simple placeholder block for empty sections until real content is ready.
type SectionPlaceholderProps = {
  badge?: string;
  title: string;
  description: string;
};

export function SectionPlaceholder({ badge, title, description }: SectionPlaceholderProps) {
  const { t } = useTranslate('pages');

  return (
    <Stack spacing={3} alignItems="flex-start">
      {badge ? (
        <Chip
          label={badge}
          color="primary"
          size="small"
          sx={{ fontWeight: 600, letterSpacing: 0.2 }}
        />
      ) : null}

      <Stack spacing={1}>
        <Typography variant="h3">{title}</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 720 }}>
          {description}
        </Typography>
      </Stack>

      <Card
        sx={{
          p: 3,
          width: '100%',
          maxWidth: 720,
          bgcolor: 'background.neutral',
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1">{t('placeholder.title')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {t('placeholder.description')}
        </Typography>
      </Card>
    </Stack>
  );
}

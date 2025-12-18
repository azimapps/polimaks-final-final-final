/* eslint-disable perfectionist/sort-imports */
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

type FinanceTemplateProps = {
  baseKey: string;
};

export function FinanceTemplate({ baseKey }: FinanceTemplateProps) {
  const { t } = useTranslate('pages');

  const titleText = t(`${baseKey}.title`);
  const description = t(`${baseKey}.description`, '', { returnObjects: false });
  const subtitle = t(`${baseKey}.subtitle`, '', { returnObjects: false });

  const pageTitle = `${titleText} | ${CONFIG.appName}`;

  return (
    <>
      <title>{pageTitle}</title>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={1.5}>
          <Typography variant="h4">{titleText}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {description !== `${baseKey}.description` ? description : subtitle}
          </Typography>
          {subtitle && description !== subtitle && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Stack>
      </Container>
    </>
  );
}

import type { NavSectionProps } from 'src/components/nav-section';

import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  overview: icon('ic-analytics'),
};

// ----------------------------------------------------------------------

export const useLaminatsiyaNavData = (): NavSectionProps['data'] => {
  const { t } = useTranslate('navbar');

  return useMemo(
    () => [
      {
        subheader: t('laminatsiya_panel'),
        items: [
          {
            title: t('laminatsiya_panel_overview'),
            path: paths.dashboard.laminatsiyaPanel.overview,
            icon: ICONS.overview,
          },
        ],
      },
    ],
    [t]
  );
};

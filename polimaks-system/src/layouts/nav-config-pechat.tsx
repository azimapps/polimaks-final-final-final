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
  inProgress: icon('ic-analytics'),
  finished: icon('ic-analytics'),
};

// ----------------------------------------------------------------------

export const usePechatNavData = (): NavSectionProps['data'] => {
  const { t } = useTranslate('navbar');

  return useMemo(
    () => [
      {
        subheader: t('pechat_panel'),
        items: [
          {
            title: t('pechat_panel_in_progress'),
            path: paths.dashboard.pechatPanel.inProgress,
            icon: ICONS.inProgress,
          },
          {
            title: t('pechat_panel_finished'),
            path: paths.dashboard.pechatPanel.finished,
            icon: ICONS.finished,
          },
        ],
      },
    ],
    [t]
  );
};

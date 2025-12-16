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
  queue: icon('ic-odd'),
  reports: icon('ic-analytics'),
};

// ----------------------------------------------------------------------

export const useReskaNavData = (): NavSectionProps['data'] => {
  const { t } = useTranslate('navbar');

  return useMemo(
    () => [
      {
        subheader: t('reska_panel'),
        items: [
          {
            title: t('reska_panel_overview'),
            path: paths.dashboard.reskaPanel.overview,
            icon: ICONS.overview,
          },
          {
            title: t('reska_panel_queue'),
            path: paths.dashboard.reskaPanel.queue,
            icon: ICONS.queue,
          },
          {
            title: t('reska_panel_reports'),
            path: paths.dashboard.reskaPanel.reports,
            icon: ICONS.reports,
          },
        ],
      },
    ],
    [t]
  );
};

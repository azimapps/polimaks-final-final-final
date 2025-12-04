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
  inventory: icon('ic-analytics'),
  machine: icon('ic-odd'),
};

// ----------------------------------------------------------------------

export const useNavData = (): NavSectionProps['data'] => {
  const { t } = useTranslate('navbar');
  return useMemo(
    () => [
      {
        subheader: t('sections'),
        items: [
          {
            title: t('inventory'),
            path: paths.dashboard.inventory.root,
            icon: ICONS.inventory,
            children: [
              { title: t('plyonka'), path: paths.dashboard.inventory.plyonka },
              { title: t('kraska'), path: paths.dashboard.inventory.kraska },
              { title: t('suyuq_kraska'), path: paths.dashboard.inventory.suyuqKraska },
              { title: t('razvaritel'), path: paths.dashboard.inventory.razvaritel },
              { title: t('silindir'), path: paths.dashboard.inventory.silindir },
              { title: t('kley'), path: paths.dashboard.inventory.kley },
              { title: t('zapchastlar'), path: paths.dashboard.inventory.zapchastlar },
              { title: t('otxot'), path: paths.dashboard.inventory.otxot },
              {
                title: t('tayyor_mahsulotlar'),
                path: paths.dashboard.inventory.tayyorMahsulotlar,
              },
            ],
          },
          {
            title: t('stanok'),
            path: paths.dashboard.stanok.root,
            icon: ICONS.machine,
            children: [
              { title: t('pechat'), path: paths.dashboard.stanok.pechat },
              { title: t('reska'), path: paths.dashboard.stanok.reska },
              { title: t('laminatsiya'), path: paths.dashboard.stanok.laminatsiya },
            ],
          },
        ],
      },
    ],
    [t]
  );
};

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

const componentIcon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/components/${name}.svg`} />
);

const ICONS = {
  inventory: icon('ic-analytics'),
  machine: icon('ic-odd'),
  staff: icon('ic-user'),
  clients: icon('ic-analytics'),
  finance: icon('ic-analytics'),
  ishlabChiqarish: componentIcon('ic-extra-chart'),
  buyurtmaPlanlashtirish: componentIcon('ic-progress'),
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
              { title: t('inventory_analytics'), path: paths.dashboard.inventory.analytics },
              { title: t('plyonka'), path: paths.dashboard.inventory.plyonka },
              { title: t('kraska'), path: paths.dashboard.inventory.kraska },
              { title: t('razvaritel'), path: paths.dashboard.inventory.razvaritel },
              { title: t('razvaritel_aralashmasi'), path: paths.dashboard.inventory.razvaritelAralashmasi },
              { title: t('silindir'), path: paths.dashboard.inventory.silindir },
              { title: t('kley'), path: paths.dashboard.inventory.kley },
              { title: t('zapchastlar'), path: paths.dashboard.inventory.zapchastlar },
              { title: t('otxot'), path: paths.dashboard.inventory.otxot },
              { title: t('tayyor_mahsulotlar_tashkent'), path: paths.dashboard.inventory.tayyorMahsulotlarTashkent },
              { title: t('tayyor_mahsulotlar_angren'), path: paths.dashboard.inventory.tayyorMahsulotlarAngren },
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
          {
            title: t('staff'),
            path: paths.dashboard.staff.root,
            icon: ICONS.staff,
            children: [
              { title: t('staff_crm'), path: paths.dashboard.staff.crm },
              { title: t('staff_worker'), path: paths.dashboard.staff.worker },
              { title: t('staff_accountant'), path: paths.dashboard.staff.accountant },
              { title: t('staff_planner'), path: paths.dashboard.staff.planner },
            ],
          },
          {
            title: t('partners'),
            path: paths.dashboard.partners.root,
            icon: ICONS.clients,
          },
          {
            title: t('clients'),
            path: paths.dashboard.clients.root,
            icon: ICONS.clients,
            children: [
              { title: t('clients_clients'), path: paths.dashboard.clients.clients },
              { title: t('clients_crm'), path: paths.dashboard.clients.crm },
              { title: t('clients_materials'), path: paths.dashboard.clients.materials },
              { title: t('clients_order_book'), path: paths.dashboard.clients.orderBook },
            ],
          },
          {
            title: t('finance'),
            path: paths.dashboard.finance.root,
            icon: ICONS.finance,
            children: [
              {
                title: t('finance_cash'),
                path: paths.dashboard.finance.cash.root,
              },
              {
                title: t('finance_transfer'),
                path: paths.dashboard.finance.transfer.root,
              },
            ],
          },

          {
            title: t('ishlab_chiqarish'),
            path: paths.dashboard.ishlabChiqarish.root,
            icon: ICONS.ishlabChiqarish,
            children: [
              { title: t('ishlab_chiqarish_hisobotlar'), path: paths.dashboard.ishlabChiqarish.hisobotlar },
            ],
          },
          {
            title: t('buyurtma_planlashtirish'),
            path: paths.dashboard.buyurtmaPlanlashtirish.root,
            icon: ICONS.buyurtmaPlanlashtirish,
          },
        ],
      },
    ],
    [t]
  );
};

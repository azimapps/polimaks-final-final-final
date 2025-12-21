import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { DashboardLayout } from 'src/layouts/dashboard';
import { useReskaNavData } from 'src/layouts/nav-config-reska';
import { usePechatNavData } from 'src/layouts/nav-config-pechat';
import { useLaminatsiyaNavData } from 'src/layouts/nav-config-laminatsiya';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { mainRoutes } from './main';
import { usePathname } from '../hooks';
import { authDemoRoutes } from './auth';

// ----------------------------------------------------------------------

const HomePage = lazy(() => import('src/pages/dashboard/home'));
const OmborIndexPage = lazy(() => import('src/pages/dashboard/ombor'));
const InventoryAnalyticsPage = lazy(() => import('src/pages/dashboard/ombor/analytics'));
const PlyonkaPage = lazy(() => import('src/pages/dashboard/ombor/plyonka'));
const PlyonkaTransactionsPage = lazy(
  () => import('src/pages/dashboard/ombor/plyonka-transaksiyalar')
);
const KraskaPage = lazy(() => import('src/pages/dashboard/ombor/kraska'));
const KraskaTransactionsPage = lazy(
  () => import('src/pages/dashboard/ombor/kraska-transaksiyalar')
);
const SuyuqKraskaPage = lazy(() => import('src/pages/dashboard/ombor/suyuq-kraska'));
const SuyuqKraskaTransactionsPage = lazy(
  () => import('src/pages/dashboard/ombor/suyuq-kraska-transaksiyalar')
);
const RazvaritelPage = lazy(() => import('src/pages/dashboard/ombor/razvaritel'));
const RazvaritelTransactionsPage = lazy(
  () => import('src/pages/dashboard/ombor/razvaritel-transaksiyalar')
);
const SilindirPage = lazy(() => import('src/pages/dashboard/ombor/silindir'));
const SilindirTransactionsPage = lazy(
  () => import('src/pages/dashboard/ombor/silindir-transaksiyalar')
);
const KleyPage = lazy(() => import('src/pages/dashboard/ombor/kley'));
const ZapchastlarPage = lazy(() => import('src/pages/dashboard/ombor/zapchastlar'));
const OtxotPage = lazy(() => import('src/pages/dashboard/ombor/otxot'));
const TayyorMahsulotlarTashkentPage = lazy(
  () => import('src/pages/dashboard/ombor/tayyor-mahsulotlar-tashkent')
);
const TayyorMahsulotlarAngrenPage = lazy(
  () => import('src/pages/dashboard/ombor/tayyor-mahsulotlar-angren')
);
const StanokIndexPage = lazy(() => import('src/pages/dashboard/stanok'));
const PechatPage = lazy(() => import('src/pages/dashboard/stanok/pechat'));
const PechatProfilePage = lazy(() => import('src/pages/dashboard/stanok/pechat-profile'));
const ReskaPage = lazy(() => import('src/pages/dashboard/stanok/reska'));
const LaminatsiyaPage = lazy(() => import('src/pages/dashboard/stanok/laminatsiya'));
const BrigadaPechatPage = lazy(() => import('src/pages/dashboard/stanok/brigada-pechat'));
const BrigadaReskaPage = lazy(() => import('src/pages/dashboard/stanok/brigada-reska'));
const BrigadaLaminatsiyaPage = lazy(() => import('src/pages/dashboard/stanok/brigada-laminatsiya'));
const MaterialsPechatPage = lazy(() => import('src/pages/dashboard/stanok/materials-pechat'));
const MaterialsReskaPage = lazy(() => import('src/pages/dashboard/stanok/materials-reska'));
const MaterialsLaminatsiyaPage = lazy(() => import('src/pages/dashboard/stanok/materials-laminatsiya'));
const StaffCrmPage = lazy(() => import('src/pages/dashboard/staff/crm'));
const StaffWorkerPage = lazy(() => import('src/pages/dashboard/staff/worker'));
const StaffAccountantPage = lazy(() => import('src/pages/dashboard/staff/accountant'));
const StaffPlannerPage = lazy(() => import('src/pages/dashboard/staff/planner'));
const FinancePage = lazy(() => import('src/pages/dashboard/finance'));
const FinanceIncomePage = lazy(() => import('src/pages/dashboard/finance/income'));
const FinanceExpensePage = lazy(() => import('src/pages/dashboard/finance/expense'));
const ClientsPage = lazy(() => import('src/pages/dashboard/clients/clients'));
const ClientsCrmPage = lazy(() => import('src/pages/dashboard/clients/crm'));
const PechatPanelOverviewPage = lazy(() => import('src/pages/dashboard/pechat-panel/overview'));
const ClientTransactionsDetailPage = lazy(
  () => import('src/pages/dashboard/clients/client-transactions')
);
const ClientAgreementsPage = lazy(() => import('src/pages/dashboard/clients/agreements'));
const ClientComplaintsPage = lazy(() => import('src/pages/dashboard/clients/complaints'));
const ClientsMaterialsPage = lazy(() => import('src/pages/dashboard/clients/materials'));
const ClientsOrderBookPage = lazy(() => import('src/pages/dashboard/clients/order-book'));
const ClientMaterialsDetailPage = lazy(
  () => import('src/pages/dashboard/clients/client-materials')
);
const ClientDetailPage = lazy(() => import('src/pages/dashboard/clients/client-detail'));
const IshlabChiqarishIndexPage = lazy(() => import('src/pages/dashboard/ishlab-chiqarish'));
const IshlabChiqarishRejalashtirish = lazy(() => import('src/pages/dashboard/ishlab-chiqarish/rejalashtirish'));
const IshlabChiqarishNazorat = lazy(() => import('src/pages/dashboard/ishlab-chiqarish/nazorat'));
const IshlabChiqarishHisobotlar = lazy(() => import('src/pages/dashboard/ishlab-chiqarish/hisobotlar'));
const IshlabChiqarishUskunalar = lazy(() => import('src/pages/dashboard/ishlab-chiqarish/uskunalar'));
const BuyurtmaPlanlashtirish = lazy(() => import('src/pages/dashboard/buyurtma-planlashtirish/buyurtma-planlashtirish'));
const ReskaPanelOverviewPage = lazy(() => import('src/pages/dashboard/reska-panel/overview'));
const ReskaPanelQueuePage = lazy(() => import('src/pages/dashboard/reska-panel/queue'));
const ReskaPanelReportsPage = lazy(() => import('src/pages/dashboard/reska-panel/reports'));
const LaminatsiyaPanelOverviewPage = lazy(
  () => import('src/pages/dashboard/laminatsiya-panel/overview')
);
// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

const ReskaPanelLayout = () => {
  const reskaNavData = useReskaNavData();
  return (
    <DashboardLayout slotProps={{ nav: { data: reskaNavData } }}>
      <SuspenseOutlet />
    </DashboardLayout>
  );
};

const PechatPanelLayout = () => {
  const pechatNavData = usePechatNavData();
  return (
    <DashboardLayout slotProps={{ nav: { data: pechatNavData } }}>
      <SuspenseOutlet />
    </DashboardLayout>
  );
};

const LaminatsiyaPanelLayout = () => {
  const laminatsiyaNavData = useLaminatsiyaNavData();
  return (
    <DashboardLayout slotProps={{ nav: { data: laminatsiyaNavData } }}>
      <SuspenseOutlet />
    </DashboardLayout>
  );
};

// ----------------------------------------------------------------------

const Page404 = lazy(() => import('src/pages/error/404'));

export const routesSection: RouteObject[] = [
  {
    path: '/',
    element: <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'ombor',
        children: [
          { index: true, element: <OmborIndexPage /> },
          { path: 'analytics', element: <InventoryAnalyticsPage /> },
          { path: 'plyonka', element: <PlyonkaPage /> },
          { path: 'plyonka/:plyonkaId/transaksiyalar', element: <PlyonkaTransactionsPage /> },
          { path: 'kraska', element: <KraskaPage /> },
          { path: 'kraska/:kraskaId/transaksiyalar', element: <KraskaTransactionsPage /> },
          { path: 'suyuq-kraska', element: <SuyuqKraskaPage /> },
          { path: 'suyuq-kraska/:suyuqKraskaId/transaksiyalar', element: <SuyuqKraskaTransactionsPage /> },
          { path: 'razvaritel', element: <RazvaritelPage /> },
          { path: 'razvaritel/:razvaritelId/transaksiyalar', element: <RazvaritelTransactionsPage /> },
          { path: 'silindir', element: <SilindirPage /> },
          { path: 'silindir/:silindirId/transaksiyalar', element: <SilindirTransactionsPage /> },
          { path: 'kley', element: <KleyPage /> },
          { path: 'zapchastlar', element: <ZapchastlarPage /> },
          { path: 'otxot', element: <OtxotPage /> },
          { path: 'tayyor-mahsulotlar-tashkent', element: <TayyorMahsulotlarTashkentPage /> },
          { path: 'tayyor-mahsulotlar-angren', element: <TayyorMahsulotlarAngrenPage /> },
        ],
      },
          {
            path: 'stanok',
            children: [
              { index: true, element: <StanokIndexPage /> },
              { path: 'pechat', element: <PechatPage /> },
              { path: 'pechat/:machineId/profile', element: <PechatProfilePage /> },
              { path: 'reska', element: <ReskaPage /> },
              { path: 'laminatsiya', element: <LaminatsiyaPage /> },
              { path: 'pechat/:machineId/brigada', element: <BrigadaPechatPage /> },
              { path: 'reska/:machineId/brigada', element: <BrigadaReskaPage /> },
          { path: 'laminatsiya/:machineId/brigada', element: <BrigadaLaminatsiyaPage /> },
          { path: 'pechat/:machineId/materials', element: <MaterialsPechatPage /> },
          { path: 'reska/:machineId/materials', element: <MaterialsReskaPage /> },
          { path: 'laminatsiya/:machineId/materials', element: <MaterialsLaminatsiyaPage /> },
        ],
      },
      {
        path: 'staff',
        children: [
          { index: true, element: <StaffCrmPage /> },
          { path: 'crm', element: <StaffCrmPage /> },
          { path: 'worker', element: <StaffWorkerPage /> },
          { path: 'accountant', element: <StaffAccountantPage /> },
          { path: 'planner', element: <StaffPlannerPage /> },
        ],
      },
      {
        path: 'finance',
        children: [
          { index: true, element: <FinancePage /> },
          { path: 'income', element: <FinanceIncomePage /> },
          { path: 'expense', element: <FinanceExpensePage /> },
        ],
      },
      {
        path: 'clients',
        children: [
          { index: true, element: <ClientsPage /> },
          { path: 'crm', element: <ClientsCrmPage /> },
          { path: ':clientId', element: <ClientDetailPage /> },
          { path: 'agreements/:clientId', element: <ClientAgreementsPage /> },
          { path: 'complaints/:clientId', element: <ClientComplaintsPage /> },
          { path: 'transactions/:clientId', element: <ClientTransactionsDetailPage /> },
          { path: 'materials', element: <ClientsMaterialsPage /> },
          { path: 'materials/:clientId', element: <ClientMaterialsDetailPage /> },
          { path: 'order-book', element: <ClientsOrderBookPage /> },
        ],
      },
          {
            path: 'ishlab-chiqarish',
            children: [
              { index: true, element: <IshlabChiqarishIndexPage /> },
              { path: 'rejalashtirish', element: <IshlabChiqarishRejalashtirish /> },
              { path: 'nazorat', element: <IshlabChiqarishNazorat /> },
              { path: 'hisobotlar', element: <IshlabChiqarishHisobotlar /> },
              { path: 'uskunalar', element: <IshlabChiqarishUskunalar /> },
            ],
          },
          {
            path: 'buyurtma-planlashtirish',
            element: <BuyurtmaPlanlashtirish />,
          },
    ],
  },
  {
    path: 'reska-panel',
    element: (
      <AuthGuard>
        <ReskaPanelLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <ReskaPanelOverviewPage /> },
      { path: 'overview', element: <ReskaPanelOverviewPage /> },
      { path: 'queue', element: <ReskaPanelQueuePage /> },
      { path: 'reports', element: <ReskaPanelReportsPage /> },
    ],
  },
  {
    path: 'laminatsiya-paneli',
    element: (
      <AuthGuard>
        <LaminatsiyaPanelLayout />
      </AuthGuard>
    ),
    children: [{ index: true, element: <LaminatsiyaPanelOverviewPage /> }],
  },
  {
    path: 'pechat-paneli',
    element: (
      <AuthGuard>
        <PechatPanelLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="jarayonda" replace /> },
      { path: 'jarayonda', element: <PechatPanelOverviewPage /> },
      { path: 'yakunlangan', element: <PechatPanelOverviewPage /> },
    ],
  },

  // Auth
  ...authDemoRoutes,

  // Main
  ...mainRoutes,

  // No match
  { path: '*', element: <Page404 /> },
];

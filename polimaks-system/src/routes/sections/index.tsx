import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { mainRoutes } from './main';
import { usePathname } from '../hooks';
import { authDemoRoutes } from './auth';

// ----------------------------------------------------------------------

const HomePage = lazy(() => import('src/pages/dashboard/home'));
const OmborIndexPage = lazy(() => import('src/pages/dashboard/ombor'));
const PlyonkaPage = lazy(() => import('src/pages/dashboard/ombor/plyonka'));
const KraskaPage = lazy(() => import('src/pages/dashboard/ombor/kraska'));
const SuyuqKraskaPage = lazy(() => import('src/pages/dashboard/ombor/suyuq-kraska'));
const RazvaritelPage = lazy(() => import('src/pages/dashboard/ombor/razvaritel'));
const SilindirPage = lazy(() => import('src/pages/dashboard/ombor/silindir'));
const KleyPage = lazy(() => import('src/pages/dashboard/ombor/kley'));
const ZapchastlarPage = lazy(() => import('src/pages/dashboard/ombor/zapchastlar'));
const OtxotPage = lazy(() => import('src/pages/dashboard/ombor/otxot'));
const TayyorMahsulotlarPage = lazy(
  () => import('src/pages/dashboard/ombor/tayyor-mahsulotlar')
);
const StanokIndexPage = lazy(() => import('src/pages/dashboard/stanok'));
const PechatPage = lazy(() => import('src/pages/dashboard/stanok/pechat'));
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
const ClientsPage = lazy(() => import('src/pages/dashboard/clients/clients'));
const ClientsTransactionsPage = lazy(
  () => import('src/pages/dashboard/clients/transactions')
);
const ClientsMaterialsPage = lazy(() => import('src/pages/dashboard/clients/materials'));
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
          { path: 'plyonka', element: <PlyonkaPage /> },
          { path: 'kraska', element: <KraskaPage /> },
          { path: 'suyuq-kraska', element: <SuyuqKraskaPage /> },
          { path: 'razvaritel', element: <RazvaritelPage /> },
          { path: 'silindir', element: <SilindirPage /> },
          { path: 'kley', element: <KleyPage /> },
          { path: 'zapchastlar', element: <ZapchastlarPage /> },
          { path: 'otxot', element: <OtxotPage /> },
          { path: 'tayyor-mahsulotlar', element: <TayyorMahsulotlarPage /> },
        ],
      },
      {
        path: 'stanok',
        children: [
          { index: true, element: <StanokIndexPage /> },
          { path: 'pechat', element: <PechatPage /> },
          { path: 'reska', element: <ReskaPage /> },
          { path: 'laminatsiya', element: <LaminatsiyaPage /> },
          { path: 'pechat/:machineId/brigada', element: <BrigadaPechatPage /> },
          { path: 'reska/:machineId/brigada', element: <BrigadaReskaPage /> },
          { path: 'laminatsiya/:machineId/brigada', element: <BrigadaLaminatsiyaPage /> },
          { path: 'materials-pechat', element: <MaterialsPechatPage /> },
          { path: 'materials-reska', element: <MaterialsReskaPage /> },
          { path: 'materials-laminatsiya', element: <MaterialsLaminatsiyaPage /> },
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
        path: 'clients',
        children: [
          { index: true, element: <ClientsPage /> },
          { path: 'transactions', element: <ClientsTransactionsPage /> },
          { path: 'materials', element: <ClientsMaterialsPage /> },
        ],
      },
    ],
  },

  // Auth
  ...authDemoRoutes,

  // Main
  ...mainRoutes,

  // No match
  { path: '*', element: <Page404 /> },
];

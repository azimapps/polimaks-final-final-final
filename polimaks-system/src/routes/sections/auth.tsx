import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { AuthCenteredLayout } from 'src/layouts/auth-centered';

import { SplashScreen } from 'src/components/loading-screen';

import { GuestGuard } from 'src/auth/guard/guest-guard';

const CenteredLayout = {
  SignInPage: lazy(() => import('src/pages/auth/sign-in')),
  SignUpPage: lazy(() => import('src/pages/auth/sign-up')),
  SignInPhonePage: lazy(() => import('src/pages/auth/sign-in-phone')),
};

const authCentered = {
  path: 'auth',
  element: (
    <AuthCenteredLayout>
      <Outlet />
    </AuthCenteredLayout>
  ),
  children: [
    { path: 'sign-in', element: <CenteredLayout.SignInPage /> },
    { path: 'sign-in-phone', element: <CenteredLayout.SignInPhonePage /> },
    { path: 'sign-up', element: <CenteredLayout.SignUpPage /> },
  ],
};

// ----------------------------------------------------------------------

export const authDemoRoutes: RouteObject[] = [
  {
    path: '',
    element: (
      <GuestGuard>
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
      </GuestGuard>
    ),
    children: [authCentered],
  },
];

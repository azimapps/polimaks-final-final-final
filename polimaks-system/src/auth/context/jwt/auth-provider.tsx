import cookies from 'js-cookie';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import { decodeToken } from 'src/utils/decode';

import { CONFIG } from 'src/global-config';
import axios, { endpoints } from 'src/lib/axios';

import { useMockedUser } from 'src/auth/hooks/use-mocked-user';

import { AuthContext } from '../auth-context';

import type { AuthState } from '../../types';
// ----------------------------------------------------------------------

/**
 * NOTE:
 * We only build demo at basic level.
 * Customer will need to do some extra handling yourself if you want to extend the logic and other features...
 */

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const { user: mockedUser } = useMockedUser();
  const { state, setState } = useSetState<AuthState>({
    user: CONFIG.auth.skip ? null : mockedUser,
    loading: CONFIG.auth.skip ? false : !mockedUser,
  });

  const checkUserSession = useCallback(async () => {
    if (CONFIG.auth.skip) {
      setState({ loading: false, user: null });
      return;
    }

    try {
      const accessToken = decodeToken(cookies.get('m_at') as string)?.id?.toString() || '';

      if (accessToken) {
        const res = await axios.get(endpoints.auth.me(accessToken));
        setState({ user: { ...res.data.data, accessToken }, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    if (!CONFIG.auth.skip) {
      checkUserSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;
  const memoizedValue = useMemo(
    () => ({
      user: state.user ? { ...state.user } : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}

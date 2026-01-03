import type { IParams } from 'src/types/params';

import { get } from 'lodash';
import { useQuery } from '@tanstack/react-query';

import { userApi } from '../api/users';
import { usersMapper } from '../libs/usersMapper';

export const useGetAllUsers = (params: IParams) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['all-users', params],
    queryFn: () => userApi.getAll(params),
    select: (res) => ({
      users: usersMapper(get(res, 'items', [])),
      pagination: {
        currentPage: undefined, // Not provided by API, calculated in component if needed
        limit: get(res, 'limit', 10),
        pagesCount: Math.ceil(get(res, 'total', 0) / get(res, 'limit', 10)),
        resultCount: get(res, 'items.length', 0),
        totalCount: get(res, 'total', 0),
      },
    }),
  });

  return { data, isLoading, error };
};

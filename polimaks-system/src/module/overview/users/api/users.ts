import type { IParams } from 'src/types/params';

import axiosInstance from 'src/lib/axios';

import type { IUserProfile, IUsersResponse } from '../types/IUsers';

export const userApi = {
  getAll: (params: IParams) => axiosInstance.get<IUsersResponse>('admin/users', { params }).then((res) => res.data),
  getProfile: () => axiosInstance.get<IUserProfile>('users/me').then((res) => res.data),
  updateProfile: (data: Partial<IUserProfile> & { current_password?: string; password?: string }) => axiosInstance.put<IUserProfile>('users/me', data).then((res) => res.data),
};

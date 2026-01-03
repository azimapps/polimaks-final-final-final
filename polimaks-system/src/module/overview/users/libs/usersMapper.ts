import type { IUserRes, IUserAdapter } from '../types/IUsers';

export const usersAdapter = (item: IUserRes): IUserAdapter => ({
  id: item.id || 0,
  fullName: item.fullname || '',
  phoneNumber: item.phone_number || '',
  createdAt: item.created_at || '',
  isPremium: item.is_premium || false,
  premiumExpiresAt: item.premium_expires_at || null,
});

export const usersMapper = (data: IUserRes[]) => data?.map(usersAdapter) || [];

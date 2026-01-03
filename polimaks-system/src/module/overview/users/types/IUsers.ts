// Response for GET /admin/users items
export interface IUserRes {
  id: number;
  phone_number: string;
  fullname: string;
  created_at: string;
  is_premium?: boolean;
  premium_expires_at?: string | null;
}

// Response for GET /admin/users items wrapper
export interface IUsersResponse {
  total: number;
  skip: number;
  limit: number;
  items: IUserRes[];
}

// Response for GET /users/me
export interface IUserProfile {
  id: number;
  phone_number: string;
  fullname: string;
  created_at: string;
}

// Adapter for UI (DataGrid)
export interface IUserAdapter {
  id: number;
  fullName: string;
  phoneNumber: string;
  createdAt: string;
  isPremium: boolean;
  premiumExpiresAt: string | null;
}


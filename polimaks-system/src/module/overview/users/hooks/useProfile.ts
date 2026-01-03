import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from 'src/components/snackbar';

import { userApi } from '../api/users';

import type { IUserProfile } from '../types/IUsers';

export const useUserProfile = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['user-profile'],
        queryFn: () => userApi.getProfile(),
    });

    return { data, isLoading, error };
};

export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<IUserProfile> & { current_password?: string; password?: string }) =>
            userApi.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast.success('Profile updated successfully');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update profile');
        },
    });
};

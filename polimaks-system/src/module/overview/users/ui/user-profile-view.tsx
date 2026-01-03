import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useUserProfile, useUpdateUserProfile } from '../hooks/useProfile';

export function UserProfileView() {
    const { t } = useTranslate('users');
    const { data: user, isLoading } = useUserProfile();
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateUserProfile();

    const [form, setForm] = useState({
        fullname: '',
        phone_number: '',
        current_password: '',
        password: '',
    });

    useEffect(() => {
        if (user) {
            setForm((prev) => ({
                ...prev,
                fullname: user.fullname,
                phone_number: user.phone_number,
            }));
        }
    }, [user]);

    if (isLoading) return <LoadingScreen />;

    const handleSubmit = () => {
        updateProfile({
            fullname: form.fullname,
            current_password: form.current_password || undefined,
            password: form.password || undefined,
        });
    };

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <DashboardContent>
            <CustomBreadcrumbs
                heading="My Profile"
                links={[
                    { name: 'Dashboard', href: paths.dashboard.root },
                    { name: 'User', href: paths.dashboard.user.root },
                    { name: 'Profile' },
                ]}
                sx={{ mb: { xs: 3, md: 5 } }}
            />

            <Card sx={{ p: 3, maxWidth: 600 }}>
                <Stack spacing={3}>
                    <Typography variant="h6">Personal Information</Typography>

                    <TextField
                        label="Full Name"
                        value={form.fullname}
                        onChange={handleChange('fullname')}
                        fullWidth
                    />

                    <TextField
                        label="Phone Number"
                        value={form.phone_number}
                        disabled
                        fullWidth
                        helperText="Phone number cannot be changed"
                    />

                    <Typography variant="h6" sx={{ mt: 2 }}>Change Password</Typography>

                    <TextField
                        label="Current Password"
                        type="password"
                        value={form.current_password}
                        onChange={handleChange('current_password')}
                        fullWidth
                    />

                    <TextField
                        label="New Password"
                        type="password"
                        value={form.password}
                        onChange={handleChange('password')}
                        fullWidth
                        helperText="Leave blank to keep current password"
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={isUpdating}
                        >
                            Save Changes
                        </Button>
                    </Box>
                </Stack>
            </Card>
        </DashboardContent>
    );
}

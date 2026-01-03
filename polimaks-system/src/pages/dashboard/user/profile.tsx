

import { CONFIG } from 'src/global-config';

import { UserProfileView } from 'src/module/overview/users/ui/user-profile-view';

// ----------------------------------------------------------------------

const metadata = { title: `User Profile | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title> {metadata.title} </title>

            <UserProfileView />
        </>
    );
}

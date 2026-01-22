export const PROFILE_MENU_OPTIONS = (onLogout: () => void) => [
    {
        label: 'Log out',
        route: '/logout',
        onClick: onLogout,
    }
];
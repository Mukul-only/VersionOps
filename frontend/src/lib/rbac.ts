// src/lib/rbac.ts
// Mirrors backend ROLE_PERMISSIONS — keep in sync with backend

export const PERMISSIONS = {
    USERS_MANAGE: 'users-manage',

    EVENT_CREATE: 'event-create',
    EVENT_READ: 'event-read',
    EVENT_UPDATE: 'event-update',
    EVENT_DELETE: 'event-delete',

    COLLEGE_CREATE: 'college-create',
    COLLEGE_READ: 'college-read',
    COLLEGE_UPDATE: 'college-update',
    COLLEGE_DELETE: 'college-delete',

    PARTICIPANT_CREATE: 'participant-create',
    PARTICIPANT_READ: 'participant-read',
    PARTICIPANT_UPDATE: 'participant-update',
    PARTICIPANT_DELETE: 'participant-delete',

    LEADERBOARD_MANAGE: 'leaderboard-manage',
    RESULT_MANAGE: 'result-manage',
    ATTENDENCE_MANAGE: 'attendence-manage',
} as const;

export const ROUTE_PERMISSIONS: Record<string, AppPermission | null> = {
    '/': null,
    '/participants': PERMISSIONS.PARTICIPANT_READ,
    '/participants/add': PERMISSIONS.PARTICIPANT_CREATE,
    '/colleges': PERMISSIONS.COLLEGE_READ,
    '/colleges/add': PERMISSIONS.COLLEGE_CREATE,
    '/events': PERMISSIONS.EVENT_READ,
    '/events/add': PERMISSIONS.EVENT_CREATE,
    '/events/edit/:id': PERMISSIONS.EVENT_UPDATE,
    '/results': PERMISSIONS.RESULT_MANAGE,
    '/leaderboard': PERMISSIONS.LEADERBOARD_MANAGE,
};

export const ROUTE_ORDER = ['/', '/participants', '/colleges', '/events', '/leaderboard', '/results'];

export type AppPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type AppRole = 'ADMIN' | 'OPERATOR' | 'DESK';

export const ROLE_PERMISSIONS: Record<AppRole, readonly AppPermission[] | readonly ['*']> = {
    ADMIN: ['*'],
    OPERATOR: [
        PERMISSIONS.COLLEGE_CREATE,
        PERMISSIONS.COLLEGE_UPDATE,
        PERMISSIONS.COLLEGE_READ,
        PERMISSIONS.PARTICIPANT_CREATE,
        PERMISSIONS.PARTICIPANT_UPDATE,
        PERMISSIONS.PARTICIPANT_READ,
        PERMISSIONS.ATTENDENCE_MANAGE,
    ],
    DESK: [
        PERMISSIONS.COLLEGE_CREATE,
        PERMISSIONS.COLLEGE_UPDATE,
        PERMISSIONS.COLLEGE_READ,
        PERMISSIONS.PARTICIPANT_CREATE,
        PERMISSIONS.PARTICIPANT_UPDATE,
        PERMISSIONS.PARTICIPANT_READ,
    ],
};

/** Check if a role has a given permission */
export function hasPermission(role: AppRole | undefined, permission: AppPermission): boolean {
    if (!role) return false;
    const perms = ROLE_PERMISSIONS[role];
    if (!perms) return false;
    return perms[0] === '*' || (perms as readonly AppPermission[]).includes(permission);
}

/** Check if a role has ALL of the given permissions */
export function hasAllPermissions(role: AppRole | undefined, permissions: AppPermission[]): boolean {
    return permissions.every((p) => hasPermission(role, p));
}

/** Check if a role has ANY of the given permissions */
export function hasAnyPermission(role: AppRole | undefined, permissions: AppPermission[]): boolean {
    return permissions.some((p) => hasPermission(role, p));
}

export function getFirstAccessibleRoute(role: AppRole | undefined): string {
    for (const route of ROUTE_ORDER) {
        const required = ROUTE_PERMISSIONS[route];
        if (!required || hasPermission(role, required)) return route;
    }
    return '/forbidden';
}
import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/database';

type AllowedRolesInput = UserRole | readonly UserRole[] | UserRole[];

/**
 * Pure evaluation function for role-based authorization.
 * Determines if user is authorized and what redirect route (if any) should be taken.
 */
export function evaluateRoleAccess(
  user: any,
  userRole: UserRole | null | undefined,
  loading: boolean,
  allowedRoles: AllowedRolesInput
): { isAuthorized: boolean; redirectRoute: string | null } {
  if (loading) {
    return { isAuthorized: false, redirectRoute: null };
  }

  if (!user) {
    return { isAuthorized: false, redirectRoute: '/auth' };
  }

  const rolesList: readonly UserRole[] = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles as UserRole];

  if (userRole && !rolesList.includes(userRole)) {
    switch (userRole) {
      case 'teacher':
        return { isAuthorized: false, redirectRoute: '/teacher' };
      case 'admin':
        return { isAuthorized: false, redirectRoute: '/admin' };
      case 'parent':
        return { isAuthorized: false, redirectRoute: '/parent' };
      case 'student':
      default:
        return { isAuthorized: false, redirectRoute: '/student' };
    }
  }

  const isAuthorized = Boolean(user && userRole && rolesList.includes(userRole));
  return { isAuthorized, redirectRoute: null };
}

/**
 * useRoleGuard:
 * - Accepts a stable argument (string union or array).
 * - Reads role strictly from the authenticated Supabase session (JWT app_metadata).
 * - Displays a loading state while the session resolves.
 * - Redirects unauthenticated users to /auth and unauthorized users to their designated home route.
 */
export function useRoleGuard(allowedRoles: AllowedRolesInput) {
  const router = useRouter();
  const { user, userRole, loading } = useAuth();

  // Stabilize allowedRoles input across renders even if inline arrays are passed
  const rolesKey = Array.isArray(allowedRoles) ? allowedRoles.join(',') : allowedRoles;
  const rolesList: readonly UserRole[] = useMemo(() => {
    return Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles as UserRole];
  }, [rolesKey]);

  useEffect(() => {
    const { redirectRoute } = evaluateRoleAccess(user, userRole, loading, rolesList);
    if (redirectRoute) {
      router.replace(redirectRoute as any);
    }
  }, [user, userRole, loading, rolesKey, rolesList, router]);

  const { isAuthorized } = evaluateRoleAccess(user, userRole, loading, rolesList);

  return {
    isAuthorized,
    isLoading: loading,
    userRole,
    user,
  };
}

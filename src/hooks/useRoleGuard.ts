import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/database';

export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (userRole && !allowedRoles.includes(userRole)) {
      switch (userRole) {
        case 'teacher':
          router.replace('/teacher');
          break;
        case 'admin':
          router.replace('/admin');
          break;
        case 'parent':
          router.replace('/parent');
          break;
        case 'student':
        default:
          router.replace('/student');
          break;
      }
    }
  }, [user, userRole, loading, allowedRoles, router]);

  const isAuthorized = Boolean(user && userRole && allowedRoles.includes(userRole));

  return {
    isAuthorized,
    isLoading: loading,
    userRole,
    user,
  };
}

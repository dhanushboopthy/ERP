/**
 * Protected Route Wrapper
 * 
 * Enforces permission-based access control on routes.
 * Redirects unauthorized users to /unauthorized page.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { hasAnyPermission } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permissions?: string[]; // At least ONE required
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  permissions = [],
  fallback,
  redirectTo = '/unauthorized',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // No permissions required
    if (!permissions || permissions.length === 0) {
      return;
    }

    // Check permissions
    const userPermissions = user?.permissions || [];
    const hasAccess = hasAnyPermission(userPermissions, permissions);

    if (!hasAccess) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ProtectedRoute] Access denied:', {
          requiredPermissions: permissions,
          userPermissions,
          user: user?.username,
        });
      }
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, user, permissions, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check permissions
  if (permissions && permissions.length > 0) {
    const userPermissions = user?.permissions || [];
    const hasAccess = hasAnyPermission(userPermissions, permissions);

    if (!hasAccess) {
      return null; // Will redirect in useEffect
    }
  }

  return <>{children}</>;
}

/**
 * Hook to check permissions in components
 */
export function usePermissions() {
  const { user } = useAuth();
  const userPermissions = user?.permissions || [];

  return {
    hasPermission: (permission: string) => hasAnyPermission(userPermissions, [permission]),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(userPermissions, permissions),
    hasAllPermissions: (permissions: string[]) => 
      permissions.every(perm => hasAnyPermission(userPermissions, [perm])),
    permissions: userPermissions,
  };
}

/**
 * Component to conditionally render based on permission
 */
interface PermissionGateProps {
  children: React.ReactNode;
  permissions: string[]; // At least ONE required
  fallback?: React.ReactNode;
}

export function PermissionGate({ children, permissions, fallback = null }: PermissionGateProps) {
  const { hasAnyPermission: checkPermissions } = usePermissions();
  
  if (!checkPermissions(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}


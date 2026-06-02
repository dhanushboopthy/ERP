/**
 * PRODUCTION ROUTE GUARD
 * 
 * Protects routes from unauthorized access via direct URL navigation
 * Redirects to dashboard if user lacks required permissions
 * 
 * Usage:
 * ```tsx
 * export default function ProtectedPage() {
 *   return (
 *     <RouteGuard requiredPermission="YARN_RECEIPT.VIEW">
 *       <YarnReceiptContent />
 *     </RouteGuard>
 *   );
 * }
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

export function RouteGuard({
  children,
  requiredPermission,
  requireAdmin = false,
  fallbackPath = '/dashboard',
}: RouteGuardProps) {
  const router = useRouter();
  const { user, isAdmin, hasPermission, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (!user) {
      router.replace('/login');
      return;
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin) {
      router.replace(fallbackPath);
      return;
    }

    // Check permission requirement
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.replace(fallbackPath);
      return;
    }
  }, [user, isAdmin, requiredPermission, requireAdmin, hasPermission, router, fallbackPath, isLoading]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  // Check access inline as well
  if (!user) return null;
  if (requireAdmin && !isAdmin) return null;
  if (requiredPermission && !hasPermission(requiredPermission)) return null;

  return <>{children}</>;
}


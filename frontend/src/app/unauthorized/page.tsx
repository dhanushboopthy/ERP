/**
 * Unauthorized Access Page
 * 
 * Shown when user tries to access a page without proper permissions.
 */

'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-danger bg-opacity-10 blur-2xl rounded-full"></div>
            <div className="relative bg-white rounded-full p-6 shadow-lg border-4 border-brand-danger border-opacity-20">
              <ShieldAlert className="h-16 w-16 text-brand-danger" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Access Denied
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-2">
          You don&apos;t have permission to access this page.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Please contact your administrator if you believe this is a mistake.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            className="btn-brand-primary gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Need Access?
          </h3>
          <p className="text-xs text-gray-600">
            Contact your system administrator to request access to this module.
            They can assign the appropriate role or permissions to your account.
          </p>
        </div>
      </div>
    </div>
  );
}


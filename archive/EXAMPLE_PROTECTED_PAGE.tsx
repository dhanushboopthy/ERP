/**
 * EXAMPLE: Protected Yarn Receipt Page
 * 
 * This demonstrates how to properly wrap a page with permission-based access control.
 * Copy this pattern to all other pages.
 */

'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import YarnReceiptPageContent from './content';

export default function YarnReceiptPage() {
  return (
    <ProtectedRoute permissions={['YARN_RECEIPT.VIEW']}>
      <YarnReceiptPageContent />
    </ProtectedRoute>
  );
}

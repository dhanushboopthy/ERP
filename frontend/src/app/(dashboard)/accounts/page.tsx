'use client';

import { SkeletonModulePage } from '@/components/shared/skeleton-module-page';

export default function AccountsPage() {
  return (
    <SkeletonModulePage
      title="Accounts & Finance"
      description="Complete financial accounting management system"
      moduleName="Accounts"
      features={[
        'Chart of Accounts',
        'Journal Vouchers',
        'Payment & Receipt',
        'Bank Reconciliation',
        'GST Returns Preparation',
        'Party Ledger Management',
        'Bill-to-Bill Adjustment',
        'TDS Management',
        'Balance Sheet & P&L',
        'Cash Flow Statements',
      ]}
    />
  );
}


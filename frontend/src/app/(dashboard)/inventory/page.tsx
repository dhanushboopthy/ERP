'use client';

import { SkeletonModulePage } from '@/components/shared/skeleton-module-page';

export default function InventoryPage() {
  return (
    <SkeletonModulePage
      title="Inventory Management"
      description="Complete inventory and stock management system"
      moduleName="Inventory"
      features={[
        'Multi-Warehouse Management',
        'Stock Transfer Between Locations',
        'Material Requisitions',
        'Purchase Orders',
        'Goods Receipt Notes',
        'Stock Adjustments',
        'Physical Stock Verification',
        'Reorder Level Alerts',
        'ABC Analysis',
        'Stock Aging Reports',
      ]}
    />
  );
}


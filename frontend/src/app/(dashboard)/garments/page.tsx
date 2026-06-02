'use client';

import { SkeletonModulePage } from '@/components/shared/skeleton-module-page';

export default function GarmentsPage() {
  return (
    <SkeletonModulePage
      title="Garments ERP"
      description="Complete garment manufacturing management system"
      moduleName="Garments"
      features={[
        'Style & Order Management',
        'Fabric Requisition',
        'Cutting Operations',
        'Sewing Line Management',
        'Finishing & Packing',
        'Quality Control',
        'Trims & Accessories',
        'Work-in-Progress Tracking',
        'Bundle Tracking',
        'Shipment Management',
      ]}
    />
  );
}


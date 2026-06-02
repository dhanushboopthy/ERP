'use client';

import { SkeletonModulePage } from '@/components/shared/skeleton-module-page';

export default function ProcessingPage() {
  return (
    <SkeletonModulePage
      title="Processing ERP"
      description="Complete fabric processing management system"
      moduleName="Processing"
      features={[
        'Grey Fabric Receipt',
        'Pretreatment (Desizing, Scouring, Bleaching)',
        'Dyeing Operations',
        'Printing Management',
        'Finishing Processes',
        'Quality Testing & Approval',
        'Chemical Inventory',
        'Recipe Management',
        'Process Costing',
        'Batch Tracking',
      ]}
    />
  );
}


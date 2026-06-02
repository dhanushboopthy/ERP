'use client';

import { SkeletonModulePage } from '@/components/shared/skeleton-module-page';

export default function SpinningPage() {
  return (
    <SkeletonModulePage
      title="Spinning ERP"
      description="Complete spinning mill management system"
      moduleName="Spinning"
      features={[
        'Raw Material Management (Cotton, Polyester, Blends)',
        'Blow Room Operations',
        'Carding Machine Management',
        'Drawing & Roving Operations',
        'Ring Frame Production',
        'Winding & Packing',
        'Quality Control & Testing',
        'Production Planning & Scheduling',
        'Machine Maintenance',
        'Waste & Recovery Tracking',
      ]}
    />
  );
}


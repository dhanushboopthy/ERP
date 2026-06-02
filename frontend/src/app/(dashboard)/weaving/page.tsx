'use client';

import { SkeletonModulePage } from '@/components/shared/skeleton-module-page';

export default function WeavingPage() {
  return (
    <SkeletonModulePage
      title="Weaving ERP"
      description="Complete weaving mill management system"
      moduleName="Weaving"
      features={[
        'Loom Scheduling & Allocation',
        'Fabric Construction Management',
        'Reed & Heald Management',
        'Loom Production Monitoring',
        'Stop Rate Analysis',
        'Quality Inspection',
        'Grey Fabric Stock',
        'Weaving Defect Tracking',
        'Loom Maintenance',
        'Production Reports',
      ]}
    />
  );
}


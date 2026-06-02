'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Professional Status Filter Tabs
 * Enterprise-grade tab component for filtering by status
 * 
 * Features:
 * - Clean, flat design with professional colors
 * - Active state with blue background
 * - Count badges for each status
 * - Smooth hover and active transitions
 * - Fully responsive
 * 
 * Usage:
 * <ProfessionalStatusTabs 
 *   activeTab="pending" 
 *   onTabChange={(tab) => setActiveTab(tab)}
 *   counts={{ all: 150, draft: 12, pending: 8, authorized: 130 }}
 * />
 */

interface StatusTab {
  value: string;
  label: string;
  color?: 'default' | 'blue' | 'yellow' | 'green';
}

interface ProfessionalStatusTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts?: Record<string, number>;
  tabs?: StatusTab[];
}

const DEFAULT_TABS: StatusTab[] = [
  { value: 'all', label: 'All', color: 'default' },
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'authorized', label: 'Authorized', color: 'green' },
];

export function ProfessionalStatusTabs({
  activeTab,
  onTabChange,
  counts = {},
  tabs = DEFAULT_TABS,
}: ProfessionalStatusTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1 border border-gray-200">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        const count = counts[tab.value];

        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md outline-none',
              'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              isActive
                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <span>{tab.label}</span>
            {count !== undefined && (
              <Badge 
                variant={isActive ? 'active' : 'grey'}
                className={cn(
                  'ml-1 px-2 py-0.5 text-xs font-semibold min-w-[1.5rem] justify-center',
                  isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                )}
              >
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

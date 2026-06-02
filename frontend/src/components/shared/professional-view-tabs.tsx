'use client';

import { cn } from '@/lib/utils';
import { Calendar, Clock, Layers } from 'lucide-react';

/**
 * Professional View Filter Tabs
 * Enterprise-grade tab component for view filtering (All Sets, Pending, Today)
 * 
 * Features:
 * - Clean, professional design with subtle icons
 * - Active state with blue background and shadow
 * - Optional icons for visual clarity
 * - Smooth transitions
 * - Mobile responsive
 * 
 * Usage:
 * <ProfessionalViewTabs 
 *   activeView="today" 
 *   onViewChange={(view) => setActiveView(view)}
 * />
 */

interface ViewTab {
  value: string;
  label: string;
  icon?: React.ElementType;
}

interface ProfessionalViewTabsProps {
  activeView: string;
  onViewChange: (view: string) => void;
  views?: ViewTab[];
  showIcons?: boolean;
}

const DEFAULT_VIEWS: ViewTab[] = [
  { value: 'all', label: 'All Sets', icon: Layers },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'today', label: 'Today', icon: Calendar },
];

export function ProfessionalViewTabs({
  activeView,
  onViewChange,
  views = DEFAULT_VIEWS,
  showIcons = true,
}: ProfessionalViewTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-gray-50 p-1 border border-gray-200 shadow-sm">
      {views.map((view) => {
        const isActive = activeView === view.value;
        const Icon = view.icon;

        return (
          <button
            key={view.value}
            onClick={() => onViewChange(view.value)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-md outline-none',
              'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
              isActive
                ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-gray-700 hover:bg-white hover:text-blue-700 hover:shadow-sm'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {showIcons && Icon && (
              <Icon className={cn(
                'h-4 w-4',
                isActive ? 'text-white' : 'text-gray-500'
              )} />
            )}
            <span className="whitespace-nowrap">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Alternative Flat Style (No blue background, border-based active state)
 */
export function ProfessionalViewTabsFlat({
  activeView,
  onViewChange,
  views = DEFAULT_VIEWS,
  showIcons = false,
}: ProfessionalViewTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      {views.map((view) => {
        const isActive = activeView === view.value;
        const Icon = view.icon;

        return (
          <button
            key={view.value}
            onClick={() => onViewChange(view.value)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md outline-none',
              'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              isActive
                ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {showIcons && Icon && (
              <Icon className="h-4 w-4" />
            )}
            <span className="whitespace-nowrap">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}

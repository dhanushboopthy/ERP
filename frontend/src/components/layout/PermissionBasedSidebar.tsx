/**
 * PREMIUM ENTERPRISE SIDEBAR NAVIGATION
 * 
 * Design Philosophy:
 * - Professional & Branded (White sidebar with Blue accents)
 * - Clear Visual Hierarchy
 * - Hardware-accelerated CSS transitions (NO flickering)
 * - Consistent with SAP/Oracle standards
 * - Mobile-friendly
 * - Accessibility-first
 * 
 * Performance Optimizations:
 * - Pure CSS transitions (no framer-motion for nav items)
 * - will-change property for smooth animations
 * - Memoized access checks
 * - Minimal re-renders
 * 
 * Theme: Modern White with Blue-600 accents
 */

'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Lock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth-context';
import { NAVIGATION, canAccessItem, type NavigationItem } from '@/lib/navigation';

interface SidebarProps {
  isCollapsed: boolean;
  onNavigate?: () => void;
}

// Memoized Sidebar for performance
export const Sidebar = memo(function Sidebar({ isCollapsed, onNavigate }: SidebarProps) {
  const { user, isAdmin } = useAuth();
  const userPermissions = useMemo(() => user?.permissions || [], [user?.permissions]);

  return (
    <TooltipProvider delayDuration={200}>
      <ScrollArea className="sidebar-scroll flex-1 px-2 py-3">
        <nav className="space-y-0.5" role="navigation" aria-label="Main navigation">
          {NAVIGATION.map((item) => (
            <MemoizedNavItem
              key={item.key}
              item={item}
              isCollapsed={isCollapsed}
              userPermissions={userPermissions}
              isAdmin={isAdmin}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </ScrollArea>
    </TooltipProvider>
  );
});

interface NavItemProps {
  item: NavigationItem;
  isCollapsed: boolean;
  userPermissions: string[];
  isAdmin: boolean;
  onNavigate?: () => void;
}

// Memoized NavItem component for performance
const MemoizedNavItem = memo(function NavItem({ item, isCollapsed, userPermissions, isAdmin, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = item.path ? (pathname === item.path || pathname.startsWith(item.path + '/')) : false;
  
  // Check if any child is active
  const hasActiveChild = useMemo(() => 
    item.children?.some(
      (child) => child.path && (pathname === child.path || pathname.startsWith(child.path + '/'))
    ) ?? false,
    [item.children, pathname]
  );

  // Auto-expand if has active child (only once on mount or path change)
  useEffect(() => {
    if (hasActiveChild && !isCollapsed) {
      setIsExpanded(true);
    }
  }, [hasActiveChild, isCollapsed]);

  // Memoize access check to prevent recalculation on every render
  const accessCheck = useMemo(() => 
    canAccessItem(item, userPermissions, isAdmin),
    [item, userPermissions, isAdmin]
  );
  const canAccess = accessCheck.canAccess;
  const disabledReason = accessCheck.reason;

  // For parent groups, filter children to only those with access (memoized)
  // Must be before early returns to comply with Rules of Hooks
  const accessibleChildren = useMemo(() => 
    item.children?.filter(child => {
      const childAccess = canAccessItem(child, userPermissions, isAdmin);
      return childAccess.canAccess || child.comingSoon;
    }) || [],
    [item.children, userPermissions, isAdmin]
  );

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (item.path) {
      e.preventDefault();
      router.push(item.path);
      onNavigate?.();
    }
  }, [router, item.path, onNavigate]);

  // PRODUCTION RBAC: Hide items user cannot access
  if (!canAccess && !item.comingSoon) {
    return null;
  }

  // Hide parent group if no accessible children
  if (item.children && accessibleChildren.length === 0) {
    return null;
  }

  // Parent item with children
  if (item.children && item.children.length > 0) {
    return (
      <div className="nav-group">
        {/* Parent Item - Professional Design */}
        <button
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          className={cn(
            'nav-parent-item',
            (isExpanded || hasActiveChild) && 'nav-parent-active',
            isCollapsed && 'nav-collapsed'
          )}
        >
          <div className="nav-item-content">
            <div className={cn('nav-icon-wrapper', (isExpanded || hasActiveChild) && 'nav-icon-active')}>
              <item.icon className="nav-icon" />
            </div>
            {!isCollapsed && (
              <span className="nav-label">{item.label}</span>
            )}
          </div>
          
          {!isCollapsed && (
            <div className="nav-item-actions">
              {item.badge && (
                <Badge className="nav-badge">{item.badge}</Badge>
              )}
              {item.comingSoon && (
                <Badge className="nav-badge-soon">
                  <Clock className="h-3 w-3" />
                </Badge>
              )}
              <ChevronDown className={cn('nav-chevron', isExpanded && 'nav-chevron-open')} />
            </div>
          )}
        </button>

        {/* Children - CSS Transition Accordion */}
        <div 
          className={cn(
            'nav-children-wrapper',
            isExpanded && !isCollapsed && 'nav-children-open'
          )}
          aria-hidden={!isExpanded}
        >
          <div className="nav-children">
            {accessibleChildren.map((child) => (
              <MemoizedChildNavItem
                key={child.key}
                item={child}
                userPermissions={userPermissions}
                isAdmin={isAdmin}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Single item (no children) - Professional Design
  const ItemContent = (
    <div className={cn(
      'nav-single-item',
      !canAccess && 'nav-disabled',
      canAccess && isActive && 'nav-active',
      isCollapsed && 'nav-collapsed'
    )}>
      {/* Active Indicator */}
      {canAccess && isActive && <div className="nav-active-indicator" />}

      <div className={cn('nav-icon-wrapper', isActive && 'nav-icon-active')}>
        <item.icon className="nav-icon" />
      </div>

      {!isCollapsed && (
        <>
          <span className="nav-label">{item.label}</span>
          <div className="nav-item-actions">
            {item.badge && (
              <Badge className="nav-badge">{item.badge}</Badge>
            )}
            {item.comingSoon && (
              <Badge className="nav-badge-soon">
                <Clock className="h-3 w-3" />
              </Badge>
            )}
            {!canAccess && !item.comingSoon && (
              <Lock className="nav-lock-icon" />
            )}
          </div>
        </>
      )}
    </div>
  );

  // Disabled item (no access OR not implemented)
  if (!canAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">{ItemContent}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="nav-tooltip">
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-2">
              {item.comingSoon ? (
                <><Clock className="h-4 w-4 text-blue-400" /> Coming Soon</>
              ) : (
                <><Lock className="h-4 w-4 text-amber-400" /> Access Restricted</>
              )}
            </p>
            <p className="text-xs text-gray-300">{disabledReason}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Enabled item with navigation
  return (
    <Link href={item.path!} onClick={handleClick} prefetch={true}>
      {ItemContent}
    </Link>
  );
});

interface ChildNavItemProps {
  item: NavigationItem;
  userPermissions: string[];
  isAdmin: boolean;
  onNavigate?: () => void;
}

// Memoized ChildNavItem for performance
const MemoizedChildNavItem = memo(function ChildNavItem({ item, userPermissions, isAdmin, onNavigate }: ChildNavItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = item.path ? (pathname === item.path || pathname.startsWith(item.path + '/')) : false;

  // Memoize access check
  const accessCheck = useMemo(() => 
    canAccessItem(item, userPermissions, isAdmin),
    [item, userPermissions, isAdmin]
  );
  const canAccess = accessCheck.canAccess;
  const disabledReason = accessCheck.reason;

  // Must be before early return to comply with Rules of Hooks
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (item.path) {
      e.preventDefault();
      router.push(item.path);
      onNavigate?.();
    }
  }, [router, item.path, onNavigate]);

  // PRODUCTION RBAC: Hide child items user cannot access
  if (!canAccess && !item.comingSoon) {
    return null;
  }

  const ItemContent = (
    <div className={cn(
      'nav-child-item',
      !canAccess && 'nav-disabled',
      canAccess && isActive && 'nav-child-active'
    )}>
      {/* Active Indicator */}
      {canAccess && isActive && <div className="nav-child-indicator" />}

      <item.icon className="nav-child-icon" />
      <span className="nav-child-label">{item.label}</span>
      
      <div className="nav-child-actions">
        {item.badge && (
          <Badge className="nav-badge-small">{item.badge}</Badge>
        )}
        {item.comingSoon && <Clock className="nav-clock-icon" />}
        {!canAccess && !item.comingSoon && <Lock className="nav-lock-icon-small" />}
      </div>
    </div>
  );

  // Disabled child item
  if (!canAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">{ItemContent}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="nav-tooltip">
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-2">
              {item.comingSoon ? (
                <><Clock className="h-4 w-4 text-blue-400" /> Coming Soon</>
              ) : (
                <><Lock className="h-4 w-4 text-amber-400" /> Access Restricted</>
              )}
            </p>
            <p className="text-xs text-gray-300">{disabledReason}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Enabled item
  return (
    <Link href={item.path!} onClick={handleClick} prefetch={true}>
      {ItemContent}
    </Link>
  );
});


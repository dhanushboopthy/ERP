/**
 * Navigation Configuration - Enterprise ERP Standard
 * 
 * CRITICAL RULES:
 * 1. ALL modules ALWAYS visible (never hide based on permissions)
 * 2. Visibility (UI) ≠ Access (Permission)
 * 3. Not implemented = "Coming Soon" badge + disabled
 * 4. No permission = disabled with tooltip
 * 5. Implemented + Permission = enabled navigation
 */

import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Layers,
  Truck,
  Calendar,
  FileText,
  Scissors,
  Grid3x3,
  ClipboardList,
  Box,
  ArrowLeftRight,
  ArrowRightLeft,
  Receipt,
  BarChart3,
  Settings,
  Shield,
  Database,
  Bell,
  UserCog,
  Factory,
  Shirt,
  Palette,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  permissions?: string[]; // Required permissions (if implemented)
  implemented: boolean; // Is this module implemented?
  comingSoon?: boolean; // Show "Coming Soon" badge?
  children?: NavigationItem[];
  badge?: string;
  description?: string;
}

/**
 * COMPLETE NAVIGATION - ALL MODULES
 * 
 * Every module appears in sidebar regardless of implementation status.
 * Users see the full system capability map.
 */
export const NAVIGATION: NavigationItem[] = [
  // Dashboard
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    permissions: ['DASHBOARD.VIEW'],
    implemented: true,
    description: 'Overview and analytics',
  },

  // Masters Module
  {
    key: 'masters',
    label: 'Masters',
    icon: Database,
    implemented: true,
    permissions: [
      'COMPANY.VIEW',
      'PARTY.VIEW',
      'YARN_COUNT.VIEW',
      'LOOM_TYPE.VIEW',
      'BEAM.VIEW',
      'VEHICLE.VIEW',
      'FINANCIAL_YEAR.VIEW',
      'DOCUMENT_SERIES.VIEW',
    ],
    children: [
      {
        key: 'company',
        label: 'Company Master',
        icon: Building2,
        path: '/masters/company',
        permissions: ['COMPANY.VIEW'],
        implemented: true,
        description: 'Company profile and settings',
      },
      {
        key: 'parties',
        label: 'Party / Vendor',
        icon: Users,
        path: '/masters/parties',
        permissions: ['PARTY.VIEW'],
        implemented: true,
        description: 'Manage customers and suppliers',
      },
      {
        key: 'yarn-counts',
        label: 'Yarn Count',
        icon: Package,
        path: '/masters/yarn-counts',
        permissions: ['YARN_COUNT.VIEW'],
        implemented: true,
        description: 'Yarn specifications',
      },
      {
        key: 'loom-types',
        label: 'Loom Type',
        icon: Layers,
        path: '/masters/loom-types',
        permissions: ['LOOM_TYPE.VIEW'],
        implemented: true,
        description: 'Loom configurations',
      },
      {
        key: 'beams',
        label: 'Beam Master',
        icon: Grid3x3,
        path: '/masters/beams',
        permissions: ['BEAM.VIEW'],
        implemented: true,
        description: 'Beam master data',
      },
      {
        key: 'vehicles',
        label: 'Vehicle Master',
        icon: Truck,
        path: '/masters/vehicles',
        permissions: ['VEHICLE.VIEW'],
        implemented: true,
        description: 'Transport vehicles',
      },
      {
        key: 'financial-years',
        label: 'Financial Year',
        icon: Calendar,
        path: '/masters/financial-years',
        permissions: ['FINANCIAL_YEAR.VIEW'],
        implemented: true,
        description: 'FY management',
      },
      {
        key: 'document-series',
        label: 'Document Series',
        icon: FileText,
        path: '/masters/document-series',
        permissions: ['DOCUMENT_SERIES.VIEW'],
        implemented: true,
        description: 'Document numbering',
      },
    ],
  },

  // Sizing ERP Module (Phase 1 - Implemented)
  {
    key: 'sizing',
    label: 'Sizing ERP',
    icon: Scissors,
    implemented: true,
    badge: 'Active',
    permissions: [
      'YARN_RECEIPT.VIEW',
      'BABY_CONE.VIEW',
      'WARPING_JOB_CARD.VIEW',
      'SIZING_JOB_CARD.VIEW',
      'BEAM_MANAGEMENT.VIEW',
      'YARN_STOCK.VIEW',
      'YARN_RETURN.VIEW',
      'YARN_DELIVERY.VIEW',
      'GST_INVOICE.VIEW',
    ],
    children: [
      {
        key: 'yarn-receipt',
        label: 'Yarn Receipt',
        icon: Receipt,
        path: '/sizing/yarn-receipt',
        permissions: ['YARN_RECEIPT.VIEW'],
        implemented: true,
        description: 'Yarn inward entry',
      },
      {
        key: 'baby-cone',
        label: 'Baby Cone / Winding',
        icon: Box,
        path: '/sizing/baby-cone',
        permissions: ['BABY_CONE.VIEW'],
        implemented: true,
        description: 'Baby cone management',
      },
      {
        key: 'warping-job-card',
        label: 'Warping Job Card',
        icon: FileText,
        path: '/sizing/warping-job-card',
        permissions: ['WARPING_JOB_CARD.VIEW'],
        implemented: true,
        description: 'Warping process',
      },
      {
        key: 'sizing-job-card',
        label: 'Sizing Job Card',
        icon: ClipboardList,
        path: '/sizing/sizing-job-card',
        permissions: ['SIZING_JOB_CARD.VIEW'],
        implemented: true,
        description: 'Sizing operations',
      },
      {
        key: 'beam-management',
        label: 'Beam Management',
        icon: Grid3x3,
        path: '/sizing/beam-management',
        permissions: ['BEAM_MANAGEMENT.VIEW'],
        implemented: true,
        description: 'Beam tracking',
      },
      {
        key: 'yarn-stock',
        label: 'Yarn Stock Ledger',
        icon: Database,
        path: '/sizing/yarn-stock',
        permissions: ['YARN_STOCK.VIEW'],
        implemented: true,
        description: 'Current yarn inventory',
      },
      {
        key: 'yarn-return',
        label: 'Yarn Return',
        icon: ArrowLeftRight,
        path: '/sizing/yarn-return',
        permissions: ['YARN_RETURN.VIEW'],
        implemented: true,
        description: 'Return to supplier',
      },
      {
        key: 'yarn-delivery',
        label: 'Yarn Delivery',
        icon: ArrowRightLeft,
        path: '/sizing/yarn-delivery',
        permissions: ['YARN_DELIVERY.VIEW'],
        implemented: true,
        description: 'Delivery to customer',
      },
      {
        key: 'invoices',
        label: 'GST Tax Invoice',
        icon: Receipt,
        path: '/sizing/invoices',
        permissions: ['GST_INVOICE.VIEW'],
        implemented: true,
        description: 'Invoice generation',
      },
    ],
  },

  // Spinning ERP (Coming Soon)
  {
    key: 'spinning',
    label: 'Spinning ERP',
    icon: Layers,
    path: '/spinning',
    implemented: false,
    comingSoon: true,
    permissions: [],
    description: 'Spinning process management (Phase 2)',
  },

  // Weaving ERP (Coming Soon)
  {
    key: 'weaving',
    label: 'Weaving ERP',
    icon: Factory,
    path: '/weaving',
    implemented: false,
    comingSoon: true,
    permissions: [],
    description: 'Weaving operations (Phase 3)',
  },

  // Processing ERP (Coming Soon)
  {
    key: 'processing',
    label: 'Processing ERP',
    icon: Palette,
    path: '/processing',
    implemented: false,
    comingSoon: true,
    permissions: [],
    description: 'Dyeing and finishing (Phase 4)',
  },

  // Garments ERP (Coming Soon)
  {
    key: 'garments',
    label: 'Garments ERP',
    icon: Shirt,
    path: '/garments',
    implemented: false,
    comingSoon: true,
    permissions: [],
    description: 'Garment manufacturing (Phase 5)',
  },

  // Inventory (Coming Soon)
  {
    key: 'inventory',
    label: 'Inventory',
    icon: Package,
    path: '/inventory',
    implemented: false,
    comingSoon: true,
    permissions: [],
    description: 'General inventory management',
  },

  // Accounts & Finance (Coming Soon)
  {
    key: 'accounts',
    label: 'Accounts & Finance',
    icon: Wallet,
    path: '/accounts',
    implemented: false,
    comingSoon: true,
    permissions: [],
    description: 'Financial accounting',
  },

  // Reports Module
  {
    key: 'reports',
    label: 'Reports',
    icon: BarChart3,
    implemented: true,
    permissions: [
      'YARN_STOCK_REPORT.VIEW',
      'SET_PRODUCTION_REPORT.VIEW',
      'BEAM_UTILIZATION_REPORT.VIEW',
      'PARTY_LEDGER_REPORT.VIEW',
      'INVOICE_REGISTER_REPORT.VIEW',
      'PENDING_INVOICES_REPORT.VIEW',
    ],
    children: [
      {
        key: 'yarn-stock-report',
        label: 'Yarn Stock Register',
        icon: Database,
        path: '/reports/yarn-stock',
        permissions: ['YARN_STOCK_REPORT.VIEW'],
        implemented: true,
        description: 'Stock levels',
      },
      {
        key: 'set-production-report',
        label: 'Set-wise Production',
        icon: BarChart3,
        path: '/reports/set-production',
        permissions: ['SET_PRODUCTION_REPORT.VIEW'],
        implemented: true,
        description: 'Production analytics',
      },
      {
        key: 'beam-utilization-report',
        label: 'Beam Utilization',
        icon: Grid3x3,
        path: '/reports/beam-utilization',
        permissions: ['BEAM_UTILIZATION_REPORT.VIEW'],
        implemented: true,
        description: 'Beam efficiency',
      },
      {
        key: 'party-ledger-report',
        label: 'Party Ledger',
        icon: Users,
        path: '/reports/party-ledger',
        permissions: ['PARTY_LEDGER_REPORT.VIEW'],
        implemented: true,
        description: 'Party accounts',
      },
      {
        key: 'invoice-register-report',
        label: 'Invoice Register',
        icon: Receipt,
        path: '/reports/invoice-register',
        permissions: ['INVOICE_REGISTER_REPORT.VIEW'],
        implemented: true,
        description: 'Invoice list',
      },
      {
        key: 'pending-invoices-report',
        label: 'Pending Invoices',
        icon: FileText,
        path: '/reports/pending-invoices',
        permissions: ['PENDING_INVOICES_REPORT.VIEW'],
        implemented: true,
        description: 'Outstanding invoices',
      },
    ],
  },

  // Settings Module
  {
    key: 'settings',
    label: 'Settings & Security',
    icon: Settings,
    implemented: true,
    permissions: [
      'USER_MANAGEMENT.VIEW',
      'ROLE_PERMISSIONS.VIEW',
      'APPROVAL_MATRIX.VIEW',
      'SYSTEM_SETTINGS.VIEW',
      'SECURITY_POLICIES.VIEW',
      'AUDIT_LOGS.VIEW',
      'BACKUP.VIEW',
      'NOTIFICATIONS.VIEW',
    ],
    children: [
      {
        key: 'profile',
        label: 'Profile Settings',
        icon: UserCog,
        path: '/settings/profile',
        permissions: [], // Always accessible
        implemented: true,
        description: 'Your profile settings',
      },
      {
        key: 'users',
        label: 'User Management',
        icon: UserCog,
        path: '/settings/users',
        permissions: ['USER_MANAGEMENT.VIEW'],
        implemented: true,
        description: 'Manage users',
      },
      {
        key: 'roles',
        label: 'Role Permissions',
        icon: Shield,
        path: '/settings/roles',
        permissions: ['ROLE_PERMISSIONS.VIEW'],
        implemented: true,
        description: 'RBAC configuration',
      },
      {
        key: 'approval-matrix',
        label: 'Approval Matrix',
        icon: ClipboardList,
        path: '/settings/approval-matrix',
        permissions: ['APPROVAL_MATRIX.VIEW'],
        implemented: true,
        description: 'Approval workflows',
      },
      {
        key: 'system',
        label: 'System Settings',
        icon: Settings,
        path: '/settings/system',
        permissions: ['SYSTEM_SETTINGS.VIEW'],
        implemented: true,
        description: 'Global configuration',
      },
      {
        key: 'security',
        label: 'Security Policies',
        icon: Shield,
        path: '/settings/security',
        permissions: ['SECURITY_POLICIES.VIEW'],
        implemented: true,
        description: 'Security rules',
      },
      {
        key: 'audit-logs',
        label: 'Audit Logs',
        icon: FileText,
        path: '/settings/audit-logs',
        permissions: ['AUDIT_LOGS.VIEW'],
        implemented: true,
        description: 'System audit trail',
      },
      {
        key: 'backup',
        label: 'Backup & Safety',
        icon: Database,
        path: '/settings/backup',
        permissions: ['BACKUP.VIEW'],
        implemented: true,
        description: 'Data backup',
      },
      {
        key: 'notifications',
        label: 'Notifications',
        icon: Bell,
        path: '/settings/notifications',
        permissions: ['NOTIFICATIONS.VIEW'],
        implemented: true,
        description: 'Notification settings',
      },
    ],
  },
];

/**
 * Check if user can ACCESS a navigation item
 * (Different from visibility - all items are visible)
 */
export function canAccessItem(
  item: NavigationItem,
  userPermissions: string[],
  isAdmin: boolean
): { canAccess: boolean; reason?: string } {
  // Not implemented = cannot access
  if (!item.implemented) {
    return { canAccess: false, reason: 'Module under development' };
  }

  // Admin can access everything implemented
  if (isAdmin) {
    return { canAccess: true };
  }
  
  // Check for wildcard permissions (admin-level access)
  if (userPermissions.includes('*') || userPermissions.includes('All')) {
    return { canAccess: true };
  }

  // No permissions required = accessible (e.g., profile settings)
  if (!item.permissions || item.permissions.length === 0) {
    return { canAccess: true };
  }

  // Check if user has ANY required permission
  const hasPermission = item.permissions.some((perm) =>
    userPermissions.includes(perm) ||
    userPermissions.some((userPerm) => {
      // Support wildcard patterns like "YARN_RECEIPT.*"
      if (userPerm.endsWith('.*')) {
        const prefix = userPerm.slice(0, -2);
        return perm.startsWith(prefix + '.');
      }
      return false;
    })
  );

  if (!hasPermission) {
    return { canAccess: false, reason: 'Access restricted - contact administrator' };
  }

  return { canAccess: true };
}

/**
 * Get all navigation paths (for route validation)
 */
export function getAllNavigationPaths(): string[] {
  const paths: string[] = [];

  const collectPaths = (items: NavigationItem[]) => {
    items.forEach((item) => {
      if (item.path) {
        paths.push(item.path);
      }
      if (item.children) {
        collectPaths(item.children);
      }
    });
  };

  collectPaths(NAVIGATION);
  return paths;
}

/**
 * Get navigation item by path
 */
export function getNavigationItemByPath(path: string): NavigationItem | null {
  const search = (items: NavigationItem[]): NavigationItem | null => {
    for (const item of items) {
      if (item.path === path) {
        return item;
      }
      if (item.children) {
        const found = search(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  return search(NAVIGATION);
}

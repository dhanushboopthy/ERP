'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  Factory,
  Layers,
  Shirt,
  Palette,
  Package,
  Wallet,
  Users,
  BarChart3,
  Settings,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Building2,
  Truck,
  Cylinder,
  Calendar,
  Hash,
  UserCircle,
  Receipt,
  Scissors,
  FileSpreadsheet,
  Scale,
  Undo2,
  ArrowRightFromLine,
  FileCheck,
  ClipboardList,
  Shield,
  History,
  LogOut,
  Bell,
  Lock,
  GitBranch,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ProfessionalAccountMenu } from '@/components/shared/professional-account-menu';
import { useAuth, Permissions, ModuleKeys, PermissionActions, buildPermissionCode } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/PermissionBasedSidebar';
import { NavigationProgress } from '@/components/shared/navigation-progress';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavItem[];
  skeleton?: boolean;
  permission?: string | string[]; // Required permission(s) to view this item
  moduleKey?: string; // Module key for dynamic permission checking
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    moduleKey: ModuleKeys.Dashboard,
    permission: Permissions.DashboardView,
  },
  {
    title: 'Masters',
    icon: Database,
    children: [
      { title: 'Company Master', href: '/masters/company', icon: Building2, moduleKey: ModuleKeys.Company, permission: Permissions.CompanyView },
      { title: 'Party / Vendor', href: '/masters/parties', icon: UserCircle, moduleKey: ModuleKeys.Party, permission: Permissions.PartyView },
      { title: 'Yarn Count', href: '/masters/yarn-counts', icon: Layers, moduleKey: ModuleKeys.YarnCount, permission: Permissions.YarnCountView },
      { title: 'Loom Type', href: '/masters/loom-types', icon: Factory, moduleKey: ModuleKeys.LoomType, permission: Permissions.LoomTypeView },
      { title: 'Beam Master', href: '/masters/beams', icon: Cylinder, moduleKey: ModuleKeys.Beam, permission: Permissions.BeamView },
      { title: 'Vehicle Master', href: '/masters/vehicles', icon: Truck, moduleKey: ModuleKeys.Vehicle, permission: Permissions.VehicleView },
      { title: 'Financial Year', href: '/masters/financial-years', icon: Calendar, moduleKey: ModuleKeys.FinancialYear, permission: Permissions.FinancialYearView },
      { title: 'Document Series', href: '/masters/document-series', icon: Hash, moduleKey: ModuleKeys.DocumentSeries, permission: Permissions.DocumentSeriesView },
    ],
  },
  {
    title: 'Sizing ERP',
    icon: Factory,
    badge: 'Active',
    children: [
      { title: 'Yarn Receipt', href: '/sizing/yarn-receipt', icon: Receipt, moduleKey: ModuleKeys.YarnReceipt, permission: Permissions.YarnReceiptView },
      { title: 'Baby Cone / Winding', href: '/sizing/baby-cone', icon: Scissors, moduleKey: ModuleKeys.BabyCone, permission: Permissions.BabyConeView },
      { title: 'Warping Job Card', href: '/sizing/warping-job-card', icon: FileSpreadsheet, moduleKey: ModuleKeys.WarpingJobCard, permission: Permissions.WarpingView },
      { title: 'Sizing Job Card', href: '/sizing/sizing-job-card', icon: ClipboardList, moduleKey: ModuleKeys.SizingJobCard, permission: Permissions.SizingView },
      { title: 'Beam Management', href: '/sizing/beam-management', icon: Cylinder, moduleKey: ModuleKeys.BeamManagement, permission: Permissions.BeamManagementView },
      { title: 'Yarn Stock Ledger', href: '/sizing/yarn-stock', icon: Scale, moduleKey: ModuleKeys.YarnStock, permission: Permissions.YarnStockView },
      { title: 'Yarn Return', href: '/sizing/yarn-return', icon: Undo2, moduleKey: ModuleKeys.YarnReturn, permission: Permissions.YarnReturnView },
      { title: 'Yarn Delivery', href: '/sizing/yarn-delivery', icon: ArrowRightFromLine, moduleKey: ModuleKeys.YarnDelivery, permission: Permissions.YarnDeliveryView },
      { title: 'GST Tax Invoice', href: '/sizing/invoices', icon: FileCheck, moduleKey: ModuleKeys.GSTInvoice, permission: Permissions.InvoiceView },
    ],
  },
  {
    title: 'Spinning ERP',
    href: '/spinning',
    icon: Layers,
    skeleton: true,
  },
  {
    title: 'Weaving ERP',
    href: '/weaving',
    icon: Factory,
    skeleton: true,
  },
  {
    title: 'Processing ERP',
    href: '/processing',
    icon: Palette,
    skeleton: true,
  },
  {
    title: 'Garments ERP',
    href: '/garments',
    icon: Shirt,
    skeleton: true,
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Package,
    skeleton: true,
  },
  {
    title: 'Accounts & Finance',
    href: '/accounts',
    icon: Wallet,
    skeleton: true,
  },
  {
    title: 'Reports',
    icon: BarChart3,
    children: [
      { title: 'Yarn Stock Register', href: '/reports/yarn-stock', icon: Scale, moduleKey: ModuleKeys.YarnStockReport, permission: Permissions.YarnStockReportView },
      { title: 'Set-wise Production', href: '/reports/set-production', icon: ClipboardList, moduleKey: ModuleKeys.SetProductionReport, permission: Permissions.SetProductionReportView },
      { title: 'Beam Utilization', href: '/reports/beam-utilization', icon: Cylinder, moduleKey: ModuleKeys.BeamUtilizationReport, permission: Permissions.BeamUtilizationReportView },
      { title: 'Party Ledger', href: '/reports/party-ledger', icon: UserCircle, moduleKey: ModuleKeys.PartyLedgerReport, permission: Permissions.PartyLedgerReportView },
      { title: 'Invoice Register', href: '/reports/invoice-register', icon: FileCheck, moduleKey: ModuleKeys.InvoiceRegisterReport, permission: Permissions.InvoiceRegisterReportView },
      { title: 'Pending Invoices', href: '/reports/pending-invoices', icon: FileText, moduleKey: ModuleKeys.PendingInvoicesReport, permission: Permissions.PendingInvoicesReportView },
    ],
  },
  {
    title: 'Settings & Security',
    icon: Settings,
    children: [
      { title: 'Profile Settings', href: '/settings/profile', icon: UserCircle }, // Always accessible
      { title: 'User Management', href: '/settings/users', icon: Users, moduleKey: ModuleKeys.UserManagement, permission: Permissions.UsersView },
      { title: 'Role Permissions', href: '/settings/roles', icon: Shield, moduleKey: ModuleKeys.RolePermissions, permission: Permissions.RolesView },
      { title: 'Approval Matrix', href: '/settings/approval-matrix', icon: GitBranch, moduleKey: ModuleKeys.ApprovalMatrix, permission: Permissions.ApprovalMatrixView },
      { title: 'System Settings', href: '/settings/system', icon: Settings, moduleKey: ModuleKeys.SystemSettings, permission: Permissions.SystemSettingsView },
      { title: 'Security Policies', href: '/settings/security', icon: Lock, moduleKey: ModuleKeys.SecurityPolicies, permission: Permissions.SecurityPoliciesView },
      { title: 'Audit Logs', href: '/settings/audit-logs', icon: History, moduleKey: ModuleKeys.AuditLogs, permission: Permissions.AuditLogsView },
      { title: 'Backup & Safety', href: '/settings/backup', icon: Database, moduleKey: ModuleKeys.Backup, permission: Permissions.BackupView },
      { title: 'Notifications', href: '/settings/notifications', icon: Bell, moduleKey: ModuleKeys.Notifications, permission: Permissions.NotificationsView },
    ],
  },
];

// Filter navigation items based on permissions
function useFilteredNavItems(items: NavItem[]): NavItem[] {
  const { hasPermission, isAdmin } = useAuth();
  
  return useMemo(() => {
    const filterItems = (navItems: NavItem[]): NavItem[] => {
      return navItems
        .map(item => {
          // Skeleton items are always visible
          if (item.skeleton) return item;
          
          // Check permission if required
          if (item.permission) {
            const hasAccess = hasPermission(item.permission);
            if (!hasAccess && !isAdmin) {
              return null;
            }
          }
          
          // Filter children if they exist
          if (item.children) {
            const filteredChildren = filterItems(item.children);
            // If no children visible, hide the parent too
            if (filteredChildren.length === 0) return null;
            return { ...item, children: filteredChildren };
          }
          
          return item;
        })
        .filter((item): item is NavItem => item !== null);
    };
    
    return filterItems(items);
  }, [hasPermission, isAdmin]);
}

/* Mobile Drawer Navigation */
function MobileDrawer({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const router = useRouter();
  const { logout: authLogout, user } = useAuth();

  const handleLogout = () => {
    authLogout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden',
          'transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{ willChange: 'opacity' }}
      />
      
      {/* Drawer */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-[280px] md:hidden',
          'bg-gradient-to-b from-[#0F172A] to-[#162033]',
          'shadow-2xl transition-transform duration-200 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ willChange: 'transform' }}
      >
        {/* Header - Professional Branding */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
              ST
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">SUDHAN TEXTILE</h1>
              <p className="text-[9px] text-white/50 uppercase tracking-wider">Sizing ERP System</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-white/70 hover:bg-white/10 hover:text-white rounded-lg">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <UserCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
                <p className="text-xs text-white/60 truncate">{user.roleName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation - Use Permission-Based Sidebar */}
        <Sidebar isCollapsed={false} onNavigate={onClose} />

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3 bg-[#0F172A]">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-red-400 hover:bg-white/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

/* Desktop Sidebar */
function DesktopSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const { logout: authLogout, user } = useAuth();

  const handleLogout = () => {
    authLogout();
  };

  return (
    <aside
      style={{ 
        width: isCollapsed ? 72 : 260,
        transition: 'width 0.2s ease-out',
        willChange: 'width'
      }}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        'bg-gradient-to-b from-[#0F172A] to-[#162033]',
        'flex-col hidden md:flex'
      )}
    >
      {/* Logo - Professional Branding */}
      <div className="border-b border-white/10 p-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
              ST
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-white tracking-tight truncate">SUDHAN TEXTILE</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Sizing ERP System</p>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
              ST
            </div>
          </Link>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-[#1E293B] border border-slate-600 shadow-md hover:bg-slate-600 transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft 
          className="h-3.5 w-3.5 text-white/70 transition-transform" 
          style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Navigation - Use Permission-Based Sidebar */}
      <Sidebar isCollapsed={isCollapsed} />

      {/* Footer - User Profile */}
      <div className="border-t border-white/10 p-3 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-white/10 transition-colors group">
              <div className="h-9 w-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <UserCircle className="h-5 w-5 text-blue-400" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-white/60 truncate">{user?.roleName || user?.email || ''}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200 shadow-xl rounded-lg overflow-hidden p-0">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'User Account'}</p>
              <p className="text-xs text-gray-500">{user?.roleName || user?.email || ''}</p>
            </div>
            <div className="py-1">
              <Link href="/settings/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <UserCircle className="mr-3 h-4 w-4" />
                Profile Settings
              </Link>
              <Link href="/settings/system" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <Settings className="mr-3 h-4 w-4" />
                System Settings
              </Link>
            </div>
            <div className="border-t border-gray-100">
              <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

/* Responsive Header */
function Header({ 
  isCollapsed, 
  onOpenMobileMenu 
}: { 
  isCollapsed: boolean;
  onOpenMobileMenu: () => void;
}) {
  const pathname = usePathname();
  const { user, logout: authLogout } = useAuth();
  
  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const title = segment.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    return { href, title };
  });

  // Get page title for mobile
  const pageTitle = breadcrumbs.length > 0 
    ? breadcrumbs[breadcrumbs.length - 1].title 
    : 'Dashboard';

  return (
    <header 
      className={cn(
        'fixed top-0 right-0 z-30 h-14 bg-white/80 backdrop-blur-md border-b border-gray-100',
        'flex items-center justify-between px-4 md:px-6 transition-[left] duration-200',
        'left-0 md:left-[260px]',
        isCollapsed && 'md:left-[72px]'
      )}
      style={{ willChange: 'left' }}
    >
      {/* Mobile: Menu button + Page title */}
      <div className="flex items-center gap-3 md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onOpenMobileMenu}
          className="h-10 w-10 -ml-2 text-gray-700 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Desktop: Breadcrumbs */}
      <nav className="hidden md:flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-900">{crumb.title}</span>
            ) : (
              <Link href={crumb.href} className="text-gray-600 hover:text-gray-900 transition-colors">
                {crumb.title}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Financial Year Badge - hidden on small mobile */}
        <Badge variant="outline" className="font-mono text-xs hidden sm:inline-flex border-gray-200 text-gray-600 bg-gray-50">
          FY 2024-25
        </Badge>

        {/* Notifications */}
        <NotificationBell />

        {/* User dropdown - desktop only */}
        <div className="hidden md:block">
          <ProfessionalAccountMenu />
        </div>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation Progress Indicator */}
      <NavigationProgress />
      
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <DesktopSidebar 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)} 
      />

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Header */}
      <Header 
        isCollapsed={isCollapsed} 
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Main Content */}
      <main
        id="main-content"
        className={cn(
          'min-h-screen pt-14 md:pt-16 bg-gray-50',
          'pl-0 md:pl-[260px]',
          isCollapsed && 'md:pl-[72px]'
        )}
        style={{ 
          transition: 'padding-left 0.2s ease-out',
          willChange: 'padding-left'
        }}
      >
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}


'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

// ============================================
// MODULE KEYS (Mirror of backend Module.cs)
// ============================================
export const ModuleKeys = {
  // Dashboard
  Dashboard: 'DASHBOARD',
  
  // Masters
  Company: 'COMPANY',
  Party: 'PARTY',
  YarnCount: 'YARN_COUNT',
  LoomType: 'LOOM_TYPE',
  Beam: 'BEAM',
  Vehicle: 'VEHICLE',
  FinancialYear: 'FINANCIAL_YEAR',
  DocumentSeries: 'DOCUMENT_SERIES',
  
  // Sizing ERP
  YarnReceipt: 'YARN_RECEIPT',
  BabyCone: 'BABY_CONE',
  WarpingJobCard: 'WARPING_JOB_CARD',
  SizingJobCard: 'SIZING_JOB_CARD',
  BeamManagement: 'BEAM_MANAGEMENT',
  YarnStock: 'YARN_STOCK',
  YarnReturn: 'YARN_RETURN',
  YarnDelivery: 'YARN_DELIVERY',
  GSTInvoice: 'GST_INVOICE',
  
  // Reports
  YarnStockReport: 'YARN_STOCK_REPORT',
  SetProductionReport: 'SET_PRODUCTION_REPORT',
  BeamUtilizationReport: 'BEAM_UTILIZATION_REPORT',
  PartyLedgerReport: 'PARTY_LEDGER_REPORT',
  InvoiceRegisterReport: 'INVOICE_REGISTER_REPORT',
  PendingInvoicesReport: 'PENDING_INVOICES_REPORT',
  
  // Settings
  UserManagement: 'USER_MANAGEMENT',
  RolePermissions: 'ROLE_PERMISSIONS',
  ApprovalMatrix: 'APPROVAL_MATRIX',
  SystemSettings: 'SYSTEM_SETTINGS',
  SecurityPolicies: 'SECURITY_POLICIES',
  AuditLogs: 'AUDIT_LOGS',
  Backup: 'BACKUP',
  Notifications: 'NOTIFICATIONS',
} as const;

// ============================================
// PERMISSION ACTIONS
// ============================================
export const PermissionActions = {
  View: 'VIEW',
  Create: 'CREATE',
  Edit: 'EDIT',
  Delete: 'DELETE',
  Approve: 'APPROVE',
  Print: 'PRINT',
  Export: 'EXPORT',
} as const;

// ============================================
// PERMISSION HELPER
// ============================================
export function buildPermissionCode(moduleKey: string, action: string): string {
  return `${moduleKey}.${action}`;
}

// ============================================
// PERMISSION CONSTANTS (Module.Action format)
// ============================================
export const Permissions = {
  // Dashboard
  DashboardView: buildPermissionCode(ModuleKeys.Dashboard, PermissionActions.View),
  
  // Company
  CompanyView: buildPermissionCode(ModuleKeys.Company, PermissionActions.View),
  CompanyCreate: buildPermissionCode(ModuleKeys.Company, PermissionActions.Create),
  CompanyEdit: buildPermissionCode(ModuleKeys.Company, PermissionActions.Edit),
  CompanyDelete: buildPermissionCode(ModuleKeys.Company, PermissionActions.Delete),
  
  // Party
  PartyView: buildPermissionCode(ModuleKeys.Party, PermissionActions.View),
  PartyCreate: buildPermissionCode(ModuleKeys.Party, PermissionActions.Create),
  PartyEdit: buildPermissionCode(ModuleKeys.Party, PermissionActions.Edit),
  PartyDelete: buildPermissionCode(ModuleKeys.Party, PermissionActions.Delete),
  
  // Yarn Count
  YarnCountView: buildPermissionCode(ModuleKeys.YarnCount, PermissionActions.View),
  YarnCountCreate: buildPermissionCode(ModuleKeys.YarnCount, PermissionActions.Create),
  YarnCountEdit: buildPermissionCode(ModuleKeys.YarnCount, PermissionActions.Edit),
  YarnCountDelete: buildPermissionCode(ModuleKeys.YarnCount, PermissionActions.Delete),
  
  // Loom Type
  LoomTypeView: buildPermissionCode(ModuleKeys.LoomType, PermissionActions.View),
  LoomTypeCreate: buildPermissionCode(ModuleKeys.LoomType, PermissionActions.Create),
  LoomTypeEdit: buildPermissionCode(ModuleKeys.LoomType, PermissionActions.Edit),
  LoomTypeDelete: buildPermissionCode(ModuleKeys.LoomType, PermissionActions.Delete),
  
  // Beam
  BeamView: buildPermissionCode(ModuleKeys.Beam, PermissionActions.View),
  BeamCreate: buildPermissionCode(ModuleKeys.Beam, PermissionActions.Create),
  BeamEdit: buildPermissionCode(ModuleKeys.Beam, PermissionActions.Edit),
  BeamDelete: buildPermissionCode(ModuleKeys.Beam, PermissionActions.Delete),
  
  // Vehicle
  VehicleView: buildPermissionCode(ModuleKeys.Vehicle, PermissionActions.View),
  VehicleCreate: buildPermissionCode(ModuleKeys.Vehicle, PermissionActions.Create),
  VehicleEdit: buildPermissionCode(ModuleKeys.Vehicle, PermissionActions.Edit),
  VehicleDelete: buildPermissionCode(ModuleKeys.Vehicle, PermissionActions.Delete),
  
  // Financial Year
  FinancialYearView: buildPermissionCode(ModuleKeys.FinancialYear, PermissionActions.View),
  FinancialYearCreate: buildPermissionCode(ModuleKeys.FinancialYear, PermissionActions.Create),
  FinancialYearEdit: buildPermissionCode(ModuleKeys.FinancialYear, PermissionActions.Edit),
  FinancialYearDelete: buildPermissionCode(ModuleKeys.FinancialYear, PermissionActions.Delete),
  
  // Document Series
  DocumentSeriesView: buildPermissionCode(ModuleKeys.DocumentSeries, PermissionActions.View),
  DocumentSeriesCreate: buildPermissionCode(ModuleKeys.DocumentSeries, PermissionActions.Create),
  DocumentSeriesEdit: buildPermissionCode(ModuleKeys.DocumentSeries, PermissionActions.Edit),
  DocumentSeriesDelete: buildPermissionCode(ModuleKeys.DocumentSeries, PermissionActions.Delete),
  
  // Yarn Receipt
  YarnReceiptView: buildPermissionCode(ModuleKeys.YarnReceipt, PermissionActions.View),
  YarnReceiptCreate: buildPermissionCode(ModuleKeys.YarnReceipt, PermissionActions.Create),
  YarnReceiptEdit: buildPermissionCode(ModuleKeys.YarnReceipt, PermissionActions.Edit),
  YarnReceiptDelete: buildPermissionCode(ModuleKeys.YarnReceipt, PermissionActions.Delete),
  YarnReceiptApprove: buildPermissionCode(ModuleKeys.YarnReceipt, PermissionActions.Approve),
  YarnReceiptPrint: buildPermissionCode(ModuleKeys.YarnReceipt, PermissionActions.Print),
  
  // Baby Cone
  BabyConeView: buildPermissionCode(ModuleKeys.BabyCone, PermissionActions.View),
  BabyConeCreate: buildPermissionCode(ModuleKeys.BabyCone, PermissionActions.Create),
  BabyConeEdit: buildPermissionCode(ModuleKeys.BabyCone, PermissionActions.Edit),
  BabyConeDelete: buildPermissionCode(ModuleKeys.BabyCone, PermissionActions.Delete),
  
  // Warping Job Card
  WarpingView: buildPermissionCode(ModuleKeys.WarpingJobCard, PermissionActions.View),
  WarpingCreate: buildPermissionCode(ModuleKeys.WarpingJobCard, PermissionActions.Create),
  WarpingEdit: buildPermissionCode(ModuleKeys.WarpingJobCard, PermissionActions.Edit),
  WarpingDelete: buildPermissionCode(ModuleKeys.WarpingJobCard, PermissionActions.Delete),
  WarpingApprove: buildPermissionCode(ModuleKeys.WarpingJobCard, PermissionActions.Approve),
  WarpingPrint: buildPermissionCode(ModuleKeys.WarpingJobCard, PermissionActions.Print),
  
  // Sizing Job Card
  SizingView: buildPermissionCode(ModuleKeys.SizingJobCard, PermissionActions.View),
  SizingCreate: buildPermissionCode(ModuleKeys.SizingJobCard, PermissionActions.Create),
  SizingEdit: buildPermissionCode(ModuleKeys.SizingJobCard, PermissionActions.Edit),
  SizingDelete: buildPermissionCode(ModuleKeys.SizingJobCard, PermissionActions.Delete),
  SizingApprove: buildPermissionCode(ModuleKeys.SizingJobCard, PermissionActions.Approve),
  SizingPrint: buildPermissionCode(ModuleKeys.SizingJobCard, PermissionActions.Print),
  
  // Beam Management
  BeamManagementView: buildPermissionCode(ModuleKeys.BeamManagement, PermissionActions.View),
  BeamManagementCreate: buildPermissionCode(ModuleKeys.BeamManagement, PermissionActions.Create),
  BeamManagementEdit: buildPermissionCode(ModuleKeys.BeamManagement, PermissionActions.Edit),
  BeamManagementDelete: buildPermissionCode(ModuleKeys.BeamManagement, PermissionActions.Delete),
  
  // Yarn Stock
  YarnStockView: buildPermissionCode(ModuleKeys.YarnStock, PermissionActions.View),
  YarnStockExport: buildPermissionCode(ModuleKeys.YarnStock, PermissionActions.Export),
  
  // Yarn Return
  YarnReturnView: buildPermissionCode(ModuleKeys.YarnReturn, PermissionActions.View),
  YarnReturnCreate: buildPermissionCode(ModuleKeys.YarnReturn, PermissionActions.Create),
  YarnReturnEdit: buildPermissionCode(ModuleKeys.YarnReturn, PermissionActions.Edit),
  YarnReturnDelete: buildPermissionCode(ModuleKeys.YarnReturn, PermissionActions.Delete),
  YarnReturnApprove: buildPermissionCode(ModuleKeys.YarnReturn, PermissionActions.Approve),
  YarnReturnPrint: buildPermissionCode(ModuleKeys.YarnReturn, PermissionActions.Print),
  
  // Yarn Delivery
  YarnDeliveryView: buildPermissionCode(ModuleKeys.YarnDelivery, PermissionActions.View),
  YarnDeliveryCreate: buildPermissionCode(ModuleKeys.YarnDelivery, PermissionActions.Create),
  YarnDeliveryEdit: buildPermissionCode(ModuleKeys.YarnDelivery, PermissionActions.Edit),
  YarnDeliveryDelete: buildPermissionCode(ModuleKeys.YarnDelivery, PermissionActions.Delete),
  YarnDeliveryApprove: buildPermissionCode(ModuleKeys.YarnDelivery, PermissionActions.Approve),
  YarnDeliveryPrint: buildPermissionCode(ModuleKeys.YarnDelivery, PermissionActions.Print),
  
  // GST Invoice
  InvoiceView: buildPermissionCode(ModuleKeys.GSTInvoice, PermissionActions.View),
  InvoiceCreate: buildPermissionCode(ModuleKeys.GSTInvoice, PermissionActions.Create),
  InvoiceEdit: buildPermissionCode(ModuleKeys.GSTInvoice, PermissionActions.Edit),
  InvoiceDelete: buildPermissionCode(ModuleKeys.GSTInvoice, PermissionActions.Delete),
  InvoiceApprove: buildPermissionCode(ModuleKeys.GSTInvoice, PermissionActions.Approve),
  InvoicePrint: buildPermissionCode(ModuleKeys.GSTInvoice, PermissionActions.Print),
  
  // Reports
  YarnStockReportView: buildPermissionCode(ModuleKeys.YarnStockReport, PermissionActions.View),
  YarnStockReportPrint: buildPermissionCode(ModuleKeys.YarnStockReport, PermissionActions.Print),
  YarnStockReportExport: buildPermissionCode(ModuleKeys.YarnStockReport, PermissionActions.Export),
  
  SetProductionReportView: buildPermissionCode(ModuleKeys.SetProductionReport, PermissionActions.View),
  SetProductionReportPrint: buildPermissionCode(ModuleKeys.SetProductionReport, PermissionActions.Print),
  SetProductionReportExport: buildPermissionCode(ModuleKeys.SetProductionReport, PermissionActions.Export),
  
  BeamUtilizationReportView: buildPermissionCode(ModuleKeys.BeamUtilizationReport, PermissionActions.View),
  BeamUtilizationReportPrint: buildPermissionCode(ModuleKeys.BeamUtilizationReport, PermissionActions.Print),
  BeamUtilizationReportExport: buildPermissionCode(ModuleKeys.BeamUtilizationReport, PermissionActions.Export),
  
  PartyLedgerReportView: buildPermissionCode(ModuleKeys.PartyLedgerReport, PermissionActions.View),
  PartyLedgerReportPrint: buildPermissionCode(ModuleKeys.PartyLedgerReport, PermissionActions.Print),
  PartyLedgerReportExport: buildPermissionCode(ModuleKeys.PartyLedgerReport, PermissionActions.Export),
  
  InvoiceRegisterReportView: buildPermissionCode(ModuleKeys.InvoiceRegisterReport, PermissionActions.View),
  InvoiceRegisterReportPrint: buildPermissionCode(ModuleKeys.InvoiceRegisterReport, PermissionActions.Print),
  InvoiceRegisterReportExport: buildPermissionCode(ModuleKeys.InvoiceRegisterReport, PermissionActions.Export),
  
  PendingInvoicesReportView: buildPermissionCode(ModuleKeys.PendingInvoicesReport, PermissionActions.View),
  PendingInvoicesReportPrint: buildPermissionCode(ModuleKeys.PendingInvoicesReport, PermissionActions.Print),
  PendingInvoicesReportExport: buildPermissionCode(ModuleKeys.PendingInvoicesReport, PermissionActions.Export),
  
  // User Management
  UsersView: buildPermissionCode(ModuleKeys.UserManagement, PermissionActions.View),
  UsersCreate: buildPermissionCode(ModuleKeys.UserManagement, PermissionActions.Create),
  UsersEdit: buildPermissionCode(ModuleKeys.UserManagement, PermissionActions.Edit),
  UsersDelete: buildPermissionCode(ModuleKeys.UserManagement, PermissionActions.Delete),
  
  // Role Permissions
  RolesView: buildPermissionCode(ModuleKeys.RolePermissions, PermissionActions.View),
  RolesCreate: buildPermissionCode(ModuleKeys.RolePermissions, PermissionActions.Create),
  RolesEdit: buildPermissionCode(ModuleKeys.RolePermissions, PermissionActions.Edit),
  RolesDelete: buildPermissionCode(ModuleKeys.RolePermissions, PermissionActions.Delete),
  
  // Approval Matrix
  ApprovalMatrixView: buildPermissionCode(ModuleKeys.ApprovalMatrix, PermissionActions.View),
  ApprovalMatrixEdit: buildPermissionCode(ModuleKeys.ApprovalMatrix, PermissionActions.Edit),
  
  // System Settings
  SystemSettingsView: buildPermissionCode(ModuleKeys.SystemSettings, PermissionActions.View),
  SystemSettingsEdit: buildPermissionCode(ModuleKeys.SystemSettings, PermissionActions.Edit),
  
  // Security Policies
  SecurityPoliciesView: buildPermissionCode(ModuleKeys.SecurityPolicies, PermissionActions.View),
  SecurityPoliciesEdit: buildPermissionCode(ModuleKeys.SecurityPolicies, PermissionActions.Edit),
  
  // Audit Logs
  AuditLogsView: buildPermissionCode(ModuleKeys.AuditLogs, PermissionActions.View),
  AuditLogsExport: buildPermissionCode(ModuleKeys.AuditLogs, PermissionActions.Export),
  
  // Backup
  BackupView: buildPermissionCode(ModuleKeys.Backup, PermissionActions.View),
  BackupEdit: buildPermissionCode(ModuleKeys.Backup, PermissionActions.Edit),
  
  // Notifications
  NotificationsView: buildPermissionCode(ModuleKeys.Notifications, PermissionActions.View),
  NotificationsEdit: buildPermissionCode(ModuleKeys.Notifications, PermissionActions.Edit),
} as const;

export type PermissionCode = typeof Permissions[keyof typeof Permissions];

// ============================================
// MODULE PERMISSION TYPE (from API)
// ============================================
export interface ModulePermission {
  moduleKey: string;
  moduleName: string;
  parentModule: string;
  routePath: string;
  icon: string;
  sortOrder: number;
  actions: {
    permissionId: number;
    permissionCode: string;
    action: string;
    isGranted: boolean;
  }[];
}

// ============================================
// USER CONTEXT
// ============================================
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roleName: string;
  roleId: number;
  permissions: string[];
  modulePermissions?: ModulePermission[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: string[];
  userPermissions: string[]; // Alias for sidebar compatibility
  modulePermissions: ModulePermission[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string | string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasModuleAccess: (moduleKey: string, action?: string) => boolean;
  isAdmin: boolean;
  canAccess: (module: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// MODULE ACCESS MAPPING (Route to Module Key)
// ============================================
const routeToModuleMap: Record<string, string> = {
  'dashboard': ModuleKeys.Dashboard,
  'masters/company': ModuleKeys.Company,
  'masters/parties': ModuleKeys.Party,
  'masters/yarn-counts': ModuleKeys.YarnCount,
  'masters/loom-types': ModuleKeys.LoomType,
  'masters/beams': ModuleKeys.Beam,
  'masters/vehicles': ModuleKeys.Vehicle,
  'masters/financial-years': ModuleKeys.FinancialYear,
  'masters/document-series': ModuleKeys.DocumentSeries,
  'sizing/yarn-receipt': ModuleKeys.YarnReceipt,
  'sizing/baby-cone': ModuleKeys.BabyCone,
  'sizing/warping-job-card': ModuleKeys.WarpingJobCard,
  'sizing/sizing-job-card': ModuleKeys.SizingJobCard,
  'sizing/beam-management': ModuleKeys.BeamManagement,
  'sizing/yarn-stock': ModuleKeys.YarnStock,
  'sizing/yarn-return': ModuleKeys.YarnReturn,
  'sizing/yarn-delivery': ModuleKeys.YarnDelivery,
  'sizing/invoices': ModuleKeys.GSTInvoice,
  'reports/yarn-stock': ModuleKeys.YarnStockReport,
  'reports/set-production': ModuleKeys.SetProductionReport,
  'reports/beam-utilization': ModuleKeys.BeamUtilizationReport,
  'reports/party-ledger': ModuleKeys.PartyLedgerReport,
  'reports/invoice-register': ModuleKeys.InvoiceRegisterReport,
  'reports/pending-invoices': ModuleKeys.PendingInvoicesReport,
  'settings/users': ModuleKeys.UserManagement,
  'settings/roles': ModuleKeys.RolePermissions,
  'settings/approval-matrix': ModuleKeys.ApprovalMatrix,
  'settings/system': ModuleKeys.SystemSettings,
  'settings/security': ModuleKeys.SecurityPolicies,
  'settings/audit-logs': ModuleKeys.AuditLogs,
  'settings/backup': ModuleKeys.Backup,
  'settings/notifications': ModuleKeys.Notifications,
  'settings/profile': '', // Always accessible
};

// ============================================
// AUTH PROVIDER - PRODUCTION STABLE VERSION
// ============================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // CRITICAL FIX: Verify token and fetch fresh user data on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Verify token is still valid by fetching current user
        try {
          const response = await apiClient.get('/api/auth/me');
          
          if (response.success && response.data) {
            const userData = response.data as User;
            
            // SINGLE SOURCE OF TRUTH: Update both state and localStorage
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
            console.log('[Auth] User authenticated:', {
              username: userData.username,
              role: userData.roleName,
              permissions: userData.permissions?.length || 0
            });
          } else {
            // Token invalid or expired
            throw new Error('Invalid session');
          }
        } catch (apiError) {
          // Token expired or invalid - clean up
          console.warn('[Auth] Session invalid, logging out');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
        // Clean up on any error
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []); // Run only once on mount

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post('/api/auth/login', { username, password });
      
      if (response.success && response.data) {
        const { token, refreshToken, user: userData } = response.data as {
          token: string;
          refreshToken: string;
          user: User;
        };
        
        // CRITICAL: Store token first
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Then fetch complete user data with permissions
        try {
          const meResponse = await apiClient.get('/api/auth/me');
          if (meResponse.success && meResponse.data) {
            const completeUser = meResponse.data as User;
            
            // SINGLE SOURCE OF TRUTH
            setUser(completeUser);
            localStorage.setItem('user', JSON.stringify(completeUser));
            
            console.log('[Auth] Login successful:', {
              username: completeUser.username,
              role: completeUser.roleName,
              permissions: completeUser.permissions?.length || 0,
              isAdmin: completeUser.roleName?.toLowerCase().includes('admin') || completeUser.permissions?.includes('*')
            });
            
            return true;
          }
        } catch (meError) {
          console.error('[Auth] Failed to fetch user details:', meError);
          // Fall back to login response data
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          return true;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    console.log('[Auth] Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      if (response.success && response.data) {
        const userData = response.data as User;
        
        // SINGLE SOURCE OF TRUTH
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('[Auth] User refreshed:', {
          username: userData.username,
          role: userData.roleName,
          permissions: userData.permissions?.length || 0
        });
      }
    } catch (error) {
      console.error('[Auth] Error refreshing user:', error);
      // If refresh fails, session might be invalid
      logout();
    }
  }, [logout]);

  // Permission checking functions
  const permissions = useMemo(() => user?.permissions || [], [user]);
  const modulePermissions = useMemo(() => user?.modulePermissions || [], [user]);
  
  const isAdmin = useMemo(() => {
    // Check for wildcard permissions (backend returns these for admin roles)
    if (permissions.includes('*') || permissions.includes('All')) return true;
    
    // Check for admin role names (case-insensitive)
    const roleName = user?.roleName?.toLowerCase() || '';
    return roleName === 'admin' || 
           roleName === 'administrator' || 
           roleName === 'superadmin' ||
           roleName === 'super admin';
  }, [permissions, user?.roleName]);

  const hasPermission = useCallback((permission: string | string[]): boolean => {
    // Admin has all permissions
    if (isAdmin) return true;
    
    // Check for wildcard permissions
    if (permissions.includes('*') || permissions.includes('All')) return true;
    
    if (Array.isArray(permission)) {
      return permission.some(p => permissions.includes(p));
    }
    
    return permissions.includes(permission);
  }, [permissions, isAdmin]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    if (isAdmin) return true;
    return perms.some(p => permissions.includes(p));
  }, [permissions, isAdmin]);

  const hasAllPermissions = useCallback((perms: string[]): boolean => {
    if (isAdmin) return true;
    return perms.every(p => permissions.includes(p));
  }, [permissions, isAdmin]);

  // Check if user has access to a specific module with optional action
  const hasModuleAccess = useCallback((moduleKey: string, action: string = PermissionActions.View): boolean => {
    if (isAdmin) return true;
    
    const permissionCode = buildPermissionCode(moduleKey, action);
    return permissions.includes(permissionCode);
  }, [permissions, isAdmin]);

  const canAccess = useCallback((route: string): boolean => {
    if (isAdmin) return true;
    
    const normalizedRoute = route.toLowerCase().replace(/^\//, '');
    
    // Profile is always accessible
    if (normalizedRoute === 'settings/profile') return true;
    
    // Find the module key for this route
    const moduleKey = routeToModuleMap[normalizedRoute];
    if (!moduleKey) {
      // Check if it's a parent route (e.g., 'masters', 'sizing', 'reports', 'settings')
      const parentRoutes = ['masters', 'sizing', 'reports', 'settings'];
      if (parentRoutes.includes(normalizedRoute)) {
        // Check if user has VIEW access to any child module in this group
        const childModules = Object.entries(routeToModuleMap)
          .filter(([r]) => r.startsWith(normalizedRoute + '/'))
          .map(([, key]) => key);
        
        return childModules.some(key => hasModuleAccess(key, PermissionActions.View));
      }
      return true; // Unknown route, allow access
    }
    
    return hasModuleAccess(moduleKey, PermissionActions.View);
  }, [isAdmin, hasModuleAccess]);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    permissions,
    userPermissions: permissions, // Alias for sidebar compatibility
    modulePermissions,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    isAdmin,
    canAccess,
    refreshUser,
  }), [user, isLoading, permissions, modulePermissions, login, logout, hasPermission, hasAnyPermission, hasAllPermissions, hasModuleAccess, isAdmin, canAccess, refreshUser]);

  // CRITICAL: Block rendering until auth is initialized
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-primary animate-spin"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Loading...</h3>
            <p className="text-sm text-slate-500">Initializing your session</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePermission(permission: string | string[]) {
  const { hasPermission, isLoading } = useAuth();
  return { hasPermission: hasPermission(permission), isLoading };
}

export function useModuleAccess(module: string) {
  const { canAccess, hasModuleAccess, isLoading } = useAuth();
  return { 
    canAccess: canAccess(module), 
    hasModuleAccess,
    isLoading 
  };
}

// ============================================
// PERMISSION GUARD COMPONENT
// ============================================
interface PermissionGuardProps {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const { hasPermission, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================
interface ProtectedRouteProps {
  permission?: string | string[];
  children: React.ReactNode;
}

export function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 text-center max-w-md">
          You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
}


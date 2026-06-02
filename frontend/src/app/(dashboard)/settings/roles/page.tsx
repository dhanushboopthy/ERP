'use client';

import { useState, useEffect, type ComponentPropsWithoutRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  Users,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
  AlertCircle,
  Eye,
  FilePlus,
  Pencil,
  Trash,
  CheckSquare,
  Printer,
} from 'lucide-react';
import { Card as BaseCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { PermissionGuard, useAuth, Permissions, ProtectedRoute } from '@/lib/auth-context';
import { SettingsShell, settingsCardClass } from '@/components/settings/settings-shell';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

interface Role {
  id: number;
  roleName: string;
  roleDescription?: string;
  isSystemRole: boolean;
  userCount: number;
  permissions: Permission[];
}

interface Permission {
  id: number;
  permissionCode: string;
  permissionName: string;
  description?: string;
  module: string;       // Maps to ModuleKey
  moduleKey?: string;   // Individual module key
  category: string;     // Maps to Action
  action?: string;      // Action type (VIEW, CREATE, etc.)
  isGranted?: boolean;
}

interface PermissionModule {
  module: string;        // Parent module group (Masters, Sizing ERP, etc.)
  moduleKey?: string;    // Individual module key
  moduleName?: string;   // Display name
  routePath?: string;
  icon?: string;
  sortOrder?: number;
  permissions: Permission[];
}

const actionIcons: Record<string, React.ReactNode> = {
  View: <Eye className="h-4 w-4" />,
  VIEW: <Eye className="h-4 w-4" />,
  Create: <FilePlus className="h-4 w-4" />,
  CREATE: <FilePlus className="h-4 w-4" />,
  Edit: <Pencil className="h-4 w-4" />,
  EDIT: <Pencil className="h-4 w-4" />,
  Delete: <Trash className="h-4 w-4" />,
  DELETE: <Trash className="h-4 w-4" />,
  Approve: <CheckSquare className="h-4 w-4" />,
  APPROVE: <CheckSquare className="h-4 w-4" />,
  Print: <Printer className="h-4 w-4" />,
  PRINT: <Printer className="h-4 w-4" />,
  Export: <Printer className="h-4 w-4" />,
  EXPORT: <Printer className="h-4 w-4" />,
};

function RolesPermissionsContent() {
  const { hasPermission, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [rolePermissions, setRolePermissions] = useState<Set<number>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
  });

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get<Role[]>('/api/settings/roles');
      console.log('Roles API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Is Array?:', Array.isArray(response));
      console.log('response.data:', response.data);
      // Backend returns array directly, not wrapped in ApiResponse
      return Array.isArray(response) ? response : (response.data ?? []);
    },
  });

  // Fetch all permissions grouped by module
  const { data: permissionModules = [], isLoading: permissionsLoading } = useQuery<PermissionModule[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await apiClient.get<PermissionModule[]>('/api/settings/permissions');
      console.log('Permissions API Response:', response);
      // Backend returns array directly, not wrapped in ApiResponse
      return Array.isArray(response) ? response : (response.data ?? []);
    },
  });

  // Fetch role permissions when role is selected
  const { data: selectedRolePermissions, isLoading: rolePermissionsLoading } = useQuery<PermissionModule[]>({
    queryKey: ['rolePermissions', selectedRole?.id],
    queryFn: async () => {
      if (!selectedRole) return [];
      const response = await apiClient.get<PermissionModule[]>(`/api/settings/roles/${selectedRole.id}/permissions`);
      console.log('Role Permissions API Response:', response);
      // Backend returns array directly, not wrapped in ApiResponse
      return Array.isArray(response) ? response : (response.data ?? []);
    },
    enabled: !!selectedRole,
  });

  // Update permissions when role permissions are loaded
  useEffect(() => {
    if (selectedRolePermissions && selectedRole) {
      const permIds = new Set<number>();
      selectedRolePermissions.forEach(module => {
        module.permissions.forEach(p => {
          // Only add permissions that are granted for this role
          if (p.isGranted) {
            permIds.add(p.id);
          }
        });
      });
      setRolePermissions(permIds);
      setHasChanges(false);
    }
  }, [selectedRolePermissions, selectedRole]);

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.post('/api/settings/roles', data);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Role created successfully');
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        setIsCreateOpen(false);
        setFormData({ roleName: '', description: '' });
      } else {
        toast.error(response.message || 'Failed to create role');
      }
    },
  });

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      return await apiClient.put(`/api/settings/roles/${data.id}`, data);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Role updated successfully');
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        setIsEditOpen(false);
      } else {
        toast.error(response.message || 'Failed to update role');
      }
    },
  });

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/api/settings/roles/${id}`);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Role deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        setIsDeleteOpen(false);
        if (selectedRole?.id === deleteMutation.variables) {
          setSelectedRole(null);
        }
      } else {
        toast.error(response.message || 'Failed to delete role');
      }
    },
  });

  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) => {
      return await apiClient.put(`/api/settings/roles/${roleId}/permissions`, permissionIds);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Permissions saved successfully', {
          description: 'Users with this role need to logout and login again to get updated permissions'
        });
        queryClient.invalidateQueries({ queryKey: ['rolePermissions', selectedRole?.id] });
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        setHasChanges(false);
      } else {
        toast.error(response.message || 'Failed to save permissions');
      }
    },
  });

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setHasChanges(false);
    // Permissions will be loaded via the query
  };

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const togglePermission = (permissionId: number) => {
    const newPermissions = new Set(rolePermissions);
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }
    setRolePermissions(newPermissions);
    setHasChanges(true);
  };

  const toggleModulePermissions = (module: PermissionModule) => {
    const modulePermIds = module.permissions.map(p => p.id);
    const viewPermission = module.permissions.find(p => 
      p.action === 'VIEW' || p.category === 'VIEW' || 
      p.permissionCode.endsWith('.VIEW')
    );
    const hasAnyPermission = modulePermIds.some(id => rolePermissions.has(id));
    
    const newPermissions = new Set(rolePermissions);
    if (hasAnyPermission) {
      // If any permission exists, remove ALL (turn off module completely)
      modulePermIds.forEach(id => newPermissions.delete(id));
    } else {
      // If no permissions, add VIEW only (make module visible with read-only)
      if (viewPermission) {
        newPermissions.add(viewPermission.id);
      } else {
        // Fallback: add all if no VIEW permission found
        modulePermIds.forEach(id => newPermissions.add(id));
      }
    }
    setRolePermissions(newPermissions);
    setHasChanges(true);
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
      savePermissionsMutation.mutate({
        roleId: selectedRole.id,
        permissionIds: Array.from(rolePermissions),
      });
    }
  };

  const isLoading = rolesLoading || permissionsLoading;

  // Keyboard shortcuts
  useKeyboardShortcut([
    { key: 'n', ctrl: true, callback: () => setIsCreateOpen(true) },
    { key: 's', ctrl: true, callback: () => { if (selectedRole && hasChanges) handleSavePermissions(); } },
    { key: 'Escape', callback: () => { setIsCreateOpen(false); setIsEditOpen(false); } },
  ]);

  return (
    <SettingsShell
      title="Role & Permission Management"
      subtitle="Configure roles and control access to system features"
      actions={(
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[color:var(--settings-accent)] hover:bg-[color:var(--settings-accent-strong)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      )}
    >

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Roles List */}
          <div className="col-span-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Roles</CardTitle>
                <CardDescription>Select a role to manage permissions</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {roles.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      variant="empty"
                      title="No roles found"
                      description="Get started by creating your first role"
                      action={{
                        label: "Create Role",
                        onClick: () => setIsCreateOpen(true)
                      }}
                    />
                  </div>
                ) : (
                  <div className="divide-y">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className={cn(
                        'flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-gray-50',
                        selectedRole?.id === role.id && 'bg-primary/5 border-l-4 border-primary'
                      )}
                      onClick={() => handleSelectRole(role)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          role.isSystemRole ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                        )}>
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{role.roleName}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="grey" className="text-xs">
                              <Users className="mr-1 h-3 w-3" />
                              {role.userCount} users
                            </Badge>
                            {role.isSystemRole && (
                              <Badge variant="outline" className="text-xs text-amber-600">
                                System
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!role.isSystemRole && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRole(role);
                                setFormData({ roleName: role.roleName, description: role.roleDescription || '' });
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRole(role);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Permissions Matrix */}
          <div className="col-span-8">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedRole ? `Permissions for ${selectedRole.roleName}` : 'Select a Role'}
                    </CardTitle>
                    <CardDescription>
                      {selectedRole ? 'Configure module and action permissions' : 'Click on a role to manage its permissions'}
                    </CardDescription>
                  </div>
                  {selectedRole && hasChanges && (
                    <Button onClick={handleSavePermissions} disabled={savePermissionsMutation.isPending}>
                      {savePermissionsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedRole ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Shield className="h-12 w-12 mb-4" />
                    <p>Select a role from the list to manage permissions</p>
                  </div>
                ) : rolePermissionsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Group modules by parent module */}
                    {(() => {
                      // Group modules by their parent module
                      const groupedByParent = permissionModules.reduce<Record<string, PermissionModule[]>>((acc, mod) => {
                        const parent = mod.module || 'Other';
                        if (!acc[parent]) acc[parent] = [];
                        acc[parent].push(mod);
                        return acc;
                      }, {});
                      
                      const parentOrder = ['Dashboard', 'Masters', 'Sizing ERP', 'Reports', 'Settings'];
                      const sortedParents = Object.keys(groupedByParent).sort((a, b) => {
                        const aIdx = parentOrder.indexOf(a);
                        const bIdx = parentOrder.indexOf(b);
                        if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
                        if (aIdx === -1) return 1;
                        if (bIdx === -1) return -1;
                        return aIdx - bIdx;
                      });
                      
                      return sortedParents.map((parentModule) => {
                        const modules = groupedByParent[parentModule];
                        const isParentExpanded = expandedModules.has(parentModule);
                        
                        // Calculate total permissions for this parent
                        const allParentPermIds = modules.flatMap(m => m.permissions.map(p => p.id));
                        // Get VIEW permissions for each module in this parent group
                        const viewPermIds = modules.flatMap(m => 
                          m.permissions.filter(p => 
                            p.action === 'VIEW' || p.category === 'VIEW' || p.permissionCode.endsWith('.VIEW')
                          ).map(p => p.id)
                        );
                        const selectedParentCount = allParentPermIds.filter(id => rolePermissions.has(id)).length;
                        const allParentSelected = selectedParentCount === allParentPermIds.length && allParentPermIds.length > 0;
                        const someParentSelected = selectedParentCount > 0;
                        
                        return (
                          <div key={parentModule} className="border rounded-lg overflow-hidden shadow-sm">
                            {/* Parent Module Header */}
                            <div
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-100 to-slate-50 cursor-pointer hover:from-slate-200 hover:to-slate-100"
                              onClick={() => toggleModule(parentModule)}
                            >
                              <div className="flex items-center gap-3">
                                {isParentExpanded ? (
                                  <ChevronDown className="h-5 w-5 text-gray-600" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-600" />
                                )}
                                <Shield className="h-5 w-5 text-primary" />
                                <span className="font-semibold text-lg">{parentModule}</span>
                              <Badge variant={allParentSelected ? "default" : someParentSelected ? "grey" : "outline"} className="text-xs">
                                  {selectedParentCount}/{allParentPermIds.length}
                                </Badge>
                              </div>
                              <Switch
                                checked={someParentSelected}
                                onCheckedChange={() => {
                                  const newSet = new Set(rolePermissions);
                                  if (someParentSelected) {
                                    // Turn OFF: Remove all permissions from this group
                                    allParentPermIds.forEach(id => newSet.delete(id));
                                  } else {
                                    // Turn ON: Add VIEW permission for each module
                                    viewPermIds.forEach(id => newSet.add(id));
                                  }
                                  setRolePermissions(newSet);
                                  setHasChanges(true);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            
                            {/* Child Modules */}
                            {isParentExpanded && (
                              <div className="p-4 bg-white border-t space-y-3">
                                {modules.map((module) => {
                                  const moduleKey = module.moduleKey || module.module;
                                  const isModuleExpanded = expandedModules.has(moduleKey);
                                  const modulePermIds = module.permissions.map(p => p.id);
                                  const selectedCount = modulePermIds.filter(id => rolePermissions.has(id)).length;
                                  const allSelected = selectedCount === modulePermIds.length && modulePermIds.length > 0;
                                  const someSelected = selectedCount > 0 && selectedCount < modulePermIds.length;
                                  
                                  return (
                                    <div key={moduleKey} className="border rounded-lg overflow-hidden bg-gray-50">
                                      {/* Module Header */}
                                      <div
                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleModule(moduleKey)}
                                      >
                                        <div className="flex items-center gap-3">
                                          {isModuleExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-500" />
                                          )}
                                          <span className="font-medium">{module.moduleName || moduleKey}</span>
                                          <Badge variant={allSelected ? "default" : someSelected ? "secondary" : "outline"} className="text-xs">
                                            {selectedCount}/{modulePermIds.length}
                                          </Badge>
                                        </div>
                                        <Switch
                                          checked={someSelected || allSelected}
                                          onCheckedChange={() => toggleModulePermissions(module)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      
                                      {/* Permission Actions */}
                                      {isModuleExpanded && (
                                        <div className="p-3 border-t bg-white">
                                          <div className="flex flex-wrap gap-2">
                                            {module.permissions.map((permission) => {
                                              const action = permission.category || permission.action || permission.permissionCode.split('.')[1] || 'View';
                                              const isGranted = rolePermissions.has(permission.id);
                                              return (
                                                <button
                                                  key={permission.id}
                                                  className={cn(
                                                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                                                    isGranted
                                                      ? 'bg-primary text-white border-primary shadow-sm'
                                                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                                                  )}
                                                  onClick={() => togglePermission(permission.id)}
                                                >
                                                  {actionIcons[action] || <Shield className="h-4 w-4" />}
                                                  <span>{action}</span>
                                                  {isGranted && <Check className="h-3 w-3 ml-1" />}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Create Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>Define a new role with specific permissions</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                placeholder="e.g., Supervisor, Accountant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role's responsibilities"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.roleName}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-roleName">Role Name *</Label>
              <Input
                id="edit-roleName"
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate({ ...formData, id: selectedRole!.id })}
              disabled={updateMutation.isPending || !formData.roleName}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role &quot;{selectedRole?.roleName}&quot;? 
              {selectedRole && selectedRole.userCount > 0 && (
                <span className="block mt-2 text-red-600">
                  This role has {selectedRole.userCount} users assigned. You must reassign them first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(selectedRole!.id)}
              disabled={!!(selectedRole && selectedRole.userCount > 0)}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsShell>
  );
}

// Default export with permission protection
export default function RolesPermissionsPage() {
  return (
    <RouteGuard requireAdmin>
      <RolesPermissionsContent />
    </RouteGuard>
  );
}


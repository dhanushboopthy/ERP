'use client';

import { useState, type ComponentPropsWithoutRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Lock,
  Unlock,
  KeyRound,
  UserX,
  MoreHorizontal,
  Shield,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Phone,
  Clock,
  Globe,
} from 'lucide-react';
import { Card as BaseCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { EmptyState } from '@/components/ui/empty-state';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { PermissionGuard, useAuth, Permissions } from '@/lib/auth-context';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { SettingsShell, settingsCardClass } from '@/components/settings/settings-shell';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  mobile?: string;
  department?: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginDate?: string;
  lastLoginIp?: string;
  createdAt: string;
}

interface Role {
  id: number;
  roleName: string;
  description?: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

function UserManagementContent() {
  const { hasPermission, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLockOpen, setIsLockOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    mobile: '',
    department: '',
    defaultLocation: '',
    roleId: 0,
    isActive: true,
  });

  // Fetch users
  const { data: usersData, isLoading } = useQuery<PagedResult<User>>({
    queryKey: ['users', page, pageSize, search],
    queryFn: async (): Promise<PagedResult<User>> => {
      const response = await apiClient.get<PagedResult<User>>(
        `/api/settings/users?pageNumber=${page}&pageSize=${pageSize}&search=${search}`
      );
      // Backend returns data directly, not wrapped in ApiResponse
      if (Array.isArray(response)) {
        return { items: response, totalCount: response.length, pageNumber: page, pageSize };
      }
      const result = response.data ?? response;
      return result as PagedResult<User>;
    },
  });

  // Fetch roles
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get<Role[]>('/api/settings/roles');
      // Backend returns array directly, not wrapped in ApiResponse
      return Array.isArray(response) ? response : (response.data ?? []);
    },
  });

  // Keyboard shortcuts
  useKeyboardShortcut([
    { key: 'n', ctrl: true, callback: () => setIsCreateOpen(true) },
    { key: 'r', ctrl: true, callback: () => queryClient.invalidateQueries({ queryKey: ['users'] }) },
    { key: 'Escape', callback: () => { setIsCreateOpen(false); setIsEditOpen(false); } },
  ]);

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.post('/api/settings/users', data);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('User created successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setIsCreateOpen(false);
        resetForm();
      } else {
        toast.error(response.message || 'Failed to create user');
      }
    },
    onError: () => {
      toast.error('Failed to create user');
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      return await apiClient.put(`/api/settings/users/${data.id}`, data);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('User updated successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setIsEditOpen(false);
        setSelectedUser(null);
      } else {
        toast.error(response.message || 'Failed to update user');
      }
    },
    onError: () => {
      toast.error('Failed to update user');
    },
  });

  // Lock user mutation
  const lockMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      return await apiClient.post(`/api/settings/users/${userId}/lock`, { reason });
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('User locked successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setIsLockOpen(false);
        setLockReason('');
        setSelectedUser(null);
      } else {
        toast.error(response.message || 'Failed to lock user');
      }
    },
  });

  // Unlock user mutation
  const unlockMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiClient.post(`/api/settings/users/${userId}/unlock`);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('User unlocked successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } else {
        toast.error(response.message || 'Failed to unlock user');
      }
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) => {
      return await apiClient.post(`/api/settings/users/${userId}/reset-password`, { newPassword: password });
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Password reset successfully');
        setIsResetPasswordOpen(false);
        setNewPassword('');
        setSelectedUser(null);
      } else {
        toast.error(response.message || 'Failed to reset password');
      }
    },
  });

  // Deactivate user mutation
  const deactivateMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiClient.delete(`/api/settings/users/${userId}`);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('User deactivated successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setIsDeactivateOpen(false);
        setSelectedUser(null);
      } else {
        toast.error(response.message || 'Failed to deactivate user');
      }
    },
  });

  // Activate user mutation
  const activateMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiClient.post(`/api/settings/users/${userId}/activate`);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('User activated successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } else {
        toast.error(response.message || 'Failed to activate user');
      }
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      mobile: '',
      department: '',
      defaultLocation: '',
      roleId: 0,
      isActive: true,
    });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName,
      mobile: user.mobile || '',
      department: user.department || '',
      defaultLocation: '',
      roleId: user.roleId,
      isActive: user.isActive,
    });
    setIsEditOpen(true);
  };

  const users = usersData?.items ?? [];
  const totalPages = Math.ceil((usersData?.totalCount ?? 0) / pageSize);

  const stats = {
    total: usersData?.totalCount ?? 0,
    active: users.filter((u: User) => u.isActive && !u.isLocked).length,
    locked: users.filter((u: User) => u.isLocked).length,
    inactive: users.filter((u: User) => !u.isActive).length,
  };

  return (
    <SettingsShell
      title="User Management"
      subtitle="Manage system users, roles, and access"
      actions={(
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[color:var(--settings-accent)] hover:bg-[color:var(--settings-accent-strong)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      )}
    >

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Locked Users</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.locked}</p>
              </div>
              <Lock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive Users</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage all system users</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyState
                          variant="empty"
                          title="No users found"
                          description="Get started by creating your first user account"
                          action={{
                            label: "Add User",
                            onClick: () => setIsCreateOpen(true)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: User) => (
                      <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white font-semibold">
                            {user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {user.email}
                          </div>
                          {user.mobile && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Phone className="h-3 w-3" />
                              {user.mobile}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          {user.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        {user.isLocked ? (
                          <Badge variant="cancelled" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </Badge>
                        ) : user.isActive ? (
                          <Badge className="gap-1 bg-green-500 hover:bg-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="grey" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.lastLoginDate ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {formatDate(user.lastLoginDate)}
                            </div>
                            {user.lastLoginIp && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Globe className="h-3 w-3" />
                                {user.lastLoginIp}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 hover:bg-gray-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => handleEdit(user)}
                              className="cursor-pointer hover:bg-blue-50"
                            >
                              <Edit className="mr-2 h-4 w-4 text-blue-600" />
                              <span>Edit User</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsResetPasswordOpen(true);
                              }}
                              className="cursor-pointer hover:bg-blue-50"
                            >
                              <KeyRound className="mr-2 h-4 w-4 text-blue-600" />
                              <span>Reset Password</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="bg-gray-200" />
                            
                            {user.isLocked ? (
                              <DropdownMenuItem
                                onClick={() => unlockMutation.mutate(user.id)}
                                className="cursor-pointer hover:bg-green-50"
                              >
                                <Unlock className="mr-2 h-4 w-4 text-green-600" />
                                <span>Unlock User</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsLockOpen(true);
                                }}
                                className="cursor-pointer hover:bg-blue-50"
                              >
                                <Lock className="mr-2 h-4 w-4 text-blue-600" />
                                <span>Lock User</span>
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator className="bg-gray-200" />
                            
                            {user.isActive ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeactivateOpen(true);
                                }}
                                className="cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-700"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                <span>Deactivate User</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => activateMutation.mutate(user.id)}
                                className="cursor-pointer text-green-600 hover:bg-green-50 focus:text-green-700"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Activate User</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, usersData?.totalCount ?? 0)} of {usersData?.totalCount} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="Enter mobile"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.roleId.toString()}
                  onValueChange={(v) => setFormData({ ...formData, roleId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Enter department"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.username || !formData.password || !formData.email || !formData.fullName || !formData.roleId}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full Name *</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mobile">Mobile</Label>
                <Input
                  id="edit-mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role *</Label>
                <Select
                  value={formData.roleId.toString()}
                  onValueChange={(v) => setFormData({ ...formData, roleId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate({ ...formData, id: selectedUser!.id })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock User Dialog */}
      <Dialog open={isLockOpen} onOpenChange={setIsLockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock User Account</DialogTitle>
            <DialogDescription>
              This will prevent {selectedUser?.fullName} from logging into the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lockReason">Reason for locking *</Label>
              <Textarea
                id="lockReason"
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder="Enter reason for locking this account"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLockOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="cancelled"
              onClick={() => lockMutation.mutate({ userId: selectedUser!.id, reason: lockReason })}
              disabled={lockMutation.isPending || !lockReason}
            >
              {lockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lock User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <p className="text-sm text-gray-500">
              User will be required to change password on next login.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => resetPasswordMutation.mutate({ userId: selectedUser!.id, password: newPassword })}
              disabled={resetPasswordMutation.isPending || !newPassword}
            >
              {resetPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Dialog */}
      <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedUser?.fullName}? They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deactivateMutation.mutate(selectedUser!.id)}
            >
              {deactivateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsShell>
  );
}

// Default export with Admin-only protection
export default function UserManagementPage() {
  return (
    <RouteGuard requireAdmin>
      <UserManagementContent />
    </RouteGuard>
  );
}


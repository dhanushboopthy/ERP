'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Grid3X3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { LoomType } from '@/types';
import { formatNumber } from '@/lib/utils';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useAuth } from '@/lib/auth-context';
import { PermissionButton } from '@/components/ui/permission-button';

/** Form data shape for creating/editing a loom type. */
interface LoomFormData {
  loomTypeCode: string;
  loomTypeName: string;
  widthInches: number;
  isActive: boolean;
}

const EMPTY_FORM: LoomFormData = {
  loomTypeCode: '',
  loomTypeName: '',
  widthInches: 0,
  isActive: true,
};

export default function LoomTypesPage() {
  return (
    <RouteGuard requiredPermission="LOOM_TYPE.VIEW">
      <LoomTypesContent />
    </RouteGuard>
  );
}

function LoomTypesContent() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LoomType | null>(null);
  const [formData, setFormData] = useState<LoomFormData>({ ...EMPTY_FORM });

  // Fetch loom types
  const { data: loomTypes = [], isLoading, error, refetch } = useQuery<LoomType[]>({
    queryKey: ['loomTypes'],
    queryFn: async () => {
      // Use the active endpoint which returns a plain list instead of paginated payload
      const response = await apiClient.get<LoomType[]>('/api/loomtypes/active');
      if (!response.success) throw new Error(response.message || 'Failed to fetch loom types');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/api/loomtypes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loomTypes'] });
      toast.success('Loom type created successfully');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to create loom type');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await apiClient.put(`/api/loomtypes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loomTypes'] });
      toast.success('Loom type updated successfully');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update loom type');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/loomtypes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loomTypes'] });
      toast.success('Loom type deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete loom type');
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: LoomType) => {
    if (!hasPermission('LOOM_TYPE.EDIT')) {
      toast.error("You don't have permission to perform this action. Please contact your administrator.");
      return;
    }
    setEditingItem(item);
    setFormData({
      loomTypeCode: item?.loomTypeCode ?? '',
      loomTypeName: item?.loomTypeName ?? '',
      widthInches: item?.widthInches ?? 0,
      isActive: item?.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM });
  };

  const handleSubmit = () => {
    if (!formData.loomTypeCode.trim()) {
      toast.error('Loom type code is required');
      return;
    }
    if (!formData.loomTypeName.trim()) {
      toast.error('Loom type name is required');
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (!hasPermission('LOOM_TYPE.DELETE')) {
      toast.error("You don't have permission to perform this action. Please contact your administrator.");
      return;
    }
    if (confirm('Are you sure you want to delete this loom type?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredItems = loomTypes.filter((item) => {
    const code = item.loomTypeCode ?? '';
    const name = item.loomTypeName ?? '';
    return code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load loom types</h2>
        <p className="text-gray-500">Please check your connection and try again</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loom Type Master</h1>
          <p className="text-gray-500">Manage loom types with width specifications</p>
        </div>
        <PermissionButton permission="LOOM_TYPE.CREATE" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Loom Type
        </PermissionButton>
      </div>

      {/* Stats Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Grid3X3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Loom Types</p>
                <p className="text-2xl font-bold font-mono">{loomTypes.length}</p>
                <p className="text-xs text-gray-400">
                  {loomTypes.filter(l => l.isActive).length} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by loom name or description..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Loom Types ({filteredItems.length})</CardTitle>
            <CardDescription>List of loom types used for sizing operations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Loom Type Name</TableHead>
                    <TableHead className="text-right">Width (inches)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No loom types found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.loomTypeCode}</TableCell>
                        <TableCell className="font-medium">{item.loomTypeName ?? '-'}</TableCell>
                        <TableCell className="text-right font-mono">
                          {item.widthInches ? `${formatNumber(item.widthInches)}"` : '-'}
                        </TableCell>
                        <TableCell>
                        <Badge variant={item.isActive ? 'active' : 'default'}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle>
                  {editingItem ? 'Edit Loom Type' : 'Add New Loom Type'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the loom type details below'
                    : 'Enter the loom type specifications'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="loomTypeCode">Loom Type Code *</Label>
              <Input
                id="loomTypeCode"
                placeholder="e.g., SULZER260"
                value={formData.loomTypeCode}
                onChange={(e) => setFormData({ ...formData, loomTypeCode: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loomTypeName">Loom Type Name *</Label>
              <Input
                id="loomTypeName"
                placeholder="e.g., Sulzer 260 inches"
                value={formData.loomTypeName}
                onChange={(e) => setFormData({ ...formData, loomTypeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="widthInches">Width (inches)</Label>
              <Input
                id="widthInches"
                type="number"
                placeholder="e.g., 260"
                value={formData.widthInches || ''}
                onChange={(e) =>
                  setFormData({ ...formData, widthInches: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive" className="font-normal">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


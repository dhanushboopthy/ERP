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
  Layers,
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
import { YarnCount } from '@/types';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useAuth } from '@/lib/auth-context';
import { PermissionButton } from '@/components/ui/permission-button';

export default function YarnCountsPage() {
  return (
    <RouteGuard requiredPermission="YARN_COUNT.VIEW">
      <YarnCountsContent />
    </RouteGuard>
  );
}

function YarnCountsContent() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<YarnCount | null>(null);
  const [formData, setFormData] = useState({
    countCode: '',
    countDescription: '',
    ply: 1,
    isActive: true,
  });

  // Fetch yarn counts
  const { data: yarnCounts = [], isLoading, error, refetch } = useQuery<YarnCount[]>({
    queryKey: ['yarnCounts'],
    queryFn: async () => {
      const response = await apiClient.get<YarnCount[]>('/api/yarncounts');
      if (!response.success) throw new Error(response.message || 'Failed to fetch yarn counts');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/api/yarncounts', data);
      if (!response.success) throw new Error(response.message || 'Failed to create yarn count');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarnCounts'] });
      toast.success('Yarn count created successfully');
      handleCloseDialog();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create yarn count');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await apiClient.put(`/api/yarncounts/${id}`, data);
      if (!response.success) throw new Error(response.message || 'Failed to update yarn count');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarnCounts'] });
      toast.success('Yarn count updated successfully');
      handleCloseDialog();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update yarn count');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/yarncounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarnCounts'] });
      toast.success('Yarn count deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete yarn count');
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ countCode: '', countDescription: '', ply: 1, isActive: true });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: YarnCount) => {
    if (!hasPermission('YARN_COUNT.EDIT')) {
      toast.error("You don't have permission to perform this action. Please contact your administrator.");
      return;
    }
    setEditingItem(item);
    setFormData({
      countCode: item.countCode,
      countDescription: item.countDescription || '',
      ply: item.ply || 1,
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ countCode: '', countDescription: '', ply: 1, isActive: true });
  };

  const handleSubmit = () => {
    if (!formData.countCode.trim()) {
      toast.error('Count code is required');
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (!hasPermission('YARN_COUNT.DELETE')) {
      toast.error("You don't have permission to perform this action. Please contact your administrator.");
      return;
    }
    if (confirm('Are you sure you want to delete this yarn count?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredItems = yarnCounts.filter((item) =>
    item.countCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.countDescription?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load yarn counts</h2>
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
          <h1 className="text-2xl font-bold text-gray-900">Yarn Count Master</h1>
          <p className="text-gray-500">Manage yarn count specifications (e.g., 40s 2/100)</p>
        </div>
        <PermissionButton permission="YARN_COUNT.CREATE" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Yarn Count
        </PermissionButton>
      </div>

      {/* Stats Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Layers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Yarn Counts</p>
                <p className="text-2xl font-bold font-mono">{yarnCounts.length}</p>
                <p className="text-xs text-gray-400">
                  {yarnCounts.filter(y => y.isActive).length} active
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
              placeholder="Search by count code or description..."
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
            <CardTitle>Yarn Counts ({filteredItems.length})</CardTitle>
            <CardDescription>List of yarn count specifications used in the system</CardDescription>
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
                    <TableHead>Count Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Ply</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No yarn counts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.countCode}</TableCell>
                        <TableCell>{item.countDescription || '-'}</TableCell>
                        <TableCell className="text-center font-mono">{item.ply}</TableCell>
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
                  {editingItem ? 'Edit Yarn Count' : 'Add New Yarn Count'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the yarn count details below'
                    : 'Enter the yarn count specifications'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="countCode">Count Code *</Label>
              <Input
                id="countCode"
                placeholder="e.g., 40s 2/100"
                value={formData.countCode}
                onChange={(e) => setFormData({ ...formData, countCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="countDescription">Description</Label>
              <Input
                id="countDescription"
                placeholder="e.g., 40s Double 100 Ply"
                value={formData.countDescription}
                onChange={(e) => setFormData({ ...formData, countDescription: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ply">Ply</Label>
              <Input
                id="ply"
                type="number"
                min={1}
                placeholder="e.g., 1"
                value={formData.ply}
                onChange={(e) => setFormData({ ...formData, ply: parseInt(e.target.value) || 1 })}
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


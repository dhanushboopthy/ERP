'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useAuth } from '@/lib/auth-context';
import { PermissionButton } from '@/components/ui/permission-button';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Cylinder,
  Filter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { Beam, BeamType, BeamStatus } from '@/types';

const beamTypeLabels: Record<BeamType, string> = {
  [BeamType.WarpersBeam]: 'Warping Beam',
  [BeamType.SizersBeam]: 'Sizing Beam',
  [BeamType.LoomBeam]: "Weaver's Beam",
};

const beamStatusLabels: Record<BeamStatus, string> = {
  [BeamStatus.Available]: 'Available',
  [BeamStatus.InUse]: 'In Use',
  [BeamStatus.SizingComplete]: 'Sizing Done',
};

const beamStatusVariants: Record<BeamStatus, string> = {
  [BeamStatus.Available]: 'active',
  [BeamStatus.InUse]: 'draft',
  [BeamStatus.SizingComplete]: 'default',
};

export default function BeamsPage() {
  return (
    <RouteGuard requiredPermission="BEAM.VIEW">
      <BeamsContent />
    </RouteGuard>
  );
}

function BeamsContent() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Beam | null>(null);
  const [formData, setFormData] = useState({
    beamNo: '',
    beamType: BeamType.WarpersBeam,
    tareWeight: 0,
    widthInches: 0,
    maxEnds: 0,
  });

  // Fetch beams
  const { data: beams = [], isLoading, error, refetch } = useQuery<Beam[]>({
    queryKey: ['beams'],
    queryFn: async () => {
      const response = await apiClient.get<{ items: Beam[] }>('/api/beams');
      if (!response.success) throw new Error(response.message || 'Failed to fetch beams');
      return response.data?.items ?? [];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/api/beams', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beams'] });
      toast.success('Beam created successfully');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to create beam');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await apiClient.put(`/api/beams/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beams'] });
      toast.success('Beam updated successfully');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update beam');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/beams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beams'] });
      toast.success('Beam deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete beam');
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      beamNo: '',
      beamType: BeamType.WarpersBeam,
      tareWeight: 0,
      widthInches: 0,
      maxEnds: 0,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: Beam) => {
    if (!hasPermission('BEAM.EDIT')) {
      toast.error("You don't have permission to perform this action. Please contact your administrator.");
      return;
    }
    setEditingItem(item);
    setFormData({
      beamNo: item.beamNo,
      beamType: item.beamType as BeamType,
      tareWeight: item.tareWeight || 0,
      widthInches: item.widthInches || 0,
      maxEnds: item.maxEnds || 0,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      beamNo: '',
      beamType: BeamType.WarpersBeam,
      tareWeight: 0,
      widthInches: 0,
      maxEnds: 0,
    });
  };

  const handleSubmit = () => {
    if (!formData.beamNo.trim()) {
      toast.error('Beam number is required');
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (!hasPermission('BEAM.DELETE')) {
      toast.error("You don't have permission to perform this action. Please contact your administrator.");
      return;
    }
    if (confirm('Are you sure you want to delete this beam?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredItems = beams.filter((item) => {
    const matchesSearch = item.beamNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.beamType === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats calculation
  const stats = {
    total: beams.length,
    empty: beams.filter(b => b.status === BeamStatus.Available).length,
    inUse: beams.filter(b => b.status === BeamStatus.InUse).length,
    completed: beams.filter(b => b.status === BeamStatus.SizingComplete).length,
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load beams</h2>
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
          <h1 className="text-2xl font-bold text-gray-900">Beam Master</h1>
          <p className="text-gray-500">Manage warper, sizer, and loom beams</p>
        </div>
        <PermissionButton permission="BEAM.CREATE" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Beam
        </PermissionButton>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Cylinder className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Beams</p>
                  <p className="text-2xl font-bold font-mono">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <Cylinder className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Empty</p>
                  <p className="text-2xl font-bold font-mono">{stats.empty}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <Cylinder className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">In Use</p>
                  <p className="text-2xl font-bold font-mono">{stats.inUse}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Cylinder className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold font-mono">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by beam number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(beamTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(beamStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Beams ({filteredItems.length})</CardTitle>
            <CardDescription>List of all beams with their current status</CardDescription>
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
                    <TableHead>Beam No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No beams found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.beamNo}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{beamTypeLabels[item.beamType as BeamType] || item.beamType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={beamStatusVariants[item.status as BeamStatus] as any}>
                            {beamStatusLabels[item.status as BeamStatus]}
                          </Badge>
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
                  {editingItem ? 'Edit Beam' : 'Add New Beam'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the beam details below'
                    : 'Enter the beam information'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Current status info - read-only, shown only when editing */}
            {editingItem && (
              <div className="rounded-lg border bg-gray-50 px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Status</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={beamStatusVariants[editingItem.status as BeamStatus] as any || 'grey'}>
                    {beamStatusLabels[editingItem.status as BeamStatus] || editingItem.status}
                  </Badge>
                  {editingItem.currentJobCardId && (
                    <span className="text-sm text-gray-600">
                      Job Card: <span className="font-mono font-medium">#{editingItem.currentJobCardId}</span>
                      {editingItem.currentJobCardType && (
                        <span className="text-gray-400"> ({editingItem.currentJobCardType})</span>
                      )}
                    </span>
                  )}
                  {!editingItem.currentJobCardId && (
                    <span className="text-sm text-gray-400">No active job card</span>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="beamNo">Beam Number *</Label>
              <Input
                id="beamNo"
                placeholder="e.g., WB-001"
                value={formData.beamNo}
                onChange={(e) => setFormData({ ...formData, beamNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beamType">Beam Type *</Label>
              <Select
                value={formData.beamType}
                onValueChange={(value) => setFormData({ ...formData, beamType: value as BeamType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(beamTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tareWeight">Tare Weight (kg)</Label>
                <Input
                  id="tareWeight"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={formData.tareWeight}
                  onChange={(e) => setFormData({ ...formData, tareWeight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="widthInches">Width (inches)</Label>
                <Input
                  id="widthInches"
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                  value={formData.widthInches}
                  onChange={(e) => setFormData({ ...formData, widthInches: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxEnds">Max Ends</Label>
                <Input
                  id="maxEnds"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.maxEnds}
                  onChange={(e) => setFormData({ ...formData, maxEnds: parseInt(e.target.value) || 0 })}
                />
              </div>
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


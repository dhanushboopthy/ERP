'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useAuth } from '@/lib/auth-context';
import { PermissionButton } from '@/components/ui/permission-button';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Calendar,
  Lock,
  Unlock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

interface FinancialYear {
  id: number;
  yearCode: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  isActive: boolean;
}

// Mock data removed - data is now loaded from the API

export default function FinancialYearsPage() {
  return (
    <RouteGuard requireAdmin>
      <FinancialYearsContent />
    </RouteGuard>
  );
}

function FinancialYearsContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { hasPermission } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialYear | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    yearCode: '',
    yearName: '',
    startDate: '',
    endDate: '',
  });

  // Fetch financial years
  const { data: financialYears = [], isLoading, error, refetch } = useQuery<FinancialYear[]>({
    queryKey: ['financialYears'],
    queryFn: async (): Promise<FinancialYear[]> => {
      const response = await apiClient.get<FinancialYear[]>('/api/financialyears');
      // LegacyRoutesController returns a plain array (not wrapped in ApiResponse)
      if (Array.isArray(response)) return response as FinancialYear[];
      return (response.data as FinancialYear[]) ?? [];
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ yearCode: '', yearName: '', startDate: '', endDate: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: FinancialYear) => {
    if (!hasPermission('FINANCIAL_YEAR.EDIT')) {
      toast.error("You don't have permission to perform this action. Please contact your administrator.");
      return;
    }
    setEditingItem(item);
    setFormData({
      yearCode: item.yearCode,
      yearName: item.yearName,
      startDate: item.startDate.split('T')[0],
      endDate: item.endDate.split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ yearCode: '', yearName: '', startDate: '', endDate: '' });
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/api/settings/financial-years', {
        yearCode: data.yearCode,
        yearName: data.yearName,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      if (!response.success) throw new Error(response.message || 'Failed to create financial year');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialYears'] });
      toast.success('Financial year created successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create financial year');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      toast.info('Financial year editing is not supported. Create a new year if needed.');
      return;
    }
    if (!formData.yearCode || !formData.yearName || !formData.startDate || !formData.endDate) {
      toast.error('All fields are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const filteredYears = financialYears.filter((fy) =>
    fy.yearCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fy.yearName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load financial years</h2>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Years</h1>
          <p className="text-gray-500">Manage financial year periods for accounting</p>
        </div>
        <PermissionButton permission="FINANCIAL_YEAR.CREATE" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Financial Year
        </PermissionButton>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search financial years..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year Code</TableHead>
                  <TableHead>Year Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredYears.map((fy) => (
                  <TableRow key={fy.id}>
                    <TableCell className="font-mono font-medium">{fy.yearCode}</TableCell>
                    <TableCell>{fy.yearName}</TableCell>
                    <TableCell>{formatDate(fy.startDate)}</TableCell>
                    <TableCell>{formatDate(fy.endDate)}</TableCell>
                    <TableCell>
                      {fy.isClosed ? (
                        <Badge variant="grey" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Closed
                        </Badge>
                      ) : (
                        <Badge variant="active" className="gap-1">
                          <Unlock className="h-3 w-3" />
                          Open
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <PermissionButton
                          permission="FINANCIAL_YEAR.EDIT"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(fy)}
                          disabled={fy.isClosed}
                        >
                          <Pencil className="h-4 w-4" />
                        </PermissionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredYears.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                      No financial years found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle>{editingItem ? 'Edit Financial Year' : 'Add Financial Year'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update financial year details' : 'Create a new financial year'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearCode">Year Code</Label>
                  <Input
                    id="yearCode"
                    value={formData.yearCode}
                    onChange={(e) => setFormData({ ...formData, yearCode: e.target.value })}
                    placeholder="e.g., 2024-25"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearName">Year Name</Label>
                  <Input
                    id="yearName"
                    value={formData.yearName}
                    onChange={(e) => setFormData({ ...formData, yearName: e.target.value })}
                    placeholder="e.g., FY 2024-25"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? 'View Only' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


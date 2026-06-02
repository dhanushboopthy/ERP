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
  Hash,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

interface DocumentSeries {
  id: number;
  documentType: string;
  displayName?: string;
  financialYearId: number;
  financialYear: string;
  prefix: string;
  suffix?: string;
  currentNumber: number;
  padLength: number;
  resetOnFYChange: boolean;
  allowManualOverride: boolean;
  lockAfterPrint: boolean;
  lockAfterApproval: boolean;
  sampleNumber?: string;
  isActive: boolean;
}

const documentTypes = [
  'YarnReceipt',
  'BabyCone',
  'WarpingJobCard',
  'SizingJobCard',
  'TaxInvoice',
  'YarnReturn',
  'YarnDelivery',
];

export default function DocumentSeriesPage() {
  return (
    <RouteGuard requireAdmin>
      <DocumentSeriesContent />
    </RouteGuard>
  );
}

function DocumentSeriesContent() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DocumentSeries | null>(null);

  const [formData, setFormData] = useState({
    id: 0,
    documentType: '',
    prefix: '',
    suffix: '',
    currentNumber: 1,
    padLength: 5,
    resetOnFYChange: false,
    allowManualOverride: false,
    lockAfterPrint: false,
    lockAfterApproval: false,
  });

  // Fetch document series
  const { data: documentSeries = [], isLoading, error, refetch } = useQuery<DocumentSeries[]>({
    queryKey: ['documentSeries'],
    queryFn: async (): Promise<DocumentSeries[]> => {
      const response = await apiClient.get<DocumentSeries[]>('/api/documentseries');
      // LegacyRoutesController returns a plain array (not wrapped in ApiResponse)
      if (Array.isArray(response)) return response as DocumentSeries[];
      return (response.data as DocumentSeries[]) ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.put(`/api/settings/document-numbers/${data.id}`, {
        id: data.id,
        prefix: data.prefix,
        suffix: data.suffix || null,
        padLength: data.padLength,
        resetOnFYChange: data.resetOnFYChange,
        allowManualOverride: data.allowManualOverride,
        lockAfterPrint: data.lockAfterPrint,
        lockAfterApproval: data.lockAfterApproval,
      });
      if (!response.success) throw new Error(response.message || 'Failed to update document series');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentSeries'] });
      toast.success('Document series updated successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update document series');
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ id: 0, documentType: '', prefix: '', suffix: '', currentNumber: 1, padLength: 5, resetOnFYChange: false, allowManualOverride: false, lockAfterPrint: false, lockAfterApproval: false });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: DocumentSeries) => {
    if (!hasPermission('DOCUMENT_SERIES.EDIT')) {
      toast.error("You don't have permission to perform this action. Please contact your administrator.");
      return;
    }
    setEditingItem(item);
    setFormData({
      id: item.id,
      documentType: item.documentType,
      prefix: item.prefix,
      suffix: item.suffix || '',
      currentNumber: item.currentNumber,
      padLength: item.padLength,
      resetOnFYChange: item.resetOnFYChange,
      allowManualOverride: item.allowManualOverride,
      lockAfterPrint: item.lockAfterPrint,
      lockAfterApproval: item.lockAfterApproval,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ id: 0, documentType: '', prefix: '', suffix: '', currentNumber: 1, padLength: 5, resetOnFYChange: false, allowManualOverride: false, lockAfterPrint: false, lockAfterApproval: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) {
      toast.info('Document series are auto-created per financial year. Use Edit to update settings.');
      handleCloseDialog();
      return;
    }
    if (!formData.prefix) {
      toast.error('Prefix is required');
      return;
    }
    updateMutation.mutate(formData);
  };

  const getSampleNumber = () => {
    const num = formData.currentNumber.toString().padStart(formData.padLength, '0');
    return `${formData.prefix}/${num}`;
  };

  const filteredSeries = documentSeries.filter((ds) =>
    ds.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ds.prefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load document series</h2>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Series</h1>
          <p className="text-gray-500">Configure automatic document numbering</p>
        </div>

      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search document series..."
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
                  <TableHead>Document Type</TableHead>
                  <TableHead>Financial Year</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Current Number</TableHead>
                  <TableHead>Sample</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeries.map((ds) => (
                  <TableRow key={ds.id}>
                    <TableCell className="font-medium">{ds.documentType}</TableCell>
                    <TableCell>{ds.financialYear}</TableCell>
                    <TableCell className="font-mono">{ds.prefix}</TableCell>
                    <TableCell className="font-mono">{ds.currentNumber}</TableCell>
                    <TableCell className="font-mono text-primary">
                      {ds.prefix}/{ds.currentNumber.toString().padStart(ds.padLength, '0')}
                    </TableCell>
                    <TableCell>
                    <Badge variant={ds.isActive ? 'active' : 'default'}>
                        {ds.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <PermissionButton
                        permission="DOCUMENT_SERIES.EDIT"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(ds)}
                      >
                        <Pencil className="h-4 w-4" />
                      </PermissionButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSeries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                      No document series found
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
                <DialogTitle>{editingItem ? 'Edit Document Series' : 'Add Document Series'}</DialogTitle>
                <DialogDescription>
                  Configure document numbering format
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                  disabled={!!editingItem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefix</Label>
                  <Input
                    id="prefix"
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g., INV"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="padLength">Pad Length</Label>
                  <Input
                    id="padLength"
                    type="number"
                    min={3}
                    max={10}
                    value={formData.padLength}
                    onChange={(e) => setFormData({ ...formData, padLength: parseInt(e.target.value) || 5 })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentNumber">Starting Number</Label>
                <Input
                  id="currentNumber"
                  type="number"
                  min={1}
                  value={formData.currentNumber}
                  onChange={(e) => setFormData({ ...formData, currentNumber: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              {formData.prefix && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Sample Number:</p>
                  <p className="text-lg font-mono font-medium text-primary">{getSampleNumber()}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


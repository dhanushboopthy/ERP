'use client';

import { useState, type ComponentPropsWithoutRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Calendar,
  Plus,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Star,
  FileText,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Card as BaseCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { SettingsShell, settingsCardClass } from '@/components/settings/settings-shell';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

interface FinancialYear {
  id: number;
  yearCode: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  documentCount: number;
}

interface PendingDocuments {
  draftInvoices: number;
  pendingApprovals: number;
  unpostedTransactions: number;
}

export default function FinancialYearPage() {
  return (
    <RouteGuard requireAdmin>
      <FinancialYearContent />
    </RouteGuard>
  );
}

function FinancialYearContent() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<FinancialYear | null>(null);
  const [closeConfirmations, setCloseConfirmations] = useState({
    draftInvoices: false,
    pendingApprovals: false,
    backup: false,
  });
  
  const [formData, setFormData] = useState({
    yearCode: '',
    startDate: '',
    endDate: '',
  });

  // Fetch financial years
  const { data: years = [], isLoading } = useQuery<FinancialYear[]>({
    queryKey: ['financialYears'],
    queryFn: async () => {
      const response = await apiClient.get<FinancialYear[]>('/api/settings/financial-years');
      return response.data ?? [];
    },
  });

  // Fetch pending documents for selected year
  const { data: pendingDocs } = useQuery<PendingDocuments>({
    queryKey: ['pendingDocuments', selectedYear?.id],
    queryFn: async () => {
      if (!selectedYear) return { draftInvoices: 0, pendingApprovals: 0, unpostedTransactions: 0 };
      const response = await apiClient.get<PendingDocuments>(`/api/settings/financial-years/${selectedYear.id}/pending-documents`);
      return response.data ?? { draftInvoices: 0, pendingApprovals: 0, unpostedTransactions: 0 };
    },
    enabled: !!selectedYear && isCloseOpen,
  });

  // Create financial year mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.post('/api/settings/financial-years', data);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Financial year created successfully');
        queryClient.invalidateQueries({ queryKey: ['financialYears'] });
        setIsCreateOpen(false);
        setFormData({ yearCode: '', startDate: '', endDate: '' });
      } else {
        toast.error(response.message || 'Failed to create financial year');
      }
    },
  });

  // Set current year mutation
  const setCurrentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.post(`/api/settings/financial-years/${id}/set-current`);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Current financial year updated');
        queryClient.invalidateQueries({ queryKey: ['financialYears'] });
      } else {
        toast.error(response.message || 'Failed to set current year');
      }
    },
  });

  // Close financial year mutation
  const closeMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.post(`/api/settings/financial-years/${id}/close`, {
        confirmDraftInvoices: closeConfirmations.draftInvoices,
        confirmPendingApprovals: closeConfirmations.pendingApprovals,
        confirmBackup: closeConfirmations.backup,
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Financial year closed successfully');
        queryClient.invalidateQueries({ queryKey: ['financialYears'] });
        setIsCloseOpen(false);
        setSelectedYear(null);
        setCloseConfirmations({ draftInvoices: false, pendingApprovals: false, backup: false });
      } else {
        toast.error(response.message || 'Failed to close financial year');
      }
    },
  });

  const handleOpenClose = (year: FinancialYear) => {
    setSelectedYear(year);
    setCloseConfirmations({ draftInvoices: false, pendingApprovals: false, backup: false });
    setIsCloseOpen(true);
  };

  const canClose = closeConfirmations.draftInvoices && closeConfirmations.pendingApprovals && closeConfirmations.backup;

  // Generate suggested year code
  const generateYearCode = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      return `${start.getFullYear()}-${end.getFullYear().toString().slice(-2)}`;
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentYear = years.find(y => y.isCurrent);

  return (
    <SettingsShell
      title="Financial Year Control"
      subtitle="Manage financial years and document numbering periods"
      actions={(
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[color:var(--settings-accent)] hover:bg-[color:var(--settings-accent-strong)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Financial Year
        </Button>
      )}
    >

      {/* Current Year Highlight */}
      {currentYear && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                  <Calendar className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{currentYear.yearCode}</h2>
                    <Badge className="bg-primary">Current</Badge>
                  </div>
                  <p className="text-gray-600">
                    {formatDate(currentYear.startDate)} - {formatDate(currentYear.endDate)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Documents Created</p>
                <p className="text-2xl font-bold text-primary">{currentYear.documentCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Years List */}
      <Card>
        <CardHeader>
          <CardTitle>All Financial Years</CardTitle>
          <CardDescription>Manage financial year periods and closures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {years.map((year) => (
              <div
                key={year.id}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border transition-colors',
                  year.isCurrent && 'bg-primary/5 border-primary/30',
                  year.isClosed && 'bg-gray-50'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    year.isClosed ? 'bg-gray-200' : year.isCurrent ? 'bg-primary text-white' : 'bg-blue-100 text-blue-600'
                  )}>
                    {year.isClosed ? (
                      <Lock className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Calendar className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{year.yearCode}</h3>
                      {year.isCurrent && (
                        <Badge className="bg-primary">
                          <Star className="mr-1 h-3 w-3" />
                          Current
                        </Badge>
                      )}
                      {year.isClosed && (
                        <Badge variant="grey">
                          <Lock className="mr-1 h-3 w-3" />
                          Closed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(year.startDate)} to {formatDate(year.endDate)}
                    </p>
                    {year.closedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Closed on {formatDate(year.closedAt)} by {year.closedBy}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <FileText className="h-4 w-4" />
                      {year.documentCount} documents
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!year.isClosed && !year.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMutation.mutate(year.id)}
                        disabled={setCurrentMutation.isPending}
                      >
                        Set as Current
                      </Button>
                    )}
                    {!year.isClosed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700 border-amber-300"
                        onClick={() => handleOpenClose(year)}
                      >
                        <Lock className="mr-1 h-4 w-4" />
                        Close Year
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {years.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No financial years configured</p>
                <p className="text-sm text-gray-400">Create a financial year to start</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Financial Year Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Financial Year</DialogTitle>
            <DialogDescription>Define a new financial year period</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Year Code *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.yearCode}
                  onChange={(e) => setFormData({ ...formData, yearCode: e.target.value })}
                  placeholder="e.g., 2024-25"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, yearCode: generateYearCode() })}
                >
                  Auto
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                This code will be used in document numbering (e.g., YR/2024-25/001)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.yearCode || !formData.startDate || !formData.endDate}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Financial Year
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Financial Year Dialog */}
      <AlertDialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Close Financial Year
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to close <strong>{selectedYear?.yearCode}</strong>. 
              This action cannot be undone. No new documents can be created in a closed year.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingDocs && (
            <div className="space-y-4 py-4">
              {/* Pending Items Warning */}
              {(pendingDocs.draftInvoices > 0 || pendingDocs.pendingApprovals > 0) && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="font-medium text-amber-800 mb-2">Pending Items Found:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {pendingDocs.draftInvoices > 0 && (
                      <li>• {pendingDocs.draftInvoices} draft invoice(s)</li>
                    )}
                    {pendingDocs.pendingApprovals > 0 && (
                      <li>• {pendingDocs.pendingApprovals} document(s) pending approval</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Confirmation Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="confirm-drafts"
                    checked={closeConfirmations.draftInvoices}
                    onCheckedChange={(checked) => 
                      setCloseConfirmations(prev => ({ ...prev, draftInvoices: checked as boolean }))
                    }
                  />
                  <label htmlFor="confirm-drafts" className="text-sm">
                    I confirm all draft invoices have been finalized or cancelled
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="confirm-approvals"
                    checked={closeConfirmations.pendingApprovals}
                    onCheckedChange={(checked) => 
                      setCloseConfirmations(prev => ({ ...prev, pendingApprovals: checked as boolean }))
                    }
                  />
                  <label htmlFor="confirm-approvals" className="text-sm">
                    I confirm all pending approvals have been processed
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="confirm-backup"
                    checked={closeConfirmations.backup}
                    onCheckedChange={(checked) => 
                      setCloseConfirmations(prev => ({ ...prev, backup: checked as boolean }))
                    }
                  />
                  <label htmlFor="confirm-backup" className="text-sm">
                    I confirm a backup has been taken before closing this year
                  </label>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => closeMutation.mutate(selectedYear!.id)}
              disabled={!canClose || closeMutation.isPending}
            >
              {closeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Lock className="mr-2 h-4 w-4" />
              Close Financial Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsShell>
  );
}


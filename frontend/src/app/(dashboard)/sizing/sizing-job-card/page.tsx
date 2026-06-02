'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useAuth } from '@/lib/auth-context';
import { PermissionButton } from '@/components/ui/permission-button';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Eye,
  Download,
  Printer,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { formatNumber, formatDate } from '@/lib/utils';
import { ProfessionalViewTabs } from '@/components/shared/professional-view-tabs';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { useKeyboardShortcut, commonShortcuts } from '@/hooks/use-keyboard-shortcut';

interface SizingJobCard {
  id: number;
  jobCardNumber: string;
  jobCardDate: string;
  partyId: number;
  partyCode: string;
  partyName: string;
  yarnCountId: number;
  countCode: string;
  lotNo?: string;
  setNo: string;
  loomTypeId?: number;
  loomTypeName?: string;
  totalEnds: number;
  setLength: number;
  actualLength?: number;
  beamWidth?: number;
  sizingMachineNo?: string;
  sizeRecipe?: string;
  outputSizingBeamId?: number;
  outputBeamNo?: string;
  outputWeight?: number;
  sizingDate?: string;
  status: string;
  invoiceId?: number;
  invoiceNumber?: string;
  preparedBy?: string;
  preparedDate?: string;
  checkedBy?: string;
  checkedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  authorizedBy?: string;
  authorizedDate?: string;
  remarks?: string;
  sourceBeams: { id: number; beamId: number; beamNo: string; beamSequence: number; endsOnBeam?: number }[];
}

interface PagedResult {
  items: SizingJobCard[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Prepared', label: 'Prepared' },
  { value: 'Checked', label: 'Checked' },
  { value: 'GMApproved', label: 'GM Approved' },
  { value: 'Authorized', label: 'Authorized' },
];

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  Draft: { color: 'grey', icon: Clock, label: 'Draft' },
  Prepared: { color: 'draft', icon: AlertCircle, label: 'Prepared' },
  Checked: { color: 'default', icon: CheckCircle, label: 'Checked' },
  GMApproved: { color: 'grey', icon: CheckCircle, label: 'GM Approved' },
  Authorized: { color: 'active', icon: CheckCircle, label: 'Authorized' },
  Rejected: { color: 'cancelled', icon: XCircle, label: 'Rejected' },
};

export default function SizingJobCardPage() {
  return (
    <RouteGuard requiredPermission="SIZING_JOB_CARD.VIEW">
      <SizingJobCardContent />
    </RouteGuard>
  );
}

function SizingJobCardContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    id: number | null;
    level: string;
  }>({ open: false, id: null, level: '' });

  // Keyboard shortcuts
  useKeyboardShortcut([
    commonShortcuts.refresh(() => refetch()),
    commonShortcuts.search(() => document.getElementById('sizing-search')?.focus()),
    commonShortcuts.export(() => handleExport()),
  ]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sizing-job-cards', page, statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('pageNumber', page.toString());
      params.append('pageSize', '20');
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiClient.get(`/api/sizing-job-cards?${params}`) as any;
      // API returns { success: true, data: { items: [...], totalCount } }
      if (response && response.data && response.data.items) {
        return response.data.items;
      }
      return [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, level }: { id: number; level: string }) => {
      const response = await apiClient.post(`/api/sizing-job-cards/${id}/approve`, {
        approvalLevel: level,
        approved: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizing-job-cards'] });
      toast.success('Job card approved successfully');
      setApprovalDialog({ open: false, id: null, level: '' });
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  const cards = data || [];
  const totalCount = cards.length;
  const totalPages = Math.ceil(totalCount / 20);

  const stats = {
    total: totalCount,
    authorized: cards.filter((c: any) => c.status === 'Authorized').length,
    pending: cards.filter((c: any) => ['Prepared', 'Checked', 'GMApproved'].includes(c.status)).length,
    draft: cards.filter((c: any) => c.status === 'Draft').length,
    totalMeters: cards.reduce((sum: number, c: any) => sum + (c.actualLength || c.setLength), 0),
  };

  const filteredCards = cards.filter((card: any) => {
    if (activeTab === 'draft') {
      return ['Prepared', 'Checked', 'GMApproved'].includes(card.status);
    }
    if (activeTab === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return card.jobCardDate.startsWith(today);
    }
    return true;
  });

  const handleApprove = (id: number, status: string) => {
    let level = '';
    switch (status) {
      case 'Draft': level = 'Prepare'; break;
      case 'Prepared': level = 'Check'; break;
      case 'Checked': level = 'GMApprove'; break;
      case 'GMApproved': level = 'Authorize'; break;
    }
    if (level) {
      setApprovalDialog({ open: true, id, level });
    }
  };

  const handleExport = () => {
    const headers = ['Set No', 'Job Card No', 'Date', 'Party', 'Yarn Count', 'Loom Type', 'Ends', 'Set Length', 'Actual Length', 'Beams', 'Status'];
    const rows = cards.map((c: any) => [c.setNo, c.jobCardNumber, new Date(c.jobCardDate).toLocaleDateString(), c.partyName, c.countCode, c.loomTypeName || '-', c.totalEnds, c.setLength, c.actualLength || '-', c.beamCount || 0, c.status]);
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sizing-job-cards-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sizing Job Card (Set Report)</h1>
          <p className="text-sm text-gray-500">Manage sizing production sets with approval workflow</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={cards.length === 0}><Download className="mr-2 h-4 w-4" />Export</Button>
          <PermissionButton size="sm" permission="SIZING_JOB_CARD.CREATE" onClick={() => router.push('/sizing/sizing-job-card/new')}><Plus className="mr-2 h-4 w-4" />New Set</PermissionButton>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"><ClipboardList className="h-5 w-5 text-blue-600" /></div><div><p className="text-xs text-gray-500">Total Sets</p><p className="text-xl font-bold font-mono">{stats.total}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-gray-500">Authorized</p><p className="text-xl font-bold font-mono">{stats.authorized}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100"><AlertCircle className="h-5 w-5 text-orange-600" /></div><div><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold font-mono">{stats.pending}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><Clock className="h-5 w-5 text-gray-600" /></div><div><p className="text-xs text-gray-500">Draft</p><p className="text-xl font-bold font-mono">{stats.draft}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div><p className="text-xs text-gray-500">Total Production</p><p className="text-xl font-bold font-mono">{formatNumber(stats.totalMeters / 1000, 0)}K<span className="text-sm font-normal text-gray-500 ml-1">mtrs</span></p></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <ProfessionalViewTabs
              activeView={activeTab}
              onViewChange={setActiveTab}
              views={[
                { value: 'all', label: 'All Sets' },
                { value: 'draft', label: 'Pending' },
                { value: 'today', label: 'Today' },
              ]}
              showIcons={false}
            />
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search sets..." className="pl-10 w-full sm:w-[250px]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sizing Sets ({filteredCards.length})</CardTitle><CardDescription>Complete list of sizing job cards with approval status</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : filteredCards.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No sizing job cards found. Create your first set to get started.</div>
          ) : (
            <>
              <div className="block lg:hidden space-y-4">
                {filteredCards.map((card: any) => {
                  const config = statusConfig[card.status] || statusConfig.Draft;
                  return (
                    <div key={card.id} className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/sizing/sizing-job-card/${card.id}`} className="font-mono text-sm font-medium text-primary hover:underline">{card.setNo}</Link>
                          <p className="text-sm text-gray-500">{formatDate(card.jobCardDate)}</p>
                        </div>
                        <Badge variant={config.color as 'active' | 'grey' | 'default' | 'draft' | 'grey' | 'cancelled'}>{config.label}</Badge>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-medium">{card.partyName}</p>
                        <p className="text-xs text-gray-500">{card.countCode} | {card.loomTypeName || '-'}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded bg-gray-50 p-2"><p className="text-xs text-gray-500">Ends</p><p className="text-sm font-bold font-mono">{formatNumber(card.totalEnds)}</p></div>
                        <div className="rounded bg-gray-50 p-2"><p className="text-xs text-gray-500">Length</p><p className="text-sm font-bold font-mono">{formatNumber(card.actualLength || card.setLength)}</p></div>
                        <div className="rounded bg-gray-50 p-2"><p className="text-xs text-gray-500">Beams</p><p className="text-sm font-bold font-mono">{card.beamCount || 0}</p></div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Link href={`/sizing/sizing-job-card/${card.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full"><Eye className="mr-2 h-4 w-4" />View</Button></Link>
                        {card.status !== 'Authorized' && (<Button size="sm" variant="default" className="flex-1" onClick={() => handleApprove(card.id, card.status)}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Table className="hidden lg:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Set No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Loom Type</TableHead>
                    <TableHead className="text-right">Ends</TableHead>
                    <TableHead className="text-right">Length (m)</TableHead>
                    <TableHead className="text-right">Beams</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card: any) => {
                    const config = statusConfig[card.status] || statusConfig.Draft;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={card.id}>
                        <TableCell className="font-mono text-sm font-medium"><Link href={`/sizing/sizing-job-card/${card.id}`} className="text-primary hover:underline">{card.setNo}</Link></TableCell>
                        <TableCell>{formatDate(card.jobCardDate)}</TableCell>
                        <TableCell className="font-medium">{card.partyName}</TableCell>
                        <TableCell>{card.countCode}</TableCell>
                        <TableCell>{card.loomTypeName || '-'}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(card.totalEnds)}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(card.actualLength || card.setLength)}</TableCell>
                        <TableCell className="text-right font-mono">{card.beamCount || 0}</TableCell>
                        <TableCell><Badge variant={config.color as 'active' | 'grey' | 'default' | 'draft' | 'grey' | 'cancelled'} className="flex items-center gap-1 w-fit"><StatusIcon className="h-3 w-3" />{config.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg"
                            >
                              <DropdownMenuLabel className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="mx-1 my-1 h-px bg-slate-200" />
                              <DropdownMenuItem
                                asChild
                                className="gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                              >
                                <Link href={`/sizing/sizing-job-card/${card.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {card.status !== 'Authorized' && (
                                <DropdownMenuItem
                                  asChild
                                  className="gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                                >
                                  <Link href={`/sizing/sizing-job-card/${card.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                asChild
                                className="gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                              >
                                <Link
                                  href={`/sizing/sizing-job-card/${card.id}?print=1`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  Print
                                </Link>
                              </DropdownMenuItem>
                              {card.status !== 'Authorized' && (
                                <>
                                  <DropdownMenuSeparator className="mx-1 my-1 h-px bg-slate-200" />
                                  <DropdownMenuItem
                                    className="gap-2 rounded-md px-2.5 py-2 text-sm text-primary focus:bg-slate-100"
                                    onClick={() => handleApprove(card.id, card.status)}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {card.status === 'Draft' && 'Submit for Approval'}
                                    {card.status === 'Prepared' && 'Mark as Checked'}
                                    {card.status === 'Checked' && 'GM Approval'}
                                    {card.status === 'GMApproved' && 'Final Authorization'}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalCount)} of {totalCount}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to approve this job card? This action will move it to the next stage in the workflow.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (approvalDialog.id) { approveMutation.mutate({ id: approvalDialog.id, level: approvalDialog.level }); } }} disabled={approveMutation.isPending}>
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


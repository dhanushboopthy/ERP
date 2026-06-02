'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
import { formatNumber, formatDate } from '@/lib/utils';
import { ProfessionalViewTabs } from '@/components/shared/professional-view-tabs';
import apiClient from '@/lib/api-client';
import { WarpingJobCardListDto, ApprovalStatus } from '@/types';
import type { LucideIcon } from 'lucide-react';

// Status configuration
const statusConfig: Record<ApprovalStatus, { color: string; icon: LucideIcon; label: string }> = {
  [ApprovalStatus.Draft]: {
    color: 'grey',
    icon: Clock,
    label: 'Draft',
  },
  [ApprovalStatus.Prepared]: {
    color: 'draft',
    icon: AlertCircle,
    label: 'Prepared',
  },
  [ApprovalStatus.Checked]: {
    color: 'default',
    icon: CheckCircle,
    label: 'Checked',
  },
  [ApprovalStatus.GMApproved]: {
    color: 'grey',
    icon: CheckCircle,
    label: 'GM Approved',
  },
  [ApprovalStatus.Authorized]: {
    color: 'active',
    icon: CheckCircle,
    label: 'Authorized',
  },
  [ApprovalStatus.Rejected]: {
    color: 'cancelled',
    icon: XCircle,
    label: 'Rejected',
  },
};

export default function WarpingJobCardPage() {
  return (
    <RouteGuard requiredPermission="WARPING_JOB_CARD.VIEW">
      <WarpingJobCardContent />
    </RouteGuard>
  );
}

function WarpingJobCardContent() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch warping job cards from API
  const { data: jobCards = [], isLoading, error, refetch } = useQuery<WarpingJobCardListDto[]>({
    queryKey: ['warpingJobCards'],
    queryFn: async () => {
      const response = await apiClient.get('/api/warpingjobcards', {
        params: { pageNumber: 1, pageSize: 500 },
      }) as any;
      // API returns { success, data: { items: [...] } }
      // apiClient.get unwraps to this, so response = { success, data: { items } }
      if (response && response.data && response.data.items) {
        return response.data.items;
      }
      return [];
    },
  });

  // Calculate stats
  const stats = {
    total: jobCards.length,
    authorized: jobCards.filter(c => c.approvalStatus === ApprovalStatus.Authorized).length,
    pending: jobCards.filter(c => 
      c.approvalStatus === ApprovalStatus.Prepared || 
      c.approvalStatus === ApprovalStatus.Checked || 
      c.approvalStatus === ApprovalStatus.GMApproved
    ).length,
    draft: jobCards.filter(c => c.approvalStatus === ApprovalStatus.Draft).length,
    totalMeters: jobCards.reduce((sum, c) => sum + c.totalMeters, 0),
  };

  // Filter job cards
  const filteredCards = jobCards.filter((card) => {
    const matchesSearch =
      card.jobCardNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.yarnCount || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || card.approvalStatus === statusFilter;
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'draft' && card.approvalStatus === ApprovalStatus.Draft) ||
      (activeTab === 'pending' && 
        (card.approvalStatus === ApprovalStatus.Prepared || 
         card.approvalStatus === ApprovalStatus.Checked || 
         card.approvalStatus === ApprovalStatus.GMApproved)) ||
      (activeTab === 'authorized' && card.approvalStatus === ApprovalStatus.Authorized);
    return matchesSearch && matchesStatus && matchesTab;
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load warping job cards</h2>
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
          <h1 className="text-2xl font-bold text-gray-900">Warping Job Card</h1>
          <p className="text-gray-500">Manage warping operations and beam allocations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <PermissionButton
            permission="WARPING_JOB_CARD.CREATE"
            onClick={() => router.push('/sizing/warping-job-card/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Job Card
          </PermissionButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Job Cards</p>
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
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Authorized</p>
                  <p className="text-2xl font-bold font-mono">{stats.authorized}</p>
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
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold font-mono">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <AlertCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Draft</p>
                  <p className="text-2xl font-bold font-mono">{stats.draft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <ClipboardList className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Meters</p>
                  <p className="text-2xl font-bold font-mono">{formatNumber(stats.totalMeters)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* View Tabs and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <ProfessionalViewTabs 
          activeView={activeTab}
          onViewChange={setActiveTab}
          views={[
            { value: 'all', label: 'All' },
            { value: 'draft', label: 'Draft' },
            { value: 'pending', label: 'Pending' },
            { value: 'authorized', label: 'Authorized' },
          ]}
          showIcons={false}
        />
      </div>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by job card no, party, or yarn count..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Warping Job Cards ({filteredCards.length})</CardTitle>
                <CardDescription>
                  List of all warping operations with beam allocations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Card No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Yarn Count</TableHead>
                        <TableHead>Loom Type</TableHead>
                        <TableHead className="text-right">Total Ends</TableHead>
                        <TableHead className="text-right">Meters</TableHead>
                        <TableHead className="text-right">Beams</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                            No warping job cards found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCards.map((card) => {
                          const StatusIcon = statusConfig[card.approvalStatus]?.icon || Clock;
                          return (
                            <TableRow key={card.id}>
                              <TableCell className="font-mono text-sm font-medium">
                                <Link
                                  href={`/sizing/warping-job-card/${card.id}`}
                                  className="text-primary hover:underline"
                                >
                                  {card.jobCardNo}
                                </Link>
                              </TableCell>
                              <TableCell>{formatDate(card.jobCardDate)}</TableCell>
                              <TableCell className="font-medium">{card.partyName}</TableCell>
                              <TableCell>{card.yarnCount || card.countCode}</TableCell>
                              <TableCell>{card.loomType || '-'}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatNumber(card.totalEnds)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatNumber(card.totalMeters)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {card.beamCount}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig[card.approvalStatus]?.color as any || 'grey'}>
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {statusConfig[card.approvalStatus]?.label || card.approvalStatus}
                                </Badge>
                              </TableCell>
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
                                      <Link href={`/sizing/warping-job-card/${card.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </Link>
                                    </DropdownMenuItem>
                                    {card.approvalStatus === ApprovalStatus.Draft && (
                                      <DropdownMenuItem
                                        asChild
                                        className="gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                                      >
                                        <Link href={`/sizing/warping-job-card/${card.id}/edit`}>
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
                                        href={`/sizing/warping-job-card/${card.id}?print=1`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print
                                      </Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
    </div>
  );
}


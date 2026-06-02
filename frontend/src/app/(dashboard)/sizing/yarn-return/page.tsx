'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  Download,
  Printer,
  RotateCcw,
  Truck,
  Package,
  AlertCircle,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatNumber, formatDate } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { YarnReturnDto } from '@/types';
import { toast } from 'sonner';

export default function YarnReturnPage() {
  return (
    <RouteGuard requiredPermission="YARN_RETURN.VIEW">
      <YarnReturnContent />
    </RouteGuard>
  );
}

function YarnReturnContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [approveId, setApproveId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch yarn returns from API
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['yarnReturns', statusFilter, typeFilter],
    queryFn: async () => {
      const res = await apiClient.get<{ items: YarnReturnDto[] }>('/api/yarnreturns', {
        params: {
          pageNumber: 1,
          pageSize: 500,
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(typeFilter !== 'all' && { returnType: typeFilter }),
        },
      });
      return res;
    },
  });

  const yarnReturns: YarnReturnDto[] = response?.data?.items || [];

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/api/yarnreturns/${id}/approve`);
    },
    onSuccess: () => {
      toast.success('Yarn return approved successfully');
      queryClient.invalidateQueries({ queryKey: ['yarnReturns'] });
      setApproveId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve yarn return');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/yarnreturns/${id}`);
    },
    onSuccess: () => {
      toast.success('Yarn return deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['yarnReturns'] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete yarn return');
    },
  });

  // Calculate stats
  const stats = {
    total: yarnReturns.length,
    draft: yarnReturns.filter(yr => yr.status === 'Draft').length,
    approved: yarnReturns.filter(yr => yr.status === 'Approved').length,
    mill: yarnReturns.filter(yr => yr.returnType === 'Mill').length,
    jobwork: yarnReturns.filter(yr => yr.returnType === 'Jobwork').length,
    totalWeight: yarnReturns.reduce((sum, yr) => sum + yr.totalWeight, 0),
  };

  // Filter yarn returns
  const filteredReturns = yarnReturns.filter((yr) => {
    const matchesSearch =
      yr.dcNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      yr.partyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'Approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'Dispatched':
        return <Badge variant="grey">Dispatched</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Mill':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Mill</Badge>;
      case 'Jobwork':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Jobwork</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load yarn returns</h2>
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
          <h1 className="text-2xl font-bold text-gray-900">Yarn Return DC</h1>
          <p className="text-gray-500">Manage yarn return delivery challans</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/sizing/yarn-return/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Return DC
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <RotateCcw className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Returns</p>
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
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Approval</p>
                  <p className="text-2xl font-bold font-mono">{stats.draft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jobwork Returns</p>
                  <p className="text-2xl font-bold font-mono">{stats.jobwork}</p>
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
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Weight</p>
                  <p className="text-2xl font-bold font-mono">{formatNumber(stats.totalWeight)}</p>
                  <p className="text-xs text-gray-400">kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by DC no, party..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Dispatched">Dispatched</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Mill">Mill</SelectItem>
                  <SelectItem value="Jobwork">Jobwork</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DC No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No yarn returns found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReturns.map((yr) => (
                    <TableRow key={yr.id}>
                      <TableCell className="font-medium font-mono">{yr.dcNo}</TableCell>
                      <TableCell>{formatDate(yr.dcDate)}</TableCell>
                      <TableCell>{yr.partyName}</TableCell>
                      <TableCell>
                        {getTypeBadge(yr.returnType)}
                        {yr.isNotForSale && (
                          <span className="ml-1 text-xs text-red-500">(NOT FOR SALE)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(yr.totalWeight)}</TableCell>
                      <TableCell>{yr.vehicleNo || '-'}</TableCell>
                      <TableCell>{getStatusBadge(yr.status)}</TableCell>
                      <TableCell>
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
                              <Link href={`/sizing/yarn-return/${yr.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {yr.status === 'Draft' && (
                              <DropdownMenuItem
                                asChild
                                className="gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                              >
                                <Link href={`/sizing/yarn-return/${yr.id}/edit`}>
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
                                href={`/sizing/yarn-return/${yr.id}?print=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                              </Link>
                            </DropdownMenuItem>
                            {yr.status === 'Draft' && (
                              <>
                                <DropdownMenuSeparator className="mx-1 my-1 h-px bg-slate-200" />
                                <DropdownMenuItem
                                  className="gap-2 rounded-md px-2.5 py-2 text-sm text-green-600 focus:bg-slate-100 focus:text-green-700"
                                  onClick={() => setApproveId(yr.id)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 rounded-md px-2.5 py-2 text-sm text-red-600 focus:bg-slate-100 focus:text-red-700"
                                  onClick={() => setDeleteId(yr.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveId !== null} onOpenChange={() => setApproveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Yarn Return</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this yarn return? This will update the stock ledger
              and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => approveId && approveMutation.mutate(approveId)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Yarn Return</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this yarn return? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="cancelled"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


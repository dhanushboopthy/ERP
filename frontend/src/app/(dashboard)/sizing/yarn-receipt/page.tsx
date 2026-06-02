'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Eye,
  Download,
  Printer,
  Receipt,
  Truck,
  Package,
  Calendar,
  Loader2,
  AlertCircle,
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
import apiClient, { endpoints } from '@/lib/api-client';
import { YarnReceiptListDto } from '@/types';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useAuth } from '@/lib/auth-context';
import { PermissionButton } from '@/components/ui/permission-button';

export default function YarnReceiptPage() {
  return (
    <RouteGuard requiredPermission="YARN_RECEIPT.VIEW">
      <YarnReceiptContent />
    </RouteGuard>
  );
}

function YarnReceiptContent() {
  const router = useRouter();
  const { hasPermission, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch yarn receipts from API
  const { data: receipts = [], isLoading, error, refetch } = useQuery<YarnReceiptListDto[]>({
    queryKey: ['yarnReceipts'],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.yarnReceipts, {
        params: { pageNumber: 1, pageSize: 500 },
      });

      // Normalize ApiResponse<PagedResult<T>> or array
      // Expected shapes:
      // 1) { data: { items: [...] } }
      // 2) { data: [...] }
      // 3) direct array
      const payload = response as any;
      const dataLayer = payload?.data ?? payload;
      const items = dataLayer?.items ?? dataLayer?.Items ?? (Array.isArray(dataLayer) ? dataLayer : []);

      return items as YarnReceiptListDto[];
    },
    retry: 2,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Calculate stats from data
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const receiptStats = {
    today: {
      count: receipts.filter(r => r.receiptDate.split('T')[0] === today).length,
      weight: receipts.filter(r => r.receiptDate.split('T')[0] === today).reduce((sum, r) => sum + r.totalNetWeight, 0),
    },
    thisWeek: {
      count: receipts.filter(r => r.receiptDate.split('T')[0] >= weekAgo).length,
      weight: receipts.filter(r => r.receiptDate.split('T')[0] >= weekAgo).reduce((sum, r) => sum + r.totalNetWeight, 0),
    },
    thisMonth: {
      count: receipts.filter(r => r.receiptDate.split('T')[0] >= monthAgo).length,
      weight: receipts.filter(r => r.receiptDate.split('T')[0] >= monthAgo).reduce((sum, r) => sum + r.totalNetWeight, 0),
    },
    pendingStock: {
      count: receipts.filter(r => !r.isUsedInJobCard).length,
      weight: receipts.filter(r => !r.isUsedInJobCard).reduce((sum, r) => sum + r.totalNetWeight, 0),
    },
  };

  // Filter receipts based on search and filters
  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (receipt.lotNo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (receipt.yarnCount?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'available' && !receipt.isUsedInJobCard) ||
      (statusFilter === 'used' && receipt.isUsedInJobCard);

    const receiptDate = receipt.receiptDate.split('T')[0];
    const matchesDate = 
      dateFilter === 'all' ||
      (dateFilter === 'today' && receiptDate === today) ||
      (dateFilter === 'week' && receiptDate >= weekAgo) ||
      (dateFilter === 'month' && receiptDate >= monthAgo);

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-brand-danger" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load yarn receipts</h2>
        <p className="text-gray-500">Unable to connect to the server. Please check your connection and try again.</p>
        <Button onClick={() => refetch()} className="btn-brand-primary">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yarn Receipt (Inward)</h1>
          <p className="text-gray-500">Manage yarn inward entries from vendors and mills</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <PermissionButton
            permission="YARN_RECEIPT.CREATE"
            onClick={() => router.push('/sizing/yarn-receipt/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Receipt
          </PermissionButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Today&apos;s Receipts</p>
                  <p className="text-2xl font-bold font-mono">{receiptStats.today.count}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {formatNumber(receiptStats.today.weight)} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">This Week</p>
                  <p className="text-2xl font-bold font-mono">{receiptStats.thisWeek.count}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {formatNumber(receiptStats.thisWeek.weight)} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="text-2xl font-bold font-mono">{receiptStats.thisMonth.count}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {formatNumber(receiptStats.thisMonth.weight)} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending in Stock</p>
                  <p className="text-2xl font-bold font-mono">{receiptStats.pendingStock.count}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {formatNumber(receiptStats.pendingStock.weight)} kg
                  </p>
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
                placeholder="Search by receipt no, party, lot no, or count..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available in Stock</SelectItem>
                <SelectItem value="used">Used in Job Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Yarn Receipts ({filteredReceipts.length})</CardTitle>
            <CardDescription>
              Complete list of yarn inward entries with stock status
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
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>PDC No</TableHead>
                  <TableHead>Party / Mill</TableHead>
                  <TableHead>Lot No</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead className="text-right">Bags</TableHead>
                  <TableHead className="text-right">Cones</TableHead>
                  <TableHead className="text-right">Net Weight (kg)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No yarn receipts found
                    </TableCell>
                  </TableRow>
                ) : (
                filteredReceipts.map((receipt) => (
                
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      <Link
                        href={`/sizing/yarn-receipt/${receipt.id}`}
                        className="text-primary hover:underline"
                      >
                        {receipt.receiptNo}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(receipt.receiptDate)}</TableCell>
                    <TableCell className="font-mono text-sm">{receipt.pdcNo || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{receipt.partyName}</p>
                        <p className="text-xs text-gray-500">{receipt.millName || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{receipt.lotNo || '-'}</TableCell>
                    <TableCell>{receipt.yarnCount || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{receipt.totalBags}</TableCell>
                    <TableCell className="text-right font-mono">{receipt.totalCones}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatNumber(receipt.totalNetWeight)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={receipt.isUsedInJobCard ? 'grey' : 'active'}>
                        {receipt.isUsedInJobCard ? 'Used' : 'Available'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                          <DropdownMenuLabel className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="mx-1 my-1 h-px bg-slate-200" />
                          <DropdownMenuItem asChild className="gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                            <Link href={`/sizing/yarn-receipt/${receipt.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {(isAdmin || (!receipt.isUsedInJobCard && receipt.status === 'Draft' && !receipt.isLocked)) && (
                            <DropdownMenuItem asChild className="gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                              <Link href={`/sizing/yarn-receipt/${receipt.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild className="gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                            <Link href={`/sizing/yarn-receipt/${receipt.id}?print=1`} target="_blank" rel="noopener noreferrer">
                              <Printer className="mr-2 h-4 w-4" />
                              Print
                            </Link>
                          </DropdownMenuItem>
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
      </motion.div>
    </div>
  );
}


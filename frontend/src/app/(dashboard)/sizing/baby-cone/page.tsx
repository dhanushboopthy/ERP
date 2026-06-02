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
  CircleDot,
  Package,
  Scale,
  AlertCircle,
  Loader2,
  Calendar,
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
import apiClient, { endpoints } from '@/lib/api-client';
import { BabyConeDto } from '@/types';
import { toast } from 'sonner';

export default function BabyConePage() {
  return (
    <RouteGuard requiredPermission="BABY_CONE.VIEW">
      <BabyConeContent />
    </RouteGuard>
  );
}

function BabyConeContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch baby cones from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['babyCones'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: BabyConeDto[]; summary: { total_baby_cones: number; available_for_warping: number; total_weight: number } }>('/api/babycones', {
        params: { pageNumber: 1, pageSize: 500 },
      });
      // Backend returns: { success: true, data: [...], summary: {...} }
      // apiClient.get already unwraps to this object, so return it as-is
      return res || { data: [], summary: { total_baby_cones: 0, available_for_warping: 0, total_weight: 0 } };
    },
  });

  const babyCones: BabyConeDto[] = (data as any)?.data || [];
  const summary = (data as any)?.summary || { total_baby_cones: 0, available_for_warping: 0, total_weight: 0 };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/babycones/${id}`);
    },
    onSuccess: () => {
      toast.success('Baby cone deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['babyCones'] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete baby cone');
    },
  });

  // Calculate stats (use API summary when available)
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    total: summary?.total_baby_cones || babyCones.length,
    available: summary?.available_for_warping || babyCones.filter(bc => !bc.isUsedInWarping).length,
    usedInWarping: (summary?.total_baby_cones || babyCones.length) - (summary?.available_for_warping || babyCones.filter(bc => !bc.isUsedInWarping).length),
    totalWeight: summary?.total_weight || babyCones.reduce((sum, bc) => sum + bc.netWeight, 0),
    todayCount: babyCones.filter(bc => bc.babyConeDate.split('T')[0] === today).length,
  };

  // Filter baby cones
  const filteredBabyCones = babyCones.filter((bc) => {
    const matchesSearch =
      bc.babyConeNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bc.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bc.countCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bc.lotNo?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'available' && !bc.isUsedInWarping) ||
      (statusFilter === 'used' && bc.isUsedInWarping);

    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load baby cones</h2>
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
          <h1 className="text-2xl font-bold text-gray-900">Baby Cone / Winding</h1>
          <p className="text-gray-500">Manage winding operations and baby cone entries</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/sizing/baby-cone/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Baby Cone
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
                  <CircleDot className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Baby Cones</p>
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
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available for Warping</p>
                  <p className="text-2xl font-bold font-mono">{stats.available}</p>
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
                  <Scale className="h-6 w-6 text-orange-600" />
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Today&apos;s Entries</p>
                  <p className="text-2xl font-bold font-mono">{stats.todayCount}</p>
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
                  placeholder="Search by BC no, party, count, lot..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="used">Used in Warping</SelectItem>
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
                  <TableHead>BC No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Lot No</TableHead>
                  <TableHead className="text-right">Cones</TableHead>
                  <TableHead className="text-right">Net Weight</TableHead>
                  <TableHead className="text-right">Winding Loss</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBabyCones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      No baby cones found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBabyCones.map((bc) => (
                    <TableRow key={bc.id}>
                      <TableCell className="font-medium font-mono">{bc.babyConeNo}</TableCell>
                      <TableCell>{formatDate(bc.babyConeDate)}</TableCell>
                      <TableCell className="font-mono text-sm">{bc.yarnReceiptNo}</TableCell>
                      <TableCell>{bc.partyName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{bc.countCode}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{bc.lotNo || '-'}</TableCell>
                      <TableCell className="text-right font-mono">{bc.totalCones}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(bc.netWeight)} kg</TableCell>
                      <TableCell className="text-right font-mono text-orange-600">
                        {formatNumber(bc.windingLoss)} kg
                      </TableCell>
                      <TableCell>
                        <Badge variant={bc.isUsedInWarping ? 'grey' : 'default'}>
                          {bc.isUsedInWarping ? 'Used' : 'Available'}
                        </Badge>
                      </TableCell>
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
                              <Link href={`/sizing/baby-cone/${bc.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {!bc.isUsedInWarping && (
                              <DropdownMenuItem
                                asChild
                                className="gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                              >
                                <Link href={`/sizing/baby-cone/${bc.id}/edit`}>
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
                                href={`/sizing/baby-cone/${bc.id}?print=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                              </Link>
                            </DropdownMenuItem>
                            {!bc.isUsedInWarping && (
                              <>
                                <DropdownMenuSeparator className="mx-1 my-1 h-px bg-slate-200" />
                                <DropdownMenuItem
                                  className="gap-2 rounded-md px-2.5 py-2 text-sm text-red-600 focus:bg-slate-100 focus:text-red-700"
                                  onClick={() => setDeleteId(bc.id)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Baby Cone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this baby cone entry? This action cannot be undone
              and will reverse the stock entry.
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


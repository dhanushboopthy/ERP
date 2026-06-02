'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  RefreshCw,
  Package,
  CheckCircle2,
  Loader2,
  AlertCircle,
  CircleDot,
  Truck,
  Settings2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatNumber } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Beam {
  id: number;
  beamNo: string;
  beamType: string;
  tareWeight: number;
  widthInches?: number;
  maxEnds?: number;
  status: string;
  currentJobCardId?: number;
  currentJobCardType?: string;
  isActive: boolean;
}

const BEAM_TYPES = ['Sizing Beam', 'Warping Beam', "Weaver's Beam"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  Available:      { label: 'Available',      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  InUse:          { label: 'In Process',     color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: Settings2 },
  'In Use':       { label: 'In Process',     color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: Settings2 },
  SizingComplete: { label: 'Sizing Complete',color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200',   icon: CircleDot },
  Completed:      { label: 'Completed',      color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200',   icon: CircleDot },
  Delivered:      { label: 'Delivered',      color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',     icon: Truck },
  Maintenance:    { label: 'Maintenance',    color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: Settings2 },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: CircleDot };
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.bg, cfg.color)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

function AddBeamDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [beamNo, setBeamNo] = useState('');
  const [beamType, setBeamType] = useState('Sizing Beam');
  const [tareWeight, setTareWeight] = useState('');
  const [widthInches, setWidthInches] = useState('');
  const [maxEnds, setMaxEnds] = useState('');

  const handleClose = () => {
    setBeamNo('');
    setBeamType('Sizing Beam');
    setTareWeight('');
    setWidthInches('');
    setMaxEnds('');
    onClose();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/beams', {
        beamNo: beamNo.trim().toUpperCase(),
        beamType,
        tareWeight: parseFloat(tareWeight) || 0,
        widthInches: widthInches ? parseFloat(widthInches) : undefined,
        maxEnds: maxEnds ? parseInt(maxEnds) : undefined,
      });
      if (!res.success) throw new Error(res.message || 'Failed to create beam');
      return res.data;
    },
    onSuccess: () => {
      toast.success('Beam added successfully');
      onSaved();
      handleClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Beam</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Beam No *</Label>
            <Input
              placeholder="e.g. WB-001"
              value={beamNo}
              onChange={e => setBeamNo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Beam Type *</Label>
            <Select value={beamType} onValueChange={setBeamType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BEAM_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Tare Wt (kg)</Label>
              <Input
                type="number"
                placeholder="85.5"
                value={tareWeight}
                onChange={e => setTareWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Width (in)</Label>
              <Input
                type="number"
                placeholder="63"
                value={widthInches}
                onChange={e => setWidthInches(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Ends</Label>
              <Input
                type="number"
                placeholder="4800"
                value={maxEnds}
                onChange={e => setMaxEnds(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!beamNo.trim() || !beamType || mutation.isPending}
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              'Add Beam'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BeamManagementPage() {
  return (
    <RouteGuard requiredPermission="BEAM_MANAGEMENT.VIEW">
      <BeamManagementContent />
    </RouteGuard>
  );
}

function BeamManagementContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: beams = [], isLoading, error, refetch } = useQuery<Beam[]>({
    queryKey: ['sizing-beams'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/api/beams', { params: { pageNumber: 1, pageSize: 500 } });
      if (!res.success) throw new Error(res.message || 'Failed to load beams');
      const d = res.data;
      return d?.items ?? d?.Items ?? (Array.isArray(d) ? d : []);
    },
    staleTime: 30_000,
  });

  const summary = {
    total: beams.length,
    available: beams.filter(b => b.status === 'Available').length,
    inProcess: beams.filter(b => b.status === 'InUse' || b.status === 'In Use').length,
    completed: beams.filter(b => b.status === 'Completed' || b.status === 'SizingComplete').length,
  };

  const filtered = beams.filter(b => {
    const matchSearch = !search || b.beamNo.toLowerCase().includes(search.toLowerCase()) || (b.beamType || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter || (statusFilter === 'InUse' && b.status === 'In Use');
    const matchType = typeFilter === 'all' || b.beamType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const kpis = [
    { label: 'Total Beams', value: summary.total,    color: 'text-gray-700',   bg: 'bg-gray-50',   icon: Package },
    { label: 'Available',   value: summary.available, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
    { label: 'In Process',  value: summary.inProcess, color: 'text-blue-700',    bg: 'bg-blue-50',    icon: Settings2 },
    { label: 'Completed',   value: summary.completed, color: 'text-purple-700',  bg: 'bg-purple-50',  icon: CircleDot },
  ];

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beam Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track beam status, assignments, and production flow</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Beam
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
              </div>
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', bg)}>
                <Icon className={cn('h-5 w-5', color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by beam no or type..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[175px]">
              <Filter className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="InUse">In Process</SelectItem>
              <SelectItem value="SizingComplete">Sizing Complete</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {BEAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-500">Loading beams...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Failed to load beams. Please refresh.</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">{beams.length === 0 ? 'No beams added yet' : 'No beams match filters'}</p>
            <p className="text-sm mt-1">
              {beams.length === 0 ? (
                <button
                  className="text-blue-600 font-medium hover:underline"
                  onClick={() => setShowAddDialog(true)}
                >
                  + Add your first beam
                </button>
              ) : (
                'Try clearing your filters'
              )}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Beam No</TableHead>
                  <TableHead className="font-semibold text-gray-700">Type</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Width (in)</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Max Ends</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Tare Wt (kg)</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Current Use</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(beam => (
                  <TableRow key={beam.id} className="hover:bg-gray-50/60">
                    <TableCell className="font-semibold text-gray-800">{beam.beamNo}</TableCell>
                    <TableCell className="text-gray-600">{beam.beamType || '—'}</TableCell>
                    <TableCell className="text-right text-gray-700">
                      {beam.widthInches ? formatNumber(beam.widthInches) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-gray-700">{beam.maxEnds ?? '—'}</TableCell>
                    <TableCell className="text-right text-gray-700">{formatNumber(beam.tareWeight)} kg</TableCell>
                    <TableCell><StatusBadge status={beam.status} /></TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {beam.currentJobCardType
                        ? `${beam.currentJobCardType} #${beam.currentJobCardId}`
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-400">
              Showing {filtered.length} of {beams.length} beams
            </div>
          </>
        )}
      </div>

      <AddBeamDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['sizing-beams'] })}
      />
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Boxes,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber, formatDate } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { exportToCSV, exportToPrintable, formatDateForExport, formatNumberForExport } from '@/lib/export-utils';

interface BeamUtilization {
  beamId: number;
  beamNo: string;
  beamType: string;
  tareWeight: number;
  status: string;
  currentLocation?: string;
  totalSizingUsage: number;
  totalWarpingUsage: number;
  lastUsedDate?: string;
  lastUsedInSet?: string;
}

const BEAM_TYPES = ['All', 'Sizing Beam', 'Warp Beam', 'Draw Beam'];
const BEAM_STATUSES = ['All', 'Empty', 'InUse', 'Maintenance', 'Damaged'];

export default function BeamUtilizationReportPage() {
  return (
    <RouteGuard requiredPermission="BEAM_UTILIZATION.VIEW">
      <BeamUtilizationContent />
    </RouteGuard>
  );
}

function BeamUtilizationContent() {
  const [beamType, setBeamType] = useState<string>('All');
  const [status, setStatus] = useState<string>('All');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['beam-utilization', beamType, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (beamType !== 'All') params.append('beamType', beamType);
      if (status !== 'All') params.append('status', status);

      const response = await apiClient.get<BeamUtilization[]>(`/api/reports/beam-utilization?${params}`);
      
      // Handle API error responses
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch beam utilization data');
      }
      
      return response;
    },
  });

  const beams = data?.data || [];

  // Calculate summary stats
  const totalBeams = beams.length;
  const emptyBeams = beams.filter(b => b.status === 'Empty').length;
  const inUseBeams = beams.filter(b => b.status === 'InUse').length;
  const avgUsage = totalBeams > 0
    ? beams.reduce((sum, b) => sum + b.totalSizingUsage + b.totalWarpingUsage, 0) / totalBeams
    : 0;

  const getStatusBadge = (beamStatus: string) => {
    switch (beamStatus) {
      case 'Empty':
        return <Badge variant="active" className="gap-1"><CheckCircle className="h-3 w-3" />Empty</Badge>;
      case 'InUse':
        return <Badge variant="default" className="gap-1"><Clock className="h-3 w-3" />In Use</Badge>;
      case 'Maintenance':
        return <Badge variant="grey" className="gap-1"><RefreshCw className="h-3 w-3" />Maintenance</Badge>;
      case 'Damaged':
        return <Badge variant="cancelled" className="gap-1"><XCircle className="h-3 w-3" />Damaged</Badge>;
      default:
        return <Badge variant="grey">{beamStatus}</Badge>;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      beams,
      [
        { key: 'beamNo', label: 'Beam No' },
        { key: 'beamType', label: 'Type' },
        { key: 'tareWeight', label: 'Tare Weight (kg)', format: (v) => formatNumberForExport(v, 2) },
        { key: 'status', label: 'Status' },
        { key: 'totalWarpingUsage', label: 'Warping Usage' },
        { key: 'totalSizingUsage', label: 'Sizing Usage' },
        { key: 'lastUsedDate', label: 'Last Used Date', format: (v) => v ? formatDateForExport(v) : '-' },
        { key: 'lastUsedInSet', label: 'Last Set', format: (v) => v || '-' },
      ],
      'beam-utilization'
    );
  };

  const handleExportPDF = () => {
    exportToPrintable(
      beams,
      [
        { key: 'beamNo', label: 'Beam No' },
        { key: 'beamType', label: 'Type' },
        { key: 'tareWeight', label: 'Weight (kg)', format: (v) => formatNumberForExport(v, 2) },
        { key: 'status', label: 'Status' },
        { key: 'totalWarpingUsage', label: 'Warp' },
        { key: 'totalSizingUsage', label: 'Size' },
        { key: 'lastUsedDate', label: 'Last Used', format: (v) => v ? formatDateForExport(v) : '-' },
        { key: 'lastUsedInSet', label: 'Set', format: (v) => v || '-' },
      ],
      'Beam Utilization Report',
      {
        subtitle: `${beamType !== 'All' ? `Type: ${beamType} | ` : ''}${status !== 'All' ? `Status: ${status}` : ''}`,
        summaryRows: [
          { label: 'Total Beams', value: totalBeams },
          { label: 'Empty Beams', value: emptyBeams },
          { label: 'In Use', value: inUseBeams },
          { label: 'Avg Usage', value: formatNumberForExport(avgUsage, 0) },
        ],
        orientation: 'landscape',
      }
    );
  };

  const handleExportLegacy = () => {
    const headers = ['Beam No', 'Type', 'Tare Weight (kg)', 'Status', 'Warping Usage', 'Sizing Usage', 'Last Used Date', 'Last Set'];
    const rows = beams.map(b => [
      b.beamNo,
      b.beamType,
      b.tareWeight.toFixed(2),
      b.status,
      b.totalWarpingUsage,
      b.totalSizingUsage,
      b.lastUsedDate ? new Date(b.lastUsedDate).toLocaleDateString() : '-',
      b.lastUsedInSet || '-',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beam-utilization-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load report</h2>
        <p className="text-gray-500">Please check your connection and try again</p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beam Utilization Report</h1>
          <p className="text-sm text-gray-500">Track beam usage across warping and sizing operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} disabled={beams.length === 0} variant="outline">
            <Download className="mr-2 h-4 w-4" />CSV
          </Button>
          <Button onClick={handleExportPDF} disabled={beams.length === 0}>
            <FileText className="mr-2 h-4 w-4" />PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Boxes className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Beams</p>
                <p className="text-xl font-bold">{totalBeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Available (Empty)</p>
                <p className="text-xl font-bold">{emptyBeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Use</p>
                <p className="text-xl font-bold">{inUseBeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Usage</p>
                <p className="text-xl font-bold">{avgUsage.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Beam Type</label>
              <Select value={beamType} onValueChange={setBeamType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BEAM_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BEAM_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Beam Details</CardTitle>
          <CardDescription>Usage statistics for each beam</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : beams.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No beams found matching the selected criteria.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beam No</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Tare Wt (kg)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Warping Usage</TableHead>
                      <TableHead className="text-center">Sizing Usage</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Last Set</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beams.map((beam) => (
                      <TableRow key={beam.beamId}>
                        <TableCell className="font-medium">{beam.beamNo}</TableCell>
                        <TableCell>{beam.beamType}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(beam.tareWeight)}
                        </TableCell>
                        <TableCell>{getStatusBadge(beam.status)}</TableCell>
                        <TableCell className="text-center font-mono">
                          {beam.totalWarpingUsage}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {beam.totalSizingUsage}
                        </TableCell>
                        <TableCell>
                          {beam.lastUsedDate ? formatDate(beam.lastUsedDate) : '-'}
                        </TableCell>
                        <TableCell>{beam.lastUsedInSet || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {beams.map((beam) => (
                  <Card key={beam.beamId}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold">{beam.beamNo}</p>
                          <p className="text-sm text-gray-500">{beam.beamType}</p>
                        </div>
                        {getStatusBadge(beam.status)}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Tare:</span>{' '}
                          <span className="font-mono">{formatNumber(beam.tareWeight)} kg</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Warping:</span>{' '}
                          <span className="font-mono">{beam.totalWarpingUsage}×</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Sizing:</span>{' '}
                          <span className="font-mono">{beam.totalSizingUsage}×</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Last:</span>{' '}
                          {beam.lastUsedDate ? formatDate(beam.lastUsedDate) : '-'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Download,
  Loader2,
  RefreshCw,
  Factory,
  Ruler,
  Percent,
  Boxes,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

interface SizingJobCard {
  id: number;
  setNo: string;
  setDate: string;
  partyName: string;
  yarnCount: string;
  loomType: string;
  totalEnds: number;
  warpingMeters: number;
  sizingMeters: number;
  pickupPercent: number;
  elongationPercent: number;
  beamCount: number;
  approvalStatus: string;
}

const STATUS_OPTIONS = ['All', 'Draft', 'Prepared', 'Checked', 'GMApproved', 'Authorized'];

export default function SetProductionReportPage() {
  return (
    <RouteGuard requiredPermission="SET_PRODUCTION.VIEW">
      <SetProductionContent />
    </RouteGuard>
  );
}

function SetProductionContent() {
  const [status, setStatus] = useState<string>('All');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sizing-job-cards-report', status, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== 'All') params.append('status', status);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await apiClient.get(`/api/reports/sizing-job-cards?${params}`);
      return response.data as { data?: SizingJobCard[] };
    },
  });

  const cards = data?.data || [];
  const totalSets = cards.length;
  const totalMeters = cards.reduce((sum, c) => sum + (c.sizingMeters || 0), 0);
  const avgPickup = totalSets > 0 ? cards.reduce((sum, c) => sum + (c.pickupPercent || 0), 0) / totalSets : 0;
  const totalBeams = cards.reduce((sum, c) => sum + c.beamCount, 0);

  const getStatusBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'Authorized': return <Badge variant="active">Authorized</Badge>;
      case 'GMApproved': return <Badge variant="default">GM Approved</Badge>;
      case 'Checked': return <Badge variant="grey">Checked</Badge>;
      case 'Prepared': return <Badge variant="grey">Prepared</Badge>;
      default: return <Badge variant="outline">{approvalStatus}</Badge>;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      cards,
      [
        { key: 'setNo', label: 'Set No' },
        { key: 'setDate', label: 'Date', format: formatDateForExport },
        { key: 'partyName', label: 'Party' },
        { key: 'yarnCount', label: 'Yarn Count' },
        { key: 'loomType', label: 'Loom Type' },
        { key: 'totalEnds', label: 'Ends' },
        { key: 'warpingMeters', label: 'Warping (m)', format: (v) => formatNumberForExport(v || 0, 2) },
        { key: 'sizingMeters', label: 'Sizing (m)', format: (v) => formatNumberForExport(v || 0, 2) },
        { key: 'pickupPercent', label: 'Pickup %', format: (v) => formatNumberForExport(v || 0, 2) },
        { key: 'elongationPercent', label: 'Elongation %', format: (v) => formatNumberForExport(v || 0, 2) },
        { key: 'beamCount', label: 'Beams' },
        { key: 'approvalStatus', label: 'Status' },
      ],
      'set-production'
    );
  };

  const handleExportPDF = () => {
    exportToPrintable(
      cards,
      [
        { key: 'setNo', label: 'Set No' },
        { key: 'setDate', label: 'Date', format: formatDateForExport },
        { key: 'partyName', label: 'Party' },
        { key: 'yarnCount', label: 'Count' },
        { key: 'loomType', label: 'Loom' },
        { key: 'totalEnds', label: 'Ends' },
        { key: 'warpingMeters', label: 'Warp (m)', format: (v) => formatNumberForExport(v || 0, 2) },
        { key: 'sizingMeters', label: 'Size (m)', format: (v) => formatNumberForExport(v || 0, 2) },
        { key: 'pickupPercent', label: 'P%', format: (v) => formatNumberForExport(v || 0, 2) },
        { key: 'beamCount', label: 'Beams' },
        { key: 'approvalStatus', label: 'Status' },
      ],
      'Set-wise Production Report',
      {
        subtitle: `${status !== 'All' ? `Status: ${status} | ` : ''}Period: ${fromDate || 'Start'} to ${toDate || 'End'}`,
        summaryRows: [
          { label: 'Total Sets', value: totalSets },
          { label: 'Total Meters', value: `${formatNumberForExport(totalMeters, 2)} m` },
          { label: 'Avg Pickup %', value: formatNumberForExport(avgPickup, 2) },
          { label: 'Total Beams', value: totalBeams },
        ],
        orientation: 'landscape',
      }
    );
  };

  const handleExportLegacy = () => {
    const headers = ['Set No', 'Date', 'Party', 'Yarn Count', 'Loom Type', 'Ends', 'Warping (m)', 'Sizing (m)', 'Pickup %', 'Elongation %', 'Beams', 'Status'];
    const rows = cards.map(c => [
      c.setNo,
      new Date(c.setDate).toLocaleDateString(),
      c.partyName,
      c.yarnCount,
      c.loomType,
      c.totalEnds,
      c.warpingMeters?.toFixed(2) || '0',
      c.sizingMeters?.toFixed(2) || '0',
      c.pickupPercent?.toFixed(2) || '0',
      c.elongationPercent?.toFixed(2) || '0',
      c.beamCount,
      c.approvalStatus,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `set-production-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Set-wise Production Report</h1>
          <p className="text-sm text-gray-500">Sizing job card production summary</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} disabled={cards.length === 0} variant="outline">
            <Download className="mr-2 h-4 w-4" />CSV
          </Button>
          <Button onClick={handleExportPDF} disabled={cards.length === 0}>
            <FileText className="mr-2 h-4 w-4" />PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"><Factory className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-gray-500">Total Sets</p><p className="text-xl font-bold">{totalSets}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100"><Ruler className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-gray-500">Total Meters</p><p className="text-xl font-bold">{formatNumber(totalMeters)} m</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100"><Percent className="h-5 w-5 text-purple-600" /></div><div><p className="text-sm text-gray-500">Avg Pickup</p><p className="text-xl font-bold">{avgPickup.toFixed(2)}%</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100"><Boxes className="h-5 w-5 text-amber-600" /></div><div><p className="text-sm text-gray-500">Total Beams</p><p className="text-xl font-bold">{totalBeams}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1"><label className="mb-1 block text-sm font-medium text-gray-700">Status</label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex-1"><label className="mb-1 block text-sm font-medium text-gray-700">From Date</label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
            <div className="flex-1"><label className="mb-1 block text-sm font-medium text-gray-700">To Date</label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
            <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Production Details</CardTitle><CardDescription>Sizing job cards with production metrics</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : cards.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No records found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Set No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Yarn</TableHead>
                  <TableHead>Loom</TableHead>
                  <TableHead className="text-right">Ends</TableHead>
                  <TableHead className="text-right">Sizing (m)</TableHead>
                  <TableHead className="text-right">Pickup %</TableHead>
                  <TableHead className="text-center">Beams</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.setNo}</TableCell>
                    <TableCell>{formatDate(card.setDate)}</TableCell>
                    <TableCell>{card.partyName}</TableCell>
                    <TableCell>{card.yarnCount}</TableCell>
                    <TableCell>{card.loomType}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(card.totalEnds)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(card.sizingMeters || 0)}</TableCell>
                    <TableCell className="text-right font-mono">{(card.pickupPercent || 0).toFixed(2)}%</TableCell>
                    <TableCell className="text-center">{card.beamCount}</TableCell>
                    <TableCell>{getStatusBadge(card.approvalStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


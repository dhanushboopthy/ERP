'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  IndianRupee,
  Calendar,
  AlertTriangle,
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
import { exportToCSV, exportToPrintable, formatCurrency, formatDateForExport } from '@/lib/export-utils';

interface Invoice {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  partyName: string;
  partyGSTIN?: string;
  placeOfSupply: string;
  isInterState: boolean;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  dueDate?: string;
  status: string;
  isLocked: boolean;
  isPrinted: boolean;
  daysOverdue: number;
}

const STATUS_OPTIONS = ['All', 'Draft', 'draft', 'Paid', 'Cancelled'];

export default function InvoiceRegisterReportPage() {
  return (
    <RouteGuard requiredPermission="INVOICE_REGISTER.VIEW">
      <InvoiceRegisterContent />
    </RouteGuard>
  );
}

function InvoiceRegisterContent() {
  const [status, setStatus] = useState<string>('All');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoice-register', status, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== 'All') params.append('status', status);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await apiClient.get(`/api/reports/invoice-register?${params}`);
      return response.data as { data?: Invoice[] };
    },
  });

  const invoices = data?.data || [];

  // Summary stats
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalTax = invoices.reduce((sum, inv) => sum + inv.totalTaxAmount, 0);
  const overdueCount = invoices.filter(inv => inv.daysOverdue > 0).length;

  const getStatusBadge = (invoiceStatus: string, daysOverdue: number) => {
    if (daysOverdue > 0 && invoiceStatus !== 'Paid') {
      return <Badge variant="cancelled" className="gap-1"><AlertTriangle className="h-3 w-3" />Overdue ({daysOverdue}d)</Badge>;
    }
    switch (invoiceStatus) {
      case 'Paid':
        return <Badge variant="active">Paid</Badge>;
      case 'draft':
        return <Badge variant="grey">Pending</Badge>;
      case 'Draft':
        return <Badge variant="grey">Draft</Badge>;
      case 'Cancelled':
        return <Badge variant="cancelled">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{invoiceStatus}</Badge>;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      invoices,
      [
        { key: 'invoiceNo', label: 'Invoice No' },
        { key: 'invoiceDate', label: 'Date', format: formatDateForExport },
        { key: 'partyName', label: 'Party' },
        { key: 'partyGSTIN', label: 'GSTIN', format: (v) => v || '-' },
        { key: 'taxableAmount', label: 'Taxable (₹)', format: formatCurrency },
        { key: 'cgstAmount', label: 'CGST (₹)', format: formatCurrency },
        { key: 'sgstAmount', label: 'SGST (₹)', format: formatCurrency },
        { key: 'igstAmount', label: 'IGST (₹)', format: formatCurrency },
        { key: 'totalTaxAmount', label: 'Total Tax (₹)', format: formatCurrency },
        { key: 'totalAmount', label: 'Grand Total (₹)', format: formatCurrency },
        { key: 'status', label: 'Status' },
      ],
      'invoice-register'
    );
  };

  const handleExportPDF = () => {
    exportToPrintable(
      invoices,
      [
        { key: 'invoiceNo', label: 'Invoice No' },
        { key: 'invoiceDate', label: 'Date', format: formatDateForExport },
        { key: 'partyName', label: 'Party' },
        { key: 'partyGSTIN', label: 'GSTIN', format: (v) => v || '-' },
        { key: 'taxableAmount', label: 'Taxable', format: formatCurrency },
        { key: 'cgstAmount', label: 'CGST', format: formatCurrency },
        { key: 'sgstAmount', label: 'SGST', format: formatCurrency },
        { key: 'igstAmount', label: 'IGST', format: formatCurrency },
        { key: 'totalTaxAmount', label: 'Tax', format: formatCurrency },
        { key: 'totalAmount', label: 'Total', format: formatCurrency },
        { key: 'status', label: 'Status' },
      ],
      'Invoice Register',
      {
        subtitle: `${status !== 'All' ? `Status: ${status} | ` : ''}Period: ${fromDate || 'Start'} to ${toDate || 'End'}`,
        summaryRows: [
          { label: 'Total Invoices', value: totalInvoices },
          { label: 'Total Tax', value: `₹${formatCurrency(totalTax)}` },
          { label: 'Grand Total', value: `₹${formatCurrency(totalAmount)}` },
        ],
        orientation: 'landscape',
      }
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load report</h2>
        <Button onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Register</h1>
          <p className="text-sm text-gray-500">GST-compliant invoice summary with tax breakdown</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} disabled={invoices.length === 0} variant="outline">
            <Download className="mr-2 h-4 w-4" />CSV
          </Button>
          <Button onClick={handleExportPDF} disabled={invoices.length === 0}>
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
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Invoices</p>
                <p className="text-xl font-bold">{totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold">₹{formatNumber(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tax</p>
                <p className="text-xl font-bold">₹{formatNumber(totalTax)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-xl font-bold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">From Date</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">To Date</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>GST breakdown for all invoices</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No invoices found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="text-right">Taxable</TableHead>
                  <TableHead className="text-right">CGST</TableHead>
                  <TableHead className="text-right">SGST</TableHead>
                  <TableHead className="text-right">IGST</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                    <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell>{inv.partyName}</TableCell>
                    <TableCell className="text-right font-mono">₹{formatNumber(inv.taxableAmount)}</TableCell>
                    <TableCell className="text-right font-mono">₹{formatNumber(inv.cgstAmount)}</TableCell>
                    <TableCell className="text-right font-mono">₹{formatNumber(inv.sgstAmount)}</TableCell>
                    <TableCell className="text-right font-mono">₹{formatNumber(inv.igstAmount)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">₹{formatNumber(inv.totalAmount)}</TableCell>
                    <TableCell>{getStatusBadge(inv.status, inv.daysOverdue)}</TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell colSpan={3}>TOTAL</TableCell>
                  <TableCell className="text-right font-mono">₹{formatNumber(invoices.reduce((s, i) => s + i.taxableAmount, 0))}</TableCell>
                  <TableCell className="text-right font-mono">₹{formatNumber(invoices.reduce((s, i) => s + i.cgstAmount, 0))}</TableCell>
                  <TableCell className="text-right font-mono">₹{formatNumber(invoices.reduce((s, i) => s + i.sgstAmount, 0))}</TableCell>
                  <TableCell className="text-right font-mono">₹{formatNumber(invoices.reduce((s, i) => s + i.igstAmount, 0))}</TableCell>
                  <TableCell className="text-right font-mono">₹{formatNumber(totalAmount)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


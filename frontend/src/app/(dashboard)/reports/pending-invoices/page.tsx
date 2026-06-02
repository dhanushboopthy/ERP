'use client';

import { useQuery } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Download,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Clock,
  IndianRupee,
  FileWarning,
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
import { formatNumber, formatDate } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { exportToCSV, exportToPrintable, formatCurrency, formatDateForExport } from '@/lib/export-utils';

interface PendingInvoice {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  partyName: string;
  totalAmount: number;
  dueDate: string;
  daysOverdue: number;
  status: string;
}

export default function PendingInvoicesReportPage() {
  return (
    <RouteGuard requiredPermission="PENDING_INVOICES.VIEW">
      <PendingInvoicesContent />
    </RouteGuard>
  );
}

function PendingInvoicesContent() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pending-invoices'],
    queryFn: async () => {
      const response = await apiClient.get('/api/reports/invoice-register?status=Pending');
      return response.data as { data?: PendingInvoice[] };
    },
  });

  const invoices = data?.data || [];
  const overdueInvoices = invoices.filter(inv => inv.daysOverdue > 0);
  const totalPending = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const handleExportCSV = () => {
    exportToCSV(
      invoices,
      [
        { key: 'invoiceNo', label: 'Invoice No' },
        { key: 'invoiceDate', label: 'Date', format: formatDateForExport },
        { key: 'partyName', label: 'Party' },
        { key: 'totalAmount', label: 'Amount (₹)', format: formatCurrency },
        { key: 'dueDate', label: 'Due Date', format: (v) => v ? formatDateForExport(v) : '-' },
        { key: 'daysOverdue', label: 'Days Overdue', format: (v) => v > 0 ? v.toString() : '0' },
      ],
      'pending-invoices'
    );
  };

  const handleExportPDF = () => {
    exportToPrintable(
      invoices,
      [
        { key: 'invoiceNo', label: 'Invoice No' },
        { key: 'invoiceDate', label: 'Date', format: formatDateForExport },
        { key: 'partyName', label: 'Party' },
        { key: 'totalAmount', label: 'Amount', format: formatCurrency },
        { key: 'dueDate', label: 'Due Date', format: (v) => v ? formatDateForExport(v) : '-' },
        { key: 'daysOverdue', label: 'Days Overdue', format: (v) => v > 0 ? v.toString() : '0' },
      ],
      'Pending & Overdue Invoices',
      {
        subtitle: `As of ${new Date().toLocaleDateString()}`,
        summaryRows: [
          { label: 'Total Pending', value: invoices.length },
          { label: 'Pending Amount', value: `₹${formatCurrency(totalPending)}` },
          { label: 'Overdue Count', value: overdueInvoices.length },
          { label: 'Overdue Amount', value: `₹${formatCurrency(totalOverdue)}` },
        ],
        orientation: 'portrait',
      }
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending & Overdue Invoices</h1>
          <p className="text-sm text-gray-500">Track outstanding payments and overdue amounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={invoices.length === 0}><Download className="mr-2 h-4 w-4" />CSV</Button>
          <Button onClick={handleExportPDF} disabled={invoices.length === 0}><FileText className="mr-2 h-4 w-4" />PDF</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"><Clock className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-gray-500">Total Pending</p><p className="text-xl font-bold">{invoices.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100"><IndianRupee className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-gray-500">Pending Amount</p><p className="text-xl font-bold">₹{formatNumber(totalPending)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div><div><p className="text-sm text-gray-500">Overdue Count</p><p className="text-xl font-bold text-red-600">{overdueInvoices.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100"><FileWarning className="h-5 w-5 text-amber-600" /></div><div><p className="text-sm text-gray-500">Overdue Amount</p><p className="text-xl font-bold text-red-600">₹{formatNumber(totalOverdue)}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Invoice Details</CardTitle><CardDescription>All pending and overdue invoices</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No pending invoices found. Great job!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Days Overdue</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.sort((a, b) => b.daysOverdue - a.daysOverdue).map((inv) => (
                  <TableRow key={inv.id} className={inv.daysOverdue > 30 ? 'bg-red-50' : inv.daysOverdue > 0 ? 'bg-amber-50' : ''}>
                    <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                    <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell>{inv.partyName}</TableCell>
                    <TableCell className="text-right font-mono font-bold">₹{formatNumber(inv.totalAmount)}</TableCell>
                    <TableCell>{inv.dueDate ? formatDate(inv.dueDate) : '-'}</TableCell>
                    <TableCell className="text-center">
                      {inv.daysOverdue > 0 ? (
                        <span className="font-bold text-red-600">{inv.daysOverdue}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inv.daysOverdue > 30 ? (
                        <Badge variant="cancelled">Critical</Badge>
                      ) : inv.daysOverdue > 7 ? (
                        <Badge variant="grey">High</Badge>
                      ) : inv.daysOverdue > 0 ? (
                        <Badge variant="grey">Medium</Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </TableCell>
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


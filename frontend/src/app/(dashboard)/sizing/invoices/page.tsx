'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  Printer,
  FileCheck,
  IndianRupee,
  Calendar,
  AlertCircle,
  CheckCircle,
  Lock,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
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
import { formatNumber, formatCurrency, formatDate } from '@/lib/utils';
import apiClient from '@/lib/api-client';

interface TaxInvoiceListItem {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  partyName: string;
  partyGSTIN: string;
  placeOfSupply: string;
  isInterState: boolean;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  dueDate?: string;
  isPaid: boolean;
  daysOverdue: number;
}

export default function GstInvoicePage() {
  return (
    <RouteGuard requiredPermission="GST_INVOICE.VIEW">
      <GstInvoiceContent />
    </RouteGuard>
  );
}

function GstInvoiceContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['taxInvoices'],
    queryFn: async () => {
      const res: any = await apiClient.get('/api/TaxInvoices?pageSize=500');
      return (res.data?.items ?? []) as TaxInvoiceListItem[];
    },
  });

  const allInvoices = apiData ?? [];

  const invoiceStats = useMemo(() => ({
    totalInvoices: allInvoices.length,
    totalAmount: allInvoices.reduce((s, i) => s + i.totalAmount, 0),
    paidAmount: allInvoices.filter(i => i.isPaid).reduce((s, i) => s + i.totalAmount, 0),
    pendingAmount: allInvoices.filter(i => !i.isPaid).reduce((s, i) => s + i.totalAmount, 0),
    overdueCount: allInvoices.filter(i => i.daysOverdue > 0 && !i.isPaid).length,
  }), [allInvoices]);

  const filteredInvoices = useMemo(() => allInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.partyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && invoice.isPaid) ||
      (statusFilter === 'pending' && !invoice.isPaid);
    return matchesSearch && matchesStatus;
  }), [allInvoices, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GST Tax Invoice</h1>
          <p className="text-gray-500">Manage sizing service invoices with GST compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/sizing/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Invoices</p>
                  <p className="text-xl font-bold font-mono">{isLoading ? 'â€”' : invoiceStats.totalInvoices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-lg font-bold font-mono text-gray-900">
                  {isLoading ? 'â€”' : formatCurrency(invoiceStats.totalAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Paid</p>
                  <p className="text-lg font-bold font-mono text-green-600">
                    {isLoading ? 'â€”' : formatCurrency(invoiceStats.paidAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <IndianRupee className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-lg font-bold font-mono text-orange-600">
                    {isLoading ? 'â€”' : formatCurrency(invoiceStats.pendingAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Overdue</p>
                  <p className="text-xl font-bold font-mono text-red-600">
                    {isLoading ? 'â€”' : invoiceStats.overdueCount}
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
                placeholder="Search by invoice no or party..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle>Invoices ({isLoading ? 'â€¦' : filteredInvoices.length})</CardTitle>
            <CardDescription>
              GST compliant tax invoices for sizing services (HSN/SAC: 998821)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <FileCheck className="h-12 w-12 text-gray-300" />
                <p className="text-gray-500">No invoices found</p>
                <Link href="/sizing/invoices/new">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Place of Supply</TableHead>
                    <TableHead className="text-right">Taxable Amt</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">IGST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        <Link
                          href={`/sizing/invoices/${invoice.id}`}
                          className="text-primary hover:underline"
                        >
                          {invoice.invoiceNo}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.partyName}</p>
                          <p className="text-xs text-gray-500 font-mono">{invoice.partyGSTIN}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {invoice.placeOfSupply}
                          {invoice.isInterState && (
                            <Badge variant="default" className="text-xs">IGST</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(invoice.taxableAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-600">
                        {invoice.cgstAmount > 0 ? formatCurrency(invoice.cgstAmount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-600">
                        {invoice.sgstAmount > 0 ? formatCurrency(invoice.sgstAmount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-600">
                        {invoice.igstAmount > 0 ? formatCurrency(invoice.igstAmount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.isPaid ? 'completed' : 'draft'}>
                          {invoice.isPaid ? 'Paid' : 'Draft'}
                        </Badge>
                        {invoice.daysOverdue > 0 && !invoice.isPaid && (
                          <p className="text-xs text-red-500 mt-1">{invoice.daysOverdue}d overdue</p>
                        )}
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
                              <Link href={`/sizing/invoices/${invoice.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              asChild
                              className="gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                            >
                              <Link
                                href={`/sizing/invoices/${invoice.id}?print=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                              </Link>
                            </DropdownMenuItem>
                            {!invoice.isPaid && (
                              <>
                                <DropdownMenuSeparator className="mx-1 my-1 h-px bg-slate-200" />
                                <DropdownMenuItem className="gap-2 rounded-md px-2.5 py-2 text-sm text-green-600 focus:bg-slate-100 focus:text-green-700">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

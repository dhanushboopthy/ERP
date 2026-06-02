'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Package,
  IndianRupee,
  Loader2,
  AlertCircle,
  BarChart3,
  PieChart,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatNumber, formatDate, formatCurrency } from '@/lib/utils';

// Report types
type ReportType = 'yarn-stock' | 'production' | 'party-ledger' | 'beam-utilization' | 'invoice-register';

interface ReportCard {
  id: ReportType;
  title: string;
  description: string;
  icon: typeof FileSpreadsheet;
  color: string;
}

const reportCards: ReportCard[] = [
  {
    id: 'yarn-stock',
    title: 'Yarn Stock Report',
    description: 'Current stock position by yarn count and lot',
    icon: Package,
    color: 'bg-blue-500',
  },
  {
    id: 'production',
    title: 'Set-wise Production Report',
    description: 'Production summary by sizing set with pickup & elongation',
    icon: BarChart3,
    color: 'bg-green-500',
  },
  {
    id: 'party-ledger',
    title: 'Party Ledger Report',
    description: 'Transaction history and balance by party',
    icon: IndianRupee,
    color: 'bg-purple-500',
  },
  {
    id: 'beam-utilization',
    title: 'Beam Utilization Report',
    description: 'Beam usage and efficiency analysis',
    icon: PieChart,
    color: 'bg-orange-500',
  },
  {
    id: 'invoice-register',
    title: 'Invoice Register',
    description: 'GST invoice summary with tax details',
    icon: FileSpreadsheet,
    color: 'bg-teal-500',
  },
];

// Mock data for demo
const mockYarnStockReport = [
  { yarnCount: '40s 2/100', party: 'Krishna Mills', lotNo: 'LOT-A123', bags: 50, cones: 2500, weight: 1250.5 },
  { yarnCount: '60s 2/80', party: 'Rajesh Textiles', lotNo: 'LOT-B456', bags: 30, cones: 1500, weight: 750.25 },
  { yarnCount: '40s 2/100', party: 'Lakshmi Weaving', lotNo: 'LOT-C789', bags: 45, cones: 2250, weight: 1125.75 },
  { yarnCount: '30s 2/120', party: 'Sakthi Looms', lotNo: 'LOT-D012', bags: 25, cones: 1250, weight: 625.0 },
];

const mockProductionReport = [
  { setNo: 'SET/24-25/000145', date: '2024-12-17', party: 'Rajesh Textiles', yarnCount: '40s 2/100', warpMeters: 15000, sizeMeters: 14850, pickup: 12.5, elongation: 1.2 },
  { setNo: 'SET/24-25/000144', date: '2024-12-16', party: 'Krishna Mills', yarnCount: '60s 2/80', warpMeters: 12000, sizeMeters: 11880, pickup: 11.8, elongation: 1.1 },
  { setNo: 'SET/24-25/000143', date: '2024-12-16', party: 'Lakshmi Weaving', yarnCount: '40s 2/120', warpMeters: 18000, sizeMeters: 17820, pickup: 13.2, elongation: 1.3 },
];

const mockInvoiceReport = [
  { invoiceNo: 'INV/24-25/000089', date: '2024-12-17', party: 'Rajesh Textiles', taxable: 125000, cgst: 11250, sgst: 11250, igst: 0, total: 147500 },
  { invoiceNo: 'INV/24-25/000088', date: '2024-12-15', party: 'Krishna Mills', taxable: 89500, cgst: 8055, sgst: 8055, igst: 0, total: 105610 },
  { invoiceNo: 'INV/24-25/000087', date: '2024-12-14', party: 'Gujarat Textiles', taxable: 156000, cgst: 0, sgst: 0, igst: 28080, total: 184080 },
];

export default function ReportsPage() {
  return (
    <RouteGuard requiredPermission="REPORTS.VIEW">
      <ReportsContent />
    </RouteGuard>
  );
}

function ReportsContent() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('yarn-stock');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [partyFilter, setPartyFilter] = useState('all');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Generate and export business reports</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

      {/* Report Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {reportCards.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedReport === report.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${report.color} text-white mb-4`}>
                  <report.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Party</Label>
              <Select value={partyFilter} onValueChange={setPartyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Parties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  <SelectItem value="krishna">Krishna Mills</SelectItem>
                  <SelectItem value="rajesh">Rajesh Textiles</SelectItem>
                  <SelectItem value="lakshmi">Lakshmi Weaving</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button>
                <Filter className="mr-2 h-4 w-4" />
                Apply
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <motion.div
        key={selectedReport}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {selectedReport === 'yarn-stock' && (
          <Card>
            <CardHeader>
              <CardTitle>Yarn Stock Report</CardTitle>
              <CardDescription>Current stock position as of {formatDate(new Date().toISOString())}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Yarn Count</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Lot No</TableHead>
                    <TableHead className="text-right">Bags</TableHead>
                    <TableHead className="text-right">Cones</TableHead>
                    <TableHead className="text-right">Net Weight (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockYarnStockReport.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{row.yarnCount}</TableCell>
                      <TableCell>{row.party}</TableCell>
                      <TableCell className="font-mono">{row.lotNo}</TableCell>
                      <TableCell className="text-right font-mono">{row.bags}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(row.cones)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatNumber(row.weight)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right font-mono">
                      {mockYarnStockReport.reduce((sum, r) => sum + r.bags, 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(mockYarnStockReport.reduce((sum, r) => sum + r.cones, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(mockYarnStockReport.reduce((sum, r) => sum + r.weight, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {selectedReport === 'production' && (
          <Card>
            <CardHeader>
              <CardTitle>Set-wise Production Report</CardTitle>
              <CardDescription>Production summary with pickup and elongation analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Set No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Yarn Count</TableHead>
                    <TableHead className="text-right">Warp Mtrs</TableHead>
                    <TableHead className="text-right">Size Mtrs</TableHead>
                    <TableHead className="text-right">Pickup %</TableHead>
                    <TableHead className="text-right">Elongation %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProductionReport.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{row.setNo}</TableCell>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell>{row.party}</TableCell>
                      <TableCell>{row.yarnCount}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(row.warpMeters)}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(row.sizeMeters)}</TableCell>
                      <TableCell className="text-right font-mono">{row.pickup}%</TableCell>
                      <TableCell className="text-right font-mono">{row.elongation}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell colSpan={4}>Total / Average</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(mockProductionReport.reduce((sum, r) => sum + r.warpMeters, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(mockProductionReport.reduce((sum, r) => sum + r.sizeMeters, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(mockProductionReport.reduce((sum, r) => sum + r.pickup, 0) / mockProductionReport.length).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(mockProductionReport.reduce((sum, r) => sum + r.elongation, 0) / mockProductionReport.length).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {selectedReport === 'invoice-register' && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice Register</CardTitle>
              <CardDescription>GST invoice summary with tax breakup</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead className="text-right">Taxable Amt</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">IGST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoiceReport.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{row.invoiceNo}</TableCell>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell>{row.party}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(row.taxable)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(row.cgst)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(row.sgst)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(row.igst)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatCurrency(row.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(mockInvoiceReport.reduce((sum, r) => sum + r.taxable, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(mockInvoiceReport.reduce((sum, r) => sum + r.cgst, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(mockInvoiceReport.reduce((sum, r) => sum + r.sgst, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(mockInvoiceReport.reduce((sum, r) => sum + r.igst, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(mockInvoiceReport.reduce((sum, r) => sum + r.total, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {selectedReport === 'party-ledger' && (
          <Card>
            <CardHeader>
              <CardTitle>Party Ledger Report</CardTitle>
              <CardDescription>Transaction summary and outstanding balances</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a party to view ledger details</p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedReport === 'beam-utilization' && (
          <Card>
            <CardHeader>
              <CardTitle>Beam Utilization Report</CardTitle>
              <CardDescription>Beam usage efficiency and turnaround time</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Beam utilization analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Package,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  BarChart3,
  FileText,
} from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { YarnStockDto } from '@/types';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { exportToCSV, exportToPrintable, formatNumberForExport } from '@/lib/export-utils';

export default function YarnStockLedgerPage() {
  return (
    <RouteGuard requiredPermission="YARN_STOCK.VIEW">
      <YarnStockLedgerContent />
    </RouteGuard>
  );
}

function YarnStockLedgerContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [yarnCountFilter, setYarnCountFilter] = useState<string>('all');
  const [partyFilter, setPartyFilter] = useState<string>('all');

  // Fetch yarn stock from API
  const { data: stockData = [], isLoading, error, refetch } = useQuery<YarnStockDto[]>({
    queryKey: ['yarnStock'],
    queryFn: async () => {
      const res = await apiClient.get<YarnStockDto[]>('/api/dashboard/yarn-stock');
      if (!res.success) throw new Error(res.message || 'Failed to load yarn stock');
      return Array.isArray(res.data) ? res.data : [];
    },
    retry: 2,
  });

  // Calculate totals
  const totals = stockData.reduce(
    (acc, item) => ({
      totalInward: acc.totalInward + (item.totalInward || 0),
      totalOutward: acc.totalOutward + (item.totalOutward || 0),
      balanceQtyKg: acc.balanceQtyKg + (item.balanceQtyKg || 0),
    }),
    { totalInward: 0, totalOutward: 0, balanceQtyKg: 0 }
  );

  // Get unique yarn counts and parties from stock data
  const uniqueYarnCounts = Array.from(new Set(stockData.map(s => s.countCode).filter(Boolean)));
  const uniqueParties = Array.from(new Set(stockData.map(s => s.partyName).filter(Boolean)));

  // Filter stock data
  const filteredStock = stockData.filter((item) => {
    const matchesSearch =
      (item.countCode?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.partyName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.lotNo?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesYarnCount = yarnCountFilter === 'all' || item.countCode === yarnCountFilter;
    const matchesParty = partyFilter === 'all' || item.partyName === partyFilter;
    return matchesSearch && matchesYarnCount && matchesParty;
  });

  // Calculate filtered totals
  const filteredTotals = filteredStock.reduce(
    (acc, item) => ({
      totalInward: acc.totalInward + (item.totalInward || 0),
      totalOutward: acc.totalOutward + (item.totalOutward || 0),
      balanceQtyKg: acc.balanceQtyKg + (item.balanceQtyKg || 0),
    }),
    { totalInward: 0, totalOutward: 0, balanceQtyKg: 0 }
  );

  const handleExportCSV = () => {
    exportToCSV(
      filteredStock,
      [
        { key: 'countCode', label: 'Yarn Count' },
        { key: 'partyName', label: 'Party' },
        { key: 'lotNo', label: 'Lot No' },
        { key: 'totalInward', label: 'Total Inward (kg)', format: (v) => formatNumberForExport(v, 3) },
        { key: 'totalOutward', label: 'Total Outward (kg)', format: (v) => formatNumberForExport(v, 3) },
        { key: 'balanceQtyKg', label: 'Balance (kg)', format: (v) => formatNumberForExport(v, 3) },
      ],
      'yarn-stock-ledger'
    );
  };

  const handleExportPDF = () => {
    exportToPrintable(
      filteredStock,
      [
        { key: 'countCode', label: 'Count' },
        { key: 'partyName', label: 'Party' },
        { key: 'lotNo', label: 'Lot' },
        { key: 'totalInward', label: 'Inward (kg)', format: (v) => formatNumberForExport(v, 3) },
        { key: 'totalOutward', label: 'Outward (kg)', format: (v) => formatNumberForExport(v, 3) },
        { key: 'balanceQtyKg', label: 'Balance (kg)', format: (v) => formatNumberForExport(v, 3) },
      ],
      'Yarn Stock Ledger',
      {
        subtitle: `${yarnCountFilter !== 'all' ? `Count: ${yarnCountFilter} | ` : ''}${partyFilter !== 'all' ? `Party: ${partyFilter}` : ''}`,
        summaryRows: [
          { label: 'Total Items', value: filteredStock.length },
          { label: 'Total Inward', value: `${formatNumberForExport(filteredTotals.totalInward, 3)} kg` },
          { label: 'Total Outward', value: `${formatNumberForExport(filteredTotals.totalOutward, 3)} kg` },
          { label: 'Balance', value: `${formatNumberForExport(filteredTotals.balanceQtyKg, 3)} kg` },
        ],
        orientation: 'landscape',
      }
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Failed to load stock data</h2>
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
          <h1 className="text-2xl font-bold text-gray-900">Yarn Stock Ledger</h1>
          <p className="text-gray-500">Track yarn inventory by count, party, and lot</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} disabled={filteredStock.length === 0} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button onClick={handleExportPDF} disabled={filteredStock.length === 0}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Stock Items</p>
                  <p className="text-2xl font-bold font-mono">{stockData.length}</p>
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
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Inward (kg)</p>
                  <p className="text-2xl font-bold font-mono">{formatNumber(totals.totalInward)}</p>
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
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Outward (kg)</p>
                  <p className="text-2xl font-bold font-mono">{formatNumber(totals.totalOutward)}</p>
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
                  <TrendingDown className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Balance Stock</p>
                  <p className="text-2xl font-bold font-mono">{formatNumber(totals.balanceQtyKg)}</p>
                  <p className="text-xs text-gray-400">kg</p>
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
                placeholder="Search by yarn count, party, or lot number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={yarnCountFilter} onValueChange={setYarnCountFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Yarn Counts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Yarn Counts</SelectItem>
                {uniqueYarnCounts.map((count) => (
                  <SelectItem key={count} value={count}>{count}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={partyFilter} onValueChange={setPartyFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Parties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parties</SelectItem>
                {uniqueParties.map((party) => (
                  <SelectItem key={party} value={party}>{party}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Stock Details ({filteredStock.length})</CardTitle>
            <CardDescription>
              Current yarn stock grouped by yarn count, party, and lot
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Yarn Count</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Lot No</TableHead>
                    <TableHead className="text-right">Total Inward (kg)</TableHead>
                    <TableHead className="text-right">Total Outward (kg)</TableHead>
                    <TableHead className="text-right">Balance (kg)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No stock data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredStock.map((item) => (
                        <TableRow key={`${item.countCode}-${item.partyCode}-${item.lotNo}`}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {item.countCode}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.partyName}</TableCell>
                          <TableCell className="font-mono">{item.lotNo || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(item.totalInward)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(item.totalOutward)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatNumber(item.balanceQtyKg)}
                          </TableCell>
                          <TableCell>
                            {item.balanceQtyKg > 0 ? (
                              <Badge variant="active">In Stock</Badge>
                            ) : (
                              <Badge variant="grey">Empty</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-gray-50 font-medium">
                        <TableCell colSpan={3} className="text-right">
                          Filtered Total:
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(filteredTotals.totalInward)}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(filteredTotals.totalOutward)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(filteredTotals.balanceQtyKg)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary by Yarn Count */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle>Stock Summary by Yarn Count</CardTitle>
            <CardDescription>Aggregated view of stock by yarn count</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Yarn Count</TableHead>
                  <TableHead className="text-right">Total Inward (kg)</TableHead>
                  <TableHead className="text-right">Total Outward (kg)</TableHead>
                  <TableHead className="text-right">Balance (kg)</TableHead>
                  <TableHead className="text-right">Lot Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueYarnCounts.map((yarnCount) => {
                  const items = stockData.filter(s => s.countCode === yarnCount);
                  const summary = items.reduce(
                    (acc, item) => ({
                      totalInward: acc.totalInward + (item.totalInward || 0),
                      totalOutward: acc.totalOutward + (item.totalOutward || 0),
                      balance: acc.balance + (item.balanceQtyKg || 0),
                    }),
                    { totalInward: 0, totalOutward: 0, balance: 0 }
                  );
                  return (
                    <TableRow key={yarnCount}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{yarnCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(summary.totalInward)}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(summary.totalOutward)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatNumber(summary.balance)}
                      </TableCell>
                      <TableCell className="text-right font-mono">{items.length}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


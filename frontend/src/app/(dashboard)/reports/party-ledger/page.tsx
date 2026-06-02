'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
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
import { exportToCSV, exportToPrintable, formatCurrency, formatDateForExport } from '@/lib/export-utils';

interface Party {
  id: number;
  partyCode: string;
  partyName: string;
}

interface LedgerEntry {
  transDate: string;
  documentType: string;
  documentNo: string;
  particulars: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
}

export default function PartyLedgerReportPage() {
  return (
    <RouteGuard requiredPermission="PARTY_LEDGER.VIEW">
      <PartyLedgerContent />
    </RouteGuard>
  );
}

function PartyLedgerContent() {
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Fetch parties for dropdown
  const { data: partiesData } = useQuery({
    queryKey: ['parties-lookup'],
    queryFn: async () => {
      const response = await apiClient.get('/api/parties?pageSize=500');
      return response.data as { data?: { items: Party[] } };
    },
  });

  const parties = partiesData?.data?.items || [];

  // Fetch ledger data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['party-ledger', selectedPartyId, fromDate, toDate],
    queryFn: async () => {
      if (!selectedPartyId) return { data: [] };
      const params = new URLSearchParams({ partyId: selectedPartyId });
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await apiClient.get(`/api/reports/party-ledger?${params}`);
      return response.data as { data?: LedgerEntry[] };
    },
    enabled: !!selectedPartyId,
  });

  const entries = data?.data || [];
  const selectedParty = parties.find(p => p.id.toString() === selectedPartyId);

  // Summary stats
  const totalDebit = entries.reduce((sum, e) => sum + e.debitAmount, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.creditAmount, 0);
  const closingBalance = entries.length > 0 ? entries[entries.length - 1].runningBalance : 0;

  const handleExportCSV = () => {
    if (!selectedParty) return;
    
    exportToCSV(
      entries,
      [
        { key: 'transDate', label: 'Date', format: formatDateForExport },
        { key: 'documentType', label: 'Type' },
        { key: 'documentNo', label: 'Document No' },
        { key: 'particulars', label: 'Particulars' },
        { key: 'debitAmount', label: 'Debit (₹)', format: formatCurrency },
        { key: 'creditAmount', label: 'Credit (₹)', format: formatCurrency },
        { key: 'runningBalance', label: 'Balance (₹)', format: formatCurrency },
      ],
      `party-ledger-${selectedParty.partyCode}`
    );
  };

  const handleExportPDF = () => {
    if (!selectedParty) return;
    
    exportToPrintable(
      entries,
      [
        { key: 'transDate', label: 'Date', format: formatDateForExport },
        { key: 'documentType', label: 'Type' },
        { key: 'documentNo', label: 'Doc No' },
        { key: 'particulars', label: 'Particulars' },
        { key: 'debitAmount', label: 'Debit (₹)', format: formatCurrency },
        { key: 'creditAmount', label: 'Credit (₹)', format: formatCurrency },
        { key: 'runningBalance', label: 'Balance (₹)', format: formatCurrency },
      ],
      'Party Ledger Report',
      {
        subtitle: `Party: ${selectedParty.partyCode} - ${selectedParty.partyName}${fromDate || toDate ? ` | Period: ${fromDate || 'Start'} to ${toDate || 'End'}` : ''}`,
        summaryRows: [
          { label: 'Total Debit', value: `₹${formatCurrency(totalDebit)}` },
          { label: 'Total Credit', value: `₹${formatCurrency(totalCredit)}` },
          { label: 'Closing Balance', value: `₹${formatCurrency(closingBalance)}` },
        ],
        orientation: 'landscape',
      }
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Party Ledger</h1>
          <p className="text-sm text-gray-500">View account transactions for a specific party</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} disabled={entries.length === 0} variant="outline">
            <Download className="mr-2 h-4 w-4" />CSV
          </Button>
          <Button onClick={handleExportPDF} disabled={entries.length === 0}>
            <FileText className="mr-2 h-4 w-4" />PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium text-gray-700">Select Party *</label>
              <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a party..." />
                </SelectTrigger>
                <SelectContent>
                  {parties.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.partyCode} - {p.partyName}
                    </SelectItem>
                  ))}
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
            <Button variant="outline" onClick={() => refetch()} disabled={!selectedPartyId}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {!selectedPartyId ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>Please select a party to view their ledger.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Party</p>
                    <p className="text-lg font-bold truncate">{selectedParty?.partyName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Debit</p>
                    <p className="text-xl font-bold">₹{formatNumber(totalDebit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Credit</p>
                    <p className="text-xl font-bold">₹{formatNumber(totalCredit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${closingBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Wallet className={`h-5 w-5 ${closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Closing Balance</p>
                    <p className={`text-xl font-bold ${closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{formatNumber(Math.abs(closingBalance))} {closingBalance >= 0 ? 'Dr' : 'Cr'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Ledger Entries</CardTitle>
              <CardDescription>Transaction history for {selectedParty?.partyName}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center py-12 text-red-500">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>Failed to load ledger data</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No transactions found for the selected period.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Document No</TableHead>
                      <TableHead>Particulars</TableHead>
                      <TableHead className="text-right">Debit (₹)</TableHead>
                      <TableHead className="text-right">Credit (₹)</TableHead>
                      <TableHead className="text-right">Balance (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{formatDate(entry.transDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.documentType}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{entry.documentNo}</TableCell>
                        <TableCell>{entry.particulars}</TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.debitAmount > 0 ? formatNumber(entry.debitAmount) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.creditAmount > 0 ? formatNumber(entry.creditAmount) : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold ${entry.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatNumber(Math.abs(entry.runningBalance))} {entry.runningBalance >= 0 ? 'Dr' : 'Cr'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


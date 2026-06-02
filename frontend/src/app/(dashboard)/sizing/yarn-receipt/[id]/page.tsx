'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, AlertCircle, Printer, CheckCircle, Clock, Lock, FileText, Truck, Package } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatDate, formatNumber } from '@/lib/utils';
import apiClient from '@/lib/api-client';

interface YarnReceiptDetailDto {
  id: number;
  yarnCountId: number;
  countCode: string;
  lotNo?: string;
  bagNo?: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  coneCount?: number;
  ratePerKg: number;
}

interface YarnReceiptDto {
  id: number;
  receiptNumber: string;
  receiptDate: string;
  partyId: number;
  partyCode: string;
  partyName: string;
  vehicleId?: number;
  vehicleNo?: string;
  driverName?: string;
  remarks?: string;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
  isLocked: boolean;
  totalNetWeight: number;
  totalBags: number;
  details: YarnReceiptDetailDto[];
}

export default function YarnReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const searchParams = useSearchParams();
  const isPrintMode = searchParams.get('print') === '1';
  const { data: receipt, isLoading, error } = useQuery<YarnReceiptDto>({
    queryKey: ['yarnReceipt', id],
    queryFn: async () => {
      const response: any = await apiClient.get(`/api/yarnreceipts/${id}`);
      return response.data as YarnReceiptDto;
    },
    enabled: !!id,
  });

  const hasAutoPrinted = useRef(false);

  const handlePrint = useCallback(() => {
    if (!receipt) {
      return;
    }

    const totalGrossWeight = receipt.details.reduce((sum, d) => sum + d.grossWeight, 0);
    const totalTareWeight = receipt.details.reduce((sum, d) => sum + d.tareWeight, 0);
    const totalCones = receipt.details.reduce((sum, d) => sum + (d.coneCount ?? 0), 0);
    const totalAmount = receipt.details.reduce((sum, d) => sum + d.netWeight * d.ratePerKg, 0);

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Yarn Receipt - ${receipt.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1f2937; }
    .page { padding: 28px; max-width: 960px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1d4ed8; }
    .company-name { font-size: 22px; font-weight: 800; color: #1d4ed8; letter-spacing: -0.5px; }
    .company-sub { font-size: 11px; color: #6b7280; margin-top: 3px; }
    .doc-title { text-align: right; }
    .doc-title h2 { font-size: 20px; font-weight: 700; color: #111827; letter-spacing: 1px; }
    .doc-title .receipt-no { font-size: 13px; font-weight: 700; color: #2563eb; margin-top: 4px; font-family: monospace; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; border: 1px solid; margin-top: 6px; }
    .status-draft { background: #f3f4f6; color: #6b7280; border-color: #d1d5db; }
    .status-approved { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .status-locked { background: #f3f4f6; color: #374151; border-color: #9ca3af; }
    .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; }
    .info-box h4 { font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; gap: 16px; }
    .info-row .label { color: #6b7280; white-space: nowrap; }
    .info-row .value { font-weight: 600; text-align: right; font-family: monospace; word-break: break-word; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 22px; }
    .summary-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; text-align: center; }
    .summary-box .s-label { font-size: 10px; color: #2563eb; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-box .s-value { font-size: 17px; font-weight: 800; color: #1d4ed8; font-family: monospace; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
    thead tr { background: #1e40af; color: white; }
    thead th { padding: 9px 10px; text-align: left; font-weight: 700; letter-spacing: 0.03em; }
    thead th.right { text-align: right; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 8px 10px; }
    tbody td.mono { font-family: monospace; }
    tbody td.right { text-align: right; font-family: monospace; }
    .totals-row { background: #dbeafe !important; border-top: 2px solid #93c5fd; }
    .totals-row td { padding: 9px 10px; font-size: 12px; font-weight: 700; }
    .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 48px; }
    .sign-box { border-top: 1.5px solid #9ca3af; padding-top: 7px; text-align: center; font-size: 11px; color: #6b7280; font-weight: 600; }
    .print-footer { margin-top: 20px; text-align: center; font-size: 10px; color: #d1d5db; border-top: 1px solid #f3f4f6; padding-top: 12px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 16px; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="company-name">SUDHAN TEXTILE</div>
      <div class="company-sub">SIZING ERP SYSTEM</div>
    </div>
    <div class="doc-title">
      <h2>YARN RECEIPT</h2>
      <div class="receipt-no">${receipt.receiptNumber}</div>
      <div>
        <span class="status-badge status-${receipt.status.toLowerCase()}">${receipt.status}</span>
        ${receipt.isLocked ? '<span class="status-badge status-locked" style="margin-left:4px">Locked</span>' : ''}
      </div>
    </div>
  </div>

  <div class="info-section">
    <div class="info-box">
      <h4>Receipt Information</h4>
      <div class="info-row"><span class="label">Receipt No</span><span class="value">${receipt.receiptNumber}</span></div>
      <div class="info-row"><span class="label">Receipt Date</span><span class="value">${formatDate(receipt.receiptDate)}</span></div>
      <div class="info-row"><span class="label">Party / Vendor</span><span class="value">${receipt.partyName}</span></div>
      <div class="info-row"><span class="label">Party Code</span><span class="value">${receipt.partyCode}</span></div>
      ${receipt.remarks ? `<div class="info-row"><span class="label">Remarks</span><span class="value">${receipt.remarks}</span></div>` : ''}
    </div>
    <div class="info-box">
      <h4>Transport Details</h4>
      ${receipt.vehicleNo ? `<div class="info-row"><span class="label">Vehicle No</span><span class="value">${receipt.vehicleNo}</span></div>` : ''}
      ${receipt.driverName ? `<div class="info-row"><span class="label">Driver Name</span><span class="value">${receipt.driverName}</span></div>` : ''}
      ${receipt.approvedBy ? `<div class="info-row"><span class="label">Approved By</span><span class="value">${receipt.approvedBy}</span></div>` : ''}
      ${receipt.approvedDate ? `<div class="info-row"><span class="label">Approved Date</span><span class="value">${formatDate(receipt.approvedDate as string)}</span></div>` : ''}
      ${!receipt.vehicleNo && !receipt.driverName ? '<p style="color:#9ca3af;font-style:italic">No transport details</p>' : ''}
    </div>
  </div>

  <div class="summary">
    <div class="summary-box"><div class="s-label">Total Bags</div><div class="s-value">${receipt.totalBags}</div></div>
    <div class="summary-box"><div class="s-label">Total Cones</div><div class="s-value">${totalCones}</div></div>
    <div class="summary-box"><div class="s-label">Gross Weight</div><div class="s-value">${formatNumber(totalGrossWeight)} kg</div></div>
    <div class="summary-box"><div class="s-label">Net Weight</div><div class="s-value">${formatNumber(receipt.totalNetWeight)} kg</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>Yarn Count</th><th>Lot No</th><th>Bag No</th>
        <th class="right">Cones</th><th class="right">Gross Wt (kg)</th><th class="right">Tare Wt (kg)</th>
        <th class="right">Net Wt (kg)</th><th class="right">Rate/kg (&#8377;)</th><th class="right">Amount (&#8377;)</th>
      </tr>
    </thead>
    <tbody>
      ${receipt.details.map((d, i) => `
      <tr>
        <td class="mono">${i + 1}</td>
        <td style="font-weight:700">${d.countCode}</td>
        <td class="mono">${d.lotNo || '-'}</td>
        <td class="mono">${d.bagNo || '-'}</td>
        <td class="right">${d.coneCount ?? '-'}</td>
        <td class="right">${formatNumber(d.grossWeight)}</td>
        <td class="right">${formatNumber(d.tareWeight)}</td>
        <td class="right" style="font-weight:700">${formatNumber(d.netWeight)}</td>
        <td class="right">${formatNumber(d.ratePerKg)}</td>
        <td class="right" style="font-weight:700">${formatNumber(d.netWeight * d.ratePerKg)}</td>
      </tr>`).join('')}
      <tr class="totals-row">
        <td colspan="4" style="text-align:right;color:#1e40af">TOTALS</td>
        <td class="right">${totalCones}</td>
        <td class="right">${formatNumber(totalGrossWeight)}</td>
        <td class="right">${formatNumber(totalTareWeight)}</td>
        <td class="right">${formatNumber(receipt.totalNetWeight)}</td>
        <td></td>
        <td class="right">${formatNumber(totalAmount)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div class="sign-box">Prepared By</div>
    <div class="sign-box">Checked By</div>
    <div class="sign-box">Authorised Signatory</div>
  </div>
  <div class="print-footer">
    Printed on ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; ${receipt.receiptNumber} &nbsp;|&nbsp; Sudhan Textile ERP
  </div>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1000,height=750');
    if (win) {
      win.document.write(printContent);
      win.document.close();
    }
  }, [receipt]);

  useEffect(() => {
    if (isPrintMode && receipt && !hasAutoPrinted.current) {
      hasAutoPrinted.current = true;
      handlePrint();
    }
  }, [isPrintMode, receipt, handlePrint]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Receipt not found</h2>
        <Button onClick={() => router.push('/sizing/yarn-receipt')}>Back to List</Button>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; variant: 'active' | 'grey' | 'locked'; icon: React.ReactNode }> = {
    Draft: { label: 'Draft', variant: 'grey', icon: <Clock className="h-3 w-3" /> },
    Approved: { label: 'Approved', variant: 'active', icon: <CheckCircle className="h-3 w-3" /> },
    Locked: { label: 'Locked', variant: 'locked', icon: <Lock className="h-3 w-3" /> },
  };
  const status = statusConfig[receipt.status] ?? { label: receipt.status, variant: 'grey' as const, icon: null };

  const totalGrossWeight = receipt.details.reduce((sum, d) => sum + d.grossWeight, 0);
  const totalTareWeight = receipt.details.reduce((sum, d) => sum + d.tareWeight, 0);
  const totalCones = receipt.details.reduce((sum, d) => sum + (d.coneCount ?? 0), 0);
  const totalAmount = receipt.details.reduce((sum, d) => sum + d.netWeight * d.ratePerKg, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/sizing/yarn-receipt">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{receipt.receiptNumber}</h1>
            <p className="text-gray-500">Yarn Receipt Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={status.variant} className="flex items-center gap-1 px-3 py-1">
            {status.icon}
            {status.label}
          </Badge>
          {receipt.isLocked && (
            <Badge variant="locked" className="flex items-center gap-1 px-3 py-1">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Receipt Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-blue-600" />
              Receipt Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt No</span>
              <span className="font-mono font-medium">{receipt.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt Date</span>
              <span>{formatDate(receipt.receiptDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Party / Vendor</span>
              <span className="font-medium">{receipt.partyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Party Code</span>
              <span className="font-mono">{receipt.partyCode}</span>
            </div>
            {receipt.remarks && (
              <div className="flex justify-between">
                <span className="text-gray-500">Remarks</span>
                <span className="text-right max-w-[200px]">{receipt.remarks}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5 text-blue-600" />
              Transport Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {receipt.vehicleNo ? (
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle No</span>
                <span className="font-mono font-medium">{receipt.vehicleNo}</span>
              </div>
            ) : (
              <p className="text-gray-400 italic">No transport details</p>
            )}
            {receipt.driverName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Driver Name</span>
                <span>{receipt.driverName}</span>
              </div>
            )}
            {receipt.approvedBy && (
              <>
                <div className="border-t pt-3 mt-3" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved By</span>
                  <span className="font-medium">{receipt.approvedBy}</span>
                </div>
                {receipt.approvedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approved Date</span>
                    <span>{formatDate(receipt.approvedDate)}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Total Bags', value: receipt.totalBags },
          { label: 'Total Cones', value: totalCones },
          { label: 'Gross Weight', value: `${formatNumber(totalGrossWeight)} kg` },
          { label: 'Net Weight', value: `${formatNumber(receipt.totalNetWeight)} kg` },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-xl font-bold font-mono">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Yarn Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-blue-600" />
            Yarn Details ({receipt.details.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Yarn Count</TableHead>
                  <TableHead>Lot No</TableHead>
                  <TableHead>Bag No</TableHead>
                  <TableHead className="text-right">Cones</TableHead>
                  <TableHead className="text-right">Gross Wt (kg)</TableHead>
                  <TableHead className="text-right">Tare Wt (kg)</TableHead>
                  <TableHead className="text-right">Net Wt (kg)</TableHead>
                  <TableHead className="text-right">Rate/kg (₹)</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.details.map((detail, idx) => (
                  <TableRow key={detail.id}>
                    <TableCell className="font-mono text-gray-500">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{detail.countCode}</TableCell>
                    <TableCell className="font-mono">{detail.lotNo || '-'}</TableCell>
                    <TableCell className="font-mono">{detail.bagNo || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{detail.coneCount ?? '-'}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(detail.grossWeight)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(detail.tareWeight)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{formatNumber(detail.netWeight)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(detail.ratePerKg)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatNumber(detail.netWeight * detail.ratePerKg)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={4} className="text-right text-gray-600">Totals</TableCell>
                  <TableCell className="text-right font-mono">{totalCones}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(totalGrossWeight)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(totalTareWeight)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(receipt.totalNetWeight)}</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono">
                    {formatNumber(receipt.details.reduce((sum, d) => sum + d.netWeight * d.ratePerKg, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

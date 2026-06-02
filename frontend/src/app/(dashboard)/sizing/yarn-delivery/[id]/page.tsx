'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Printer,
  CheckCircle,
  Clock,
  Truck,
  Package,
  Send,
  User,
  FileText,
  Calendar,
  IndianRupee,
  Edit,
} from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { formatDate, formatNumber } from '@/lib/utils';
import apiClient from '@/lib/api-client';

interface YarnDeliveryDetailDto {
  id: number;
  yarnCountId: number;
  countCode: string;
  lotNo?: string;
  bags: number;
  cones: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  ratePerKg: number;
  amount: number;
}

interface YarnDeliveryDto {
  id: number;
  dcNo: string;
  dcDate: string;
  partyId: number;
  partyCode: string;
  partyName: string;
  vehicleId?: number;
  vehicleNo?: string;
  driverName?: string;
  driverPhone?: string;
  totalWeight: number;
  totalAmount: number;
  status: 'Draft' | 'Approved' | 'Dispatched';
  approvedBy?: string;
  approvedDate?: string;
  dispatchedBy?: string;
  dispatchedDate?: string;
  remarks?: string;
  details: YarnDeliveryDetailDto[];
}

export default function YarnDeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: delivery, isLoading, error } = useQuery<YarnDeliveryDto>({
    queryKey: ['yarnDelivery', id],
    queryFn: async () => {
      const response: any = await apiClient.get(`/api/yarndeliveries/${id}`);
      return response.data as YarnDeliveryDto;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Yarn Delivery not found</h2>
        <p className="text-gray-500">The record may have been deleted or you lack access.</p>
        <Button onClick={() => router.push('/sizing/yarn-delivery')}>Back to List</Button>
      </div>
    );
  }

  const totalGross = delivery.details.reduce((s, d) => s + d.grossWeight, 0);
  const totalTare = delivery.details.reduce((s, d) => s + d.tareWeight, 0);
  const totalNet = delivery.details.reduce((s, d) => s + d.netWeight, 0);
  const totalBags = delivery.details.reduce((s, d) => s + d.bags, 0);
  const totalCones = delivery.details.reduce((s, d) => s + d.cones, 0);
  const totalAmount = delivery.details.reduce((s, d) => s + d.amount, 0);

  const statusConfig: Record<string, { label: string; color: string }> = {
    Draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    Approved: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-300' },
    Dispatched: { label: 'Dispatched', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  };
  const sc = statusConfig[delivery.status] ?? { label: delivery.status, color: 'bg-gray-100 text-gray-700 border-gray-300' };

  const handlePrint = () => {
    const rows = delivery.details.map((d, i) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:8px 10px;text-align:center;">${i + 1}</td>
        <td style="padding:8px 10px;font-weight:600;font-family:monospace;">${d.countCode}</td>
        <td style="padding:8px 10px;">${d.lotNo || '-'}</td>
        <td style="padding:8px 10px;text-align:center;">${d.bags}</td>
        <td style="padding:8px 10px;text-align:right;">${formatNumber(d.grossWeight)}</td>
        <td style="padding:8px 10px;text-align:right;">${formatNumber(d.tareWeight)}</td>
        <td style="padding:8px 10px;text-align:right;font-weight:700;">${formatNumber(d.netWeight)}</td>
        <td style="padding:8px 10px;text-align:right;">${formatNumber(d.ratePerKg)}</td>
        <td style="padding:8px 10px;text-align:right;font-weight:700;">${formatNumber(d.amount)}</td>
      </tr>`).join('');

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Yarn Delivery DC - ${delivery.dcNo}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:Arial,sans-serif;font-size:12px;color:#1f2937;}
    .page{padding:32px;max-width:960px;margin:0 auto;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #0f172a;margin-bottom:20px;}
    .co-name{font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;}
    .co-sub{font-size:10px;color:#6b7280;margin-top:3px;}
    .doc-title{text-align:right;}
    .doc-title h2{font-size:18px;font-weight:700;color:#111827;letter-spacing:1px;text-transform:uppercase;}
    .doc-no{font-size:14px;font-weight:700;color:#1d4ed8;font-family:monospace;margin-top:4px;}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
    .info-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:14px;}
    .info-box h3{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:10px;font-weight:600;}
    .info-row{display:flex;gap:8px;margin-bottom:6px;}
    .info-label{font-size:11px;color:#6b7280;width:110px;flex-shrink:0;}
    .info-value{font-size:11px;font-weight:600;color:#111827;}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;}
    th{background:#0f172a;color:#fff;padding:9px 10px;font-size:11px;font-weight:600;text-align:left;}
    th.r{text-align:right;}th.c{text-align:center;}
    tr:nth-child(even){background:#f9fafb;}
    .footer-row td{background:#f1f5f9;font-weight:700;border-top:2px solid #0f172a;}
    .summary{display:flex;justify-content:flex-end;gap:16px;margin-bottom:28px;}
    .summary-box{border-radius:8px;padding:16px 24px;min-width:200px;}
    .summary-box.dark{background:#0f172a;color:#fff;}
    .summary-box.accent{background:#1d4ed8;color:#fff;}
    .summary-box .label{font-size:11px;color:#94a3b8;margin-bottom:4px;}
    .summary-box .value{font-size:22px;font-weight:800;font-family:monospace;}
    .summary-box .unit{font-size:11px;color:#94a3b8;margin-top:2px;}
    .sign-row{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;}
    .sign-box{border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;}
    @media print{.page{padding:16px;}button{display:none;}}
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="co-name">Sudhan Textile</div>
      <div class="co-sub">Sizing &amp; Yarn Processing Unit</div>
    </div>
    <div class="doc-title">
      <h2>Yarn Delivery DC</h2>
      <div class="doc-no">${delivery.dcNo}</div>
    </div>
  </div>

  <div class="grid2">
    <div class="info-box">
      <h3>Customer Details</h3>
      <div class="info-row"><span class="info-label">Party Code</span><span class="info-value">${delivery.partyCode}</span></div>
      <div class="info-row"><span class="info-label">Party Name</span><span class="info-value">${delivery.partyName}</span></div>
    </div>
    <div class="info-box">
      <h3>Transport Details</h3>
      <div class="info-row"><span class="info-label">DC Date</span><span class="info-value">${formatDate(delivery.dcDate)}</span></div>
      ${delivery.vehicleNo ? `<div class="info-row"><span class="info-label">Vehicle No</span><span class="info-value">${delivery.vehicleNo}</span></div>` : ''}
      ${delivery.driverName ? `<div class="info-row"><span class="info-label">Driver</span><span class="info-value">${delivery.driverName}</span></div>` : ''}
      ${delivery.driverPhone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value">${delivery.driverPhone}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Status</span><span class="info-value">${delivery.status}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="c" style="width:40px">#</th>
        <th>Count</th>
        <th>Lot No</th>
        <th class="c">Bags</th>
        <th class="r">Gross Wt (kg)</th>
        <th class="r">Tare Wt (kg)</th>
        <th class="r">Net Wt (kg)</th>
        <th class="r">Rate/kg</th>
        <th class="r">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="footer-row">
        <td colspan="3" style="padding:8px 10px;">TOTAL</td>
        <td style="padding:8px 10px;text-align:center;">${totalBags}</td>
        <td style="padding:8px 10px;text-align:right;">${formatNumber(totalGross)}</td>
        <td style="padding:8px 10px;text-align:right;">${formatNumber(totalTare)}</td>
        <td style="padding:8px 10px;text-align:right;font-size:14px;">${formatNumber(totalNet)}</td>
        <td style="padding:8px 10px;text-align:right;">-</td>
        <td style="padding:8px 10px;text-align:right;font-size:14px;">${formatNumber(totalAmount)}</td>
      </tr>
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-box dark">
      <div class="label">Total Net Weight</div>
      <div class="value">${formatNumber(totalNet)}</div>
      <div class="unit">Kilograms</div>
    </div>
    <div class="summary-box accent">
      <div class="label">Total Amount</div>
      <div class="value">\u20B9 ${formatNumber(totalAmount)}</div>
      <div class="unit">Indian Rupees</div>
    </div>
  </div>

  ${delivery.remarks ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px;margin-bottom:24px;"><strong style="font-size:11px;">Remarks:</strong> ${delivery.remarks}</div>` : ''}

  <div class="sign-row">
    <div class="sign-box">Received By (Customer)</div>
    <div class="sign-box">Authorised Signatory</div>
  </div>
</div>
<script>window.onload=()=>window.print();</script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/sizing/yarn-delivery')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{delivery.dcNo}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sc.color}`}>
                {delivery.status === 'Approved' && <CheckCircle className="h-3 w-3" />}
                {delivery.status === 'Draft' && <Clock className="h-3 w-3" />}
                {delivery.status === 'Dispatched' && <Truck className="h-3 w-3" />}
                {sc.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Yarn Delivery DC &middot; {formatDate(delivery.dcDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {delivery.status === 'Draft' && (
            <Link href={`/sizing/yarn-delivery/${delivery.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />Edit
              </Button>
            </Link>
          )}
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />Print DC
          </Button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Package className="h-4 w-4" /> Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Party Code</p>
              <p className="font-mono font-semibold text-sm">{delivery.partyCode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Party Name</p>
              <p className="font-semibold">{delivery.partyName}</p>
            </div>
          </CardContent>
        </Card>

        {/* Transport Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Truck className="h-4 w-4" /> Transport
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">DC Date</p>
              <p className="font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {formatDate(delivery.dcDate)}
              </p>
            </div>
            {delivery.vehicleNo ? (
              <div>
                <p className="text-xs text-gray-500">Vehicle No</p>
                <p className="font-mono font-semibold">{delivery.vehicleNo}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500">Vehicle No</p>
                <p className="text-gray-400 text-sm">&mdash;</p>
              </div>
            )}
            {delivery.driverName && (
              <div>
                <p className="text-xs text-gray-500">Driver</p>
                <p className="font-semibold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  {delivery.driverName}
                </p>
              </div>
            )}
            {delivery.driverPhone && (
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-mono text-sm">{delivery.driverPhone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-slate-900 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <Send className="h-4 w-4" /> Delivery Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Total Bags</span>
              <span className="font-bold font-mono">{totalBags}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Gross Weight</span>
              <span className="font-mono">{formatNumber(totalGross)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-sm">Tare Weight</span>
              <span className="font-mono">{formatNumber(totalTare)} kg</span>
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex justify-between">
              <span className="text-white text-sm font-semibold">Net Weight</span>
              <span className="text-lg font-bold font-mono text-white">{formatNumber(totalNet)} kg</span>
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex justify-between">
              <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" /> Total Amount
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400">{formatNumber(totalAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval info */}
      {(delivery.approvedBy || delivery.approvedDate) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">Approved</p>
                <p className="text-xs">
                  {delivery.approvedBy && `By ${delivery.approvedBy}`}
                  {delivery.approvedDate && ` on ${formatDate(delivery.approvedDate)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispatch info */}
      {(delivery.dispatchedBy || delivery.dispatchedDate) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-blue-700">
              <Truck className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">Dispatched</p>
                <p className="text-xs">
                  {delivery.dispatchedBy && `By ${delivery.dispatchedBy}`}
                  {delivery.dispatchedDate && ` on ${formatDate(delivery.dispatchedDate)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remarks */}
      {delivery.remarks && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <FileText className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Remarks</p>
              <p className="text-sm text-amber-900">{delivery.remarks}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Delivery Details
            <span className="ml-2 text-sm font-normal text-gray-500">({delivery.details.length} items)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Lot No</TableHead>
                <TableHead className="text-center">Bags</TableHead>
                <TableHead className="text-right">Gross Wt (kg)</TableHead>
                <TableHead className="text-right">Tare Wt (kg)</TableHead>
                <TableHead className="text-right">Net Wt (kg)</TableHead>
                <TableHead className="text-right">Rate/kg</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delivery.details.map((d, i) => (
                <TableRow key={d.id}>
                  <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                  <TableCell className="font-mono font-semibold">{d.countCode}</TableCell>
                  <TableCell className="font-mono text-sm">{d.lotNo || '\u2014'}</TableCell>
                  <TableCell className="text-center font-mono">{d.bags}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(d.grossWeight)}</TableCell>
                  <TableCell className="text-right font-mono text-gray-500">{formatNumber(d.tareWeight)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatNumber(d.netWeight)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(d.ratePerKg)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatNumber(d.amount)}</TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <TableCell colSpan={3} className="font-bold">Total</TableCell>
                <TableCell className="text-center font-bold font-mono">{totalBags}</TableCell>
                <TableCell className="text-right font-bold font-mono">{formatNumber(totalGross)}</TableCell>
                <TableCell className="text-right font-bold font-mono text-gray-500">{formatNumber(totalTare)}</TableCell>
                <TableCell className="text-right font-bold font-mono text-lg">{formatNumber(totalNet)}</TableCell>
                <TableCell className="text-right font-bold font-mono">-</TableCell>
                <TableCell className="text-right font-bold font-mono text-lg text-primary">{formatNumber(totalAmount)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, Printer, CheckCircle, Clock, Lock, FileText, Truck, Building2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils';
import apiClient from '@/lib/api-client';

interface TaxInvoiceDetailDto {
  id: number;
  sizingJobCardId?: number;
  description: string;
  hsnCode: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
}

interface TaxInvoiceDto {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  partyId: number;
  partyCode: string;
  partyName: string;
  gstin: string;
  placeOfSupply: string;
  isInterState: boolean;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  roundOff: number;
  grandTotal: number;
  status: string;
  dueDate?: string;
  transportMode?: string;
  vehicleNo?: string;
  ewayBillNo?: string;
  irnNumber?: string;
  remarks?: string;
  isLocked: boolean;
  isPrinted: boolean;
  printedAt?: string;
  details: TaxInvoiceDetailDto[];
}

interface CompanyDto {
  id: number;
  companyName: string;
  shortName: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone?: string;
  email?: string;
  gstin: string;
  pan: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
}

const statusVariant: Record<string, 'draft' | 'active' | 'completed' | 'grey' | 'cancelled'> = {
  draft: 'draft',
  Draft: 'draft',
  Finalized: 'active',
  Paid: 'completed',
  Cancelled: 'cancelled',
};

const statusIcon: Record<string, React.ReactNode> = {
  draft: <Clock className="h-3 w-3" />,
  Draft: <Clock className="h-3 w-3" />,
  Finalized: <CheckCircle className="h-3 w-3" />,
  Paid: <CheckCircle className="h-3 w-3" />,
  Cancelled: <XCircle className="h-3 w-3" />,
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: invoice, isLoading, error } = useQuery<TaxInvoiceDto>({
    queryKey: ['taxInvoice', id],
    queryFn: async () => {
      const res: any = await apiClient.get(`/api/TaxInvoices/${id}`);
      if (res.success && res.data) return res.data as TaxInvoiceDto;
      throw new Error(res.message || 'Invoice not found');
    },
    enabled: !!id,
    retry: 0,
  });

  const { data: company } = useQuery<CompanyDto>({
    queryKey: ['currentCompany'],
    queryFn: async () => {
      const res: any = await apiClient.get('/api/Companies/current');
      return res.data as CompanyDto;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Invoice not found</h2>
        <Button onClick={() => router.push('/sizing/invoices')}>Back to List</Button>
      </div>
    );
  }

  const badge = statusVariant[invoice.status] ?? 'grey';
  const totalTax = invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount;

  const handlePrint = () => {
    const companyName = company?.companyName ?? 'SUDHAN TEXTILE';
    const companyAddr = [company?.addressLine1, company?.addressLine2, company?.city, company?.state, company?.pincode].filter(Boolean).join(', ');
    const companyGSTIN = company?.gstin ?? '';
    const companyPAN = company?.pan ?? '';
    const companyPhone = company?.phone ?? '';
    const companyEmail = company?.email ?? '';
    const bankDetails = company?.bankAccountNo
      ? `A/C: ${company.bankAccountNo} | IFSC: ${company.bankIfsc ?? ''} | ${company.bankName ?? ''}, ${company.bankBranch ?? ''}`
      : '';

    const detailRows = invoice.details.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align:left">${d.description}</td>
        <td>${d.hsnCode}</td>
        <td class="right">${formatNumber(d.quantity)}</td>
        <td>${d.uom}</td>
        <td class="right">${formatNumber(d.rate)}</td>
        <td class="right">${formatNumber(d.amount)}</td>
        ${!invoice.isInterState ? `
        <td class="right">${d.cgstRate}%</td>
        <td class="right">${formatNumber(d.cgstAmount)}</td>
        <td class="right">${d.sgstRate}%</td>
        <td class="right">${formatNumber(d.sgstAmount)}</td>
        ` : `
        <td class="right">${d.igstRate}%</td>
        <td class="right">${formatNumber(d.igstAmount)}</td>
        `}
        <td class="right bold">${formatNumber(d.amount + d.cgstAmount + d.sgstAmount + d.igstAmount)}</td>
      </tr>`).join('');

    const taxHeaders = !invoice.isInterState
      ? `<th>CGST %</th><th class="right">CGST ₹</th><th>SGST %</th><th class="right">SGST ₹</th>`
      : `<th>IGST %</th><th class="right">IGST ₹</th>`;

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GST Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111827; }
    .page { padding: 20px; max-width: 1000px; margin: 0 auto; }
    .box { border: 1.5px solid #1e40af; }
    .title-bar { background: #1e40af; color: white; text-align: center; padding: 6px; font-size: 13px; font-weight: 800; letter-spacing: 2px; }
    .header-grid { display: grid; grid-template-columns: 1fr auto 1fr; border-bottom: 1.5px solid #1e40af; }
    .seller-box { padding: 10px; border-right: 1px solid #9ca3af; }
    .mid-box { padding: 10px 16px; text-align: center; border-right: 1px solid #9ca3af; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    .buyer-box { padding: 10px; }
    .company-name { font-size: 16px; font-weight: 800; color: #1e40af; margin-bottom: 3px; }
    .section-label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .info-row { display: flex; gap: 4px; margin-bottom: 3px; }
    .info-row .lbl { color: #6b7280; min-width: 70px; }
    .info-row .val { font-weight: 600; font-family: monospace; }
    .inv-number { font-size: 15px; font-weight: 800; color: #1e40af; font-family: monospace; }
    .inv-date { font-size: 12px; color: #374151; margin-top: 4px; }
    .status-pill { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; margin-top: 6px; }
    .status-draft { background:#f3f4f6; color:#6b7280; border:1px solid #d1d5db; }
    .status-finalized { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
    .status-paid { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }
    .status-cancelled { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
    .transport-bar { display: grid; grid-template-columns: repeat(4,1fr); border-bottom: 1px solid #9ca3af; }
    .transport-cell { padding: 6px 10px; border-right: 1px solid #9ca3af; }
    .transport-cell:last-child { border-right: none; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #1e40af; color: white; }
    thead th { padding: 7px 8px; text-align: center; font-weight: 700; font-size: 10px; border: 1px solid #1e40af; white-space: nowrap; }
    thead th.left { text-align: left; }
    tbody td { padding: 6px 8px; border: 1px solid #e5e7eb; text-align: center; }
    tbody td.left { text-align: left; }
    tbody td.right { text-align: right; font-family: monospace; }
    tbody td.bold { font-weight: 700; }
    .totals-section { display: grid; grid-template-columns: 1fr auto; border-top: 1.5px solid #1e40af; }
    .amount-words { padding: 10px; border-right: 1px solid #9ca3af; }
    .amount-words .label { font-size: 9px; font-weight:700; color:#6b7280; text-transform:uppercase; margin-bottom:4px; }
    .amount-words .words { font-weight: 600; font-size: 11px; color: #111827; }
    .totals-table { min-width: 260px; }
    .totals-table td { padding: 5px 10px; border-bottom: 1px solid #f3f4f6; }
    .totals-table .t-lbl { color: #6b7280; }
    .totals-table .t-val { text-align: right; font-family: monospace; font-weight: 600; }
    .grand-row td { background: #1e40af; color: white; font-weight: 800; font-size: 13px; padding: 7px 10px; }
    .footer-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #9ca3af; }
    .bank-box { padding: 10px; border-right: 1px solid #9ca3af; }
    .sign-box { padding: 10px; }
    .sign-line { border-top: 1px solid #374151; margin-top: 30px; padding-top: 5px; text-align: center; font-size: 10px; color: #6b7280; font-weight: 600; }
    .print-note { text-align:center; font-size:9px; color:#d1d5db; margin-top:8px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding:10px; } }
  </style>
</head>
<body>
<div class="page">
  <div class="box">
    <div class="title-bar">TAX INVOICE</div>

    <div class="header-grid">
      <div class="seller-box">
        <div class="section-label">Supplier / From</div>
        <div class="company-name">${companyName}</div>
        <div style="color:#374151;margin-bottom:6px;font-size:10px">${companyAddr}</div>
        ${companyGSTIN ? `<div class="info-row"><span class="lbl">GSTIN</span><span class="val">${companyGSTIN}</span></div>` : ''}
        ${companyPAN ? `<div class="info-row"><span class="lbl">PAN</span><span class="val">${companyPAN}</span></div>` : ''}
        ${companyPhone ? `<div class="info-row"><span class="lbl">Phone</span><span class="val">${companyPhone}</span></div>` : ''}
        ${companyEmail ? `<div class="info-row"><span class="lbl">Email</span><span class="val">${companyEmail}</span></div>` : ''}
      </div>
      <div class="mid-box">
        <div class="section-label">Invoice No</div>
        <div class="inv-number">${invoice.invoiceNumber}</div>
        <div class="inv-date">Date: ${formatDate(invoice.invoiceDate)}</div>
        ${invoice.dueDate ? `<div class="inv-date">Due: ${formatDate(invoice.dueDate)}</div>` : ''}
        <span class="status-pill status-${invoice.status.toLowerCase()}">${invoice.status}</span>
      </div>
      <div class="buyer-box">
        <div class="section-label">Bill To / Buyer</div>
        <div style="font-size:14px;font-weight:800;color:#111827;margin-bottom:4px">${invoice.partyName}</div>
        <div class="info-row"><span class="lbl">Code</span><span class="val">${invoice.partyCode}</span></div>
        ${invoice.gstin ? `<div class="info-row"><span class="lbl">GSTIN</span><span class="val">${invoice.gstin}</span></div>` : ''}
        <div class="info-row"><span class="lbl">Supply</span><span class="val">${invoice.placeOfSupply}</span></div>
        <div class="info-row"><span class="lbl">Type</span><span class="val">${invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}</span></div>
      </div>
    </div>

    ${(invoice.transportMode || invoice.vehicleNo || invoice.ewayBillNo || invoice.irnNumber) ? `
    <div class="transport-bar" style="border-top:1px solid #9ca3af">
      <div class="transport-cell"><div class="section-label">Transport Mode</div><strong>${invoice.transportMode ?? '-'}</strong></div>
      <div class="transport-cell"><div class="section-label">Vehicle No</div><strong>${invoice.vehicleNo ?? '-'}</strong></div>
      <div class="transport-cell"><div class="section-label">E-Way Bill No</div><strong>${invoice.ewayBillNo ?? '-'}</strong></div>
      <div class="transport-cell"><div class="section-label">IRN Number</div><strong style="font-size:9px">${invoice.irnNumber ?? '-'}</strong></div>
    </div>` : ''}

    <div style="border-top:1px solid #9ca3af">
      <table>
        <thead>
          <tr>
            <th style="width:30px">#</th>
            <th class="left" style="width:25%">Description of Services</th>
            <th>HSN/SAC</th>
            <th class="right">Qty</th>
            <th>UOM</th>
            <th class="right">Rate (₹)</th>
            <th class="right">Amount (₹)</th>
            ${taxHeaders}
            <th class="right">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${detailRows}
        </tbody>
      </table>
    </div>

    <div class="totals-section">
      <div class="amount-words">
        ${invoice.remarks ? `<div><span class="label">Remarks:</span> <span style="font-weight:600">${invoice.remarks}</span></div>` : ''}
        <div style="margin-top:${invoice.remarks ? '8' : '0'}px">
          <div class="label">Amount in Words</div>
          <div class="words">${numberToWords(invoice.grandTotal)} Rupees Only</div>
        </div>
      </div>
      <table class="totals-table">
        <tr><td class="t-lbl">Taxable Amount</td><td class="t-val">₹ ${formatNumber(invoice.taxableAmount)}</td></tr>
        ${!invoice.isInterState ? `
        <tr><td class="t-lbl">CGST</td><td class="t-val">₹ ${formatNumber(invoice.cgstAmount)}</td></tr>
        <tr><td class="t-lbl">SGST</td><td class="t-val">₹ ${formatNumber(invoice.sgstAmount)}</td></tr>
        ` : `
        <tr><td class="t-lbl">IGST</td><td class="t-val">₹ ${formatNumber(invoice.igstAmount)}</td></tr>
        `}
        <tr><td class="t-lbl">Total Tax</td><td class="t-val">₹ ${formatNumber(totalTax)}</td></tr>
        <tr><td class="t-lbl">Total Amount</td><td class="t-val">₹ ${formatNumber(invoice.totalAmount)}</td></tr>
        ${Math.abs(invoice.roundOff) > 0.001 ? `<tr><td class="t-lbl">Round Off</td><td class="t-val">₹ ${formatNumber(invoice.roundOff)}</td></tr>` : ''}
        <tr class="grand-row"><td>Grand Total</td><td style="text-align:right;font-family:monospace">₹ ${formatNumber(invoice.grandTotal)}</td></tr>
      </table>
    </div>

    <div class="footer-grid">
      <div class="bank-box">
        <div class="section-label">Bank Details</div>
        ${bankDetails ? `<div style="font-weight:600;color:#374151">${bankDetails}</div>` : '<div style="color:#9ca3af;font-style:italic">No bank details available</div>'}
        <div style="margin-top:8px;font-size:10px;color:#6b7280">Subject to ${company?.city ?? 'local'} jurisdiction. ${invoice.isInterState ? 'IGST applicable.' : 'CGST + SGST applicable.'}</div>
      </div>
      <div class="sign-box">
        <div class="section-label" style="text-align:center">For ${companyName}</div>
        <div class="sign-line">Authorised Signatory</div>
      </div>
    </div>
  </div>
  <div class="print-note">Printed on ${new Date().toLocaleString('en-IN')} | ${invoice.invoiceNumber} | This is a computer-generated invoice</div>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (win) {
      win.document.write(printContent);
      win.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/sizing/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{invoice.invoiceNumber}</h1>
            <p className="text-gray-500">GST Tax Invoice Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={badge} size="lg" className="flex items-center gap-1">
            {statusIcon[invoice.status]}
            {invoice.status}
          </Badge>
          {invoice.isLocked && (
            <Badge variant="grey" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          )}
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Seller & Buyer Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Seller (From)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-bold text-gray-900 text-base">{company?.companyName ?? 'Sudhan Textile'}</p>
                {company?.addressLine1 && <p className="text-gray-600">{[company.addressLine1, company.addressLine2, company.city, company.state].filter(Boolean).join(', ')}</p>}
                {company?.gstin && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">GSTIN</span>
                    <span className="font-mono font-medium">{company.gstin}</span>
                  </div>
                )}
                {company?.pan && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">PAN</span>
                    <span className="font-mono font-medium">{company.pan}</span>
                  </div>
                )}
                {company?.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-mono">{company.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Bill To (Buyer)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-bold text-gray-900 text-base">{invoice.partyName}</p>
                <div className="flex justify-between">
                  <span className="text-gray-500">Party Code</span>
                  <span className="font-mono font-medium">{invoice.partyCode}</span>
                </div>
                {invoice.gstin && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">GSTIN</span>
                    <span className="font-mono font-medium">{invoice.gstin}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Place of Supply</span>
                  <span className="font-medium">{invoice.placeOfSupply}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax Type</span>
                  <Badge variant={invoice.isInterState ? 'default' : 'outline'} className="text-xs">
                    {invoice.isInterState ? 'IGST (Inter-State)' : 'CGST + SGST'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transport Details */}
          {(invoice.transportMode || invoice.vehicleNo || invoice.ewayBillNo || invoice.irnNumber) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Transport & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {invoice.transportMode && (
                    <div>
                      <p className="text-gray-500">Transport Mode</p>
                      <p className="font-medium text-gray-900">{invoice.transportMode}</p>
                    </div>
                  )}
                  {invoice.vehicleNo && (
                    <div>
                      <p className="text-gray-500">Vehicle No</p>
                      <p className="font-medium font-mono text-gray-900">{invoice.vehicleNo}</p>
                    </div>
                  )}
                  {invoice.ewayBillNo && (
                    <div>
                      <p className="text-gray-500">E-Way Bill No</p>
                      <p className="font-medium font-mono text-gray-900">{invoice.ewayBillNo}</p>
                    </div>
                  )}
                  {invoice.irnNumber && (
                    <div>
                      <p className="text-gray-500">IRN Number</p>
                      <p className="font-medium font-mono text-gray-900 text-xs">{invoice.irnNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Services / Line Items ({invoice.details.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>HSN/SAC</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead className="text-right">Rate (₹)</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                      {!invoice.isInterState ? (
                        <>
                          <TableHead className="text-right">CGST</TableHead>
                          <TableHead className="text-right">SGST</TableHead>
                        </>
                      ) : (
                        <TableHead className="text-right">IGST</TableHead>
                      )}
                      <TableHead className="text-right">Total (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.details.map((d, idx) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-gray-500">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{d.description}</TableCell>
                        <TableCell className="font-mono text-gray-600">{d.hsnCode}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(d.quantity)}</TableCell>
                        <TableCell className="text-gray-600">{d.uom}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(d.rate)}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(d.amount)}</TableCell>
                        {!invoice.isInterState ? (
                          <>
                            <TableCell className="text-right font-mono text-gray-600">
                              {d.cgstRate}% / {formatNumber(d.cgstAmount)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-gray-600">
                              {d.sgstRate}% / {formatNumber(d.sgstAmount)}
                            </TableCell>
                          </>
                        ) : (
                          <TableCell className="text-right font-mono text-gray-600">
                            {d.igstRate}% / {formatNumber(d.igstAmount)}
                          </TableCell>
                        )}
                        <TableCell className="text-right font-mono font-semibold">
                          {formatNumber(d.amount + d.cgstAmount + d.sgstAmount + d.igstAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Remarks */}
          {invoice.remarks && (
            <Card>
              <CardHeader><CardTitle className="text-base">Remarks</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-700">{invoice.remarks}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Invoice Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Invoice No</span>
                <span className="font-mono font-semibold text-gray-900 text-xs">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Invoice Date</span>
                <span className="text-gray-900">{formatDate(invoice.invoiceDate)}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Due Date</span>
                  <span className="text-gray-900">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant={badge} className="flex items-center gap-1">
                  {statusIcon[invoice.status]}
                  {invoice.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Locked</span>
                <span className={invoice.isLocked ? 'text-gray-500' : 'text-green-600'}>
                  {invoice.isLocked ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Printed</span>
                <span className="text-gray-900">{invoice.isPrinted ? formatDate(invoice.printedAt ?? '') : 'Not yet'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tax Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tax Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Taxable Amount</span>
                <span className="font-mono font-medium text-gray-900">{formatCurrency(invoice.taxableAmount)}</span>
              </div>
              {!invoice.isInterState ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">CGST</span>
                    <span className="font-mono text-gray-700">{formatCurrency(invoice.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">SGST</span>
                    <span className="font-mono text-gray-700">{formatCurrency(invoice.sgstAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">IGST</span>
                  <span className="font-mono text-gray-700">{formatCurrency(invoice.igstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total Tax</span>
                <span className="font-mono font-medium text-gray-900">{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total Amount</span>
                <span className="font-mono font-medium text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              {Math.abs(invoice.roundOff) > 0.001 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Round Off</span>
                  <span className="font-mono text-gray-600">{formatCurrency(invoice.roundOff)}</span>
                </div>
              )}
              <div className="mt-2 p-3 rounded-lg bg-blue-50">
                <p className="text-xs text-blue-700 font-medium">Grand Total</p>
                <p className="text-2xl font-bold text-blue-700 font-mono">{formatCurrency(invoice.grandTotal)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Simple number-to-words for amounts (Indian numbering)
function numberToWords(n: number): string {
  const floor = Math.floor(n);
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function helper(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '') + ' ';
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + helper(num % 100);
    if (num < 100000) return helper(Math.floor(num / 1000)) + 'Thousand ' + helper(num % 1000);
    if (num < 10000000) return helper(Math.floor(num / 100000)) + 'Lakh ' + helper(num % 100000);
    return helper(Math.floor(num / 10000000)) + 'Crore ' + helper(num % 10000000);
  }

  return helper(floor).trim() || 'Zero';
}

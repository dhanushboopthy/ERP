'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  FileText,
  IndianRupee,
  Calculator,
  Lock,
  Truck,
  Download,
  X,
  Package,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { formatNumber, formatCurrency } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { Party, SizingJobCard } from '@/types';
import { toast } from 'sonner';

// GST rates
const GST_RATE = 18; // 18% total (9% CGST + 9% SGST for intra-state, or 18% IGST for inter-state)
const DEFAULT_HSN = '998821'; // HSN for sizing services

// Indian states for place of supply
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Company state (assumed Tamil Nadu - can be made configurable)
const COMPANY_STATE = 'Tamil Nadu';

interface InvoiceDetail {
  id: string;
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
  totalAmount: number;
}

export default function NewTaxInvoicePage() {
  const router = useRouter();
  
  // Header fields
  const [partyId, setPartyId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [productionSetId, setProductionSetId] = useState<string>('');
  const [isLoadingSet, setIsLoadingSet] = useState(false);
  const [loadedSet, setLoadedSet] = useState<any>(null);
  const [dueDate, setDueDate] = useState<string>('');
  const [placeOfSupply, setPlaceOfSupply] = useState<string>(COMPANY_STATE);
  
  // Transport details
  const [transportMode, setTransportMode] = useState<string>('');
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [ewayBillNo, setEwayBillNo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  
  // Detail lines
  const [details, setDetails] = useState<InvoiceDetail[]>([]);
  
  // Computed values
  const isInterState = placeOfSupply !== COMPANY_STATE;

  // Fetch parties (customers)
  const { data: partiesRes } = useQuery({
    queryKey: ['parties', 'customers'],
    queryFn: async () => {
      const res = await apiClient.get<{ items: Party[] }>('/api/parties', {
        params: { pageNumber: 1, pageSize: 500, type: 'Customer' },
      });
      return res;
    },
  });
  const parties: Party[] = partiesRes?.data?.items || [];

  // Fetch all production sets for dropdown
  const { data: productionSetsRes } = useQuery({
    queryKey: ['productionSets'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/api/sizingjobcards/production-sets');
      return res;
    },
  });
  const productionSets: any[] = productionSetsRes?.data || [];

  // Fetch unbilled sizing job cards
  const { data: jobCardsRes } = useQuery({
    queryKey: ['sizingJobCards', 'unbilled', partyId],
    queryFn: async () => {
      const res = await apiClient.get<{ items: SizingJobCard[] }>('/api/sizingjobcards/pending-invoice', {
        params: partyId ? { partyId } : {},
      });
      return res;
    },
    enabled: !!partyId,
  });
  const unbilledJobCards: SizingJobCard[] = jobCardsRes?.data?.items || [];

  // Load production set data into invoice
  const handleLoadProductionSet = async () => {
    if (!productionSetId) {
      toast.error('Please select a Production Set');
      return;
    }
    setIsLoadingSet(true);
    try {
      const res = await apiClient.get<any>(`/api/sizingjobcards/production-set/${encodeURIComponent(productionSetId)}`);
      if (res.success && res.data) {
        const set = res.data;
        setLoadedSet(set);
        // Auto-fill party
        if (set.partyId) {
          setPartyId(set.partyId.toString());
        }
        // Auto-add as invoice line item
        const description = `Sizing charges for ${set.setId} - ${set.yarnCount || ''} (${set.totalEnds} ends, ${set.sizingMeters || 0} mtrs)`;
        const gst = calculateGST(0, isInterState);
        setDetails(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            description,
            hsnCode: DEFAULT_HSN,
            quantity: set.sizingMeters || 0,
            uom: 'MTR',
            rate: 0,
            amount: 0,
            ...gst,
            totalAmount: 0,
          },
        ]);
        toast.success(`Production set ${set.setId} loaded`);
      } else {
        toast.error(res.message || 'Production set not found');
      }
    } catch {
      toast.error('Failed to fetch production set');
    } finally {
      setIsLoadingSet(false);
    }
  };

  // Remove loaded production set data
  const handleRemoveProductionSet = () => {
    setLoadedSet(null);
    setProductionSetId('');
    setPartyId('');
    setDetails([]);
    toast.info('Production set data removed');
  };

  // Update party's default place of supply
  useEffect(() => {
    if (partyId) {
      const party = parties.find(p => p.id.toString() === partyId);
      if (party?.state) {
        setPlaceOfSupply(party.state);
      }
    }
  }, [partyId, parties]);

  // Calculate GST for a line item
  const calculateGST = useCallback((amount: number, isInter: boolean) => {
    const gstAmount = (amount * GST_RATE) / 100;
    if (isInter) {
      return {
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: GST_RATE,
        igstAmount: gstAmount,
      };
    } else {
      const halfGst = gstAmount / 2;
      return {
        cgstRate: GST_RATE / 2,
        cgstAmount: halfGst,
        sgstRate: GST_RATE / 2,
        sgstAmount: halfGst,
        igstRate: 0,
        igstAmount: 0,
      };
    }
  }, []);

  // Recalculate GST for all details when place of supply changes
  useEffect(() => {
    setDetails(details.map(d => {
      const gst = calculateGST(d.amount, isInterState);
      return {
        ...d,
        ...gst,
        totalAmount: d.amount + gst.cgstAmount + gst.sgstAmount + gst.igstAmount,
      };
    }));
  }, [isInterState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add a new detail row
  const addDetailRow = () => {
    const gst = calculateGST(0, isInterState);
    setDetails([
      ...details,
      {
        id: Date.now().toString(),
        description: '',
        hsnCode: DEFAULT_HSN,
        quantity: 0,
        uom: 'MTR',
        rate: 0,
        amount: 0,
        ...gst,
        totalAmount: 0,
      },
    ]);
  };

  // Add from sizing job card
  const addFromJobCard = (jobCard: SizingJobCard) => {
    // Check if already added
    if (details.some(d => d.sizingJobCardId === jobCard.id)) {
      toast.error('This job card is already added');
      return;
    }

    // Note: sizingRate should come from SizingRateMaster based on party/count - using 0 as placeholder
    const sizingRate = 0; // TODO: Fetch from SizingRateMaster
    const sizingMeters = jobCard.actualLength ?? 0;
    const amount = sizingMeters * sizingRate;
    const gst = calculateGST(amount, isInterState);
    const yarnCountDisplay = jobCard.countCode ?? '';
    
    setDetails([
      ...details,
      {
        id: Date.now().toString(),
        sizingJobCardId: jobCard.id,
        description: `Sizing charges for ${jobCard.setNo} - ${yarnCountDisplay} (${sizingMeters} mtrs)`,
        hsnCode: DEFAULT_HSN,
        quantity: sizingMeters,
        uom: 'MTR',
        rate: sizingRate,
        amount: amount,
        ...gst,
        totalAmount: amount + gst.cgstAmount + gst.sgstAmount + gst.igstAmount,
      },
    ]);
  };

  // Remove a detail row
  const removeDetailRow = (id: string) => {
    setDetails(details.filter(d => d.id !== id));
  };

  // Update detail row
  const updateDetail = (id: string, field: keyof InvoiceDetail, value: any) => {
    setDetails(details.map(d => {
      if (d.id !== id) return d;
      
      const updated = { ...d, [field]: value };
      
      // Recalculate amount when quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        updated.amount = updated.quantity * updated.rate;
        const gst = calculateGST(updated.amount, isInterState);
        Object.assign(updated, gst);
        updated.totalAmount = updated.amount + gst.cgstAmount + gst.sgstAmount + gst.igstAmount;
      }
      
      return updated;
    }));
  };

  // Calculate totals
  const totals = {
    taxableAmount: details.reduce((sum, d) => sum + d.amount, 0),
    cgstAmount: details.reduce((sum, d) => sum + d.cgstAmount, 0),
    sgstAmount: details.reduce((sum, d) => sum + d.sgstAmount, 0),
    igstAmount: details.reduce((sum, d) => sum + d.igstAmount, 0),
    totalGst: details.reduce((sum, d) => sum + d.cgstAmount + d.sgstAmount + d.igstAmount, 0),
    grandTotal: details.reduce((sum, d) => sum + d.totalAmount, 0),
  };

  // Round off calculation
  const roundedTotal = Math.round(totals.grandTotal);
  const roundOff = roundedTotal - totals.grandTotal;

  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post<{ id: number }>('/api/taxinvoices', data);
      if (!res.success) {
        throw new Error(res.message || 'Failed to create invoice');
      }
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Tax invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['taxInvoices'] });
      router.push(`/sizing/invoices/${(data as { id: number })?.id}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create invoice');
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    // Validation
    if (!partyId) {
      toast.error('Please select a customer');
      return;
    }
    if (!invoiceDate) {
      toast.error('Please select invoice date');
      return;
    }
    if (!placeOfSupply) {
      toast.error('Please select place of supply');
      return;
    }
    if (details.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }
    if (details.some(d => !d.description || d.quantity <= 0 || d.rate <= 0)) {
      toast.error('Please complete all line items with valid data');
      return;
    }

    const payload = {
      partyId: Number(partyId),
      invoiceDate,
      dueDate: dueDate || undefined,
      placeOfSupply,
      isInterState,
      taxableAmount: totals.taxableAmount,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      igstAmount: totals.igstAmount,
      totalAmount: totals.grandTotal,
      roundOff,
      grandTotal: roundedTotal,
      transportMode: transportMode || undefined,
      vehicleNo: vehicleNo || undefined,
      ewayBillNo: ewayBillNo || undefined,
      remarks: remarks || undefined,
      details: details.map(d => ({
        sizingJobCardId: d.sizingJobCardId,
        description: d.description,
        hsnCode: d.hsnCode,
        quantity: d.quantity,
        uom: d.uom,
        rate: d.rate,
        amount: d.amount,
        cgstRate: d.cgstRate,
        cgstAmount: d.cgstAmount,
        sgstRate: d.sgstRate,
        sgstAmount: d.sgstAmount,
        igstRate: d.igstRate,
        igstAmount: d.igstAmount,
      })),
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/sizing/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">New Tax Invoice</h1>
          <p className="text-gray-500">Create a GST compliant tax invoice</p>
        </div>
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Invoice
              </>
            )}
          </Button>
      </div>

      {/* GST Note */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>GST Information</AlertTitle>
        <AlertDescription>
          HSN/SAC Code: <strong>{DEFAULT_HSN}</strong> (Sizing/Weaving services) | 
          GST Rate: <strong>18%</strong> ({isInterState ? 'IGST 18%' : 'CGST 9% + SGST 9%'})
        </AlertDescription>
      </Alert>

      {/* Production Set Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Production Set</CardTitle>
                <CardDescription>Select a production set to auto-fill invoice details</CardDescription>
              </div>
            </div>
            {loadedSet && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Loaded
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Select value={productionSetId} onValueChange={setProductionSetId} disabled={!!loadedSet}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a production set..." />
                </SelectTrigger>
                <SelectContent>
                  {productionSets.map((set: any) => (
                    <SelectItem key={set.setId} value={set.setId}>
                      <span className="font-semibold">{set.setId}</span>
                      <span className="opacity-70"> — {set.party} · {set.yarnCount} · {set.totalEnds} ends · {set.sizingMeters} mtrs</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!loadedSet ? (
              <Button
                type="button"
                onClick={handleLoadProductionSet}
                disabled={isLoadingSet || !productionSetId}
                className="shrink-0"
              >
                {isLoadingSet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Load Data
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveProductionSet}
                className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>

          {loadedSet && (
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Party</p>
                  <p className="text-sm font-semibold text-foreground">{loadedSet.party}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Yarn Count</p>
                  <p className="text-sm font-semibold text-foreground">{loadedSet.yarnCount}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Ends</p>
                  <p className="text-sm font-semibold text-foreground">{formatNumber(loadedSet.totalEnds)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Meters</p>
                  <p className="text-sm font-semibold text-foreground">{formatNumber(loadedSet.sizingMeters)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Beams</p>
                  <p className="text-sm font-semibold text-foreground">{loadedSet.beams}</p>
                </div>
                {loadedSet.loomType && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Loom Type</p>
                    <p className="text-sm font-semibold text-foreground">{loadedSet.loomType}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Header */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Details
            </CardTitle>
            <CardDescription>Customer and invoice information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partyId">Customer *</Label>
                <Select value={partyId} onValueChange={setPartyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id.toString()}>
                        {party.partyName}
                        {party.gstin && <span className="text-gray-400 ml-2">({party.gstin})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeOfSupply">Place of Supply *</Label>
                <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                        {state === COMPANY_STATE && <span className="text-green-600 ml-2">(Intra-state)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {isInterState && (
              <Alert variant="cancelled">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Inter-state supply detected. IGST @ 18% will be applied instead of CGST+SGST.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Invoice Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxable Amount:</span>
                <span className="font-mono">{formatCurrency(totals.taxableAmount)}</span>
              </div>
              {!isInterState ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">CGST @ 9%:</span>
                    <span className="font-mono">{formatCurrency(totals.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">SGST @ 9%:</span>
                    <span className="font-mono">{formatCurrency(totals.sgstAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IGST @ 18%:</span>
                  <span className="font-mono">{formatCurrency(totals.igstAmount)}</span>
                </div>
              )}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total GST:</span>
                <span className="font-mono">{formatCurrency(totals.totalGst)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sub Total:</span>
                <span className="font-mono">{formatCurrency(totals.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Round Off:</span>
                <span className="font-mono">{roundOff >= 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Grand Total:</span>
                <span className="font-mono text-primary">{formatCurrency(roundedTotal)}</span>
              </div>
            </div>

            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Invoice will be locked after printing. No edits allowed after lock.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Transport Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Transport Details
          </CardTitle>
          <CardDescription>Optional transport and e-way bill information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="transportMode">Transport Mode</Label>
              <Select value={transportMode} onValueChange={setTransportMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Road">Road</SelectItem>
                  <SelectItem value="Rail">Rail</SelectItem>
                  <SelectItem value="Air">Air</SelectItem>
                  <SelectItem value="Ship">Ship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleNo">Vehicle No</Label>
              <Input
                id="vehicleNo"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                placeholder="TN XX YYYY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ewayBillNo">E-Way Bill No</Label>
              <Input
                id="ewayBillNo"
                value={ewayBillNo}
                onChange={(e) => setEwayBillNo(e.target.value)}
                placeholder="Enter e-way bill"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any remarks..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unbilled Job Cards Quick Add */}
      {partyId && unbilledJobCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unbilled Sizing Job Cards</CardTitle>
            <CardDescription>Click to add to invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unbilledJobCards.map((jc) => (
                <Button
                  key={jc.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addFromJobCard(jc)}
                  disabled={details.some(d => d.sizingJobCardId === jc.id)}
                  className="text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {jc.setNo} ({formatNumber(jc.actualLength ?? 0)} mtrs)
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoice Line Items</CardTitle>
            <CardDescription>Add items with HSN {DEFAULT_HSN}</CardDescription>
          </div>
          <Button onClick={addDetailRow} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Line
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Description</TableHead>
                <TableHead className="w-[100px]">HSN</TableHead>
                <TableHead className="w-[80px] text-right">Qty</TableHead>
                <TableHead className="w-[60px]">UOM</TableHead>
                <TableHead className="w-[100px] text-right">Rate</TableHead>
                <TableHead className="w-[100px] text-right">Amount</TableHead>
                <TableHead className="w-[100px] text-right">GST</TableHead>
                <TableHead className="w-[100px] text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                    No line items. Click &quot;Add Line&quot; or select from unbilled job cards.
                  </TableCell>
                </TableRow>
              ) : (
                details.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell>
                      <Input
                        value={detail.description}
                        onChange={(e) => updateDetail(detail.id, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={detail.hsnCode}
                        onChange={(e) => updateDetail(detail.id, 'hsnCode', e.target.value)}
                        className="text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={detail.quantity || ''}
                        onChange={(e) => updateDetail(detail.id, 'quantity', Number(e.target.value))}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={detail.uom}
                        onValueChange={(v) => updateDetail(detail.id, 'uom', v)}
                      >
                        <SelectTrigger className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MTR">MTR</SelectItem>
                          <SelectItem value="KGS">KGS</SelectItem>
                          <SelectItem value="NOS">NOS</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={detail.rate || ''}
                        onChange={(e) => updateDetail(detail.id, 'rate', Number(e.target.value))}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(detail.amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-500">
                      {formatCurrency(detail.cgstAmount + detail.sgstAmount + detail.igstAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(detail.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDetailRow(detail.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


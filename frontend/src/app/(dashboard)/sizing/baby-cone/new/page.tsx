'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Package,
  Scale,
  CircleDot,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface YarnReceiptOption {
  id: number;
  receiptNumber: string;
  partyName: string;
  details: YarnReceiptDetailOption[];
}

interface YarnReceiptDetailOption {
  id: number;
  yarnCountId: number;
  countCode: string;
  lotNo: string;
  netWeight: number;
  availableWeight: number;
}

export default function NewBabyConePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    babyConeDate: new Date().toISOString().split('T')[0],
    bagNo: 1,
    totalCones: 0,
    grossWeight: 0,
    tareWeight: 0,
    windingLoss: 0,
    leftoverWeight: 0,
    remarks: '',
  });

  // Fetch yarn receipts for selection (with details)
  const { data: receiptsResponse, isLoading: loadingReceipts } = useQuery({
    queryKey: ['yarnReceiptsForBabyCone'],
    queryFn: async () => {
      const res = await apiClient.get('/api/yarnreceipts', {
        params: { pageNumber: 1, pageSize: 500, includeDetails: true },
      });
      
      // Unwrap API response structure
      const payload = res as any;
      const dataLayer = payload?.data?.data || payload?.data || payload;
      const items = dataLayer?.items || dataLayer?.Items || (Array.isArray(dataLayer) ? dataLayer : []);
      
      // Map to expected format - fetch full details for each receipt
      const receiptsWithDetails = await Promise.all(
        items.map(async (receipt: any) => {
          try {
            // Fetch full receipt details
            const detailRes = await apiClient.get(`/api/yarnreceipts/${receipt.id}`);
            const detailPayload = detailRes as any;
            const fullReceipt = detailPayload?.data?.data || detailPayload?.data || detailPayload;
            
            return {
              id: fullReceipt.id,
              receiptNumber: fullReceipt.receiptNumber || fullReceipt.receiptNo,
              partyName: fullReceipt.partyName,
              details: (fullReceipt.details || []).map((d: any) => ({
                id: d.id,
                yarnCountId: d.yarnCountId,
                countCode: d.countCode,
                lotNo: d.lotNo,
                netWeight: d.netWeight,
                availableWeight: d.netWeight, // TODO: calculate from stock ledger
              })),
            };
          } catch (error) {
            console.error(`Failed to fetch details for receipt ${receipt.id}:`, error);
            return {
              id: receipt.id,
              receiptNumber: receipt.receiptNumber || receipt.receiptNo,
              partyName: receipt.partyName,
              details: [],
            };
          }
        })
      );
      
      return receiptsWithDetails;
    },
  });

  const receipts: YarnReceiptOption[] = receiptsResponse || [];

  const selectedReceipt = receipts.find(r => r.id === selectedReceiptId);
  const selectedDetail = selectedReceipt?.details?.find(d => d.id === selectedDetailId);

  // Calculate net weight and validate
  const netWeight = formData.grossWeight - formData.tareWeight;
  const actualYieldWeight = netWeight - formData.windingLoss - formData.leftoverWeight;
  const yieldPercentage = netWeight > 0 ? ((actualYieldWeight / netWeight) * 100).toFixed(2) : '0.00';

  // Comprehensive validation for submit button
  const isFormValid = 
    selectedReceiptId !== null &&
    selectedDetailId !== null &&
    formData.babyConeDate.length > 0 &&
    formData.grossWeight > 0 &&
    formData.tareWeight >= 0 &&
    netWeight > 0 &&
    formData.grossWeight > formData.tareWeight &&
    (!selectedDetail || netWeight <= selectedDetail.availableWeight);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/api/babycones', data);
      if (!res.success) {
        throw new Error(res.message || 'Failed to create baby cone');
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success('Baby cone created successfully');
      queryClient.invalidateQueries({ queryKey: ['babyCones'] });
      router.push('/sizing/baby-cone');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create baby cone');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (!selectedReceiptId) {
      toast.error('Please select a yarn receipt');
      return;
    }

    if (!selectedDetailId) {
      toast.error('Please select a yarn receipt detail');
      return;
    }

    if (!formData.babyConeDate) {
      toast.error('Please select a date');
      return;
    }

    if (formData.grossWeight <= 0) {
      toast.error('Gross weight must be greater than zero');
      return;
    }

    if (formData.grossWeight <= formData.tareWeight) {
      toast.error('Gross weight must be greater than tare weight');
      return;
    }

    if (netWeight <= 0) {
      toast.error('Net weight must be greater than zero');
      return;
    }

    if (selectedDetail && netWeight > selectedDetail.availableWeight) {
      toast.error(`Net weight (${formatNumber(netWeight)} kg) exceeds available yarn (${formatNumber(selectedDetail.availableWeight)} kg)`);
      return;
    }

    // Submit valid data
    createMutation.mutate({
      babyConeDate: formData.babyConeDate,
      yarnReceiptDetailId: selectedDetailId,
      lotNo: selectedDetail?.lotNo || '',
      bagNo: formData.bagNo,
      totalCones: formData.totalCones,
      grossWeight: formData.grossWeight,
      tareWeight: formData.tareWeight,
      windingLoss: formData.windingLoss,
      leftoverWeight: formData.leftoverWeight,
      remarks: formData.remarks || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/sizing/baby-cone">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Baby Cone Entry</h1>
            <p className="text-gray-500">Create a new winding / baby cone entry</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Source Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Source Yarn Selection
                </CardTitle>
                <CardDescription>
                  Select the yarn receipt and detail to create baby cone from
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="receiptId">Yarn Receipt *</Label>
                    <Select
                      value={selectedReceiptId?.toString() || ''}
                      onValueChange={(value) => {
                        setSelectedReceiptId(parseInt(value));
                        setSelectedDetailId(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select yarn receipt" />
                      </SelectTrigger>
                      <SelectContent>
                        {receipts.map((receipt) => (
                          <SelectItem key={receipt.id} value={receipt.id.toString()}>
                            {receipt.receiptNumber} - {receipt.partyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detailId">Yarn Detail (Count / Lot) *</Label>
                    <Select
                      value={selectedDetailId?.toString() || ''}
                      onValueChange={(value) => setSelectedDetailId(parseInt(value))}
                      disabled={!selectedReceiptId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select yarn detail" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedReceipt?.details?.map((detail) => (
                          <SelectItem key={detail.id} value={detail.id.toString()}>
                            {detail.countCode} - Lot: {detail.lotNo} (Avl: {formatNumber(detail.availableWeight)} kg)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedDetail && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Selected:</strong> {selectedDetail.countCode} | Lot: {selectedDetail.lotNo}
                      <br />
                      <strong>Total Weight:</strong> {formatNumber(selectedDetail.netWeight)} kg |{' '}
                      <strong>Available:</strong> {formatNumber(selectedDetail.availableWeight)} kg
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Baby Cone Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircleDot className="h-5 w-5" />
                  Baby Cone Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="babyConeDate">Date *</Label>
                    <Input
                      id="babyConeDate"
                      type="date"
                      value={formData.babyConeDate}
                      onChange={(e) => setFormData({ ...formData, babyConeDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bagNo">Bag No *</Label>
                    <Input
                      id="bagNo"
                      type="number"
                      min="1"
                      value={formData.bagNo}
                      onChange={(e) => setFormData({ ...formData, bagNo: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalCones">Total Cones *</Label>
                    <Input
                      id="totalCones"
                      type="number"
                      min="0"
                      value={formData.totalCones}
                      onChange={(e) => setFormData({ ...formData, totalCones: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weight Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Weight Details (kg)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="grossWeight">Gross Weight *</Label>
                    <Input
                      id="grossWeight"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.grossWeight}
                      onChange={(e) => setFormData({ ...formData, grossWeight: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tareWeight">Tare Weight *</Label>
                    <Input
                      id="tareWeight"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.tareWeight}
                      onChange={(e) => setFormData({ ...formData, tareWeight: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Net Weight</Label>
                    <Input
                      value={formatNumber(netWeight)}
                      readOnly
                      className="bg-gray-100 font-mono"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="windingLoss">Winding Loss</Label>
                    <Input
                      id="windingLoss"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.windingLoss}
                      onChange={(e) => setFormData({ ...formData, windingLoss: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leftoverWeight">Leftover Weight</Label>
                    <Input
                      id="leftoverWeight"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.leftoverWeight}
                      onChange={(e) => setFormData({ ...formData, leftoverWeight: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Any additional notes..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gross Weight</span>
                    <span className="font-mono">{formatNumber(formData.grossWeight)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tare Weight</span>
                    <span className="font-mono">- {formatNumber(formData.tareWeight)} kg</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between font-medium">
                    <span>Net Weight</span>
                    <span className="font-mono">{formatNumber(netWeight)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Winding Loss</span>
                    <span className="font-mono">- {formatNumber(formData.windingLoss)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Leftover</span>
                    <span className="font-mono">- {formatNumber(formData.leftoverWeight)} kg</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between font-medium text-green-600">
                    <span>Actual Yield</span>
                    <span className="font-mono">{formatNumber(actualYieldWeight)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Yield %</span>
                    <span className="font-mono">{yieldPercentage}%</span>
                  </div>
                </div>

                {selectedDetail && netWeight > selectedDetail.availableWeight && (
                  <div className="rounded-lg bg-red-50 p-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Exceeds available yarn!</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Baby Cone
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}


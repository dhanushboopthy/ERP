'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Save, Scale } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import { BabyConeDto } from '@/types';
import { toast } from 'sonner';

export default function EditBabyConePage() {
  return (
    <RouteGuard requiredPermission="BABY_CONE.EDIT">
      <EditBabyConeContent />
    </RouteGuard>
  );
}

function EditBabyConeContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    windingLoss: 0,
    leftoverWeight: 0,
    remarks: '',
  });
  const [initialized, setInitialized] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['babyCone', id],
    queryFn: async () => {
      const res = await apiClient.get<BabyConeDto>(`/api/babycones/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Baby cone not found');
    },
    retry: 0,
  });

  // Initialize form data when data loads
  if (data && !initialized) {
    setFormData({
      windingLoss: data.windingLoss,
      leftoverWeight: data.leftoverWeight,
      remarks: data.remarks || '',
    });
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: async (payload: { windingLoss: number; leftoverWeight: number; remarks?: string }) => {
      const res = await apiClient.put(`/api/babycones/${id}`, payload);
      if (!res.success) {
        throw new Error(res.message || 'Failed to update baby cone');
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success('Baby cone updated successfully');
      queryClient.invalidateQueries({ queryKey: ['babyCones'] });
      queryClient.invalidateQueries({ queryKey: ['babyCone', id] });
      router.push(`/sizing/baby-cone/${id}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update baby cone');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.windingLoss < 0) {
      toast.error('Winding loss cannot be negative');
      return;
    }
    if (formData.leftoverWeight < 0) {
      toast.error('Leftover weight cannot be negative');
      return;
    }

    updateMutation.mutate({
      windingLoss: formData.windingLoss,
      leftoverWeight: formData.leftoverWeight,
      remarks: formData.remarks || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-red-600 font-medium">Baby cone not found</p>
            <p className="text-sm text-gray-500">The requested baby cone entry could not be loaded.</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.isUsedInWarping) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/sizing/baby-cone/${id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.babyConeNo}</h1>
            <p className="text-gray-500">This baby cone cannot be edited</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-orange-600">
              <Scale className="h-5 w-5" />
              <p className="font-medium">This baby cone has already been used in warping and cannot be modified.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const netWeight = data.grossWeight - data.tareWeight;
  const actualYield = netWeight - formData.windingLoss - formData.leftoverWeight;
  const yieldPct = netWeight > 0 ? ((actualYield / netWeight) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/sizing/baby-cone/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit {data.babyConeNo}</h1>
          <p className="text-gray-500">Update winding loss and leftover weight</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left - Read-only Info + Editable Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Read-only Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Baby Cone Information</CardTitle>
                <CardDescription>These fields are read-only</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">BC Number</p>
                    <p className="font-mono font-medium text-gray-900">{data.babyConeNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">{formatDate(data.babyConeDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Party</p>
                    <p className="font-medium text-gray-900">{data.partyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Yarn Count</p>
                    <Badge variant="outline">{data.countCode}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Receipt No</p>
                    <p className="font-mono text-gray-900">{data.yarnReceiptNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lot No</p>
                    <p className="font-medium text-gray-900">{data.lotNo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Cones</p>
                    <p className="font-mono font-medium text-gray-900">{data.totalCones}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gross Weight</p>
                    <p className="font-mono text-gray-900">{formatNumber(data.grossWeight)} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Net Weight</p>
                    <p className="font-mono font-semibold text-gray-900">{formatNumber(data.netWeight)} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-5 w-5 text-blue-600" />
                  Editable Fields
                </CardTitle>
                <CardDescription>Update winding loss and leftover weight</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="windingLoss">Winding Loss (kg)</Label>
                    <Input
                      id="windingLoss"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.windingLoss}
                      onChange={(e) => setFormData(prev => ({ ...prev, windingLoss: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leftoverWeight">Leftover Weight (kg)</Label>
                    <Input
                      id="leftoverWeight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.leftoverWeight}
                      onChange={(e) => setFormData(prev => ({ ...prev, leftoverWeight: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Add any notes or remarks..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weight Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Gross Weight</span>
                  <span className="font-mono text-gray-900">{formatNumber(data.grossWeight)} kg</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Tare Weight</span>
                  <span className="font-mono text-gray-900">{formatNumber(data.tareWeight)} kg</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Net Weight</span>
                  <span className="font-mono font-semibold text-gray-900">{formatNumber(data.netWeight)} kg</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Winding Loss</span>
                  <span className="font-mono text-orange-600">{formatNumber(formData.windingLoss)} kg</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Leftover</span>
                  <span className="font-mono text-gray-900">{formatNumber(formData.leftoverWeight)} kg</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">Actual Yield</span>
                  <span className="font-mono font-semibold text-green-600">{formatNumber(actualYield)} kg</span>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-blue-50">
                  <p className="text-xs text-blue-700 font-medium">Yield Percentage</p>
                  <p className="text-xl font-bold text-blue-700 font-mono">{yieldPct}%</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Link href={`/sizing/baby-cone/${id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

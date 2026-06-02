'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Pencil, Package, Scale, CircleDot } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import { BabyConeDto } from '@/types';

export default function BabyConeDetailPage() {
  return (
    <RouteGuard requiredPermission="BABY_CONE.VIEW">
      <BabyConeDetailContent />
    </RouteGuard>
  );
}

function BabyConeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['babyCone', id],
    queryFn: async () => {
      const res = await apiClient.get<BabyConeDto>(`/api/babycones/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Baby cone not found');
    },
    retry: 0,
  });

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

  const netWeight = data.grossWeight - data.tareWeight;

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
            <h1 className="text-2xl font-bold text-gray-900">{data.babyConeNo}</h1>
            <p className="text-gray-500">Baby Cone / Winding Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={data.isUsedInWarping ? 'grey' : 'default'} className="text-sm px-3 py-1">
            {data.isUsedInWarping ? 'Used in Warping' : 'Available'}
          </Badge>
          {!data.isUsedInWarping && (
            <Link href={`/sizing/baby-cone/${data.id}/edit`}>
              <Button>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Source Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-blue-600" />
                Source Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Yarn Receipt No</p>
                  <p className="font-medium text-gray-900">{data.yarnReceiptNo}</p>
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
                  <p className="text-sm text-gray-500">Lot No</p>
                  <p className="font-medium text-gray-900">{data.lotNo || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Winding Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CircleDot className="h-5 w-5 text-blue-600" />
                Winding Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Baby Cone Date</p>
                  <p className="font-medium text-gray-900">{formatDate(data.babyConeDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bag No</p>
                  <p className="font-medium text-gray-900 font-mono">{data.bagNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Cones</p>
                  <p className="font-medium text-gray-900 font-mono">{data.totalCones}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weight Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-5 w-5 text-blue-600" />
                Weight Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Gross Weight</p>
                  <p className="font-medium text-gray-900 font-mono">{formatNumber(data.grossWeight)} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tare Weight</p>
                  <p className="font-medium text-gray-900 font-mono">{formatNumber(data.tareWeight)} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Net Weight</p>
                  <p className="font-semibold text-gray-900 font-mono text-lg">{formatNumber(data.netWeight)} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Winding Loss</p>
                  <p className="font-medium text-orange-600 font-mono">{formatNumber(data.windingLoss)} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Leftover Weight</p>
                  <p className="font-medium text-gray-900 font-mono">{formatNumber(data.leftoverWeight)} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actual Yield</p>
                  <p className="font-medium text-green-600 font-mono">
                    {formatNumber(data.netWeight - data.windingLoss - data.leftoverWeight)} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remarks */}
          {data.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{data.remarks}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">BC Number</span>
                <span className="font-mono font-medium text-gray-900">{data.babyConeNo}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-gray-900">{formatDate(data.babyConeDate)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Net Weight</span>
                <span className="font-mono font-semibold text-gray-900">{formatNumber(data.netWeight)} kg</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total Cones</span>
                <span className="font-mono font-medium text-gray-900">{data.totalCones}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Winding Loss</span>
                <span className="font-mono text-orange-600">{formatNumber(data.windingLoss)} kg</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant={data.isUsedInWarping ? 'grey' : 'default'}>
                  {data.isUsedInWarping ? 'Used' : 'Available'}
                </Badge>
              </div>

              {netWeight > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-blue-50">
                  <p className="text-xs text-blue-700 font-medium">Yield Percentage</p>
                  <p className="text-xl font-bold text-blue-700 font-mono">
                    {((data.netWeight - data.windingLoss - data.leftoverWeight) / netWeight * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

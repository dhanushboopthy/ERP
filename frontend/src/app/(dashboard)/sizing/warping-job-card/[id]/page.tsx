'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate, formatNumber } from '@/lib/utils';
import { ArrowLeft, FileText, Package, Settings, Cylinder, Loader2, AlertCircle } from 'lucide-react';

interface WarpingJobCardDetail {
  id: number;
  jobCardNumber: string;
  setNo: string;
  jobCardDate: string;
  partyId: number;
  partyCode: string;
  partyName: string;
  yarnCountId: number;
  countCode: string;
  lotNo: string;
  totalEnds: number;
  endsPerBeam: number;
  setLength: number;
  actualLength: number | null;
  numberOfBeams: number;
  warpingMachineNo: string | null;
  status: string;
  warpingDate: string | null;
  remarks: string | null;
  beams: Array<{
    id: number;
    beamId: number;
    beamNo: string;
    beamSequence: number;
    ends: number;
    meters: number;
    grossWeight: number;
  }>;
}

const statusVariant: Record<string, 'draft' | 'active' | 'completed' | 'grey'> = {
  Draft: 'draft',
  'In Progress': 'active',
  Completed: 'completed',
};

export default function WarpingJobCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['warpingJobCard', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/warpingjobcards/${id}`);
      if (response && response.data) return response.data as WarpingJobCardDetail;
      return null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Job card not found</h2>
        <Button onClick={() => router.push('/sizing/warping-job-card')}>Back to List</Button>
      </div>
    );
  }

  const beams = data.beams || [];
  const totalMeters = beams.reduce((s, b) => s + (b.meters || 0), 0);
  const totalWeight = beams.reduce((s, b) => s + (b.grossWeight || 0), 0);
  const totalEndsBeams = beams.reduce((s, b) => s + (b.ends || 0), 0);
  const badge = statusVariant[data.status] ?? 'grey';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/sizing/warping-job-card">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.jobCardNumber}</h1>
            <p className="text-gray-500">Warping Job Card Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data.status === 'Draft' && (
            <Link href={`/sizing/warping-job-card/${id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          )}
          <Badge variant={badge} size="lg">
            {data.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Set No</p>
                  <p className="font-medium text-gray-900">{data.setNo}</p>
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

          {/* Operation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-5 w-5 text-blue-600" />
                Operation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Job Card Date</p>
                  <p className="font-medium text-gray-900">{data.jobCardDate !== '0001-01-01T00:00:00' ? formatDate(data.jobCardDate) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Warping Date</p>
                  <p className="font-medium text-gray-900">{data.warpingDate ? formatDate(data.warpingDate) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Machine No</p>
                  <p className="font-medium text-gray-900 font-mono">{data.warpingMachineNo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Ends</p>
                  <p className="font-medium text-gray-900 font-mono">{formatNumber(data.totalEnds)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ends Per Beam</p>
                  <p className="font-medium text-gray-900 font-mono">{formatNumber(data.endsPerBeam)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Number of Beams</p>
                  <p className="font-medium text-gray-900 font-mono">{data.numberOfBeams || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Set Length</p>
                  <p className="font-medium text-gray-900 font-mono">{formatNumber(data.setLength)} m</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actual Length</p>
                  <p className="font-medium text-gray-900 font-mono">{data.actualLength != null ? `${formatNumber(data.actualLength)} m` : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Beam Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cylinder className="h-5 w-5 text-blue-600" />
                Beam Details ({beams.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {beams.length === 0 ? (
                <p className="text-gray-400 text-center py-6 italic">No beam details recorded</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seq</TableHead>
                        <TableHead>Beam No</TableHead>
                        <TableHead className="text-right">Ends</TableHead>
                        <TableHead className="text-right">Meters</TableHead>
                        <TableHead className="text-right">Weight (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {beams.map((beam) => (
                        <TableRow key={beam.id}>
                          <TableCell className="font-mono text-gray-500">{beam.beamSequence}</TableCell>
                          <TableCell className="font-medium">{beam.beamNo}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(beam.ends)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(beam.meters)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(beam.grossWeight)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-semibold">
                        <TableCell colSpan={2} className="text-right text-gray-600">Totals</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(totalEndsBeams)}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(totalMeters)}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(totalWeight)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
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
                <span className="text-sm text-gray-500">Job Card No</span>
                <span className="font-mono font-medium text-gray-900">{data.jobCardNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Set No</span>
                <span className="font-medium text-gray-900">{data.setNo}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total Ends</span>
                <span className="font-mono font-medium text-gray-900">{formatNumber(data.totalEnds)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Set Length</span>
                <span className="font-mono font-medium text-gray-900">{formatNumber(data.setLength)} m</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Beams</span>
                <span className="font-mono font-medium text-gray-900">{beams.length} / {data.numberOfBeams || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant={badge}>{data.status}</Badge>
              </div>

              {beams.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-blue-50">
                  <p className="text-xs text-blue-700 font-medium">Total Beam Weight</p>
                  <p className="text-xl font-bold text-blue-700 font-mono">
                    {formatNumber(totalWeight)} kg
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Production Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-blue-600" />
                Production Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Machine</span>
                <span className="font-mono font-medium">{data.warpingMachineNo || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ends/Beam</span>
                <span className="font-mono font-medium">{formatNumber(data.endsPerBeam)}</span>
              </div>
              {data.actualLength != null && data.setLength > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Length Efficiency</span>
                  <span className="font-mono font-semibold text-green-600">
                    {((data.actualLength / data.setLength) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

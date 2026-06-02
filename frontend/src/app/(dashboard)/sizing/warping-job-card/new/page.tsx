'use client';

import { useState, useEffect } from 'react';
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
  ClipboardList,
  Calculator,
  Package,
  Clock,
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
import { formatNumber } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { Party, YarnCount, Beam, BabyConeDto, YarnReceiptDetail } from '@/types';
import { toast } from 'sonner';

interface BeamDetail {
  id: string;
  beamId: number;
  beamNo: string;
  beamSequence: number;
  ends: number;
  meters: number;
  grossWeight: number;
}

interface YarnConsumption {
  id: string;
  source: 'BabyCone' | 'YarnReceipt';
  babyConeId?: number;
  yarnReceiptDetailId?: number;
  yarnCountId: number;
  yarnCountName: string;
  lotNo: string;
  conesUsed: number;
  weightUsed: number;
  availableWeight: number;
}

export default function NewWarpingJobCardPage() {
  const router = useRouter();
  
  // Header fields
  const [partyId, setPartyId] = useState<string>('');
  const [yarnCountId, setYarnCountId] = useState<string>('');
  const [lotNo, setLotNo] = useState('');
  const [totalEnds, setTotalEnds] = useState<number>(0);
  const [totalMeters, setTotalMeters] = useState<number>(0);
  const [setNo, setSetNo] = useState('');
  
  // Warping specific fields (audit requirement)
  const [rpmSpeed, setRpmSpeed] = useState<number | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [breakCount, setBreakCount] = useState<number>(0);
  const [machineNo, setMachineNo] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [remnantCones, setRemnantCones] = useState<number>(0);
  const [wasteWeight, setWasteWeight] = useState<number>(0);
  const [isKarlMayer, setIsKarlMayer] = useState(false);
  const [remarks, setRemarks] = useState('');
  
  // Detail sections
  const [beamDetails, setBeamDetails] = useState<BeamDetail[]>([]);
  const [yarnConsumption, setYarnConsumption] = useState<YarnConsumption[]>([]);

  // Fetch parties
  const { data: partiesRes } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const res = await apiClient.get<{ items: Party[] }>('/api/parties', {
        params: { pageNumber: 1, pageSize: 500 },
      });
      if (!res.success) throw new Error(res.message || 'Failed to fetch parties');
      return res.data;
    },
  });
  const parties: Party[] = partiesRes?.items || [];

  // Fetch yarn counts
  const { data: yarnCountsRes } = useQuery({
    queryKey: ['yarnCounts'],
    queryFn: async () => {
      const res = await apiClient.get<YarnCount[]>('/api/yarncounts');
      if (!res.success) throw new Error(res.message || 'Failed to fetch yarn counts');
      return res.data;
    },
  });
  const yarnCounts: YarnCount[] = Array.isArray(yarnCountsRes) ? yarnCountsRes : [];

  // Fetch all active beams (no status filter — user may reuse beams)
  const { data: beamsRes } = useQuery({
    queryKey: ['beams', 'all'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/api/beams', {
        params: { pageSize: 500 },
      });
      if (!res.success) throw new Error(res.message || 'Failed to fetch beams');
      // Backend returns ApiResponse<PagedResult<BeamDto>> → res.data.items
      const d = res.data;
      return d?.items ?? d?.Items ?? (Array.isArray(d) ? d : []);
    },
  });
  const availableBeams: Beam[] = Array.isArray(beamsRes) ? beamsRes : [];

  // Fetch baby cones for selected yarn count/lot
  const { data: babyConesRes } = useQuery({
    queryKey: ['babyCones', yarnCountId, lotNo],
    queryFn: async () => {
      const res = await apiClient.get<any>('/api/babycones', {
        params: {
          pageNumber: 1,
          pageSize: 500,
          isUsedInWarping: false,
          ...(yarnCountId && { yarnCountId }),
          ...(lotNo && { lotNo }),
        },
      });
      if (!res.success) throw new Error(res.message || 'Failed to fetch baby cones');
      // Backend returns { success, data: [...] } directly for baby cones
      return res.data || [];
    },
    enabled: true, // Always fetch to show all available cones
  });
  const babyCones: BabyConeDto[] = Array.isArray(babyConesRes) ? babyConesRes : [];

  // Add beam row
  const addBeamRow = () => {
    const nextSequence = beamDetails.length + 1;
    setBeamDetails([
      ...beamDetails,
      {
        id: Date.now().toString(),
        beamId: 0,
        beamNo: '',
        beamSequence: nextSequence,
        ends: 0,
        meters: totalMeters,
        grossWeight: 0,
      },
    ]);
  };

  // Remove beam row
  const removeBeamRow = (id: string) => {
    const newDetails = beamDetails.filter(b => b.id !== id);
    // Resequence
    newDetails.forEach((b, idx) => {
      b.beamSequence = idx + 1;
    });
    setBeamDetails(newDetails);
  };

  // Update beam row
  const updateBeamDetail = (id: string, field: keyof BeamDetail, value: any) => {
    setBeamDetails(beamDetails.map(b => {
      if (b.id !== id) return b;
      const updated = { ...b, [field]: value };
      
      // Update beam number when beam changes
      if (field === 'beamId') {
        const beam = availableBeams.find(ab => ab.id === Number(value));
        updated.beamNo = beam?.beamNo || '';
      }
      
      return updated;
    }));
  };

  // Add yarn consumption row
  const addYarnConsumptionRow = () => {
    const yarnCount = yarnCounts.find(yc => yc.id === Number(yarnCountId));
    setYarnConsumption([
      ...yarnConsumption,
      {
        id: Date.now().toString(),
        source: 'BabyCone',
        yarnCountId: Number(yarnCountId) || 0,
        yarnCountName: yarnCount?.countDescription || yarnCount?.countCode || '',
        lotNo: lotNo,
        conesUsed: 0,
        weightUsed: 0,
        availableWeight: 0,
      },
    ]);
  };

  // Remove yarn consumption row
  const removeYarnConsumptionRow = (id: string) => {
    setYarnConsumption(yarnConsumption.filter(yc => yc.id !== id));
  };

  // Update yarn consumption row
  const updateYarnConsumption = (id: string, field: keyof YarnConsumption, value: any) => {
    setYarnConsumption(yarnConsumption.map(yc => {
      if (yc.id !== id) return yc;
      const updated = { ...yc, [field]: value };
      
      // Update available weight when baby cone changes
      if (field === 'babyConeId') {
        const cone = babyCones.find(bc => bc.id === Number(value));
        updated.availableWeight = cone?.leftoverWeight || 0;
        updated.yarnCountName = cone?.countCode || '';
        updated.lotNo = cone?.lotNo || '';
      }
      
      return updated;
    }));
  };

  // Calculate totals
  const totalBeamEnds = beamDetails.reduce((sum, b) => sum + b.ends, 0);
  const totalBeamWeight = beamDetails.reduce((sum, b) => sum + b.grossWeight, 0);
  const totalYarnUsed = yarnConsumption.reduce((sum, yc) => sum + yc.weightUsed, 0);
  const wastagePercent = totalYarnUsed > 0 ? (wasteWeight / totalYarnUsed) * 100 : 0;
  
  // Calculate excess/shortage
  const expectedYarn = calculateExpectedYarn(totalEnds, totalMeters, Number(yarnCountId));
  const excessShortage = totalYarnUsed - expectedYarn;

  function calculateExpectedYarn(ends: number, meters: number, countId: number): number {
    // Formula: Weight (kg) = (Ends × Meters) / (840 × Count × 0.4536)
    const yarnCount = yarnCounts.find(yc => yc.id === countId);
    if (!yarnCount || !ends || !meters) return 0;
    const count = parseFloat((yarnCount.countDescription || yarnCount.countCode).replace(/[^0-9.]/g, '')) || 40;
    return (ends * meters) / (840 * count * 0.4536);
  }

  // Calculate warping duration
  const getWarpingDuration = () => {
    if (!startTime || !endTime) return null;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return null;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Validation warnings
  const getValidationWarnings = () => {
    const warnings: string[] = [];
    
    // Check ends distribution
    if (totalEnds > 0 && totalBeamEnds !== totalEnds) {
      warnings.push(`Total ends on beams (${totalBeamEnds}) doesn't match total ends (${totalEnds})`);
    }
    
    // Check yarn consumption exceeds available
    yarnConsumption.forEach(yc => {
      if (yc.weightUsed > yc.availableWeight && yc.availableWeight > 0) {
        warnings.push(`Yarn consumption ${formatNumber(yc.weightUsed)} kg exceeds available ${formatNumber(yc.availableWeight)} kg`);
      }
    });
    
    // Check significant excess/shortage (> 5%)
    if (expectedYarn > 0) {
      const variancePercent = Math.abs(excessShortage / expectedYarn) * 100;
      if (variancePercent > 5) {
        warnings.push(`Yarn variance is ${variancePercent.toFixed(1)}% (${excessShortage > 0 ? 'excess' : 'shortage'}: ${formatNumber(Math.abs(excessShortage))} kg)`);
      }
    }
    
    return warnings;
  };

  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/api/warpingjobcards', data);
      if (!res.success) {
        throw new Error(res.message || 'Failed to create warping job card');
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success('Warping job card created successfully');
      queryClient.invalidateQueries({ queryKey: ['warpingJobCards'] });
      router.push('/sizing/warping-job-card');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create warping job card');
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    // Validation
    if (!partyId) {
      toast.error('Please select a party');
      return;
    }
    if (!yarnCountId) {
      toast.error('Please select a yarn count');
      return;
    }
    if (!lotNo) {
      toast.error('Please enter a lot number');
      return;
    }
    if (totalEnds <= 0) {
      toast.error('Please enter total ends');
      return;
    }
    if (totalMeters <= 0) {
      toast.error('Please enter total meters');
      return;
    }
    if (beamDetails.length === 0) {
      toast.error('Please add at least one beam');
      return;
    }
    if (beamDetails.some(b => !b.beamId)) {
      toast.error('Please select a beam for all rows');
      return;
    }
    const payload = {
      jobCardDate: new Date().toISOString().split('T')[0],
      partyId: Number(partyId),
      yarnCountId: Number(yarnCountId),
      lotNo: lotNo || null,
      totalEnds,
      endsPerBeam: beamDetails.length > 0 ? Math.ceil(totalEnds / beamDetails.length) : totalEnds,
      setLength: totalMeters,
      numberOfBeams: beamDetails.length,
      warpingMachineNo: machineNo || undefined,
      remarks: remarks || undefined,
      beamIds: beamDetails.map(b => b.beamId),
    };

    createMutation.mutate(payload);
  };

  const warnings = getValidationWarnings();
  const warpingDuration = getWarpingDuration();

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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">New Warping Job Card</h1>
            <p className="text-gray-500">Create a new warping job card with complete details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Job Card
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <Alert variant="cancelled">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validation Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Job Card Information
            </CardTitle>
            <CardDescription>Basic warping job details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="setNo">Set ID</Label>
                <Input
                  id="setNo"
                  value="Auto-generated (SET-YYYYMMDD-XXX)"
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400">Automatically assigned on save</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partyId">Party *</Label>
                <Select value={partyId} onValueChange={setPartyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select party" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id.toString()}>
                        {party.partyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yarnCountId">Yarn Count *</Label>
                <Select value={yarnCountId} onValueChange={setYarnCountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent>
                    {yarnCounts.map((yc) => (
                      <SelectItem key={yc.id} value={yc.id.toString()}>
                        {yc.countDescription || yc.countCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="lotNo">Lot No *</Label>
                <Input
                  id="lotNo"
                  value={lotNo}
                  onChange={(e) => setLotNo(e.target.value)}
                  placeholder="Enter lot number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalEnds">Total Ends *</Label>
                <Input
                  id="totalEnds"
                  type="number"
                  value={totalEnds || ''}
                  onChange={(e) => setTotalEnds(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalMeters">Total Meters *</Label>
                <Input
                  id="totalMeters"
                  type="number"
                  value={totalMeters || ''}
                  onChange={(e) => setTotalMeters(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Calculations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Beams:</span>
                <span className="font-mono">{beamDetails.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Beam Ends:</span>
                <span className={`font-mono ${totalBeamEnds !== totalEnds && totalEnds > 0 ? 'text-red-600' : ''}`}>
                  {totalBeamEnds}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Beam Weight:</span>
                <span className="font-mono">{formatNumber(totalBeamWeight)} kg</span>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expected Yarn:</span>
                <span className="font-mono">{formatNumber(expectedYarn)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Yarn Used:</span>
                <span className="font-mono">{formatNumber(totalYarnUsed)} kg</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700">Excess/Shortage:</span>
                <span className={`font-mono ${excessShortage > 0 ? 'text-green-600' : excessShortage < 0 ? 'text-red-600' : ''}`}>
                  {excessShortage > 0 ? '+' : ''}{formatNumber(excessShortage)} kg
                </span>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Waste Weight:</span>
                <span className="font-mono">{formatNumber(wasteWeight)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Wastage %:</span>
                <span className={`font-mono ${wastagePercent > 2 ? 'text-red-600' : ''}`}>
                  {wastagePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Remnant Cones:</span>
                <span className="font-mono">{remnantCones}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warping Machine Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Warping Details
          </CardTitle>
          <CardDescription>Machine settings, timing, and operator information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="machineNo">Machine No</Label>
              <Input
                id="machineNo"
                value={machineNo}
                onChange={(e) => setMachineNo(e.target.value)}
                placeholder="e.g., WM-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpmSpeed">RPM Speed</Label>
              <Input
                id="rpmSpeed"
                type="number"
                value={rpmSpeed || ''}
                onChange={(e) => setRpmSpeed(Number(e.target.value) || undefined)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operatorName">Operator Name</Label>
              <Input
                id="operatorName"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakCount">Breaks Count</Label>
              <Input
                id="breakCount"
                type="number"
                value={breakCount || ''}
                onChange={(e) => setBreakCount(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="h-10 px-3 py-2 bg-gray-50 rounded-md border flex items-center">
                <span className="font-mono text-gray-600">
                  {warpingDuration || '-'}
                </span>
              </div>
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isKarlMayer"
                  checked={isKarlMayer}
                  onCheckedChange={(checked) => setIsKarlMayer(checked === true)}
                />
                <Label htmlFor="isKarlMayer" className="font-medium">
                  Karl Mayer Machine
                </Label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="remnantCones">Remnant Cones</Label>
              <Input
                id="remnantCones"
                type="number"
                value={remnantCones || ''}
                onChange={(e) => setRemnantCones(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wasteWeight">Waste Weight (kg)</Label>
              <Input
                id="wasteWeight"
                type="number"
                step="0.01"
                value={wasteWeight || ''}
                onChange={(e) => setWasteWeight(Number(e.target.value))}
                placeholder="0.00"
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

      {/* Beam Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Beam Details</CardTitle>
            <CardDescription>Configure beams for this warping job</CardDescription>
          </div>
          <Button onClick={addBeamRow} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Beam
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Seq</TableHead>
                <TableHead className="w-[200px]">Beam</TableHead>
                <TableHead className="w-[120px] text-right">Ends</TableHead>
                <TableHead className="w-[120px] text-right">Meters</TableHead>
                <TableHead className="w-[120px] text-right">Weight (kg)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beamDetails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    No beams added. Click &quot;Add Beam&quot; to start.
                  </TableCell>
                </TableRow>
              ) : (
                beamDetails.map((beam) => (
                  <TableRow key={beam.id}>
                    <TableCell className="font-mono">{beam.beamSequence}</TableCell>
                    <TableCell>
                      <Select
                        value={beam.beamId ? beam.beamId.toString() : ''}
                        onValueChange={(v) => updateBeamDetail(beam.id, 'beamId', Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select beam" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBeams.map((b) => (
                            <SelectItem key={b.id} value={b.id.toString()}>
                              {b.beamNo}{b.status && b.status !== 'Available' ? ` (${b.status})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={beam.ends || ''}
                        onChange={(e) => updateBeamDetail(beam.id, 'ends', Number(e.target.value))}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={beam.meters || ''}
                        onChange={(e) => updateBeamDetail(beam.id, 'meters', Number(e.target.value))}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={beam.grossWeight || ''}
                        onChange={(e) => updateBeamDetail(beam.id, 'grossWeight', Number(e.target.value))}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBeamRow(beam.id)}
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

      {/* Yarn Consumption */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Yarn Consumption
            </CardTitle>
            <CardDescription>Record yarn used from baby cones or receipt details</CardDescription>
          </div>
          <Button onClick={addYarnConsumptionRow} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Yarn
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Source (Baby Cone)</TableHead>
                <TableHead>Yarn Count</TableHead>
                <TableHead>Lot No</TableHead>
                <TableHead className="w-[100px] text-right">Available</TableHead>
                <TableHead className="w-[100px] text-right">Cones</TableHead>
                <TableHead className="w-[120px] text-right">Weight (kg)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yarnConsumption.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                    No yarn consumption recorded. Click &quot;Add Yarn&quot; to start.
                  </TableCell>
                </TableRow>
              ) : (
                yarnConsumption.map((yc) => (
                  <TableRow key={yc.id}>
                    <TableCell>
                      <Select
                        value={yc.babyConeId ? yc.babyConeId.toString() : ''}
                        onValueChange={(v) => updateYarnConsumption(yc.id, 'babyConeId', Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cone" />
                        </SelectTrigger>
                        <SelectContent>
                          {babyCones.map((bc) => (
                            <SelectItem key={bc.id} value={bc.id.toString()}>
                              {bc.babyConeNo} - {formatNumber(bc.leftoverWeight)} kg
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{yc.yarnCountName || '-'}</TableCell>
                    <TableCell>{yc.lotNo || '-'}</TableCell>
                    <TableCell className="text-right font-mono text-gray-500">
                      {formatNumber(yc.availableWeight)} kg
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={yc.conesUsed || ''}
                        onChange={(e) => updateYarnConsumption(yc.id, 'conesUsed', Number(e.target.value))}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={yc.weightUsed || ''}
                        onChange={(e) => updateYarnConsumption(yc.id, 'weightUsed', Number(e.target.value))}
                        className={`text-right ${yc.weightUsed > yc.availableWeight && yc.availableWeight > 0 ? 'border-red-500' : ''}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeYarnConsumptionRow(yc.id)}
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


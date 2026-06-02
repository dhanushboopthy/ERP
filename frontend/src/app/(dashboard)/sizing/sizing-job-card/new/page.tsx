'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  ClipboardList,
  Calculator,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { formatNumber } from '@/lib/utils';
import { Party, YarnCount, Beam, LoomType, WarpingJobCard } from '@/types';

interface BeamDetail {
  id: string;
  beamId: number;
  beamNo: string;
  ends: number;
  meters: number;
  grossWeight: number;
}

export default function NewSizingJobCardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [setDate, setSetDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState<string>('');
  const [yarnCountId, setYarnCountId] = useState<string>('');
  const [loomTypeId, setLoomTypeId] = useState<string>('');
  const [lotNo, setLotNo] = useState('');
  const [warpingJobCardId, setWarpingJobCardId] = useState<string>('');
  const [totalEnds, setTotalEnds] = useState<number>(0);
  const [warpingMeters, setWarpingMeters] = useState<number>(0);
  const [sizingMeters, setSizingMeters] = useState<number>(0);
  const [pickupPercent, setPickupPercent] = useState<number>(12);
  const [elongationPercent, setElongationPercent] = useState<number>(1);
  const [machineNo, setMachineNo] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [remarks, setRemarks] = useState('');

  // Beam details
  const [beamDetails, setBeamDetails] = useState<BeamDetail[]>([]);

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

  // Fetch loom types
  const { data: loomTypesRes } = useQuery({
    queryKey: ['loomTypes'],
    queryFn: async () => {
      const res = await apiClient.get<LoomType[]>('/api/loomtypes/active');
      if (!res.success) throw new Error(res.message || 'Failed to fetch loom types');
      return res.data;
    },
  });
  const loomTypes: LoomType[] = Array.isArray(loomTypesRes) ? loomTypesRes : [];

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

  // Fetch warping job cards for selection
  const { data: warpingCardsRes } = useQuery({
    queryKey: ['warpingJobCards', 'available'],
    queryFn: async () => {
      const res = await apiClient.get<{ items: WarpingJobCard[] }>('/api/warpingjobcards', {
        params: { pageNumber: 1, pageSize: 500, status: 'Completed' },
      });
      if (!res.success) throw new Error(res.message || 'Failed to fetch warping job cards');
      return res.data;
    },
  });
  const warpingCards: WarpingJobCard[] = warpingCardsRes?.items || [];

  // Auto-populate from warping job card
  useEffect(() => {
    if (warpingJobCardId) {
      const card = warpingCards.find(c => c.id.toString() === warpingJobCardId);
      if (card) {
        setPartyId(card.partyId.toString());
        setYarnCountId(card.yarnCountId.toString());
        setLotNo(card.lotNo ?? '');
        setTotalEnds(card.totalEnds);
        setWarpingMeters(card.setLength);
      }
    }
  }, [warpingJobCardId, warpingCards]);

  // Add beam row
  const addBeamRow = () => {
    setBeamDetails([
      ...beamDetails,
      {
        id: Date.now().toString(),
        beamId: 0,
        beamNo: '',
        ends: 0,
        meters: sizingMeters,
        grossWeight: 0,
      },
    ]);
  };

  // Remove beam row
  const removeBeamRow = (id: string) => {
    setBeamDetails(beamDetails.filter(b => b.id !== id));
  };

  // Update beam row
  const updateBeamRow = (id: string, field: keyof BeamDetail, value: string | number) => {
    setBeamDetails(beamDetails.map(b => {
      if (b.id === id) {
        const updated = { ...b, [field]: value };
        if (field === 'beamId') {
          const beam = availableBeams.find(beam => beam.id === Number(value));
          if (beam) {
            updated.beamNo = beam.beamNo;
          }
        }
        return updated;
      }
      return b;
    }));
  };

  // Calculate totals
  const totals = {
    ends: beamDetails.reduce((sum, b) => sum + b.ends, 0),
    weight: beamDetails.reduce((sum, b) => sum + b.grossWeight, 0),
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiClient.post('/api/sizingjobcards', data);
      if (!res.success) {
        const errMsg = Array.isArray(res.errors) ? res.errors.join(', ') : (res.message || 'Failed to create sizing job card');
        throw new Error(errMsg);
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success('Sizing job card created successfully');
      queryClient.invalidateQueries({ queryKey: ['sizingJobCards'] });
      router.push('/sizing/sizing-job-card');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to create sizing job card');
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
    if (!loomTypeId) {
      toast.error('Please select a loom type');
      return;
    }
    if (sizingMeters <= 0) {
      toast.error('Sizing meters must be greater than zero');
      return;
    }
    if (pickupPercent < 0 || pickupPercent > 100) {
      toast.error('Pickup % must be between 0 and 100');
      return;
    }
    if (elongationPercent < 0 || elongationPercent > 100) {
      toast.error('Elongation % must be between 0 and 100');
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

    createMutation.mutate({
      jobCardDate: setDate,
      partyId: parseInt(partyId),
      yarnCountId: parseInt(yarnCountId),
      loomTypeId: parseInt(loomTypeId),
      lotNo,
      setNo: lotNo,
      totalEnds,
      setLength: sizingMeters,
      sizingMachineNo: machineNo,
      remarks,
      sourceBeamIds: beamDetails.map(b => b.beamId),
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sizing/sizing-job-card">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Sizing Job Card</h1>
            <p className="text-gray-500">Create a new sizing/set card entry</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Enter job card details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="setDate">Set Date *</Label>
                <Input
                  id="setDate"
                  type="date"
                  value={setDate}
                  onChange={(e) => setSetDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warpingJobCard">Warping Job Card</Label>
                <Select value={warpingJobCardId} onValueChange={setWarpingJobCardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warping card (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {warpingCards.map((card) => (
                      <SelectItem key={card.id} value={card.id.toString()}>
                        {card.jobCardNumber} - {card.partyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="party">Party *</Label>
                <Select value={partyId} onValueChange={setPartyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select party" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id.toString()}>
                        {party.partyCode} - {party.partyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yarnCount">Yarn Count *</Label>
                <Select value={yarnCountId} onValueChange={setYarnCountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select yarn count" />
                  </SelectTrigger>
                  <SelectContent>
                    {yarnCounts.map((yc) => (
                      <SelectItem key={yc.id} value={yc.id.toString()}>
                        {yc.countCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="loomType">Loom Type *</Label>
                <Select value={loomTypeId} onValueChange={setLoomTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loom type" />
                  </SelectTrigger>
                  <SelectContent>
                    {loomTypes.map((lt) => (
                      <SelectItem key={lt.id} value={lt.id.toString()}>
                        {lt.loomTypeCode} - {lt.loomTypeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lotNo">Lot No</Label>
                <Input
                  id="lotNo"
                  value={lotNo}
                  onChange={(e) => setLotNo(e.target.value)}
                  placeholder="Enter lot number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalEnds">Total Ends</Label>
                <Input
                  id="totalEnds"
                  type="number"
                  value={totalEnds}
                  onChange={(e) => setTotalEnds(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="warpingMeters">Warping Meters</Label>
                <Input
                  id="warpingMeters"
                  type="number"
                  value={warpingMeters}
                  onChange={(e) => setWarpingMeters(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sizingMeters">Sizing Meters *</Label>
                <Input
                  id="sizingMeters"
                  type="number"
                  value={sizingMeters}
                  onChange={(e) => setSizingMeters(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupPercent">Pickup %</Label>
                <Input
                  id="pickupPercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={pickupPercent}
                  onChange={(e) => setPickupPercent(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="elongationPercent">Elongation %</Label>
                <Input
                  id="elongationPercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={elongationPercent}
                  onChange={(e) => setElongationPercent(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="machineNo">Machine No</Label>
                <Input
                  id="machineNo"
                  value={machineNo}
                  onChange={(e) => setMachineNo(e.target.value)}
                  placeholder="Enter machine number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operatorName">Operator Name</Label>
                <Input
                  id="operatorName"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Enter operator name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Total Ends</p>
                <p className="text-lg font-bold font-mono">{formatNumber(totalEnds)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Sizing Meters</p>
                <p className="text-lg font-bold font-mono">{formatNumber(sizingMeters)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">Pickup %</p>
                <p className="text-lg font-bold font-mono text-blue-700">{pickupPercent}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600">Elongation %</p>
                <p className="text-lg font-bold font-mono text-green-700">{elongationPercent}%</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Beams Added</span>
                <span className="font-medium">{beamDetails.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Beam Ends</span>
                <span className="font-medium font-mono">{formatNumber(totals.ends)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Beam Weight</span>
                <span className="font-medium font-mono">{formatNumber(totals.weight)} kg</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Beam Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Beam Details</CardTitle>
            <CardDescription>Add sizing beams for this job card</CardDescription>
          </div>
          <Button onClick={addBeamRow} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Beam
          </Button>
        </CardHeader>
        <CardContent>
          {beamDetails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No beams added yet</p>
              <p className="text-sm">Click &quot;Add Beam&quot; to add sizing beams</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Beam</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead>Meters</TableHead>
                  <TableHead>Gross Weight (kg)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beamDetails.map((beam, index) => (
                  <TableRow key={beam.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Select
                        value={beam.beamId.toString()}
                        onValueChange={(value) => updateBeamRow(beam.id, 'beamId', parseInt(value))}
                      >
                        <SelectTrigger className="w-[200px]">
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
                        value={beam.ends}
                        onChange={(e) => updateBeamRow(beam.id, 'ends', parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={beam.meters}
                        onChange={(e) => updateBeamRow(beam.id, 'meters', parseFloat(e.target.value) || 0)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.1"
                        value={beam.grossWeight}
                        onChange={(e) => updateBeamRow(beam.id, 'grossWeight', parseFloat(e.target.value) || 0)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBeamRow(beam.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


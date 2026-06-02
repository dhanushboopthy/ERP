'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Separator } from '@/components/ui/separator';
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

export default function EditSizingJobCardPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  // Form state
  const [setDate, setSetDate] = useState('');
  const [setNo, setSetNo] = useState('');
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
  const [beamDetails, setBeamDetails] = useState<BeamDetail[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Fetch existing job card
  const { data: jobCard, isLoading: isLoadingCard, error: loadError } = useQuery({
    queryKey: ['sizingJobCard', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/api/SizingJobCards/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Sizing job card not found');
    },
    retry: 0,
  });

  // Fetch master data
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

  const { data: yarnCountsRes } = useQuery({
    queryKey: ['yarnCounts'],
    queryFn: async () => {
      const res = await apiClient.get<YarnCount[]>('/api/yarncounts');
      if (!res.success) throw new Error(res.message || 'Failed to fetch yarn counts');
      return res.data;
    },
  });
  const yarnCounts: YarnCount[] = Array.isArray(yarnCountsRes) ? yarnCountsRes : [];

  const { data: loomTypesRes } = useQuery({
    queryKey: ['loomTypes'],
    queryFn: async () => {
      const res = await apiClient.get<LoomType[]>('/api/loomtypes/active');
      if (!res.success) throw new Error(res.message || 'Failed to fetch loom types');
      return res.data;
    },
  });
  const loomTypes: LoomType[] = Array.isArray(loomTypesRes) ? loomTypesRes : [];

  const { data: beamsRes } = useQuery({
    queryKey: ['beams', 'all'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/api/beams', { params: { pageSize: 500 } });
      if (!res.success) throw new Error(res.message || 'Failed to fetch beams');
      const d = res.data;
      return d?.items ?? d?.Items ?? (Array.isArray(d) ? d : []);
    },
  });
  const availableBeams: Beam[] = Array.isArray(beamsRes) ? beamsRes : [];

  // Pre-fill form when job card data loads
  useEffect(() => {
    if (jobCard && !isDataLoaded) {
      setSetDate(jobCard.jobCardDate ? jobCard.jobCardDate.split('T')[0] : '');
      setSetNo(jobCard.setNo || '');
      setPartyId(jobCard.partyId?.toString() || '');
      setYarnCountId(jobCard.yarnCountId?.toString() || '');
      setLoomTypeId(jobCard.loomTypeId?.toString() || '');
      setLotNo(jobCard.lotNo || '');
      setTotalEnds(jobCard.totalEnds || 0);
      setSizingMeters(jobCard.setLength || 0);
      setMachineNo(jobCard.sizingMachineNo || '');
      setRemarks(jobCard.remarks || '');

      if (jobCard.sourceBeams && Array.isArray(jobCard.sourceBeams)) {
        setBeamDetails(jobCard.sourceBeams.map((b: any, i: number) => ({
          id: b.id?.toString() || Date.now().toString() + i,
          beamId: b.beamId,
          beamNo: b.beamNo || '',
          ends: b.endsOnBeam || 0,
          meters: jobCard.setLength || 0,
          grossWeight: 0,
        })));
      }
      setIsDataLoaded(true);
    }
  }, [jobCard, isDataLoaded]);

  // Add/remove/update beam rows
  const addBeamRow = () => {
    setBeamDetails([
      ...beamDetails,
      { id: Date.now().toString(), beamId: 0, beamNo: '', ends: 0, meters: sizingMeters, grossWeight: 0 },
    ]);
  };
  const removeBeamRow = (rowId: string) => setBeamDetails(beamDetails.filter(b => b.id !== rowId));
  const updateBeamRow = (rowId: string, field: keyof BeamDetail, value: string | number) => {
    setBeamDetails(beamDetails.map(b => {
      if (b.id === rowId) {
        const updated = { ...b, [field]: value };
        if (field === 'beamId') {
          const beam = availableBeams.find(bm => bm.id === Number(value));
          if (beam) updated.beamNo = beam.beamNo;
        }
        return updated;
      }
      return b;
    }));
  };

  const totals = {
    ends: beamDetails.reduce((sum, b) => sum + b.ends, 0),
    weight: beamDetails.reduce((sum, b) => sum + b.grossWeight, 0),
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiClient.put(`/api/sizingjobcards/${id}`, data);
      if (!res.success) {
        const errMsg = Array.isArray(res.errors) ? res.errors.join(', ') : (res.message || 'Failed to update');
        throw new Error(errMsg);
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success('Sizing job card updated successfully');
      queryClient.invalidateQueries({ queryKey: ['sizingJobCards'] });
      queryClient.invalidateQueries({ queryKey: ['sizingJobCard', id] });
      router.push('/sizing/sizing-job-card');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update sizing job card');
    },
  });

  const handleSubmit = () => {
    if (!partyId) { toast.error('Please select a party'); return; }
    if (!yarnCountId) { toast.error('Please select a yarn count'); return; }
    if (!loomTypeId) { toast.error('Please select a loom type'); return; }
    if (sizingMeters <= 0) { toast.error('Sizing meters must be greater than zero'); return; }
    if (pickupPercent < 0 || pickupPercent > 100) { toast.error('Pickup % must be between 0 and 100'); return; }
    if (elongationPercent < 0 || elongationPercent > 100) { toast.error('Elongation % must be between 0 and 100'); return; }
    if (beamDetails.length === 0) { toast.error('Please add at least one beam'); return; }
    if (beamDetails.some(b => !b.beamId)) { toast.error('Please select a beam for all rows'); return; }

    updateMutation.mutate({
      partyId: parseInt(partyId),
      yarnCountId: parseInt(yarnCountId),
      loomTypeId: parseInt(loomTypeId),
      lotNo,
      totalEnds,
      setLength: sizingMeters,
      sizingMachineNo: machineNo,
      remarks,
      sourceBeamIds: beamDetails.map(b => b.beamId),
    });
  };

  // Loading state
  if (isLoadingCard) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error / not found state
  if (loadError || !jobCard) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Record Not Found</h2>
        <p className="text-gray-500">The sizing job card you are looking for does not exist.</p>
        <Button onClick={() => router.push('/sizing/sizing-job-card')}>Back to List</Button>
      </div>
    );
  }

  // Not editable check
  if (jobCard.status === 'Authorized') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-orange-500" />
        <h2 className="text-xl font-semibold text-gray-900">Cannot Edit</h2>
        <p className="text-gray-500">This job card has been authorized and cannot be edited.</p>
        <Button onClick={() => router.push('/sizing/sizing-job-card')}>Back to List</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sizing/sizing-job-card">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Sizing Job Card</h1>
            <p className="text-gray-500">{jobCard.jobCardNumber} — {setNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />Update Job Card</>
            )}
          </Button>
        </div>
      </div>

      {/* Read-only fields */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-gray-500">Set ID</Label>
              <p className="font-mono font-medium text-gray-900">{setNo}</p>
            </div>
            <div>
              <Label className="text-gray-500">Job Card No</Label>
              <p className="font-mono font-medium text-gray-900">{jobCard.jobCardNumber}</p>
            </div>
            <div>
              <Label className="text-gray-500">Created Date</Label>
              <p className="font-medium text-gray-900">{setDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Edit Details
            </CardTitle>
            <CardDescription>Update sizing job card information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Party *</Label>
                <Select value={partyId} onValueChange={setPartyId}>
                  <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                  <SelectContent>
                    {parties.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.partyCode} - {p.partyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Yarn Count *</Label>
                <Select value={yarnCountId} onValueChange={setYarnCountId}>
                  <SelectTrigger><SelectValue placeholder="Select yarn count" /></SelectTrigger>
                  <SelectContent>
                    {yarnCounts.map(yc => (
                      <SelectItem key={yc.id} value={yc.id.toString()}>{yc.countCode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Loom Type *</Label>
                <Select value={loomTypeId} onValueChange={setLoomTypeId}>
                  <SelectTrigger><SelectValue placeholder="Select loom type" /></SelectTrigger>
                  <SelectContent>
                    {loomTypes.map(lt => (
                      <SelectItem key={lt.id} value={lt.id.toString()}>{lt.loomTypeCode} - {lt.loomTypeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lot No</Label>
                <Input value={lotNo} onChange={e => setLotNo(e.target.value)} placeholder="Enter lot number" />
              </div>
              <div className="space-y-2">
                <Label>Total Ends</Label>
                <Input type="number" value={totalEnds} onChange={e => setTotalEnds(parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Warping Meters</Label>
                <Input type="number" value={warpingMeters} onChange={e => setWarpingMeters(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Sizing Meters *</Label>
                <Input type="number" value={sizingMeters} onChange={e => setSizingMeters(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Pickup %</Label>
                <Input type="number" step="0.1" min="0" max="100" value={pickupPercent} onChange={e => setPickupPercent(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Elongation %</Label>
                <Input type="number" step="0.1" min="0" max="100" value={elongationPercent} onChange={e => setElongationPercent(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Machine No</Label>
                <Input value={machineNo} onChange={e => setMachineNo(e.target.value)} placeholder="Enter machine number" />
              </div>
              <div className="space-y-2">
                <Label>Operator Name</Label>
                <Input value={operatorName} onChange={e => setOperatorName(e.target.value)} placeholder="Enter operator name" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Additional notes..." rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Summary</CardTitle>
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
            <CardDescription>Manage sizing beams for this job card</CardDescription>
          </div>
          <Button onClick={addBeamRow} size="sm"><Plus className="mr-2 h-4 w-4" />Add Beam</Button>
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
                      <Select value={beam.beamId ? beam.beamId.toString() : ''} onValueChange={v => updateBeamRow(beam.id, 'beamId', parseInt(v))}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select beam" /></SelectTrigger>
                        <SelectContent>
                          {availableBeams.map(ab => (
                            <SelectItem key={ab.id} value={ab.id.toString()}>{ab.beamNo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" className="w-[100px]" value={beam.ends} onChange={e => updateBeamRow(beam.id, 'ends', parseInt(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" className="w-[100px]" value={beam.meters} onChange={e => updateBeamRow(beam.id, 'meters', parseFloat(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" className="w-[100px]" value={beam.grossWeight} onChange={e => updateBeamRow(beam.id, 'grossWeight', parseFloat(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeBeamRow(beam.id)} className="text-red-500 hover:text-red-700">
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

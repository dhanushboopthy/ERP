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
import { Party, YarnCount, Beam } from '@/types';

interface BeamDetail {
  id: string;
  beamId: number;
  beamNo: string;
  beamSequence: number;
  ends: number;
  meters: number;
  grossWeight: number;
}

export default function EditWarpingJobCardPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  // Form state
  const [setNo, setSetNo] = useState('');
  const [jobCardNo, setJobCardNo] = useState('');
  const [jobCardDate, setJobCardDate] = useState('');
  const [partyId, setPartyId] = useState<string>('');
  const [yarnCountId, setYarnCountId] = useState<string>('');
  const [lotNo, setLotNo] = useState('');
  const [totalEnds, setTotalEnds] = useState<number>(0);
  const [totalMeters, setTotalMeters] = useState<number>(0);
  const [machineNo, setMachineNo] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [beamDetails, setBeamDetails] = useState<BeamDetail[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Fetch existing job card
  const { data: jobCard, isLoading: isLoadingCard, error: loadError } = useQuery({
    queryKey: ['warpingJobCard', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/api/WarpingJobCards/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Warping job card not found');
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

  // Pre-fill form
  useEffect(() => {
    if (jobCard && !isDataLoaded) {
      setSetNo(jobCard.setNo || '');
      setJobCardNo(jobCard.jobCardNumber || '');
      setJobCardDate(jobCard.jobCardDate ? jobCard.jobCardDate.split('T')[0] : '');
      setPartyId(jobCard.partyId?.toString() || '');
      setYarnCountId(jobCard.yarnCountId?.toString() || '');
      setLotNo(jobCard.lotNo || '');
      setTotalEnds(jobCard.totalEnds || 0);
      setTotalMeters(jobCard.setLength || 0);
      setMachineNo(jobCard.warpingMachineNo || '');
      setRemarks(jobCard.remarks || '');

      if (jobCard.beams && Array.isArray(jobCard.beams)) {
        setBeamDetails(jobCard.beams.map((b: any, i: number) => ({
          id: b.id?.toString() || Date.now().toString() + i,
          beamId: b.beamId,
          beamNo: b.beamNo || '',
          beamSequence: b.beamSequence || i + 1,
          ends: b.endsOnBeam || 0,
          meters: jobCard.setLength || 0,
          grossWeight: b.beamWeight || 0,
        })));
      }
      setIsDataLoaded(true);
    }
  }, [jobCard, isDataLoaded]);

  // Beam operations
  const addBeamRow = () => {
    const nextSeq = beamDetails.length + 1;
    setBeamDetails([
      ...beamDetails,
      { id: Date.now().toString(), beamId: 0, beamNo: '', beamSequence: nextSeq, ends: 0, meters: totalMeters, grossWeight: 0 },
    ]);
  };
  const removeBeamRow = (rowId: string) => {
    const newDetails = beamDetails.filter(b => b.id !== rowId);
    newDetails.forEach((b, idx) => { b.beamSequence = idx + 1; });
    setBeamDetails(newDetails);
  };
  const updateBeamRow = (rowId: string, field: keyof BeamDetail, value: any) => {
    setBeamDetails(beamDetails.map(b => {
      if (b.id !== rowId) return b;
      const updated = { ...b, [field]: value };
      if (field === 'beamId') {
        const beam = availableBeams.find(ab => ab.id === Number(value));
        updated.beamNo = beam?.beamNo || '';
      }
      return updated;
    }));
  };

  const totalBeamEnds = beamDetails.reduce((sum, b) => sum + b.ends, 0);
  const totalBeamWeight = beamDetails.reduce((sum, b) => sum + b.grossWeight, 0);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiClient.put(`/api/warpingjobcards/${id}`, data);
      if (!res.success) {
        const errMsg = Array.isArray(res.errors) ? res.errors.join(', ') : (res.message || 'Failed to update');
        throw new Error(errMsg);
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success('Warping job card updated successfully');
      queryClient.invalidateQueries({ queryKey: ['warpingJobCards'] });
      queryClient.invalidateQueries({ queryKey: ['warpingJobCard', id] });
      router.push('/sizing/warping-job-card');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update warping job card');
    },
  });

  const handleSubmit = () => {
    if (!partyId) { toast.error('Please select a party'); return; }
    if (!yarnCountId) { toast.error('Please select a yarn count'); return; }
    if (totalEnds <= 0) { toast.error('Total ends must be greater than 0'); return; }
    if (totalMeters <= 0) { toast.error('Meters must be greater than 0'); return; }
    if (beamDetails.length === 0) { toast.error('Please add at least one beam'); return; }
    if (beamDetails.some(b => !b.beamId)) { toast.error('Please select a beam for all rows'); return; }

    updateMutation.mutate({
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
    });
  };

  if (isLoadingCard) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError || !jobCard) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Record Not Found</h2>
        <p className="text-gray-500">The warping job card you are looking for does not exist.</p>
        <Button onClick={() => router.push('/sizing/warping-job-card')}>Back to List</Button>
      </div>
    );
  }

  if (jobCard.status === 'Authorized') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-orange-500" />
        <h2 className="text-xl font-semibold text-gray-900">Cannot Edit</h2>
        <p className="text-gray-500">This job card has been authorized and cannot be edited.</p>
        <Button onClick={() => router.push('/sizing/warping-job-card')}>Back to List</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/sizing/warping-job-card">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Warping Job Card</h1>
            <p className="text-gray-500">{jobCardNo} — {setNo}</p>
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
              <p className="font-mono font-medium text-gray-900">{jobCardNo}</p>
            </div>
            <div>
              <Label className="text-gray-500">Created Date</Label>
              <p className="font-medium text-gray-900">{jobCardDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Edit Details
            </CardTitle>
            <CardDescription>Update warping job card information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Party *</Label>
                <Select value={partyId} onValueChange={setPartyId}>
                  <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                  <SelectContent>
                    {parties.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.partyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Yarn Count *</Label>
                <Select value={yarnCountId} onValueChange={setYarnCountId}>
                  <SelectTrigger><SelectValue placeholder="Select count" /></SelectTrigger>
                  <SelectContent>
                    {yarnCounts.map(yc => (
                      <SelectItem key={yc.id} value={yc.id.toString()}>{yc.countDescription || yc.countCode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lot No</Label>
                <Input value={lotNo} onChange={e => setLotNo(e.target.value)} placeholder="Enter lot number" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Total Ends *</Label>
                <Input type="number" value={totalEnds || ''} onChange={e => setTotalEnds(Number(e.target.value))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Total Meters *</Label>
                <Input type="number" value={totalMeters || ''} onChange={e => setTotalMeters(Number(e.target.value))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Machine No</Label>
                <Input value={machineNo} onChange={e => setMachineNo(e.target.value)} placeholder="Machine number" />
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
            <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Calculations</CardTitle>
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
          </CardContent>
        </Card>
      </div>

      {/* Beam Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Beam Details</CardTitle>
            <CardDescription>Manage warping beams</CardDescription>
          </div>
          <Button onClick={addBeamRow} size="sm"><Plus className="mr-2 h-4 w-4" />Add Beam</Button>
        </CardHeader>
        <CardContent>
          {beamDetails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No beams added yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Beam</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead>Meters</TableHead>
                  <TableHead>Weight (kg)</TableHead>
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

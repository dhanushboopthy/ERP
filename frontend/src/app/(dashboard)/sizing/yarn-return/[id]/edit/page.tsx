'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
} from '@/components/ui/alert';
import { formatNumber } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { Vehicle, YarnCount } from '@/types';
import { toast } from 'sonner';
import { RouteGuard } from '@/components/auth/RouteGuard';

interface ReturnDetail {
  id: string;
  yarnCountId: number;
  yarnCountName: string;
  lotNo: string;
  bags: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  ratePerKg?: number;
}

export default function EditYarnReturnPage() {
  return (
    <RouteGuard requiredPermission="YARN_RETURN.EDIT">
      <EditYarnReturnForm />
    </RouteGuard>
  );
}

function EditYarnReturnForm() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [vehicleId, setVehicleId] = useState<string>('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [details, setDetails] = useState<ReturnDetail[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch record
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['yarnReturn', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/api/yarnreturns/${id}`);
      if (!res.success) throw new Error(res.message || 'Failed to fetch');
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch vehicles
  const { data: vehiclesRes } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get<Vehicle[]>('/api/vehicles');
      return res.data;
    },
  });
  const vehicles: Vehicle[] = Array.isArray(vehiclesRes) ? vehiclesRes : [];

  // Fetch yarn counts
  const { data: yarnCountsRes } = useQuery({
    queryKey: ['yarnCounts'],
    queryFn: async () => {
      const res = await apiClient.get<YarnCount[]>('/api/yarncounts');
      return res.data;
    },
  });
  const yarnCounts: YarnCount[] = Array.isArray(yarnCountsRes) ? yarnCountsRes : [];

  // Pre-fill form when data loads
  useEffect(() => {
    if (data && !isInitialized) {
      setVehicleId(data.vehicleId?.toString() || '');
      setVehicleNo(data.vehicleNo || '');
      setDriverName(data.driverName || '');
      setRemarks(data.remarks || '');
      setDetails(
        (data.details || []).map((d: any, i: number) => ({
          id: `existing-${i}`,
          yarnCountId: d.yarnCountId,
          yarnCountName: d.countCode || '',
          lotNo: d.lotNo || '',
          bags: d.bags,
          grossWeight: d.grossWeight,
          tareWeight: d.tareWeight,
          netWeight: d.netWeight,
          ratePerKg: d.ratePerKg,
        }))
      );
      setIsInitialized(true);
    }
  }, [data, isInitialized]);

  const handleVehicleChange = (vehicleIdValue: string) => {
    setVehicleId(vehicleIdValue);
    const vehicle = vehicles.find(v => v.id.toString() === vehicleIdValue);
    if (vehicle) {
      setVehicleNo(vehicle.vehicleNo);
      setDriverName(vehicle.driverName || '');
    }
  };

  const addDetailRow = () => {
    setDetails([...details, {
      id: Date.now().toString(),
      yarnCountId: 0, yarnCountName: '', lotNo: '',
      bags: 0, grossWeight: 0, tareWeight: 0, netWeight: 0,
    }]);
  };

  const removeDetailRow = (rowId: string) => {
    setDetails(details.filter(d => d.id !== rowId));
  };

  const updateDetail = (rowId: string, field: keyof ReturnDetail, value: string | number) => {
    setDetails(details.map(d => {
      if (d.id !== rowId) return d;
      const updated = { ...d, [field]: value };
      if (field === 'yarnCountId') {
        const yc = yarnCounts.find(y => y.id === Number(value));
        updated.yarnCountName = yc?.countDescription || yc?.countCode || '';
      }
      if (field === 'grossWeight' || field === 'tareWeight') {
        updated.netWeight = Math.max(0, updated.grossWeight - updated.tareWeight);
      }
      return updated;
    }));
  };

  const totals = {
    bags: details.reduce((s, d) => s + d.bags, 0),
    grossWeight: details.reduce((s, d) => s + d.grossWeight, 0),
    tareWeight: details.reduce((s, d) => s + d.tareWeight, 0),
    netWeight: details.reduce((s, d) => s + d.netWeight, 0),
  };

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.put(`/api/yarnreturns/${id}`, payload);
      if (!res.success) throw new Error(res.message || 'Failed to update');
      return res.data;
    },
    onSuccess: () => {
      toast.success('Yarn return updated successfully');
      queryClient.invalidateQueries({ queryKey: ['yarnReturns'] });
      queryClient.invalidateQueries({ queryKey: ['yarnReturn', id] });
      router.push('/sizing/yarn-return');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update yarn return');
    },
  });

  const handleSubmit = () => {
    if (details.length === 0) {
      toast.error('Please add at least one detail row');
      return;
    }
    if (details.some(d => !d.yarnCountId || !d.lotNo || d.netWeight <= 0)) {
      toast.error('Please complete all detail rows');
      return;
    }

    updateMutation.mutate({
      vehicleId: vehicleId ? Number(vehicleId) : undefined,
      driverName: driverName || undefined,
      remarks: remarks || undefined,
      details: details.map(d => ({
        yarnCountId: d.yarnCountId,
        lotNo: d.lotNo,
        bags: d.bags,
        grossWeight: d.grossWeight,
        tareWeight: d.tareWeight,
        ratePerKg: d.ratePerKg,
      })),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Record Not Found</h2>
        <p className="text-muted-foreground">The yarn return record could not be found.</p>
        <Link href="/sizing/yarn-return">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
        </Link>
      </div>
    );
  }

  if (data.status !== 'Draft') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-orange-500" />
        <h2 className="text-xl font-semibold">Cannot Edit</h2>
        <p className="text-muted-foreground">Only Draft records can be edited. Current status: <Badge>{data.status}</Badge></p>
        <Link href="/sizing/yarn-return">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sizing/yarn-return">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Edit Yarn Return</h1>
          <p className="text-gray-500">DC No: {data.dcNo} · {data.returnType} Return</p>
        </div>
        <Badge variant="default">{data.status}</Badge>
        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Update</>}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Return Information</CardTitle>
            <CardDescription>DC No and Party are read-only</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>DC Number</Label>
                <Input value={data.dcNo} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>Party</Label>
                <Input value={data.partyName} disabled className="bg-gray-50" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={vehicleId} onValueChange={handleVehicleChange}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id.toString()}>{v.vehicleNo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle No</Label>
                <Input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="Vehicle no" />
              </div>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Driver name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Remarks..." rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Return Type:</span>
                <Badge>{data.returnType}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Items:</span>
                <span className="font-mono">{details.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Bags:</span>
                <span className="font-mono">{totals.bags}</span>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross Weight:</span>
                <span className="font-mono">{formatNumber(totals.grossWeight)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tare Weight:</span>
                <span className="font-mono">{formatNumber(totals.tareWeight)} kg</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Net Weight:</span>
                <span className="font-mono text-primary">{formatNumber(totals.netWeight)} kg</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Return Details</CardTitle>
            <CardDescription>Edit yarn items</CardDescription>
          </div>
          <Button onClick={addDetailRow} variant="outline"><Plus className="mr-2 h-4 w-4" />Add Item</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Yarn Count</TableHead>
                <TableHead className="w-[120px]">Lot No</TableHead>
                <TableHead className="w-[80px] text-right">Bags</TableHead>
                <TableHead className="w-[120px] text-right">Gross Wt</TableHead>
                <TableHead className="w-[120px] text-right">Tare Wt</TableHead>
                <TableHead className="w-[120px] text-right">Net Wt</TableHead>
                <TableHead className="w-[100px] text-right">Rate/kg</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-gray-500">No items. Click &quot;Add Item&quot; to start.</TableCell>
                </TableRow>
              ) : (
                details.map(detail => (
                  <TableRow key={detail.id}>
                    <TableCell>
                      <Select value={detail.yarnCountId ? detail.yarnCountId.toString() : ''} onValueChange={v => updateDetail(detail.id, 'yarnCountId', Number(v))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {yarnCounts.map(yc => (
                            <SelectItem key={yc.id} value={yc.id.toString()}>{yc.countDescription || yc.countCode}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input value={detail.lotNo} onChange={e => updateDetail(detail.id, 'lotNo', e.target.value)} placeholder="Lot No" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={detail.bags || ''} onChange={e => updateDetail(detail.id, 'bags', Number(e.target.value))} className="text-right" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" value={detail.grossWeight || ''} onChange={e => updateDetail(detail.id, 'grossWeight', Number(e.target.value))} className="text-right" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" value={detail.tareWeight || ''} onChange={e => updateDetail(detail.id, 'tareWeight', Number(e.target.value))} className="text-right" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={detail.netWeight} readOnly className="text-right bg-gray-50" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" value={detail.ratePerKg || ''} onChange={e => updateDetail(detail.id, 'ratePerKg', Number(e.target.value))} className="text-right" placeholder="0.00" />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeDetailRow(detail.id)} className="text-red-500 hover:text-red-700">
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

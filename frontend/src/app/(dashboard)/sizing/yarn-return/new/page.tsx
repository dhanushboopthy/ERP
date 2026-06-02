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
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { YarnStockDto, Party, Vehicle, YarnCount } from '@/types';
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

export default function NewYarnReturnPage() {
  return (
    <RouteGuard requiredPermission="YARN_RETURN.CREATE">
      <YarnReturnForm />
    </RouteGuard>
  );
}

function YarnReturnForm() {
  const router = useRouter();
  const [returnType, setReturnType] = useState<'Mill' | 'Jobwork'>('Mill');
  const [isNotForSale, setIsNotForSale] = useState(false);
  const [partyId, setPartyId] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [details, setDetails] = useState<ReturnDetail[]>([]);

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

  // Fetch vehicles
  const { data: vehiclesRes } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get<Vehicle[]>('/api/vehicles');
      if (!res.success) throw new Error(res.message || 'Failed to fetch vehicles');
      return res.data;
    },
  });
  const vehicles: Vehicle[] = Array.isArray(vehiclesRes) ? vehiclesRes : [];

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

  // Fetch yarn stock for validation
  const { data: yarnStockRes } = useQuery({
    queryKey: ['yarnStock'],
    queryFn: async () => {
      const res = await apiClient.get<YarnStockDto[]>('/api/reports/yarn-stock');
      if (!res.success) throw new Error(res.message || 'Failed to fetch yarn stock');
      return res.data;
    },
  });
  const yarnStock: YarnStockDto[] = Array.isArray(yarnStockRes) ? yarnStockRes : [];

  // Handle type change - reset isNotForSale when switching to Mill
  useEffect(() => {
    if (returnType === 'Mill') {
      setIsNotForSale(false);
    }
  }, [returnType]);

  // Handle vehicle selection
  const handleVehicleChange = (vehicleIdValue: string) => {
    setVehicleId(vehicleIdValue);
    const vehicle = vehicles.find(v => v.id.toString() === vehicleIdValue);
    if (vehicle) {
      setVehicleNo(vehicle.vehicleNo);
      setDriverName(vehicle.driverName || '');
    }
  };

  // Add a new detail row
  const addDetailRow = () => {
    setDetails([
      ...details,
      {
        id: Date.now().toString(),
        yarnCountId: 0,
        yarnCountName: '',
        lotNo: '',
        bags: 0,
        grossWeight: 0,
        tareWeight: 0,
        netWeight: 0,
        ratePerKg: undefined,
      },
    ]);
  };

  // Remove a detail row
  const removeDetailRow = (id: string) => {
    setDetails(details.filter((d: ReturnDetail) => d.id !== id));
  };

  // Update detail row
  const updateDetail = (id: string, field: keyof ReturnDetail, value: string | number) => {
    setDetails(details.map((d: ReturnDetail) => {
      if (d.id !== id) return d;
      
      const updated = { ...d, [field]: value };
      
      // Update yarn count name when yarn count changes
      if (field === 'yarnCountId') {
        const yarnCount = yarnCounts.find(yc => yc.id === Number(value));
        updated.yarnCountName = yarnCount?.countDescription || yarnCount?.countCode || '';
      }
      
      // Recalculate net weight
      if (field === 'grossWeight' || field === 'tareWeight') {
        updated.netWeight = Math.max(0, updated.grossWeight - updated.tareWeight);
      }
      
      return updated;
    }));
  };

  // Check stock availability for Jobwork returns
  const getStockWarnings = () => {
    if (returnType !== 'Jobwork') return [];
    
    const warnings: string[] = [];
    details.forEach((d: ReturnDetail) => {
      if (d.yarnCountId && d.lotNo && d.netWeight > 0) {
        // Resolve countCode from the yarnCounts master list
        const yc = yarnCounts.find(c => c.id === d.yarnCountId);
        const countCode = yc?.countCode ?? '';
        const stock = yarnStock.find(
          (s: YarnStockDto) => s.countCode === countCode && s.lotNo === d.lotNo
        );
        const available = stock?.balanceQtyKg ?? 0;
        if (d.netWeight > available) {
          warnings.push(
            `${d.yarnCountName} (${d.lotNo}): Required ${formatNumber(d.netWeight)} kg, Available ${formatNumber(available)} kg`
          );
        }
      }
    });
    return warnings;
  };

  // Calculate totals
  const totals = {
    bags: details.reduce((sum: number, d: ReturnDetail) => sum + d.bags, 0),
    grossWeight: details.reduce((sum: number, d: ReturnDetail) => sum + d.grossWeight, 0),
    tareWeight: details.reduce((sum: number, d: ReturnDetail) => sum + d.tareWeight, 0),
    netWeight: details.reduce((sum: number, d: ReturnDetail) => sum + d.netWeight, 0),
  };

  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/api/yarnreturns', data);
      if (!res.success) {
        throw new Error(res.message || 'Failed to create yarn return');
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success('Yarn return created successfully');
      queryClient.invalidateQueries({ queryKey: ['yarnReturns'] });
      router.push('/sizing/yarn-return');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create yarn return');
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    // Validation
    if (!partyId) {
      toast.error('Please select a party');
      return;
    }
    if (details.length === 0) {
      toast.error('Please add at least one detail row');
      return;
    }
    if (details.some((d: ReturnDetail) => !d.yarnCountId || !d.lotNo || d.netWeight <= 0)) {
      toast.error('Please complete all detail rows with valid data');
      return;
    }

    const stockWarnings = getStockWarnings();
    if (stockWarnings.length > 0 && returnType === 'Jobwork') {
      toast.error('Insufficient stock for some items');
      return;
    }

    const payload = {
      dcDate: new Date().toISOString(),
      partyId: Number(partyId),
      returnType,
      isNotForSale: returnType === 'Jobwork' ? isNotForSale : false,
      vehicleId: vehicleId ? Number(vehicleId) : undefined,
      vehicleNo: vehicleNo || undefined,
      driverName: driverName || undefined,
      remarks: remarks || undefined,
      details: details.map((d: ReturnDetail) => ({
        yarnCountId: d.yarnCountId,
        lotNo: d.lotNo,
        bags: d.bags,
        grossWeight: d.grossWeight,
        tareWeight: d.tareWeight,
        ratePerKg: d.ratePerKg,
      })),
    };

    createMutation.mutate(payload);
  };

  const stockWarnings = getStockWarnings();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/sizing/yarn-return">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">New Yarn Return DC</h1>
          <p className="text-gray-500">Create a new yarn return delivery challan</p>
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
                Save
              </>
            )}
          </Button>
      </div>

      {/* Stock Warnings */}
      {stockWarnings.length > 0 && (
        <Alert variant="cancelled">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Insufficient Stock</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {stockWarnings.map((warning: string, i: number) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Header Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Return Information</CardTitle>
            <CardDescription>Basic return details and party information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="returnType">Return Type *</Label>
                <Select value={returnType} onValueChange={(v: string) => setReturnType(v as 'Mill' | 'Jobwork')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mill">Mill - Return to Supplier</SelectItem>
                    <SelectItem value="Jobwork">Jobwork - Send for Processing</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            {returnType === 'Jobwork' && (
              <div className="flex items-center space-x-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Checkbox
                  id="isNotForSale"
                  checked={isNotForSale}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setIsNotForSale(checked === true)}
                />
                <div>
                  <Label htmlFor="isNotForSale" className="text-orange-800 font-medium">
                    NOT FOR SALE - JOBWORK ONLY
                  </Label>
                  <p className="text-sm text-orange-600">
                    Check this if the yarn is being sent for jobwork processing and not for sale
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle</Label>
                <Select value={vehicleId} onValueChange={handleVehicleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.vehicleNo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNo">Vehicle No</Label>
                <Input
                  id="vehicleNo"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="Enter vehicle no"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverName">Driver Name</Label>
                <Input
                  id="driverName"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter driver name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter any remarks..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Return Type:</span>
                <Badge variant={returnType === 'Mill' ? 'default' : 'grey'}>
                  {returnType}
                </Badge>
              </div>
              {isNotForSale && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sale Status:</span>
                  <Badge variant="cancelled">NOT FOR SALE</Badge>
                </div>
              )}
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

            {returnType === 'Mill' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Mill returns will <strong>ADD</strong> stock back to inventory when approved.
                </AlertDescription>
              </Alert>
            )}
            {returnType === 'Jobwork' && (
              <Alert variant="cancelled">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Jobwork returns will <strong>DEDUCT</strong> stock from inventory when approved.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Return Details</CardTitle>
            <CardDescription>Add yarn items to return</CardDescription>
          </div>
          <Button onClick={addDetailRow} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
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
                  <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                    No items added. Click &quot;Add Item&quot; to start.
                  </TableCell>
                </TableRow>
              ) : (
                details.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell>
                      <Select
                        value={detail.yarnCountId.toString()}
                        onValueChange={(v) => updateDetail(detail.id, 'yarnCountId', Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {yarnCounts.map((yc) => (
                            <SelectItem key={yc.id} value={yc.id.toString()}>
                              {yc.countDescription || yc.countCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={detail.lotNo}
                        onChange={(e) => updateDetail(detail.id, 'lotNo', e.target.value)}
                        placeholder="Lot No"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={detail.bags || ''}
                        onChange={(e) => updateDetail(detail.id, 'bags', Number(e.target.value))}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={detail.grossWeight || ''}
                        onChange={(e) => updateDetail(detail.id, 'grossWeight', Number(e.target.value))}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={detail.tareWeight || ''}
                        onChange={(e) => updateDetail(detail.id, 'tareWeight', Number(e.target.value))}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={detail.netWeight}
                        readOnly
                        className="text-right bg-gray-50"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={detail.ratePerKg || ''}
                        onChange={(e) => updateDetail(detail.id, 'ratePerKg', Number(e.target.value))}
                        className="text-right"
                        placeholder="0.00"
                      />
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


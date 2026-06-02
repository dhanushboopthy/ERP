'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Calculator,
  Receipt,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import apiClient, { endpoints } from '@/lib/api-client';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { formatNumber, calculateNetWeight } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

const yarnReceiptDetailSchema = z.object({
  yarnCountId: z.string().min(1, 'Yarn count is required'),
  lotNo: z.string().optional(),
  bags: z.number().optional(),
  conesPerBag: z.number().optional(),
  weightPerCone: z.number().optional(),
  grossWeight: z.number().min(0.001, 'Gross weight required'),
  tareWeight: z.number().min(0, 'Tare weight required'),
  ratePerKg: z.number().min(0, 'Rate per kg required'),
});

const yarnReceiptSchema = z.object({
  receiptDate: z.string().min(1, 'Receipt date is required'),
  partyId: z.string().min(1, 'Party is required'),
  vehicleId: z.string().optional(),
  driverName: z.string().optional(),
  remarks: z.string().optional(),
  details: z.array(yarnReceiptDetailSchema).min(1, 'At least one detail row is required'),
});

type YarnReceiptFormData = z.infer<typeof yarnReceiptSchema>;

interface Party {
  id: number;
  partyCode: string;
  partyName: string;
  gstin?: string;
}

interface YarnCount {
  id: number;
  countCode: string;
}

interface Vehicle {
  id: number;
  vehicleNo: string;
  driverName?: string;
}

interface ReceiptDetail {
  id: number;
  yarnCountId: number;
  lotNo?: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  coneCount?: number;
  ratePerKg: number;
}

interface ReceiptData {
  id: number;
  receiptNumber: string;
  receiptDate: string;
  partyId: number;
  partyName: string;
  vehicleId?: number;
  driverName?: string;
  remarks?: string;
  status: string;
  isLocked: boolean;
  details: ReceiptDetail[];
}

export default function EditYarnReceiptPage() {
  return (
    <RouteGuard requiredPermission="YARN_RECEIPT.EDIT">
      <EditYarnReceiptForm />
    </RouteGuard>
  );
}

function EditYarnReceiptForm() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const id = params.id as string;
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: receipt, isLoading, error } = useQuery<ReceiptData>({
    queryKey: ['yarnReceipt', id],
    queryFn: async () => {
      const response = await apiClient.get<ReceiptData>(`${endpoints.yarnReceipts}/${id}`);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load yarn receipt');
      }
      return response.data;
    },
    enabled: !!id,
  });

  const { data: partiesData, isLoading: isLoadingParties } = useQuery<{ items: Party[] }>({
    queryKey: ['parties'],
    queryFn: async () => {
      const response: any = await apiClient.get('/api/parties?pageSize=500');
      const d = response.data;
      return Array.isArray(d) ? { items: d } : (d ?? { items: [] });
    },
  });

  const { data: yarnCountsData, isLoading: isLoadingYarnCounts } = useQuery<{ items: YarnCount[] }>({
    queryKey: ['yarnCounts'],
    queryFn: async () => {
      const response: any = await apiClient.get('/api/yarncounts?pageSize=500');
      const d = response.data;
      return Array.isArray(d) ? { items: d } : (d ?? { items: [] });
    },
  });

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery<{ items: Vehicle[] }>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const response: any = await apiClient.get('/api/vehicles?pageSize=100');
      const d = response.data;
      return Array.isArray(d) ? { items: d } : (d ?? { items: [] });
    },
  });

  const parties = partiesData?.items || [];
  const yarnCounts = yarnCountsData?.items || [];
  const vehicles = vehiclesData?.items || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<YarnReceiptFormData>({
    resolver: zodResolver(yarnReceiptSchema),
    defaultValues: {
      receiptDate: new Date().toISOString().split('T')[0],
      details: [
        {
          yarnCountId: '',
          lotNo: '',
          bags: 1,
          conesPerBag: 0,
          weightPerCone: 0,
          grossWeight: 0,
          tareWeight: 0,
          ratePerKg: 0,
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'details',
  });

  useEffect(() => {
    if (!receipt || isInitialized) {
      return;
    }

    const mappedDetails = (receipt.details || []).map((detail) => {
      const cones = detail.coneCount || 0;
      return {
        yarnCountId: detail.yarnCountId.toString(),
        lotNo: detail.lotNo || '',
        bags: 1,
        conesPerBag: cones,
        weightPerCone: cones > 0 ? Number((detail.grossWeight / cones).toFixed(4)) : 0,
        grossWeight: Number(detail.grossWeight) || 0,
        tareWeight: Number(detail.tareWeight) || 0,
        ratePerKg: Number(detail.ratePerKg) || 0,
      };
    });

    reset({
      receiptDate: receipt.receiptDate.split('T')[0],
      partyId: receipt.partyId.toString(),
      vehicleId: receipt.vehicleId?.toString() || '',
      driverName: receipt.driverName || '',
      remarks: receipt.remarks || '',
      details: mappedDetails.length > 0 ? mappedDetails : [{
        yarnCountId: '',
        lotNo: '',
        bags: 1,
        conesPerBag: 0,
        weightPerCone: 0,
        grossWeight: 0,
        tareWeight: 0,
        ratePerKg: 0,
      }],
    });

    replace(mappedDetails.length > 0 ? mappedDetails : [{
      yarnCountId: '',
      lotNo: '',
      bags: 1,
      conesPerBag: 0,
      weightPerCone: 0,
      grossWeight: 0,
      tareWeight: 0,
      ratePerKg: 0,
    }]);

    setIsInitialized(true);
  }, [receipt, isInitialized, reset, replace]);

  const partyIdValue = watch('partyId');

  useEffect(() => {
    if (!receipt?.partyId) {
      return;
    }

    if (!partyIdValue) {
      setValue('partyId', receipt.partyId.toString(), { shouldValidate: true, shouldDirty: false });
    }
  }, [partyIdValue, receipt?.partyId, setValue]);

  const handleVehicleChange = (vehicleId: string) => {
    setValue('vehicleId', vehicleId);
    const vehicle = vehicles.find((v) => v.id.toString() === vehicleId);
    if (vehicle?.driverName) {
      setValue('driverName', vehicle.driverName);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (data: YarnReceiptFormData) => {
      const payload = {
        receiptDate: data.receiptDate,
        partyId: parseInt(data.partyId, 10),
        vehicleId: data.vehicleId ? parseInt(data.vehicleId, 10) : null,
        vehicleNo: null,
        driverName: data.driverName || null,
        remarks: data.remarks || null,
        details: data.details.map((detail) => {
          const cones = (detail.bags || 0) * (detail.conesPerBag || 0);
          return {
            yarnCountId: parseInt(detail.yarnCountId, 10),
            lotNo: detail.lotNo || null,
            bagNo: null,
            grossWeight: detail.grossWeight,
            tareWeight: detail.tareWeight,
            coneCount: cones > 0 ? cones : null,
            ratePerKg: detail.ratePerKg,
          };
        }),
      };

      const response = await apiClient.put(`${endpoints.yarnReceipts}/${id}`, payload);
      if (!response.success) {
        const errMsg = Array.isArray(response.errors)
          ? response.errors.join(', ')
          : (response.message || 'Failed to update yarn receipt');
        throw new Error(errMsg);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarnReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['yarnReceipt', id] });
      toast.success('Yarn receipt updated successfully');
      router.push('/sizing/yarn-receipt');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update yarn receipt');
    },
  });

  const watchDetails = watch('details');
  const vehicleIdValue = watch('vehicleId');

  const totals = useMemo(
    () =>
      watchDetails?.reduce(
        (acc, detail) => {
          const bags = detail.bags || 0;
          const cones = bags * (detail.conesPerBag || 0);
          const gross = detail.grossWeight || 0;
          const tare = detail.tareWeight || 0;
          const net = calculateNetWeight(gross, tare);

          return {
            bags: acc.bags + bags,
            cones: acc.cones + cones,
            grossWeight: acc.grossWeight + gross,
            tareWeight: acc.tareWeight + tare,
            netWeight: acc.netWeight + net,
          };
        },
        { bags: 0, cones: 0, grossWeight: 0, tareWeight: 0, netWeight: 0 }
      ) || { bags: 0, cones: 0, grossWeight: 0, tareWeight: 0, netWeight: 0 },
    [watchDetails]
  );

  const onSubmit = async (data: YarnReceiptFormData) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch {
      // Error is handled via onError toast in mutation config.
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Receipt Not Found</h2>
        <p className="text-muted-foreground">The selected yarn receipt could not be loaded.</p>
        <Link href="/sizing/yarn-receipt">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>
    );
  }

  if (!isAdmin && (receipt.status !== 'Draft' || receipt.isLocked)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Lock className="h-12 w-12 text-orange-500" />
        <h2 className="text-xl font-semibold">This receipt cannot be edited</h2>
        <div className="text-muted-foreground flex items-center gap-2">
          <span>Only draft and unlocked receipts are editable. Current status:</span>
          <Badge variant="grey">{receipt.status}</Badge>
        </div>
        <Link href="/sizing/yarn-receipt">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>
    );
  }

  const isApprovedAdminEdit = isAdmin && receipt.status === 'Approved';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sizing/yarn-receipt">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Yarn Receipt</h1>
            <p className="text-gray-500">{receipt.receiptNumber} • {receipt.partyName}</p>
          </div>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Update Receipt
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Receipt Details
                  </CardTitle>
                  <CardDescription>Update basic receipt information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Receipt No</Label>
                      <Input value={receipt.receiptNumber} disabled className="font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiptDate" required>Receipt Date</Label>
                      <Input id="receiptDate" type="date" {...register('receiptDate')} error={!!errors.receiptDate} />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Status</Label>
                      <Input value={receipt.status} disabled />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partyId" required>Party / Vendor</Label>
                      <input type="hidden" {...register('partyId')} />
                      {isApprovedAdminEdit ? (
                        <Input value={receipt.partyName} disabled className="bg-gray-50" />
                      ) : (
                        <Select
                          value={partyIdValue || ''}
                          onValueChange={(value) => setValue('partyId', value, { shouldValidate: true })}
                          disabled={isLoadingParties}
                        >
                          <SelectTrigger error={!!errors.partyId}>
                            <SelectValue placeholder={isLoadingParties ? 'Loading parties...' : 'Select party'} />
                          </SelectTrigger>
                          <SelectContent>
                            {parties.map((party) => (
                              <SelectItem key={party.id} value={party.id.toString()}>
                                {party.partyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driverName">Driver Name</Label>
                      <Input id="driverName" {...register('driverName')} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Yarn Details</CardTitle>
                      <CardDescription>
                        {isApprovedAdminEdit
                          ? 'Approved receipt: yarn details are read-only. You can update transport/remarks only.'
                          : 'Manage yarn count, lot, and weight details'}
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isApprovedAdminEdit}
                      onClick={() => append({
                        yarnCountId: '',
                        lotNo: '',
                        bags: 1,
                        conesPerBag: 0,
                        weightPerCone: 0,
                        grossWeight: 0,
                        tareWeight: 0,
                        ratePerKg: 0,
                      })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Row
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead className="min-w-[140px]">Yarn Count</TableHead>
                          <TableHead className="min-w-[120px]">Lot No</TableHead>
                          <TableHead className="w-[90px] text-right">Bags</TableHead>
                          <TableHead className="w-[110px] text-right">Cones/Bag</TableHead>
                          <TableHead className="w-[90px] text-right">Total Cones</TableHead>
                          <TableHead className="w-[130px] text-right">Gross Wt</TableHead>
                          <TableHead className="w-[130px] text-right">Tare Wt</TableHead>
                          <TableHead className="w-[130px] text-right">Net Wt</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => {
                          const detail = watchDetails?.[index];
                          const cones = (detail?.bags || 0) * (detail?.conesPerBag || 0);
                          const netWeight = calculateNetWeight(detail?.grossWeight || 0, detail?.tareWeight || 0);

                          return (
                            <TableRow key={field.id}>
                              <TableCell className="font-mono">{index + 1}</TableCell>
                              <TableCell>
                                <Select value={detail?.yarnCountId || ''} onValueChange={(value) => setValue(`details.${index}.yarnCountId`, value)} disabled={isLoadingYarnCounts || isApprovedAdminEdit}>
                                  <SelectTrigger className="w-full" error={!!errors.details?.[index]?.yarnCountId}>
                                    <SelectValue placeholder={isLoadingYarnCounts ? 'Loading...' : 'Select'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {yarnCounts.map((count) => (
                                      <SelectItem key={count.id} value={count.id.toString()}>{count.countCode}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input placeholder="LOT-XXX" readOnly={isApprovedAdminEdit} {...register(`details.${index}.lotNo`)} />
                              </TableCell>
                              <TableCell>
                                <Input type="number" className="text-right font-mono" readOnly={isApprovedAdminEdit} {...register(`details.${index}.bags`, { valueAsNumber: true })} />
                              </TableCell>
                              <TableCell>
                                <Input type="number" className="text-right font-mono" readOnly={isApprovedAdminEdit} {...register(`details.${index}.conesPerBag`, { valueAsNumber: true })} />
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium">{cones}</TableCell>
                              <TableCell>
                                <Input type="number" step="0.001" className="text-right font-mono" readOnly={isApprovedAdminEdit} {...register(`details.${index}.grossWeight`, { valueAsNumber: true })} />
                              </TableCell>
                              <TableCell>
                                <Input type="number" step="0.001" className="text-right font-mono" readOnly={isApprovedAdminEdit} {...register(`details.${index}.tareWeight`, { valueAsNumber: true })} />
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-primary">{formatNumber(netWeight)}</TableCell>
                              <TableCell>
                                {fields.length > 1 && !isApprovedAdminEdit && (
                                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter>
                        <TableRow className="bg-gray-50 font-bold">
                          <TableCell colSpan={3} className="text-right">Total</TableCell>
                          <TableCell className="text-right font-mono">{totals.bags}</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right font-mono">{totals.cones}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(totals.grossWeight)}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(totals.tareWeight)}</TableCell>
                          <TableCell className="text-right font-mono text-primary">{formatNumber(totals.netWeight)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Transport Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleId">Vehicle</Label>
                    <Select value={vehicleIdValue || ''} onValueChange={handleVehicleChange} disabled={isLoadingVehicles}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingVehicles ? 'Loading...' : 'Select vehicle'} />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>{vehicle.vehicleNo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Bags</span>
                      <span className="font-mono font-bold">{totals.bags}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cones</span>
                      <span className="font-mono font-bold">{totals.cones}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Weight</span>
                      <span className="font-mono">{formatNumber(totals.grossWeight)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tare Weight</span>
                      <span className="font-mono">{formatNumber(totals.tareWeight)} kg</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Net Weight</span>
                      <span className="font-mono font-bold text-primary">{formatNumber(totals.netWeight)} kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Enter any additional remarks..." rows={3} {...register('remarks')} />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}

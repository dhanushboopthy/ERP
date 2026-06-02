'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import apiClient, { endpoints } from '@/lib/api-client';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { formatNumber, calculateNetWeight } from '@/lib/utils';
import { toast } from 'sonner';

// Validation schema - Matches backend CreateYarnReceiptRequest DTO
const yarnReceiptDetailSchema = z.object({
  yarnCountId: z.string().min(1, 'Yarn count is required'),
  lotNo: z.string().optional(),
  bagNo: z.string().optional(),
  bags: z.number().optional(),
  conesPerBag: z.number().optional(),
  weightPerCone: z.number().optional(),
  grossWeight: z.number().min(0.001, 'Gross weight required'),
  tareWeight: z.number().min(0, 'Tare weight required'),
  coneCount: z.number().optional(),
  ratePerKg: z.number().min(0, 'Rate per kg required'),
});

const yarnReceiptSchema = z.object({
  receiptDate: z.string().min(1, 'Receipt date is required'),
  partyId: z.string().min(1, 'Party is required'),
  vehicleId: z.string().optional(),
  vehicleNo: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  pdcNo: z.string().optional(),
  pdcDate: z.string().optional(),
  millName: z.string().optional(),
  remarks: z.string().optional(),
  details: z.array(yarnReceiptDetailSchema).min(1, 'At least one detail row is required'),
});

type YarnReceiptFormData = z.infer<typeof yarnReceiptSchema>;

// Party and YarnCount types
interface Party {
  id: number;
  partyCode: string;
  partyName: string;
  gstin?: string;
}

interface YarnCount {
  id: number;
  countCode: string;
  description?: string;
}

interface Vehicle {
  id: number;
  vehicleNo: string;
  driverName?: string;
  driverPhone?: string;
}

export default function NewYarnReceiptPage() {
  return (
    <RouteGuard requiredPermission="YARN_RECEIPT.CREATE">
      <NewYarnReceiptForm />
    </RouteGuard>
  );
}

function NewYarnReceiptForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Fetch parties from API
  const { data: partiesData, isLoading: isLoadingParties } = useQuery<{ items: Party[] }>({
    queryKey: ['parties'],
    queryFn: async () => {
      const response: any = await apiClient.get('/api/parties?pageSize=500');
      const d = response.data;
      return Array.isArray(d) ? { items: d } : (d ?? { items: [] });
    },
  });

  // Fetch yarn counts from API
  const { data: yarnCountsData, isLoading: isLoadingYarnCounts } = useQuery<{ items: YarnCount[] }>({
    queryKey: ['yarnCounts'],
    queryFn: async () => {
      const response: any = await apiClient.get('/api/yarncounts?pageSize=500');
      const d = response.data;
      return Array.isArray(d) ? { items: d } : (d ?? { items: [] });
    },
  });

  // Fetch vehicles from API
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

  const isLoadingMasters = isLoadingParties || isLoadingYarnCounts;

  // Create mutation with automatic query invalidation
  const createMutation = useMutation({
    mutationFn: async (data: YarnReceiptFormData) => {
      const response = await apiClient.post(endpoints.yarnReceipts, {
        receiptDate: data.receiptDate,
        partyId: parseInt(data.partyId),
        vehicleId: data.vehicleId ? parseInt(data.vehicleId) : null,
        vehicleNo: data.vehicleNo || null,
        driverName: data.driverName || null,
        remarks: data.remarks || null,
        details: data.details.map(detail => ({
          yarnCountId: parseInt(detail.yarnCountId),
          lotNo: detail.lotNo || null,
          bagNo: detail.bagNo || null,
          grossWeight: detail.grossWeight,
          tareWeight: detail.tareWeight,
          coneCount: detail.coneCount || null,
          ratePerKg: detail.ratePerKg,
        })),
      });
      
      if (!response.success) {
        const errMsg = Array.isArray(response.errors) ? response.errors.join(', ') : (response.message || 'Failed to create yarn receipt');
        throw new Error(errMsg);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarnReceipts'] });
      toast.success('Yarn receipt created successfully!');
      router.push('/sizing/yarn-receipt');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create yarn receipt';
      toast.error(message);
      console.error('Create error:', error);
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<YarnReceiptFormData>({
    resolver: zodResolver(yarnReceiptSchema),
    defaultValues: {
      receiptDate: new Date().toISOString().split('T')[0],
      driverPhone: '',
      pdcNo: '',
      pdcDate: '',
      millName: '',
      details: [
        {
          yarnCountId: '',
          lotNo: '',
          bags: 1,
          conesPerBag: 50,
          weightPerCone: 0.5,
          grossWeight: 0,
          tareWeight: 0,
          ratePerKg: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'details',
  });

  const watchDetails = watch('details');
  const watchVehicleId = watch('vehicleId');

  // Auto-fill driver details when vehicle is selected
  const handleVehicleChange = (vehicleId: string) => {
    setValue('vehicleId', vehicleId);
    const vehicle = vehicles.find((v) => v.id.toString() === vehicleId);
    if (vehicle) {
      setValue('driverName', vehicle.driverName || '');
      setValue('driverPhone', vehicle.driverPhone || '');
    }
  };

  // Calculate totals
  const calculateRowCones = (bags: number, conesPerBag: number) => bags * conesPerBag;
  const calculateRowNetWeight = (gross: number, tare: number) => calculateNetWeight(gross, tare);

  const totals = watchDetails?.reduce(
    (acc, detail) => ({
      bags: acc.bags + (detail.bags || 0),
      cones: acc.cones + calculateRowCones(detail.bags || 0, detail.conesPerBag || 0),
      grossWeight: acc.grossWeight + (detail.grossWeight || 0),
      tareWeight: acc.tareWeight + (detail.tareWeight || 0),
      netWeight:
        acc.netWeight + calculateRowNetWeight(detail.grossWeight || 0, detail.tareWeight || 0),
    }),
    { bags: 0, cones: 0, grossWeight: 0, tareWeight: 0, netWeight: 0 }
  );

  // Keyboard shortcuts
  useKeyboardShortcut([
    { key: 's', ctrl: true, callback: () => { if (!isSubmitting) handleSubmit(onSubmit)(); } },
    { key: 'Escape', callback: () => router.back() },
  ]);

  const onSubmit = async (data: YarnReceiptFormData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while fetching master data
  if (isLoadingMasters) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Loading master data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sizing/yarn-receipt">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Yarn Receipt</h1>
            <p className="text-gray-500">Create a new yarn inward entry</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Receipt'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Details Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Receipt Details
                  </CardTitle>
                  <CardDescription>Enter the basic receipt information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Receipt No</Label>
                      <Input value="YR/24-25/000157" disabled className="font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiptDate" required>
                        Receipt Date
                      </Label>
                      <Input
                        id="receiptDate"
                        type="date"
                        {...register('receiptDate')}
                        error={!!errors.receiptDate}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pdcNo">PDC No</Label>
                      <Input id="pdcNo" placeholder="PDC-XXXX" {...register('pdcNo')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pdcDate">PDC Date</Label>
                      <Input id="pdcDate" type="date" {...register('pdcDate')} />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partyId" required>
                        Party / Vendor
                      </Label>
                      <Select onValueChange={(value) => setValue('partyId', value)} disabled={isLoadingParties}>
                        <SelectTrigger error={!!errors.partyId}>
                          <SelectValue placeholder={isLoadingParties ? "Loading parties..." : "Select party"} />
                        </SelectTrigger>
                        <SelectContent>
                          {parties.map((party) => (
                            <SelectItem key={party.id} value={party.id.toString()}>
                              <div className="flex flex-col">
                                <span>{party.partyName}</span>
                                {party.gstin && <span className="text-xs text-gray-500">{party.gstin}</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.partyId && (
                        <p className="text-xs text-red-500">{errors.partyId.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="millName">Mill Name</Label>
                      <Input id="millName" placeholder="Enter mill name" {...register('millName')} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Yarn Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Yarn Details</CardTitle>
                      <CardDescription>Add yarn count, lot, and weight details</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          yarnCountId: '',
                          lotNo: '',
                          bags: 1,
                          conesPerBag: 50,
                          weightPerCone: 0.5,
                          grossWeight: 0,
                          tareWeight: 0,                          ratePerKg: 0,                        })
                      }
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
                          <TableHead className="min-w-[150px]">Yarn Count</TableHead>
                          <TableHead className="min-w-[120px]">Lot No</TableHead>
                          <TableHead className="w-[80px] text-right">Bags</TableHead>
                          <TableHead className="w-[100px] text-right">Cones/Bag</TableHead>
                          <TableHead className="w-[80px] text-right">Total Cones</TableHead>
                          <TableHead className="w-[100px] text-right">Wt/Cone (kg)</TableHead>
                          <TableHead className="w-[120px] text-right">Gross Wt (kg)</TableHead>
                          <TableHead className="w-[120px] text-right">Tare Wt (kg)</TableHead>
                          <TableHead className="w-[120px] text-right">Net Wt (kg)</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => {
                          const detail = watchDetails?.[index];
                          const cones = calculateRowCones(
                            detail?.bags || 0,
                            detail?.conesPerBag || 0
                          );
                          const netWeight = calculateRowNetWeight(
                            detail?.grossWeight || 0,
                            detail?.tareWeight || 0
                          );

                          return (
                            <TableRow key={field.id}>
                              <TableCell className="font-mono">{index + 1}</TableCell>
                              <TableCell>
                                <Select
                                  onValueChange={(value) =>
                                    setValue(`details.${index}.yarnCountId`, value)
                                  }
                                  disabled={isLoadingYarnCounts}
                                >
                                  <SelectTrigger
                                    className="w-full"
                                    error={!!errors.details?.[index]?.yarnCountId}
                                  >
                                    <SelectValue placeholder={isLoadingYarnCounts ? "Loading..." : "Select"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {yarnCounts.map((count) => (
                                      <SelectItem key={count.id} value={count.id.toString()}>
                                        {count.countCode}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="LOT-XXX"
                                  {...register(`details.${index}.lotNo`)}
                                  error={!!errors.details?.[index]?.lotNo}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="text-right font-mono"
                                  {...register(`details.${index}.bags`, { valueAsNumber: true })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="text-right font-mono"
                                  {...register(`details.${index}.conesPerBag`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium">
                                {cones}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.001"
                                  className="text-right font-mono"
                                  {...register(`details.${index}.weightPerCone`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.001"
                                  className="text-right font-mono"
                                  {...register(`details.${index}.grossWeight`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.001"
                                  className="text-right font-mono"
                                  {...register(`details.${index}.tareWeight`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-primary">
                                {formatNumber(netWeight)}
                              </TableCell>
                              <TableCell>
                                {fields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
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
                          <TableCell colSpan={3} className="text-right">
                            Total
                          </TableCell>
                          <TableCell className="text-right font-mono">{totals?.bags}</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right font-mono">{totals?.cones}</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(totals?.grossWeight || 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(totals?.tareWeight || 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-primary">
                            {formatNumber(totals?.netWeight || 0)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Vehicle Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Transport Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleId">Vehicle</Label>
                    <Select onValueChange={handleVehicleChange} disabled={isLoadingVehicles}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingVehicles ? "Loading..." : "Select vehicle"} />
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
                    <Label htmlFor="driverName">Driver Name</Label>
                    <Input id="driverName" {...register('driverName')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverPhone">Driver Phone</Label>
                    <Input id="driverPhone" {...register('driverPhone')} maxLength={10} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
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
                      <span className="font-mono font-bold">{totals?.bags}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cones</span>
                      <span className="font-mono font-bold">{totals?.cones}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Weight</span>
                      <span className="font-mono">{formatNumber(totals?.grossWeight || 0)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tare Weight</span>
                      <span className="font-mono">{formatNumber(totals?.tareWeight || 0)} kg</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Net Weight</span>
                      <span className="font-mono font-bold text-primary">
                        {formatNumber(totals?.netWeight || 0)} kg
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Remarks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter any additional remarks..."
                    rows={3}
                    {...register('remarks')}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}


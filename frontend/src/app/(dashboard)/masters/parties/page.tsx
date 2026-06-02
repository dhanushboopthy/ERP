'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Loader2, Building2, Phone, Mail, MapPin, CreditCard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useAuth } from '@/lib/auth-context';
import { PermissionButton } from '@/components/ui/permission-button';
import { useKeyboardShortcut, commonShortcuts } from '@/hooks/use-keyboard-shortcut';

interface Party {
  id: number;
  partyCode: string;
  partyName: string;
  partyType: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone?: string;
  mobile?: string;
  email?: string;
  contactPerson?: string;
  gstin?: string;
  pan?: string;
  creditDays: number;
  creditLimit: number;
  isBillToBill: boolean;
  isActive: boolean;
}

interface PartyFormData {
  partyCode: string;
  partyName: string;
  partyType: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  mobile: string;
  email: string;
  contactPerson: string;
  gstin: string;
  pan: string;
  creditDays: number;
  creditLimit: number;
  isBillToBill: boolean;
  isActive: boolean;
}

const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
];

const PARTY_TYPES = ['Customer', 'Supplier', 'Both', 'Transporter', 'Agent'];

const initialFormData: PartyFormData = {
  partyCode: '',
  partyName: '',
  partyType: 'Customer',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  stateCode: '',
  pincode: '',
  phone: '',
  mobile: '',
  email: '',
  contactPerson: '',
  gstin: '',
  pan: '',
  creditDays: 30,
  creditLimit: 0,
  isBillToBill: false,
  isActive: true,
};

export default function PartiesPage() {
  return (
    <RouteGuard requiredPermission="PARTY.VIEW">
      <PartiesContent />
    </RouteGuard>
  );
}

function PartiesContent() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [formData, setFormData] = useState<PartyFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Keyboard shortcuts
  useKeyboardShortcut([
    commonShortcuts.create(() => {
      setEditingParty(null);
      setFormData(initialFormData);
      setFormErrors({});
      setIsDialogOpen(true);
    }),
    commonShortcuts.refresh(() => refetch()),
    commonShortcuts.search(() => document.getElementById('party-search')?.focus()),
  ]);

  // Fetch parties
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['parties', page, search, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        pageNumber: page.toString(),
        pageSize: '20',
      });
      if (search) params.append('search', search);
      if (typeFilter !== 'all') params.append('partyType', typeFilter);

      const response = await apiClient.get(`/api/parties?${params}`);

      // ApiResponse wraps the paged result in `data`
      const payload: any = response.data ?? response;
      const items = payload.items || payload.Items || [];
      const totalCount = payload.totalCount ?? payload.TotalCount ?? items.length;
      const pageSize = payload.pageSize ?? payload.PageSize ?? 20;
      const totalPages = payload.totalPages ?? payload.TotalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));

      return { items, totalPages };
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: PartyFormData) => {
      const response = await apiClient.post('/api/parties', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success('Party created successfully');
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create party');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PartyFormData }) => {
      const response = await apiClient.put(`/api/parties/${id}`, { id, ...data });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success('Party updated successfully');
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update party');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/api/parties/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success('Party deleted successfully');
      setIsDeleteDialogOpen(false);
      setEditingParty(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Cannot delete party - it may be in use');
    },
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.partyCode.trim()) {
      errors.partyCode = 'Party code is required';
    }
    if (!formData.partyName.trim()) {
      errors.partyName = 'Party name is required';
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.state) {
      errors.state = 'State is required';
    }
    if (!formData.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }
    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      errors.gstin = 'Invalid GSTIN format';
    }
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      errors.pan = 'Invalid PAN format';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = 'Mobile must be 10 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingParty) {
      updateMutation.mutate({ id: editingParty.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreateDialog = () => {
    if (!hasPermission('PARTY.CREATE')) {
      toast.error("You don't have permission to perform this action. Please contact your administrator.");
      return;
    }
    setEditingParty(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (party: Party) => {
    if (!hasPermission('PARTY.EDIT')) {
      toast.error("You don't have permission to perform this action. Please contact your administrator.");
      return;
    }
    setEditingParty(party);
    setFormData({
      partyCode: party.partyCode,
      partyName: party.partyName,
      partyType: party.partyType,
      addressLine1: party.addressLine1 || '',
      addressLine2: party.addressLine2 || '',
      city: party.city,
      state: party.state,
      stateCode: party.stateCode,
      pincode: party.pincode,
      phone: party.phone || '',
      mobile: party.mobile || '',
      email: party.email || '',
      contactPerson: party.contactPerson || '',
      gstin: party.gstin || '',
      pan: party.pan || '',
      creditDays: party.creditDays,
      creditLimit: party.creditLimit,
      isBillToBill: party.isBillToBill,
      isActive: party.isActive,
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingParty(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleStateChange = (stateName: string) => {
    const state = INDIAN_STATES.find(s => s.name === stateName);
    setFormData(prev => ({
      ...prev,
      state: stateName,
      stateCode: state?.code || '',
    }));
  };

  const parties = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parties Master</h1>
          <p className="text-sm text-gray-500">Manage customers, suppliers, and other parties</p>
        </div>
        <PermissionButton permission="PARTY.CREATE" onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Party
        </PermissionButton>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by code, name, GSTIN..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PARTY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          ) : error ? (
            <div className="p-12 text-center space-y-4">
              <p className="text-brand-danger font-medium">Failed to load parties</p>
              <p className="text-sm text-gray-500">Unable to connect to the server. Please try again.</p>
              <Button onClick={() => refetch()} className="btn-brand-primary">
                Retry
              </Button>
            </div>
          ) : parties.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No parties found. Click &quot;Add Party&quot; to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parties.map((party: Party) => (
                  <TableRow key={party.id}>
                    <TableCell className="font-medium">{party.partyCode}</TableCell>
                    <TableCell>{party.partyName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{party.partyType}</Badge>
                    </TableCell>
                    <TableCell>{party.city}, {party.state}</TableCell>
                    <TableCell className="font-mono text-xs">{party.gstin || '-'}</TableCell>
                    <TableCell>
                      {party.mobile || party.phone || '-'}
                    </TableCell>
                    <TableCell>
                      {party.creditDays} days / ₹{party.creditLimit.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={party.isActive ? 'default' : 'grey'}>
                        {party.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <PermissionButton
                          permission="PARTY.EDIT"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(party)}
                        >
                          <Edit className="h-4 w-4" />
                        </PermissionButton>
                        <PermissionButton
                          permission="PARTY.DELETE"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingParty(party);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </PermissionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : parties.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No parties found.
            </CardContent>
          </Card>
        ) : (
          parties.map((party: Party) => (
            <Card key={party.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{party.partyCode}</span>
                      <Badge variant="outline" className="text-xs">{party.partyType}</Badge>
                    </div>
                    <p className="font-medium">{party.partyName}</p>
                  </div>
                  <Badge variant={party.isActive ? 'default' : 'grey'}>
                    {party.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {party.city}, {party.state}
                  </div>
                  {party.mobile && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {party.mobile}
                    </div>
                  )}
                  {party.gstin && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3" />
                      <span className="font-mono text-xs">{party.gstin}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(party)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingParty(party);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle>
                  {editingParty ? 'Edit Party' : 'Add New Party'}
                </DialogTitle>
                <DialogDescription>
                  {editingParty ? 'Update party details' : 'Enter party details to create a new record'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partyCode">Party Code *</Label>
                <Input
                  id="partyCode"
                  value={formData.partyCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, partyCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g., CUST001"
                  className={formErrors.partyCode ? 'border-red-500' : ''}
                />
                {formErrors.partyCode && <p className="text-xs text-red-500">{formErrors.partyCode}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="partyType">Party Type *</Label>
                <Select
                  value={formData.partyType}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, partyType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partyName">Party Name *</Label>
              <Input
                id="partyName"
                value={formData.partyName}
                onChange={(e) => setFormData(prev => ({ ...prev, partyName: e.target.value }))}
                placeholder="Legal name of the party"
                className={formErrors.partyName ? 'border-red-500' : ''}
              />
              {formErrors.partyName && <p className="text-xs text-red-500">{formErrors.partyName}</p>}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                placeholder="Area, landmark"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className={formErrors.city ? 'border-red-500' : ''}
                />
                {formErrors.city && <p className="text-xs text-red-500">{formErrors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={handleStateChange}>
                  <SelectTrigger className={formErrors.state ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(state => (
                      <SelectItem key={state.code} value={state.name}>
                        {state.name} ({state.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.state && <p className="text-xs text-red-500">{formErrors.state}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="6 digits"
                  className={formErrors.pincode ? 'border-red-500' : ''}
                />
                {formErrors.pincode && <p className="text-xs text-red-500">{formErrors.pincode}</p>}
              </div>
            </div>

            {/* Contact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="10 digits"
                  className={formErrors.mobile ? 'border-red-500' : ''}
                />
                {formErrors.mobile && <p className="text-xs text-red-500">{formErrors.mobile}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Landline with STD code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
              </div>
            </div>

            {/* Tax Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={formData.gstin}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  placeholder="15 character GSTIN"
                  maxLength={15}
                  className={formErrors.gstin ? 'border-red-500' : ''}
                />
                {formErrors.gstin && <p className="text-xs text-red-500">{formErrors.gstin}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  value={formData.pan}
                  onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                  placeholder="10 character PAN"
                  maxLength={10}
                  className={formErrors.pan ? 'border-red-500' : ''}
                />
                {formErrors.pan && <p className="text-xs text-red-500">{formErrors.pan}</p>}
              </div>
            </div>

            {/* Credit Terms */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="creditDays">Credit Days</Label>
                <Input
                  id="creditDays"
                  type="number"
                  min="0"
                  value={formData.creditDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditDays: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  min="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="isBillToBill"
                  checked={formData.isBillToBill}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isBillToBill: checked }))}
                />
                <Label htmlFor="isBillToBill">Bill-to-Bill</Label>
              </div>
            </div>

            {editingParty && (
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingParty ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Party</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{editingParty?.partyName}&quot;? 
              This action cannot be undone if the party is not used in any transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => editingParty && deleteMutation.mutate(editingParty.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


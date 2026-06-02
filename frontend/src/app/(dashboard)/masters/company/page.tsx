'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  CreditCard,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

interface CompanyData {
  id?: number;
  companyName: string;
  shortName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
  pan?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
}

export default function CompanyMasterPage() {
  return (
    <RouteGuard requireAdmin>
      <CompanyMasterContent />
    </RouteGuard>
  );
}

function CompanyMasterContent() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CompanyData>({
    companyName: '',
    shortName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    stateCode: '',
    pincode: '',
    country: 'India',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    pan: '',
    bankName: '',
    bankBranch: '',
    bankAccountNo: '',
    bankIfsc: '',
  });

  // Fetch company data
  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await apiClient.get<CompanyData>('/api/companies/current');
      return res.data as CompanyData | undefined;
    },
  });

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CompanyData) => {
      if (data.id) {
        return apiClient.put(`/api/companies/${data.id}`, data);
      }
      return apiClient.post('/api/companies', data);
    },
    onSuccess: () => {
      toast.success('Company details saved successfully');
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
    onError: () => {
      toast.error('Failed to save company details');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Master</h1>
          <p className="text-gray-500">Manage your company information and settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Company name and identification details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortName">Short Name *</Label>
                  <Input
                    id="shortName"
                    name="shortName"
                    value={formData.shortName}
                    onChange={handleChange}
                    placeholder="e.g., STMPL"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    name="gstin"
                    value={formData.gstin || ''}
                    onChange={handleChange}
                    placeholder="e.g., 33AABCS1234A1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input
                    id="pan"
                    name="pan"
                    value={formData.pan || ''}
                    onChange={handleChange}
                    placeholder="e.g., AABCS1234A"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>Phone, email and website details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="e.g., 0424-2345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    placeholder="e.g., info@company.com"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    placeholder="e.g., www.company.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </CardTitle>
              <CardDescription>Company registered address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="Street address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.addressLine2 || ''}
                  onChange={handleChange}
                  placeholder="Additional address details"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="e.g., 638001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g., Tamil Nadu"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateCode">State Code *</Label>
                  <Input
                    id="stateCode"
                    name="stateCode"
                    value={formData.stateCode}
                    onChange={handleChange}
                    placeholder="e.g., 33"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Details
              </CardTitle>
              <CardDescription>Company bank account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    value={formData.bankName || ''}
                    onChange={handleChange}
                    placeholder="e.g., State Bank of India"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankBranch">Branch</Label>
                  <Input
                    id="bankBranch"
                    name="bankBranch"
                    value={formData.bankBranch || ''}
                    onChange={handleChange}
                    placeholder="e.g., Main Branch"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNo">Account Number</Label>
                  <Input
                    id="bankAccountNo"
                    name="bankAccountNo"
                    value={formData.bankAccountNo || ''}
                    onChange={handleChange}
                    placeholder="Bank account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankIfsc">IFSC Code</Label>
                  <Input
                    id="bankIfsc"
                    name="bankIfsc"
                    value={formData.bankIfsc || ''}
                    onChange={handleChange}
                    placeholder="e.g., SBIN0001234"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending} size="lg">
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Company Details
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}


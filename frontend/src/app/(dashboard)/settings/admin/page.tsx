'use client';

import { useState, useEffect, type ComponentPropsWithoutRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Settings,
  Save,
  RotateCcw,
  Loader2,
  Building2,
  Shield,
  FileText,
  Calculator,
  Bell,
  Upload,
  AlertCircle,
  CheckCircle,
  Info,
  Lock,
  Clock,
  Globe,
  Hash,
  Percent,
  Package,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import NextImage from 'next/image';
import { Card as BaseCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { SettingsShell, settingsCardClass } from '@/components/settings/settings-shell';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

interface AdminSettings {
  // General Settings
  companyName: string;
  companyLogo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  gstNo: string;
  panNo: string;
  defaultFinancialYearId: number;
  decimalPrecision: number;
  defaultLanguage: string;

  // Security Settings
  minPasswordLength: number;
  passwordExpiryDays: number;
  sessionTimeoutMins: number;
  maxLoginAttempts: number;
  forceLogoutOnRoleChange: boolean;
  enableIpRestriction: boolean;
  allowedIps?: string;

  // Document Settings
  documentPrefix: string;
  autoGenerateNumbers: boolean;
  lockDocumentAfterPrint: boolean;
  allowManualOverride: boolean;
  requireApprovalBeforePrint: boolean;

  // Business Rule Settings
  allowNegativeStock: boolean;
  enforceApprovalWorkflow: boolean;
  defaultGstPercent: number;
  defaultHsnCode: string;
  lowStockAlertThreshold: number;
  overdueAlertDays: number;
}

const defaultSettings: AdminSettings = {
  companyName: 'Sudhan Textile',
  address: '123, Industrial Area, Coimbatore - 641001',
  phone: '+91 98765 43210',
  email: 'info@sudhantextile.com',
  website: 'www.sudhantextile.com',
  gstNo: '33AAAAA0000A1Z5',
  panNo: 'AAAAA0000A',
  defaultFinancialYearId: 1,
  decimalPrecision: 2,
  defaultLanguage: 'en',
  minPasswordLength: 8,
  passwordExpiryDays: 90,
  sessionTimeoutMins: 30,
  maxLoginAttempts: 5,
  forceLogoutOnRoleChange: true,
  enableIpRestriction: false,
  allowedIps: '',
  documentPrefix: 'ST',
  autoGenerateNumbers: true,
  lockDocumentAfterPrint: true,
  allowManualOverride: false,
  requireApprovalBeforePrint: true,
  allowNegativeStock: false,
  enforceApprovalWorkflow: true,
  defaultGstPercent: 5,
  defaultHsnCode: '52081300',
  lowStockAlertThreshold: 500,
  overdueAlertDays: 7,
};

export default function AdminSettingsPage() {
  return (
    <RouteGuard requireAdmin>
      <AdminSettingsContent />
    </RouteGuard>
  );
}

function AdminSettingsContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch admin settings
  const { data: fetchedSettings, isLoading } = useQuery<AdminSettings>({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      const res = await apiClient.get<AdminSettings>('/api/settings/admin');
      if (!res.success || !res.data) {
        return defaultSettings;
      }
      return res.data;
    },
  });

  // Fetch financial years for dropdown
  const { data: financialYears = [] } = useQuery({
    queryKey: ['financialYears'],
    queryFn: async () => {
      const res = await apiClient.get<{ id: number; yearName: string; isCurrent: boolean }[]>('/api/settings/financial-years');
      if (!res.success || !res.data) {
        return [{ id: 1, yearName: '2024-25', isCurrent: true }];
      }
      return res.data;
    },
  });

  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AdminSettings) => {
      const res = await apiClient.put('/api/settings/admin', data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      toast.success('Settings saved successfully');
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const handleChange = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleReset = () => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
      setHasChanges(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SettingsShell
      title="Admin Settings"
      subtitle="System control center for enterprise configuration"
      actions={(
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="grey" className="mr-2">Unsaved changes</Badge>
          )}
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            className="bg-[color:var(--settings-accent)] hover:bg-[color:var(--settings-accent-strong)]"
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save All Changes
          </Button>
        </div>
      )}
    >
      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-2 rounded-2xl border border-[color:var(--settings-border)] bg-white/90 p-2 shadow-sm">
          <TabsTrigger value="general" className="gap-2 rounded-xl border border-slate-200 text-slate-600 data-[state=active]:bg-[color:var(--settings-accent)] data-[state=active]:text-white data-[state=active]:border-transparent">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 rounded-xl border border-slate-200 text-slate-600 data-[state=active]:bg-[color:var(--settings-accent)] data-[state=active]:text-white data-[state=active]:border-transparent">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 rounded-xl border border-slate-200 text-slate-600 data-[state=active]:bg-[color:var(--settings-accent)] data-[state=active]:text-white data-[state=active]:border-transparent">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2 rounded-xl border border-slate-200 text-slate-600 data-[state=active]:bg-[color:var(--settings-accent)] data-[state=active]:text-white data-[state=active]:border-transparent">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Company Information
              </CardTitle>
              <CardDescription>Basic company details used across the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-24 w-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                    {(logoPreview || settings.companyLogo) ? (
                      <NextImage 
                        src={logoPreview || settings.companyLogo || '/placeholder.png'} 
                        alt="Company Logo" 
                        width={96}
                        height={96}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </Label>
                </div>
                <div className="flex-1 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={settings.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Enter company address"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNo">GST Number</Label>
                  <Input
                    id="gstNo"
                    value={settings.gstNo}
                    onChange={(e) => handleChange('gstNo', e.target.value)}
                    placeholder="33AAAAA0000A1Z5"
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNo">PAN Number</Label>
                  <Input
                    id="panNo"
                    value={settings.panNo}
                    onChange={(e) => handleChange('panNo', e.target.value)}
                    placeholder="AAAAA0000A"
                    className="font-mono uppercase"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Default Financial Year</Label>
                  <Select
                    value={settings.defaultFinancialYearId.toString()}
                    onValueChange={(v) => handleChange('defaultFinancialYearId', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(financialYears) ? financialYears : []).map((fy) => (
                        <SelectItem key={fy.id} value={fy.id.toString()}>
                          {fy.yearName} {fy.isCurrent && '(Current)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Decimal Precision</Label>
                  <Select
                    value={settings.decimalPrecision.toString()}
                    onValueChange={(v) => handleChange('decimalPrecision', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 decimals</SelectItem>
                      <SelectItem value="1">1 decimal</SelectItem>
                      <SelectItem value="2">2 decimals</SelectItem>
                      <SelectItem value="3">3 decimals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select
                    value={settings.defaultLanguage}
                    onValueChange={(v) => handleChange('defaultLanguage', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                      <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Password Policy
              </CardTitle>
              <CardDescription>Configure password requirements and expiry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Minimum Password Length</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={settings.minPasswordLength}
                      onChange={(e) => handleChange('minPasswordLength', parseInt(e.target.value))}
                      min={6}
                      max={24}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">characters</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password Expiry</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={settings.passwordExpiryDays}
                      onChange={(e) => handleChange('passwordExpiryDays', parseInt(e.target.value))}
                      min={0}
                      max={365}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">days (0 = never)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Session Settings
              </CardTitle>
              <CardDescription>Configure session timeout and login security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Session Timeout</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={settings.sessionTimeoutMins}
                      onChange={(e) => handleChange('sessionTimeoutMins', parseInt(e.target.value))}
                      min={5}
                      max={480}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">minutes of inactivity</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                      min={1}
                      max={10}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">before account lockout</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label className="text-base">Force Logout on Role Change</Label>
                    <p className="text-sm text-gray-500">Automatically logout users when their role is modified</p>
                  </div>
                  <Switch
                    checked={settings.forceLogoutOnRoleChange}
                    onCheckedChange={(v) => handleChange('forceLogoutOnRoleChange', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label className="text-base">IP Address Restriction</Label>
                    <p className="text-sm text-gray-500">Limit access to specific IP addresses</p>
                  </div>
                  <Switch
                    checked={settings.enableIpRestriction}
                    onCheckedChange={(v) => handleChange('enableIpRestriction', v)}
                  />
                </div>

                {settings.enableIpRestriction && (
                  <div className="space-y-2 ml-4 p-4 bg-gray-50 rounded-lg">
                    <Label>Allowed IP Addresses</Label>
                    <Textarea
                      value={settings.allowedIps}
                      onChange={(e) => handleChange('allowedIps', e.target.value)}
                      placeholder="192.168.1.0/24&#10;10.0.0.1"
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">Enter one IP or CIDR range per line</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Settings Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                Document Numbering
              </CardTitle>
              <CardDescription>Configure how document numbers are generated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Document Prefix</Label>
                  <Input
                    value={settings.documentPrefix}
                    onChange={(e) => handleChange('documentPrefix', e.target.value.toUpperCase())}
                    placeholder="ST"
                    className="w-32 font-mono uppercase"
                    maxLength={5}
                  />
                  <p className="text-xs text-gray-500">Prefix for all document numbers</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label className="text-base">Auto-Generate Document Numbers</Label>
                    <p className="text-sm text-gray-500">Automatically generate sequential document numbers</p>
                  </div>
                  <Switch
                    checked={settings.autoGenerateNumbers}
                    onCheckedChange={(v) => handleChange('autoGenerateNumbers', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label className="text-base">Lock Document After Print</Label>
                    <p className="text-sm text-gray-500">Prevent editing once a document is printed</p>
                  </div>
                  <Switch
                    checked={settings.lockDocumentAfterPrint}
                    onCheckedChange={(v) => handleChange('lockDocumentAfterPrint', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <div>
                      <Label className="text-base">Allow Manual Override</Label>
                      <p className="text-sm text-gray-500">Allow admins to manually set document numbers</p>
                    </div>
                    <Badge variant="outline" className="text-xs">Admin Only</Badge>
                  </div>
                  <Switch
                    checked={settings.allowManualOverride}
                    onCheckedChange={(v) => handleChange('allowManualOverride', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label className="text-base">Require Approval Before Print</Label>
                    <p className="text-sm text-gray-500">Documents must be fully approved before printing</p>
                  </div>
                  <Switch
                    checked={settings.requireApprovalBeforePrint}
                    onCheckedChange={(v) => handleChange('requireApprovalBeforePrint', v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Rules Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Stock Management
              </CardTitle>
              <CardDescription>Configure stock validation and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Production Environment</AlertTitle>
                <AlertDescription className="text-red-700">
                  Negative stock is permanently disabled for production environments to maintain data integrity.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                <div>
                  <Label className="text-base">Allow Negative Stock</Label>
                  <p className="text-sm text-gray-500">Allow delivery when stock is insufficient</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="cancelled">Disabled</Badge>
                  <Switch
                    checked={false}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Low Stock Alert Threshold</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={settings.lowStockAlertThreshold}
                    onChange={(e) => handleChange('lowStockAlertThreshold', parseInt(e.target.value))}
                    min={0}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">kg (generate alert below this)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Approval Workflow
              </CardTitle>
              <CardDescription>Configure approval requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label className="text-base">Enforce Approval Workflow</Label>
                  <p className="text-sm text-gray-500">Require approvals as defined in approval matrix</p>
                </div>
                <Switch
                  checked={settings.enforceApprovalWorkflow}
                  onCheckedChange={(v) => handleChange('enforceApprovalWorkflow', v)}
                />
              </div>

              <div className="space-y-2">
                <Label>Overdue Alert Days</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={settings.overdueAlertDays}
                    onChange={(e) => handleChange('overdueAlertDays', parseInt(e.target.value))}
                    min={1}
                    max={90}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">days after due date to generate alert</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Tax Defaults
              </CardTitle>
              <CardDescription>Default tax settings for transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default GST Percentage</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={settings.defaultGstPercent}
                      onChange={(e) => handleChange('defaultGstPercent', parseFloat(e.target.value))}
                      min={0}
                      max={28}
                      step={0.5}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Default HSN/SAC Code (Sizing)</Label>
                  <Input
                    value={settings.defaultHsnCode}
                    onChange={(e) => handleChange('defaultHsnCode', e.target.value)}
                    placeholder="52081300"
                    className="w-40 font-mono"
                    maxLength={8}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">All changes are logged</p>
                  <p className="text-sm text-blue-700">
                    Every configuration change is recorded in the audit log for compliance and tracking purposes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky Save Button for Mobile */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden z-50">
          <Button onClick={handleSave} className="w-full" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save All Changes
          </Button>
        </div>
      )}
    </SettingsShell>
  );
}


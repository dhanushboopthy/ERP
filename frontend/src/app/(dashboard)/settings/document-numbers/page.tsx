'use client';

import { useState, useEffect, type ComponentPropsWithoutRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  FileText,
  Save,
  RotateCcw,
  Loader2,
  Hash,
  Lock,
  Unlock,
  Info,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { Card as BaseCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { SettingsShell, settingsCardClass } from '@/components/settings/settings-shell';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

interface DocumentNumberSetting {
  id: number;
  documentType: string;
  documentDisplayName: string;
  prefix: string;
  paddingLength: number;
  currentNumber: number;
  resetRule: 'FYWise' | 'Continuous';
  includeYearCode: boolean;
  separator: string;
  manualOverrideAllowed: boolean;
  lockAfterPrint: boolean;
  sampleNumber: string;
  financialYearId?: number;
  financialYearCode?: string;
}

interface FinancialYear {
  id: number;
  yearCode: string;
  isCurrent: boolean;
}

export default function DocumentNumbersPage() {
  return (
    <RouteGuard requireAdmin>
      <DocumentNumbersContent />
    </RouteGuard>
  );
}

function DocumentNumbersContent() {
  const queryClient = useQueryClient();
  const [selectedFY, setSelectedFY] = useState<number | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentNumberSetting | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<DocumentNumberSetting>>({});

  // Fetch financial years
  const { data: financialYears = [] } = useQuery<FinancialYear[]>({
    queryKey: ['financialYears'],
    queryFn: async () => {
      const response = await apiClient.get<FinancialYear[]>('/api/settings/financial-years');
      return response.data ?? [];
    },
  });

  // Set default FY
  useEffect(() => {
    if (financialYears.length > 0 && selectedFY === null) {
      const current = financialYears.find(fy => fy.isCurrent);
      setSelectedFY(current?.id ?? financialYears[0].id);
    }
  }, [financialYears, selectedFY]);

  // Fetch document number settings
  const { data: settings = [], isLoading } = useQuery<DocumentNumberSetting[]>({
    queryKey: ['documentNumbers', selectedFY],
    queryFn: async () => {
      const url = selectedFY 
        ? `/api/settings/document-numbers?financialYearId=${selectedFY}`
        : '/api/settings/document-numbers';
      const response = await apiClient.get<DocumentNumberSetting[]>(url);
      return response.data ?? [];
    },
    enabled: selectedFY !== null,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: DocumentNumberSetting) => {
      return await apiClient.put(`/api/settings/document-numbers/${data.id}`, data);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Document settings updated successfully');
        queryClient.invalidateQueries({ queryKey: ['documentNumbers'] });
        setIsEditOpen(false);
        setEditingDoc(null);
      } else {
        toast.error(response.message || 'Failed to update settings');
      }
    },
  });

  const handleEdit = (setting: DocumentNumberSetting) => {
    setEditingDoc(setting);
    setFormData({
      prefix: setting.prefix,
      paddingLength: setting.paddingLength,
      separator: setting.separator,
      includeYearCode: setting.includeYearCode,
      manualOverrideAllowed: setting.manualOverrideAllowed,
      lockAfterPrint: setting.lockAfterPrint,
      resetRule: setting.resetRule,
    });
    setIsEditOpen(true);
  };

  const generateSampleNumber = () => {
    if (!formData.prefix) return '';
    
    const parts = [formData.prefix];
    if (formData.includeYearCode) {
      const currentFY = financialYears.find(fy => fy.id === selectedFY);
      parts.push(currentFY?.yearCode ?? '2024-25');
    }
    parts.push('001'.padStart(formData.paddingLength ?? 3, '0'));
    
    return parts.join(formData.separator ?? '/');
  };

  const handleSave = () => {
    if (editingDoc) {
      updateMutation.mutate({
        ...editingDoc,
        ...formData,
      } as DocumentNumberSetting);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SettingsShell
      title="Document Number Settings"
      subtitle="Configure document numbering format and rules"
      actions={(
        <div className="flex items-center gap-2">
          <Label className="text-sm text-slate-500">Financial Year:</Label>
          <Select
            value={selectedFY?.toString() ?? ''}
            onValueChange={(v) => setSelectedFY(parseInt(v))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select FY" />
            </SelectTrigger>
            <SelectContent>
              {financialYears.map((fy) => (
                <SelectItem key={fy.id} value={fy.id.toString()}>
                  {fy.yearCode} {fy.isCurrent && '(Current)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    >

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Document Numbering Rules</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Document numbers are auto-generated based on configured format</li>
                <li>• Numbers can reset with each financial year or continue sequentially</li>
                <li>• Manual override requires admin permission and is logged</li>
                <li>• Locked documents cannot be edited after printing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Types</CardTitle>
          <CardDescription>Configure numbering format for each document type</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Current Number</TableHead>
                <TableHead>Reset Rule</TableHead>
                <TableHead>Options</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="font-medium">{setting.documentDisplayName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                      {setting.sampleNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      #{setting.currentNumber}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={setting.resetRule === 'FYWise' ? 'default' : 'grey'}>
                      {setting.resetRule === 'FYWise' ? 'Reset per FY' : 'Continuous'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {setting.manualOverrideAllowed && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="gap-1">
                                <Settings className="h-3 w-3" />
                                Override
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Manual override allowed</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {setting.lockAfterPrint && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Lock
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Locked after print</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                    >
                      Configure
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {settings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No document settings found for this financial year
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure {editingDoc?.documentDisplayName}</DialogTitle>
            <DialogDescription>
              Customize document number format and behavior
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Prefix */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prefix *</Label>
                <Input
                  value={formData.prefix ?? ''}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                  placeholder="e.g., YR, SJC"
                />
              </div>
              <div className="space-y-2">
                <Label>Separator</Label>
                <Select
                  value={formData.separator ?? '/'}
                  onValueChange={(v) => setFormData({ ...formData, separator: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/">/</SelectItem>
                    <SelectItem value="-">-</SelectItem>
                    <SelectItem value="_">_</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Padding and Year */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number Padding</Label>
                <Select
                  value={formData.paddingLength?.toString() ?? '3'}
                  onValueChange={(v) => setFormData({ ...formData, paddingLength: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 digits (001)</SelectItem>
                    <SelectItem value="4">4 digits (0001)</SelectItem>
                    <SelectItem value="5">5 digits (00001)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reset Rule</Label>
                <Select
                  value={formData.resetRule ?? 'FYWise'}
                  onValueChange={(v) => setFormData({ ...formData, resetRule: v as 'FYWise' | 'Continuous' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FYWise">Reset per Financial Year</SelectItem>
                    <SelectItem value="Continuous">Continuous (Never reset)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Include Year Code</Label>
                  <p className="text-xs text-gray-500">Add FY code to document number</p>
                </div>
                <Switch
                  checked={formData.includeYearCode ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeYearCode: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Manual Override</Label>
                  <p className="text-xs text-gray-500">Admin can manually set document number</p>
                </div>
                <Switch
                  checked={formData.manualOverrideAllowed ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, manualOverrideAllowed: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Lock After Print</Label>
                  <p className="text-xs text-gray-500">Prevent editing after document is printed</p>
                </div>
                <Switch
                  checked={formData.lockAfterPrint ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, lockAfterPrint: checked })}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg bg-gray-50 border">
              <Label className="text-xs text-gray-500">Preview</Label>
              <div className="mt-1 font-mono text-lg font-semibold text-primary">
                {generateSampleNumber()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !formData.prefix}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsShell>
  );
}


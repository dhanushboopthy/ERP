'use client';

import { useState, type ComponentPropsWithoutRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  GitBranch,
  Plus,
  Save,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Users,
  FileText,
} from 'lucide-react';
import { Card as BaseCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { SettingsShell, settingsCardClass } from '@/components/settings/settings-shell';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

interface ApprovalLevel {
  level: number;
  roleId: number;
  roleName: string;
  isRequired: boolean;
  autoApproveThreshold?: number;
}

interface ApprovalMatrix {
  documentType: string;
  documentDisplayName: string;
  isEnabled: boolean;
  levels: ApprovalLevel[];
}

interface Role {
  id: number;
  roleName: string;
}

const documentTypes = [
  { type: 'YarnReceipt', name: 'Yarn Receipt', description: 'Incoming yarn from parties' },
  { type: 'WarpingJobCard', name: 'Warping Job Card', description: 'Warping process documentation' },
  { type: 'SizingJobCard', name: 'Sizing Job Card', description: 'Sizing process documentation' },
  { type: 'YarnDelivery', name: 'Yarn Delivery', description: 'Outgoing yarn to parties' },
  { type: 'YarnReturn', name: 'Yarn Return', description: 'Yarn returned to parties' },
  { type: 'TaxInvoice', name: 'Tax Invoice', description: 'GST compliant invoices' },
];

export default function ApprovalMatrixPage() {
  return (
    <RouteGuard requireAdmin>
      <ApprovalMatrixContent />
    </RouteGuard>
  );
}

function ApprovalMatrixContent() {
  const queryClient = useQueryClient();
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set(documentTypes.map(d => d.type)));
  const [editingMatrix, setEditingMatrix] = useState<ApprovalMatrix | null>(null);
  const [isAddLevelOpen, setIsAddLevelOpen] = useState(false);
  const [newLevel, setNewLevel] = useState({ roleId: 0, isRequired: true, autoApproveThreshold: 0 });

  // Fetch approval matrix
  const { data: approvalMatrix = [], isLoading } = useQuery<ApprovalMatrix[]>({
    queryKey: ['approvalMatrix'],
    queryFn: async () => {
      const response = await apiClient.get<ApprovalMatrix[]>('/api/settings/approval-matrix');
      return response.data ?? [];
    },
  });

  // Fetch roles
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get<Role[]>('/api/settings/roles');
      return response.data ?? [];
    },
  });

  // Save approval matrix mutation
  const saveMutation = useMutation({
    mutationFn: async (matrix: ApprovalMatrix) => {
      return await apiClient.post('/api/settings/approval-matrix', {
        documentType: matrix.documentType,
        isEnabled: matrix.isEnabled,
        levels: matrix.levels.map((l, idx) => ({
          level: idx + 1,
          roleId: l.roleId,
          isRequired: l.isRequired,
          autoApproveThreshold: l.autoApproveThreshold,
        })),
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Approval matrix saved successfully');
        queryClient.invalidateQueries({ queryKey: ['approvalMatrix'] });
        setEditingMatrix(null);
      } else {
        toast.error(response.message || 'Failed to save approval matrix');
      }
    },
  });

  const getMatrixForDocument = (docType: string): ApprovalMatrix => {
    const existing = approvalMatrix.find(m => m.documentType === docType);
    if (existing) return existing;
    
    const docInfo = documentTypes.find(d => d.type === docType);
    return {
      documentType: docType,
      documentDisplayName: docInfo?.name || docType,
      isEnabled: false,
      levels: [],
    };
  };

  const toggleDocument = (docType: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docType)) {
      newExpanded.delete(docType);
    } else {
      newExpanded.add(docType);
    }
    setExpandedDocs(newExpanded);
  };

  const handleEdit = (docType: string) => {
    setEditingMatrix(getMatrixForDocument(docType));
  };

  const handleToggleEnabled = (matrix: ApprovalMatrix) => {
    setEditingMatrix({
      ...matrix,
      isEnabled: !matrix.isEnabled,
    });
  };

  const handleAddLevel = () => {
    if (!editingMatrix || !newLevel.roleId) return;
    
    const role = roles.find(r => r.id === newLevel.roleId);
    const updatedMatrix = {
      ...editingMatrix,
      levels: [
        ...editingMatrix.levels,
        {
          level: editingMatrix.levels.length + 1,
          roleId: newLevel.roleId,
          roleName: role?.roleName || '',
          isRequired: newLevel.isRequired,
          autoApproveThreshold: newLevel.autoApproveThreshold || undefined,
        },
      ],
    };
    
    setEditingMatrix(updatedMatrix);
    setNewLevel({ roleId: 0, isRequired: true, autoApproveThreshold: 0 });
    setIsAddLevelOpen(false);
  };

  const handleRemoveLevel = (levelIndex: number) => {
    if (!editingMatrix) return;
    
    const updatedLevels = editingMatrix.levels
      .filter((_, idx) => idx !== levelIndex)
      .map((l, idx) => ({ ...l, level: idx + 1 }));
    
    setEditingMatrix({
      ...editingMatrix,
      levels: updatedLevels,
    });
  };

  const handleSave = () => {
    if (editingMatrix) {
      saveMutation.mutate(editingMatrix);
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
      title="Approval Matrix"
      subtitle="Configure document approval workflows and authorization levels"
    >

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">How Approval Matrix Works</p>
              <p className="text-sm text-blue-700 mt-1">
                Each document type can have multiple approval levels. Documents must be approved in sequence.
                You can configure auto-approval thresholds for certain value ranges. Changes are logged in audit logs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Types */}
      <div className="space-y-4">
        {documentTypes.map((doc) => {
          const matrix = getMatrixForDocument(doc.type);
          const isExpanded = expandedDocs.has(doc.type);
          const isEditing = editingMatrix?.documentType === doc.type;
          const currentMatrix = isEditing ? editingMatrix : matrix;

          return (
            <Card key={doc.type} className={cn(
              'overflow-hidden transition-colors',
              currentMatrix.isEnabled && 'border-green-200'
            )}>
              <div
                className={cn(
                  'flex items-center justify-between p-4 cursor-pointer',
                  currentMatrix.isEnabled ? 'bg-green-50' : 'bg-gray-50'
                )}
                onClick={() => toggleDocument(doc.type)}
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{doc.name}</h3>
                    <p className="text-sm text-gray-500">{doc.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {currentMatrix.isEnabled ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {currentMatrix.levels.length} Level{currentMatrix.levels.length !== 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="grey">
                      <XCircle className="mr-1 h-3 w-3" />
                      Disabled
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(doc.type);
                    }}
                  >
                    Configure
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <CardContent className="border-t bg-white p-6">
                  {isEditing ? (
                    <div className="space-y-6">
                      {/* Enable/Disable Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <Label className="text-base">Enable Approval Workflow</Label>
                          <p className="text-sm text-gray-500">
                            When enabled, documents require approval before processing
                          </p>
                        </div>
                        <Switch
                          checked={currentMatrix.isEnabled}
                          onCheckedChange={() => handleToggleEnabled(currentMatrix)}
                        />
                      </div>

                      {/* Approval Levels */}
                      {currentMatrix.isEnabled && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base">Approval Levels</Label>
                            <Button size="sm" onClick={() => setIsAddLevelOpen(true)}>
                              <Plus className="mr-1 h-4 w-4" />
                              Add Level
                            </Button>
                          </div>

                          {currentMatrix.levels.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                              <GitBranch className="h-8 w-8 text-gray-300 mb-2" />
                              <p className="text-gray-500">No approval levels configured</p>
                              <p className="text-sm text-gray-400">Add levels to define the approval workflow</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 overflow-x-auto pb-4">
                              {currentMatrix.levels.map((level, idx) => (
                                <div key={idx} className="flex items-center">
                                  <div className="relative flex flex-col items-center p-4 rounded-lg border bg-white min-w-[180px]">
                                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                                      Level {level.level}
                                    </Badge>
                                    <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                      <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <p className="mt-2 font-medium">{level.roleName}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                      {level.isRequired ? (
                                        <Badge variant="outline" className="text-xs">Required</Badge>
                                      ) : (
                                        <Badge variant="grey" className="text-xs">Optional</Badge>
                                      )}
                                    </div>
                                    {level.autoApproveThreshold !== undefined && level.autoApproveThreshold > 0 && (
                                      <p className="mt-1 text-xs text-gray-500">
                                        Auto-approve ≤ ₹{level.autoApproveThreshold.toLocaleString()}
                                      </p>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleRemoveLevel(idx)}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                  {idx < currentMatrix.levels.length - 1 && (
                                    <ArrowRight className="mx-2 h-6 w-6 text-gray-300" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setEditingMatrix(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saveMutation.isPending}
                        >
                          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {currentMatrix.isEnabled && currentMatrix.levels.length > 0 ? (
                        <div className="flex items-center gap-4 overflow-x-auto">
                          {currentMatrix.levels.map((level, idx) => (
                            <div key={idx} className="flex items-center">
                              <div className="flex flex-col items-center p-4 rounded-lg border bg-gray-50 min-w-[150px]">
                                <Badge variant="grey">Level {level.level}</Badge>
                                <p className="mt-2 font-medium">{level.roleName}</p>
                                <p className="text-xs text-gray-500">
                                  {level.isRequired ? 'Required' : 'Optional'}
                                </p>
                              </div>
                              {idx < currentMatrix.levels.length - 1 && (
                                <ArrowRight className="mx-2 h-6 w-6 text-gray-300" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          {currentMatrix.isEnabled
                            ? 'No approval levels configured. Click Configure to add levels.'
                            : 'Approval workflow is disabled for this document type.'}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Level Dialog */}
      <Dialog open={isAddLevelOpen} onOpenChange={setIsAddLevelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Approval Level</DialogTitle>
            <DialogDescription>
              Configure a new approval level for {editingMatrix?.documentDisplayName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Approving Role *</Label>
              <Select
                value={newLevel.roleId.toString()}
                onValueChange={(v) => setNewLevel({ ...newLevel, roleId: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Required Approval</Label>
                <p className="text-sm text-gray-500">Document cannot proceed without this approval</p>
              </div>
              <Switch
                checked={newLevel.isRequired}
                onCheckedChange={(checked) => setNewLevel({ ...newLevel, isRequired: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label>Auto-Approve Threshold (₹)</Label>
              <Input
                type="number"
                placeholder="0 = disabled"
                value={newLevel.autoApproveThreshold || ''}
                onChange={(e) => setNewLevel({ ...newLevel, autoApproveThreshold: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500">
                Documents with value less than or equal to this amount will be auto-approved
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLevelOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLevel} disabled={!newLevel.roleId}>
              Add Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsShell>
  );
}


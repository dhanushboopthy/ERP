'use client';

import { useState, useEffect, type ComponentPropsWithoutRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Save,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Calendar,
  FileArchive,
  AlertTriangle,
} from 'lucide-react';
import { Card as BaseCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { SettingsShell, settingsCardClass } from '@/components/settings/settings-shell';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

interface BackupConfig {
  id: number;
  backupType: string;
  frequency: string;
  retentionDays: number;
  backupPath: string;
  isEnabled: boolean;
  lastBackupTime?: string | null;
  lastBackupStatus?: string | null;
  lastBackupSize?: string | null;
  nextScheduledBackup?: string | null;
}

interface BackupConfigUpdate {
  id: number;
  backupType: string;
  frequency: string;
  retentionDays: number;
  backupPath: string;
  isEnabled: boolean;
}

const backupTypeOptions = ['Full', 'Differential'];
const frequencyOptions = ['Daily', 'Weekly', 'Monthly'];

export default function BackupSettingsPage() {
  return (
    <RouteGuard requireAdmin>
      <BackupSettingsContent />
    </RouteGuard>
  );
}

function BackupSettingsContent() {
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<BackupConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: fetchedConfigs = [], isLoading: configsLoading } = useQuery<BackupConfig[]>({
    queryKey: ['backupConfigs'],
    queryFn: async () => {
      const response = await apiClient.get<BackupConfig[]>('/api/settings/backup-config');
      if (Array.isArray(response)) return response;
      return response.data ?? [];
    },
  });

  useEffect(() => {
    if (fetchedConfigs.length > 0) {
      setConfigs(fetchedConfigs);
      setHasChanges(false);
    }
  }, [fetchedConfigs]);

  const saveMutation = useMutation({
    mutationFn: async (updates: BackupConfigUpdate[]) => {
      const results = await Promise.all(
        updates.map((update) => apiClient.put(`/api/settings/backup-config/${update.id}`, update))
      );
      const failed = results.find((result) => !result.success);
      if (failed) {
        throw new Error(failed.message || 'Failed to save backup settings');
      }
      return results;
    },
    onSuccess: () => {
      toast.success('Backup settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['backupConfigs'] });
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save backup settings');
    },
  });

  const triggerBackupMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/api/settings/backup-config/trigger');
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Backup started successfully');
      } else {
        toast.error(response.message || 'Failed to start backup');
      }
    },
    onError: () => {
      toast.error('Failed to start backup');
    },
  });

  const handleConfigChange = <K extends keyof BackupConfig>(
    configId: number,
    field: K,
    value: BackupConfig[K]
  ) => {
    setConfigs((prev) =>
      prev.map((config) => (config.id === configId ? { ...config, [field]: value } : config))
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    const updates: BackupConfigUpdate[] = configs.map((config) => ({
      id: config.id,
      backupType: config.backupType,
      frequency: config.frequency,
      retentionDays: config.retentionDays,
      backupPath: config.backupPath,
      isEnabled: config.isEnabled,
    }));
    saveMutation.mutate(updates);
  };

  const getStatusColor = (status?: string | null) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'success' || normalized === 'completed' || normalized === 'active') return 'bg-green-500';
    if (normalized === 'failed' || normalized === 'error') return 'bg-red-500';
    if (normalized === 'inprogress' || normalized === 'running') return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getStatusIcon = (status?: string | null) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'success' || normalized === 'completed' || normalized === 'active') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (normalized === 'failed' || normalized === 'error') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (normalized === 'inprogress' || normalized === 'running') {
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  if (configsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const primaryConfig = configs[0];

  return (
    <SettingsShell
      title="Backup & Data Safety"
      subtitle="Configure backup schedules and data protection settings"
      actions={(
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => triggerBackupMutation.mutate()}
            disabled={triggerBackupMutation.isPending}
          >
            {triggerBackupMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Backup Now
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
            Save Settings
          </Button>
        </div>
      )}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Last Backup</p>
                <p className="text-lg font-semibold">
                  {primaryConfig?.lastBackupTime ? formatDate(primaryConfig.lastBackupTime) : 'Never'}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-semibold">
                  {primaryConfig?.lastBackupStatus || 'Unknown'}
                </p>
                <div className={cn('mt-2 h-1.5 w-24 rounded-full', getStatusColor(primaryConfig?.lastBackupStatus))} />
              </div>
              {getStatusIcon(primaryConfig?.lastBackupStatus)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Backup Size</p>
                <p className="text-lg font-semibold">{primaryConfig?.lastBackupSize || 'N/A'}</p>
              </div>
              <FileArchive className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Next Scheduled</p>
                <p className="text-lg font-semibold">
                  {primaryConfig?.nextScheduledBackup ? formatDate(primaryConfig.nextScheduledBackup) : 'Not scheduled'}
                </p>
              </div>
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup Configuration</CardTitle>
          <CardDescription>Configure backup frequency, retention, and location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {configs.map((config) => (
            <div key={config.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{config.backupType} Backup</p>
                  <p className="text-sm text-gray-500">Scheduled {config.frequency.toLowerCase()}</p>
                </div>
                <Switch
                  checked={config.isEnabled}
                  onCheckedChange={(checked) => handleConfigChange(config.id, 'isEnabled', checked)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Backup Type</Label>
                  <Select
                    value={config.backupType}
                    onValueChange={(value) => handleConfigChange(config.id, 'backupType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backupTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={config.frequency}
                    onValueChange={(value) => handleConfigChange(config.id, 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Retention (Days)</Label>
                  <Input
                    type="number"
                    value={config.retentionDays}
                    onChange={(e) => handleConfigChange(config.id, 'retentionDays', Number(e.target.value))}
                    min={1}
                    max={365}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Backup Path</Label>
                  <Input
                    value={config.backupPath}
                    onChange={(e) => handleConfigChange(config.id, 'backupPath', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          {configs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <FileArchive className="h-12 w-12 mb-4" />
              <p className="text-lg">No backup configuration found</p>
              <p className="text-sm">Contact an administrator to set up backups.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Important Reminder</p>
              <ul className="text-sm text-amber-700 mt-1 space-y-1">
                <li>• Regularly verify backup integrity by performing test restores</li>
                <li>• Keep at least one off-site backup copy for disaster recovery</li>
                <li>• Ensure backup storage has sufficient space and access permissions</li>
                <li>• Monitor backup logs for any warnings or errors</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
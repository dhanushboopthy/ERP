'use client';

import { useState, useEffect, useMemo, type ComponentPropsWithoutRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Bell,
  Save,
  Loader2,
  AlertTriangle,
  Package,
  FileText,
  Clock,
  CheckCircle,
  Send,
  Info,
} from 'lucide-react';
import { Card as BaseCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { SettingsShell, settingsCardClass } from '@/components/settings/settings-shell';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

interface NotificationSetting {
  id: number;
  notificationType: string;
  eventType: string;
  displayName: string;
  isEnabled: boolean;
  thresholdValue?: number | null;
  recipientRoleIds: number[];
}

interface Role {
  id: number;
  roleName: string;
}

const notificationIcons: Record<string, React.ReactNode> = {
  LowStock: <Package className="h-5 w-5" />,
  OverdueInvoice: <FileText className="h-5 w-5" />,
  PendingApproval: <Clock className="h-5 w-5" />,
  BackupFailure: <AlertTriangle className="h-5 w-5" />,
  LoginAlert: <Bell className="h-5 w-5" />,
};

const notificationColors: Record<string, string> = {
  LowStock: 'text-amber-600 bg-amber-100',
  OverdueInvoice: 'text-red-600 bg-red-100',
  PendingApproval: 'text-blue-600 bg-blue-100',
  BackupFailure: 'text-red-600 bg-red-100',
  LoginAlert: 'text-purple-600 bg-purple-100',
};

export default function NotificationSettingsPage() {
  return (
    <RouteGuard requireAdmin>
      <NotificationSettingsContent />
    </RouteGuard>
  );
}

function NotificationSettingsContent() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: notificationSettings = [], isLoading } = useQuery<NotificationSetting[]>({
    queryKey: ['notificationSettings'],
    queryFn: async () => {
      const response = await apiClient.get<NotificationSetting[]>('/api/settings/notifications');
      if (Array.isArray(response)) return response;
      return response.data ?? [];
    },
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get<Role[]>('/api/settings/roles');
      if (Array.isArray(response)) return response;
      return response.data ?? [];
    },
  });

  const roleMap = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role.roleName]));
  }, [roles]);

  useEffect(() => {
    if (notificationSettings.length > 0) {
      setSettings(notificationSettings);
      setHasChanges(false);
    }
  }, [notificationSettings]);

  const saveMutation = useMutation({
    mutationFn: async (updates: NotificationSetting[]) => {
      const results = await Promise.all(
        updates.map((setting) =>
          apiClient.put(`/api/settings/notifications/${setting.id}`, {
            id: setting.id,
            isEnabled: setting.isEnabled,
            thresholdValue: setting.thresholdValue ?? null,
            recipientRoleIds: setting.recipientRoleIds,
          })
        )
      );
      const failed = results.find((result) => !result.success);
      if (failed) {
        throw new Error(failed.message || 'Failed to save notification settings');
      }
      return results;
    },
    onSuccess: () => {
      toast.success('Notification settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save notification settings');
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.post(`/api/settings/notifications/${id}/test`);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Test notification sent successfully');
      } else {
        toast.error(response.message || 'Failed to send test notification');
      }
    },
    onError: () => {
      toast.error('Failed to send test notification');
    },
  });

  const handleSettingChange = (id: number, field: keyof NotificationSetting, value: boolean | number | string | number[]) => {
    setSettings((prev) =>
      prev.map((setting) => (setting.id === id ? { ...setting, [field]: value } : setting))
    );
    setHasChanges(true);
  };

  const updateRecipientRole = (settingId: number, roleId: number, checked: boolean) => {
    setSettings((prev) =>
      prev.map((setting) => {
        if (setting.id !== settingId) return setting;
        const nextIds = checked
          ? Array.from(new Set([...setting.recipientRoleIds, roleId]))
          : setting.recipientRoleIds.filter((id) => id !== roleId);
        return { ...setting, recipientRoleIds: nextIds };
      })
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
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
      title="Notification & Alert Settings"
      subtitle="Configure system alerts and notification recipients"
      actions={(
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
      )}
    >
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Notification System</p>
              <p className="text-sm text-blue-700 mt-1">
                Configure alerts for important business events and choose which roles should receive them.
                Use the test button to verify notifications are working correctly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Configuration</CardTitle>
          <CardDescription>Enable or disable specific notification types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  setting.isEnabled ? 'bg-white' : 'bg-gray-50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      notificationColors[setting.eventType] || 'text-gray-600 bg-gray-100'
                    )}>
                      {notificationIcons[setting.eventType] || <Bell className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{setting.displayName}</h3>
                        {setting.isEnabled && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Event: {setting.eventType}</p>
                    </div>
                  </div>
                  <Switch
                    checked={setting.isEnabled}
                    onCheckedChange={(checked) => handleSettingChange(setting.id, 'isEnabled', checked)}
                  />
                </div>

                {setting.isEnabled && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="flex items-center justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate(setting.id)}
                        disabled={testMutation.isPending}
                      >
                        {testMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Test
                      </Button>
                    </div>

                    {setting.thresholdValue !== null && setting.thresholdValue !== undefined && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                        <Label className="text-sm whitespace-nowrap">Threshold:</Label>
                        <Input
                          type="number"
                          value={setting.thresholdValue}
                          onChange={(e) => handleSettingChange(setting.id, 'thresholdValue', Number(e.target.value))}
                          className="h-8 w-24"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm">Recipient Roles</Label>
                      {roles.length === 0 ? (
                        <p className="text-xs text-gray-500">No roles available.</p>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-2">
                          {roles.map((role) => (
                            <label
                              key={role.id}
                              className="flex items-center gap-2 rounded-md border p-2 text-sm"
                            >
                              <Checkbox
                                checked={setting.recipientRoleIds.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  if (checked === 'indeterminate') return;
                                  updateRecipientRole(setting.id, role.id, !!checked);
                                }}
                              />
                              <span>{role.roleName}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {setting.recipientRoleIds.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Selected: {setting.recipientRoleIds.map((id) => roleMap.get(id)).filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {settings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="h-12 w-12 mb-4" />
                <p className="text-lg">No notification settings configured</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Delivery</CardTitle>
          <CardDescription>Ensure delivery channels are configured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border bg-gray-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-gray-800">Check SMTP settings</p>
                <p className="text-sm text-gray-600">
                  Email delivery depends on your SMTP configuration. Update SMTP settings in System Configuration.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
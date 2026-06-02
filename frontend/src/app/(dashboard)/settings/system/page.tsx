'use client';

import { useState, useEffect, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Settings,
  Save,
  RotateCcw,
  Loader2,
  Info,
  AlertCircle,
  Package,
  FileText,
  Bell,
  Shield,
} from 'lucide-react';
import { Card as BaseCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { SettingsShell, settingsCardClass } from '@/components/settings/settings-shell';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

interface SystemConfig {
  id: number;
  configKey: string;
  configValue: string;
  configType: string;
  category: string;
  displayName: string;
  description?: string | null;
  defaultValue?: string | null;
  isEditable: boolean;
}

interface SystemConfigCategory {
  category: string;
  displayName: string;
  configs: SystemConfig[];
}

const categoryIcons: Record<string, ReactNode> = {
  General: <Settings className="h-4 w-4" />,
  Stock: <Package className="h-4 w-4" />,
  Invoice: <FileText className="h-4 w-4" />,
  Security: <Shield className="h-4 w-4" />,
  Notification: <Bell className="h-4 w-4" />,
};

export default function SystemConfigPage() {
  return (
    <RouteGuard requireAdmin>
      <SystemConfigContent />
    </RouteGuard>
  );
}

function SystemConfigContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('');
  const [configValues, setConfigValues] = useState<Record<number, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch system configs
  const { data: categories = [], isLoading } = useQuery<SystemConfigCategory[]>({
    queryKey: ['systemConfigs'],
    queryFn: async () => {
      const response = await apiClient.get<SystemConfigCategory[]>('/api/settings/system-config');
      if (Array.isArray(response)) return response;
      return response.data ?? [];
    },
  });

  // Initialize config values when data loads
  useEffect(() => {
    if (categories.length > 0) {
      const values: Record<number, string> = {};
      categories.forEach(cat => {
        cat.configs.forEach(config => {
          values[config.id] = config.configValue;
        });
      });
      setConfigValues(values);
      setHasChanges(false);
      
      if (!activeTab && categories.length > 0) {
        setActiveTab(categories[0].category);
      }
    }
  }, [categories, activeTab]);

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: async (configs: { id: number; configValue: string }[]) => {
      return await apiClient.put('/api/settings/system-config/bulk', configs);
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Settings saved successfully');
        queryClient.invalidateQueries({ queryKey: ['systemConfigs'] });
        setHasChanges(false);
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const handleValueChange = (configId: number, value: string) => {
    setConfigValues(prev => ({
      ...prev,
      [configId]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const configs = Object.entries(configValues).map(([id, value]) => ({
      id: parseInt(id),
      configValue: value,
    }));
    saveMutation.mutate(configs);
  };

  const handleReset = () => {
    if (categories.length > 0) {
      const values: Record<number, string> = {};
      categories.forEach(cat => {
        cat.configs.forEach(config => {
          values[config.id] = config.configValue;
        });
      });
      setConfigValues(values);
      setHasChanges(false);
    }
  };

  const renderConfigInput = (config: SystemConfig) => {
    const value = configValues[config.id] ?? config.configValue;
    const normalizedType = config.configType?.toLowerCase();

    switch (normalizedType) {
      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) => handleValueChange(config.id, checked.toString())}
              disabled={!config.isEditable}
            />
            <span className="text-sm text-gray-600">
              {value === 'true' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(config.id, e.target.value)}
            disabled={!config.isEditable}
            className="max-w-[200px]"
          />
        );
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleValueChange(config.id, e.target.value)}
            disabled={!config.isEditable}
            className="max-w-[300px]"
          />
        );
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
      title="System Configuration"
      subtitle="Configure ERP behavior and default settings"
      actions={(
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
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
            Save Changes
          </Button>
        </div>
      )}
    >

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-[color:var(--settings-border)] bg-white/90 p-2 shadow-sm">
          {categories.map((category) => (
            <TabsTrigger
              key={category.category}
              value={category.category}
              className="gap-2 rounded-xl border border-slate-200 text-slate-600 data-[state=active]:bg-[color:var(--settings-accent)] data-[state=active]:text-white data-[state=active]:border-transparent"
            >
              {categoryIcons[category.category] || <Settings className="h-4 w-4" />}
              {category.displayName || category.category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.category} value={category.category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {categoryIcons[category.category] || <Settings className="h-5 w-5" />}
                  {(category.displayName || category.category)} Settings
                </CardTitle>
                <CardDescription>
                  Configure {category.category.toLowerCase()} related settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {category.configs.map((config) => (
                    <div
                      key={config.id}
                      className={cn(
                        'flex items-start justify-between p-4 rounded-lg border',
                        !config.isEditable && 'bg-gray-50'
                      )}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium">{config.displayName}</Label>
                          {!config.isEditable && (
                            <Badge variant="grey" className="text-xs">
                              Read-only
                            </Badge>
                          )}
                          {config.description && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{config.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{config.description}</p>
                        <p className="text-xs text-gray-400 font-mono">{config.configKey}</p>
                      </div>
                      <div className="ml-4">
                        {renderConfigInput(config)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Stock Validation</p>
                <p className="text-sm text-amber-700">
                  Negative stock allowance is disabled for production. Stock will be validated before delivery.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Configuration Changes</p>
                <p className="text-sm text-blue-700">
                  All configuration changes are logged in audit logs for compliance tracking.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}


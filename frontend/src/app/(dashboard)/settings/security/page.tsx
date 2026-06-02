'use client';

import { useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  Shield,
  Save,
  RotateCcw,
  Loader2,
  Key,
  Lock,
  Clock,
  AlertTriangle,
  Globe,
  Info,
} from 'lucide-react';
import { Card as BaseCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

interface SecurityPolicy {
  id: number;
  policyKey: string;
  policyValue: string;
  policyType: string;
  displayName: string;
  description?: string | null;
}

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

export default function SecurityPoliciesPage() {
  return (
    <RouteGuard requireAdmin>
      <SecurityPoliciesContent />
    </RouteGuard>
  );
}

function SecurityPoliciesContent() {
  const queryClient = useQueryClient();
  const [policyValues, setPolicyValues] = useState<Record<number, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: policies = [], isLoading } = useQuery<SecurityPolicy[]>({
    queryKey: ['securityPolicies'],
    queryFn: async () => {
      const response = await apiClient.get<SecurityPolicy[]>('/api/settings/security-policies');
      if (Array.isArray(response)) return response;
      return response.data ?? [];
    },
  });

  useEffect(() => {
    if (policies.length > 0) {
      const values: Record<number, string> = {};
      policies.forEach((policy) => {
        values[policy.id] = policy.policyValue;
      });
      setPolicyValues(values);
      setHasChanges(false);
    }
  }, [policies]);

  const saveMutation = useMutation({
    mutationFn: async (updates: { id: number; policyValue: string }[]) => {
      const results = await Promise.all(
        updates.map((update) =>
          apiClient.put(`/api/settings/security-policies/${update.id}`, {
            id: update.id,
            policyValue: update.policyValue,
          })
        )
      );
      const failed = results.find((result) => !result.success);
      if (failed) {
        throw new Error(failed.message || 'Failed to update security policies');
      }
      return results;
    },
    onSuccess: () => {
      toast.success('Security policies updated successfully');
      queryClient.invalidateQueries({ queryKey: ['securityPolicies'] });
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update security policies');
    },
  });

  const handleValueChange = (policyId: number, value: string) => {
    setPolicyValues((prev) => ({
      ...prev,
      [policyId]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updates = Object.entries(policyValues).map(([id, value]) => ({
      id: parseInt(id, 10),
      policyValue: value,
    }));
    saveMutation.mutate(updates);
  };

  const handleReset = () => {
    const values: Record<number, string> = {};
    policies.forEach((policy) => {
      values[policy.id] = policy.policyValue;
    });
    setPolicyValues(values);
    setHasChanges(false);
  };

  const groupedPolicies = useMemo(() => {
    return policies.reduce<Record<string, SecurityPolicy[]>>((acc, policy) => {
      const key = policy.policyType || 'Other';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(policy);
      return acc;
    }, {});
  }, [policies]);

  const categoryConfig: Record<string, { icon: ReactNode; color: string }> = {
    Password: { icon: <Key className="h-5 w-5" />, color: 'text-blue-600 bg-blue-100' },
    Session: { icon: <Clock className="h-5 w-5" />, color: 'text-purple-600 bg-purple-100' },
    Login: { icon: <Lock className="h-5 w-5" />, color: 'text-amber-600 bg-amber-100' },
    Network: { icon: <Globe className="h-5 w-5" />, color: 'text-green-600 bg-green-100' },
  };

  const resolveInputType = (value: string) => {
    if (value === 'true' || value === 'false') return 'boolean';
    if (!Number.isNaN(Number(value))) return 'number';
    return 'string';
  };

  const renderPolicyInput = (policy: SecurityPolicy) => {
    const value = policyValues[policy.id] ?? policy.policyValue;
    const inputType = resolveInputType(value);

    if (inputType === 'boolean') {
      return (
        <Switch
          checked={value === 'true'}
          onCheckedChange={(checked) => handleValueChange(policy.id, checked.toString())}
        />
      );
    }

    if (inputType === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleValueChange(policy.id, e.target.value)}
          className="max-w-[140px]"
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => handleValueChange(policy.id, e.target.value)}
        className="max-w-[320px]"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const passwordPolicies = policies.filter((policy) => policy.policyType === 'Password');

  return (
    <SettingsShell
      title="Security Policies"
      subtitle="Configure authentication and access security settings"
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
            Save Policies
          </Button>
        </div>
      )}
    >
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Security Notice</p>
              <p className="text-sm text-amber-700 mt-1">
                Changes to security policies take effect immediately. Review carefully before saving.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {Object.entries(groupedPolicies).map(([category, categoryPolicies]) => {
          const config = categoryConfig[category] || {
            icon: <Shield className="h-5 w-5" />,
            color: 'text-slate-600 bg-slate-100',
          };

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', config.color)}>
                    {config.icon}
                  </div>
                  <div>
                    <CardTitle>{category} Policy</CardTitle>
                    <CardDescription>
                      Configure {category.toLowerCase()} related security settings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {categoryPolicies.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-gray-50/50"
                    >
                      <div className="space-y-1 flex-1 mr-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium">{policy.displayName}</Label>
                          {policy.description && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{policy.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        {policy.description && (
                          <p className="text-sm text-gray-500">{policy.description}</p>
                        )}
                        <p className="text-xs text-gray-400 font-mono">{policy.policyKey}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {renderPolicyInput(policy)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {passwordPolicies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Password Requirements Preview</CardTitle>
            <CardDescription>Current password policy requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {passwordPolicies.map((policy) => {
                const value = policyValues[policy.id] ?? policy.policyValue;
                const key = policy.policyKey.toLowerCase();
                const suffix = key.includes('length')
                  ? ' characters'
                  : key.includes('expiry')
                    ? ' days'
                    : '';

                return (
                  <div key={policy.id} className="p-4 rounded-lg border bg-white">
                    <p className="text-sm text-gray-500">{policy.displayName}</p>
                    <p className="text-xl font-semibold mt-1">
                      {value === 'true' ? 'Yes' : value === 'false' ? 'No' : value}
                      {suffix}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </SettingsShell>
  );
}
'use client';

import { useState, type ComponentPropsWithoutRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  History,
  Search,
  Filter,
  Download,
  Loader2,
  User,
  Calendar,
  FileText,
  Eye,
  ChevronDown,
  ChevronRight,
  Clock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { SettingsShell, settingsCardClass } from '@/components/settings/settings-shell';

const Card = ({ className, ...props }: ComponentPropsWithoutRef<typeof BaseCard>) => (
  <BaseCard className={cn(settingsCardClass, className)} {...props} />
);

interface AuditLog {
  id: number;
  tableName: string;
  moduleName?: string;
  recordId: number;
  action: string;
  oldValues?: string;
  newValues?: string;
  changedBy: string;
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-gray-100 text-gray-700',
  APPROVE: 'bg-amber-100 text-amber-700',
  LOCK: 'bg-red-100 text-red-700',
  UNLOCK: 'bg-green-100 text-green-700',
  PRINT: 'bg-cyan-100 text-cyan-700',
};

export default function AuditLogsPage() {
  return (
    <RouteGuard requireAdmin>
      <AuditLogsContent />
    </RouteGuard>
  );
}

function AuditLogsContent() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState({
    search: '',
    module: '',
    action: '',
    user: '',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch audit logs
  const { data: logsData, isLoading, refetch } = useQuery<PagedResult<AuditLog>>({
    queryKey: ['auditLogs', page, pageSize, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        pageNumber: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (filters.module) params.append('tableName', filters.module);
      if (filters.action) params.append('action', filters.action);
      if (filters.user) params.append('changedBy', filters.user);
      if (filters.startDate) params.append('fromDate', filters.startDate);
      if (filters.endDate) params.append('toDate', filters.endDate);

      const response = await apiClient.get<PagedResult<AuditLog>>(`/api/settings/audit-logs?${params}`);
      if ('items' in (response as Record<string, unknown>)) {
        return response as PagedResult<AuditLog>;
      }
      return response.data ?? { items: [], totalCount: 0, pageNumber: page, pageSize };
    },
  });

  // Fetch distinct modules
  const { data: modules = [] } = useQuery<string[]>({
    queryKey: ['auditModules'],
    queryFn: async () => {
      const response = await apiClient.get<string[]>('/api/settings/audit-logs/modules');
      if (Array.isArray(response)) return response;
      return response.data ?? [];
    },
  });

  // Fetch distinct users
  const { data: users = [] } = useQuery<string[]>({
    queryKey: ['auditUsers'],
    queryFn: async () => {
      const response = await apiClient.get<string[]>('/api/settings/audit-logs/users');
      if (Array.isArray(response)) return response;
      return response.data ?? [];
    },
  });

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.module) params.append('tableName', filters.module);
      if (filters.action) params.append('action', filters.action);
      if (filters.user) params.append('changedBy', filters.user);
      if (filters.startDate) params.append('fromDate', filters.startDate);
      if (filters.endDate) params.append('toDate', filters.endDate);
      
      window.open(`${process.env.NEXT_PUBLIC_API_URL}/settings/audit-logs/export?${params}`, '_blank');
      toast.success('Export started');
    } catch {
      toast.error('Failed to export logs');
    }
  };

  const parseJson = (jsonString?: string) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  const rawLogs = logsData?.items ?? [];
  const searchTerm = filters.search.trim().toLowerCase();
  const logs = searchTerm
    ? rawLogs.filter((log) => {
        const moduleLabel = (log.moduleName || log.tableName || '').toLowerCase();
        return (
          moduleLabel.includes(searchTerm) ||
          log.changedBy.toLowerCase().includes(searchTerm) ||
          log.action.toLowerCase().includes(searchTerm) ||
          log.recordId.toString().includes(searchTerm)
        );
      })
    : rawLogs;
  const totalPages = Math.ceil((logsData?.totalCount ?? 0) / pageSize);

  const activeFilterCount = [
    filters.module,
    filters.action,
    filters.user,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  return (
    <SettingsShell
      title="Audit Logs"
      subtitle="Track all system activities and changes"
      actions={(
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      )}
    >

      {/* Info Card */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-800">Audit Log Policy</p>
              <p className="text-sm text-gray-600 mt-1">
                Audit logs are read-only and cannot be modified or deleted. All user actions, data changes, 
                and security events are automatically recorded for compliance and security purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                {logsData?.totalCount?.toLocaleString() ?? 0} total records
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              {/* Filter Popover */}
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="grey" className="ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Module</Label>
                      <Select
                        value={filters.module}
                        onValueChange={(v) => setFilters({ ...filters, module: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All modules" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All modules</SelectItem>
                          {modules.map((module) => (
                            <SelectItem key={module} value={module}>
                              {module}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select
                        value={filters.action}
                        onValueChange={(v) => setFilters({ ...filters, action: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All actions</SelectItem>
                          <SelectItem value="CREATE">Create</SelectItem>
                          <SelectItem value="UPDATE">Update</SelectItem>
                          <SelectItem value="DELETE">Delete</SelectItem>
                          <SelectItem value="LOGIN">Login</SelectItem>
                          <SelectItem value="LOGOUT">Logout</SelectItem>
                          <SelectItem value="APPROVE">Approve</SelectItem>
                          <SelectItem value="LOCK">Lock</SelectItem>
                          <SelectItem value="UNLOCK">Unlock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>User</Label>
                      <Select
                        value={filters.user}
                        onValueChange={(v) => setFilters({ ...filters, user: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All users" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All users</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user} value={user}>
                              {user}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilters({
                            search: '',
                            module: '',
                            action: '',
                            user: '',
                            startDate: '',
                            endDate: '',
                          });
                          setPage(1);
                        }}
                      >
                        Clear filters
                      </Button>
                      <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {formatDate(log.changedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="font-medium">{log.changedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <FileText className="mr-1 h-3 w-3" />
                          {log.moduleName || log.tableName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('uppercase', actionColors[log.action] || 'bg-gray-100 text-gray-700')}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">#{log.recordId}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{log.ipAddress || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <History className="h-12 w-12 mb-4" />
                  <p className="text-lg">No audit logs found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, logsData?.totalCount ?? 0)} of {logsData?.totalCount?.toLocaleString()} logs
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog && `${selectedLog.action} on ${selectedLog.moduleName || selectedLog.tableName} #${selectedLog.recordId}`}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">User</p>
                  <p className="font-medium">{selectedLog.changedBy}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Timestamp</p>
                  <p className="font-medium">{formatDate(selectedLog.changedAt)}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">IP Address</p>
                  <p className="font-medium">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Action</p>
                  <Badge className={cn('uppercase', actionColors[selectedLog.action] || 'bg-gray-100 text-gray-700')}>
                    {selectedLog.action}
                  </Badge>
                </div>
              </div>

              {/* Changes */}
              {(selectedLog.oldValues || selectedLog.newValues) && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Changes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.oldValues && (
                      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-xs text-red-600 font-medium mb-2">Before</p>
                        <pre className="text-xs overflow-auto max-h-64">
                          {JSON.stringify(parseJson(selectedLog.oldValues), null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.newValues && (
                      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-xs text-green-600 font-medium mb-2">After</p>
                        <pre className="text-xs overflow-auto max-h-64">
                          {JSON.stringify(parseJson(selectedLog.newValues), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <h4 className="text-sm font-medium mb-2">User Agent</h4>
                  <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SettingsShell>
  );
}


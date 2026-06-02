'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  FileCheck,
  Package,
  Clock,
  Shield,
  Settings,
  Filter,
  Loader2,
  RefreshCw,
  Archive,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn, formatDistanceToNow, formatDate } from '@/lib/utils';

interface Notification {
  id: number;
  type: 'approval' | 'invoice' | 'stock' | 'document' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Mock notifications for development
const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'approval',
    title: 'Pending Approval',
    message: 'Sizing Job Card SET/24-25/000145 needs your approval',
    link: '/sizing/sizing-job-card',
    isRead: false,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    priority: 'high',
  },
  {
    id: 2,
    type: 'invoice',
    title: 'Invoice Overdue',
    message: 'Invoice INV/24-25/000089 is overdue by 3 days. Please follow up with the customer.',
    link: '/sizing/invoices',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    priority: 'urgent',
  },
  {
    id: 3,
    type: 'stock',
    title: 'Low Stock Alert',
    message: 'Yarn Count 40s 2/100 stock below threshold (234 kg remaining)',
    link: '/sizing/yarn-stock',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    priority: 'high',
  },
  {
    id: 4,
    type: 'document',
    title: 'Document Rejected',
    message: 'Warping Job Card WRP/24-25/000156 was rejected by GM with remarks: "Weight discrepancy"',
    link: '/sizing/warping-job-card',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    priority: 'normal',
  },
  {
    id: 5,
    type: 'system',
    title: 'System Update',
    message: 'New features added to Invoice module. Check the release notes.',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    priority: 'low',
  },
  {
    id: 6,
    type: 'approval',
    title: 'Approval Completed',
    message: 'Your request for Sizing Job Card SET/24-25/000140 has been approved by MD.',
    link: '/sizing/sizing-job-card',
    isRead: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    priority: 'normal',
  },
  {
    id: 7,
    type: 'stock',
    title: 'Stock Replenished',
    message: 'Yarn Count 60s 2/80 stock has been replenished. Current balance: 1,500 kg',
    link: '/sizing/yarn-stock',
    isRead: true,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    priority: 'low',
  },
];

const notificationIcons: Record<string, React.ElementType> = {
  approval: Shield,
  invoice: FileCheck,
  stock: Package,
  document: FileCheck,
  system: Settings,
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  normal: 'bg-blue-100 text-blue-600 border-blue-200',
  high: 'bg-amber-100 text-amber-600 border-amber-200',
  urgent: 'bg-red-100 text-red-600 border-red-200',
};

const priorityBadgeColors: Record<string, string> = {
  low: 'grey',
  normal: 'default',
  high: 'grey',
  urgent: 'cancelled',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch notifications
  const { data: notifications = mockNotifications, isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['allNotifications'],
    queryFn: async () => {
      const res = await apiClient.get<Notification[]>('/api/notifications');
      if (!res.success || !res.data) {
        return mockNotifications;
      }
      return res.data;
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiClient.post('/api/notifications/mark-read', { ids });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Marked as read');
      setSelectedIds([]);
    },
  });

  // Delete notifications mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiClient.post('/api/notifications/delete', { ids });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notifications deleted');
      setSelectedIds([]);
    },
  });

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (statusFilter === 'unread' && n.isRead) return false;
    if (statusFilter === 'read' && !n.isRead) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedNotifications.map(n => n.id));
    }
  };

  const handleMarkSelectedAsRead = () => {
    markAsReadMutation.mutate(selectedIds);
  };

  const handleDeleteSelected = () => {
    deleteMutation.mutate(selectedIds);
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    markAsReadMutation.mutate(unreadIds);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500 text-white">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total</p>
                <p className="text-2xl font-bold text-blue-900">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500 text-white">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-amber-700">Unread</p>
                <p className="text-2xl font-bold text-amber-900">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500 text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-red-700">Urgent</p>
                <p className="text-2xl font-bold text-red-900">
                  {notifications.filter(n => n.priority === 'urgent' && !n.isRead).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500 text-white">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-green-700">Read</p>
                <p className="text-2xl font-bold text-green-900">
                  {notifications.filter(n => n.isRead).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="approval">Approvals</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {selectedIds.length} selected
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleMarkSelectedAsRead}
                  disabled={markAsReadMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark Read
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You&apos;re all caught up!</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
                <Checkbox
                  checked={selectedIds.length === paginatedNotifications.length && paginatedNotifications.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium text-gray-600">Select all</span>
              </div>

              {/* Notifications */}
              <div className="divide-y">
                {paginatedNotifications.map((notification) => {
                  const Icon = notificationIcons[notification.type] || Bell;
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors',
                        !notification.isRead && 'bg-blue-50/30'
                      )}
                    >
                      <Checkbox
                        checked={selectedIds.includes(notification.id)}
                        onCheckedChange={() => toggleSelect(notification.id)}
                        className="mt-1"
                      />
                      <div className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border',
                        priorityColors[notification.priority]
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              'text-sm',
                              !notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                            )}>
                              {notification.title}
                            </p>
                            {notification.priority !== 'normal' && (
                              <Badge variant={priorityBadgeColors[notification.priority] as 'default' | 'grey' | 'cancelled' | 'grey'} className="text-xs capitalize">
                                {notification.priority}
                              </Badge>
                            )}
                            {!notification.isRead && (
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatDistanceToNow(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">
                            {formatDate(notification.createdAt, 'long')}
                          </span>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              View Details →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredNotifications.length)} of {filteredNotifications.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Settings Link */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Notification Preferences</p>
                <p className="text-sm text-gray-500">Configure which notifications you receive</p>
              </div>
            </div>
            <Link href="/settings/notifications/preferences">
              <Button variant="outline">
                Configure
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


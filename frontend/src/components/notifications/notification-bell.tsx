'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  FileCheck,
  Package,
  Clock,
  Shield,
  ChevronRight,
  Loader2,
  Settings,
  Trash2,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn, formatDistanceToNow } from '@/lib/utils';
import apiClient from '@/lib/api-client';

export interface Notification {
  id: number;
  type: 'approval' | 'invoice' | 'stock' | 'document' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  readAt?: string;
}

interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

const notificationIcons: Record<string, React.ElementType> = {
  approval: Shield,
  invoice: FileCheck,
  stock: Package,
  document: FileCheck,
  system: Settings,
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-amber-100 text-amber-600',
  urgent: 'bg-red-100 text-red-600',
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications from API with real-time polling (every 10 seconds)
  const { data, isLoading, refetch } = useQuery<NotificationListResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get<NotificationListResponse>('/api/notifications?limit=20');
      if (!res.success || !res.data) {
        // Return empty state if API fails
        return { notifications: [], unreadCount: 0, totalCount: 0 };
      }
      return res.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    refetchIntervalInBackground: true,
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/api/notifications/${id}/read`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/notifications/read-all');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Refetch when popover opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="grey" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Bell className="h-10 w-10 mb-2 text-gray-300" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                return (
                  <Link
                    key={notification.id}
                    href={notification.link || '#'}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex gap-3 p-4 hover:bg-gray-50 transition-colors',
                      !notification.isRead && 'bg-blue-50/50'
                    )}
                  >
                    <div className={cn(
                      'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                      priorityColors[notification.priority]
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm',
                          !notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                        )}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(notification.createdAt)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2">
          <Link href="/settings/notifications" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full justify-between text-sm">
              View all notifications
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;


'use client';

import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileText,
  FileCheck,
  CheckCircle,
  Shield,
  Lock,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

type WorkflowStatus = 
  | 'Draft' 
  | 'Prepared' 
  | 'Checked' 
  | 'Approved' 
  | 'Authorized' 
  | 'Locked'
  | 'Cancelled'
  | 'draft'
  | 'Pending'
  | 'Paid'
  | 'Overdue'
  | 'Active'
  | 'Inactive';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: WorkflowStatus;
  showIcon?: boolean;
}

const statusConfig: Record<WorkflowStatus, {
  variant: BadgeProps['variant'];
  icon: React.ElementType;
  label: string;
}> = {
  Draft: {
    variant: 'draft',
    icon: FileText,
    label: 'Draft',
  },
  Prepared: {
    variant: 'prepared',
    icon: FileCheck,
    label: 'Prepared',
  },
  Checked: {
    variant: 'checked',
    icon: AlertCircle,
    label: 'Checked',
  },
  Approved: {
    variant: 'approved',
    icon: CheckCircle,
    label: 'Approved',
  },
  Authorized: {
    variant: 'authorized',
    icon: Shield,
    label: 'Authorized',
  },
  Locked: {
    variant: 'locked',
    icon: Lock,
    label: 'Locked',
  },
  Cancelled: {
    variant: 'cancelled',
    icon: XCircle,
    label: 'Cancelled',
  },
  draft: {
    variant: 'draft',
    icon: FileText,
    label: 'Draft',
  },
  Pending: {
    variant: 'grey',
    icon: Clock,
    label: 'Pending',
  },
  Paid: {
    variant: 'active',
    icon: CheckCircle,
    label: 'Paid',
  },
  Overdue: {
    variant: 'cancelled',
    icon: AlertCircle,
    label: 'Overdue',
  },
  Active: {
    variant: 'active',
    icon: CheckCircle,
    label: 'Active',
  },
  Inactive: {
    variant: 'grey',
    icon: XCircle,
    label: 'Inactive',
  },
};

export function StatusBadge({ 
  status, 
  showIcon = true, 
  className, 
  ...props 
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.Draft;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn("gap-1", className)}
      {...props}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{config.label}</span>
    </Badge>
  );
}

// Utility function to get status variant for direct badge usage
export function getStatusVariant(status: string): BadgeProps['variant'] {
  const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return statusConfig[normalizedStatus as WorkflowStatus]?.variant || 'grey';
}

export { type WorkflowStatus };


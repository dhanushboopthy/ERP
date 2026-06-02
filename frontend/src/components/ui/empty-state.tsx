'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Inbox, 
  FileText, 
  Search, 
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

type EmptyStateVariant = 'empty' | 'search' | 'error' | 'filtered';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultContent: Record<EmptyStateVariant, { icon: React.ReactNode; title: string; description: string }> = {
  empty: {
    icon: <Inbox className="h-12 w-12" />,
    title: "No data yet",
    description: "Get started by adding your first record.",
  },
  search: {
    icon: <Search className="h-12 w-12" />,
    title: "No results found",
    description: "Try adjusting your search or filter criteria.",
  },
  error: {
    icon: <AlertCircle className="h-12 w-12" />,
    title: "Something went wrong",
    description: "We couldn't load the data. Please try again.",
  },
  filtered: {
    icon: <FileText className="h-12 w-12" />,
    title: "No matching records",
    description: "No records match your current filter settings.",
  },
};

export function EmptyState({
  variant = 'empty',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const content = defaultContent[variant];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 text-gray-400 mb-4">
        {icon || content.icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {title || content.title}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {description || content.description}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {action && (
          <Button onClick={action.onClick}>
            {action.icon || (variant === 'error' ? <RefreshCw className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />)}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}


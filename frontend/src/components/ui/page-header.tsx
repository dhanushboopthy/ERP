'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, Filter, RefreshCw } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

interface PageHeaderActionsProps {
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  children,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 md:pb-6",
      className
    )}>
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

export function PageHeaderActions({ children, className }: PageHeaderActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  );
}

// Preset action buttons for common use cases
interface ActionButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function AddButton({ onClick, loading, disabled, className, label = "Add New" }: ActionButtonProps) {
  return (
    <Button onClick={onClick} disabled={loading || disabled} className={className}>
      <Plus className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">Add</span>
    </Button>
  );
}

export function ExportButton({ onClick, loading, disabled, className, label = "Export" }: ActionButtonProps) {
  return (
    <Button variant="outline" onClick={onClick} disabled={loading || disabled} className={className}>
      <Download className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export function ImportButton({ onClick, loading, disabled, className, label = "Import" }: ActionButtonProps) {
  return (
    <Button variant="outline" onClick={onClick} disabled={loading || disabled} className={className}>
      <Upload className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export function FilterButton({ onClick, loading, disabled, className, active }: ActionButtonProps & { active?: boolean }) {
  return (
    <Button 
      variant={active ? "default" : "outline"} 
      onClick={onClick} 
      disabled={loading || disabled} 
      className={className}
    >
      <Filter className="h-4 w-4" />
      <span className="sr-only">Filter</span>
    </Button>
  );
}

export function RefreshButton({ onClick, loading, disabled, className }: ActionButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={onClick} 
      disabled={loading || disabled} 
      className={className}
    >
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      <span className="sr-only">Refresh</span>
    </Button>
  );
}


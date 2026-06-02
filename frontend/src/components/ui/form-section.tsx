'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
  variant?: 'card' | 'plain';
}

export function FormSection({ 
  title, 
  description, 
  children, 
  className,
  columns = 2,
  variant = 'card'
}: FormSectionProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  const content = (
    <div className={cn(`grid ${gridClass[columns]} gap-4 md:gap-6`, className)}>
      {children}
    </div>
  );

  if (variant === 'plain') {
    return (
      <div className="space-y-4">
        {(title || description) && (
          <div className="pb-2 border-b border-gray-200">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
        )}
        {content}
      </div>
    );
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader className="pb-4">
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={!title && !description ? 'pt-6' : ''}>
        {content}
      </CardContent>
    </Card>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function FormField({ 
  label, 
  required, 
  error, 
  hint, 
  children,
  className,
  fullWidth = false
}: FormFieldProps) {
  return (
    <div className={cn(
      "space-y-2",
      fullWidth && "md:col-span-2 lg:col-span-3",
      className
    )}>
      <Label className={cn(
        "text-sm font-medium",
        error && "text-red-600"
      )}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Info className="h-3.5 w-3.5" />
          {hint}
        </p>
      )}
    </div>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function FormActions({ children, className, sticky = false }: FormActionsProps) {
  return (
    <div className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 mt-6",
      sticky && "sticky bottom-0 bg-white py-4 -mx-4 px-4 md:-mx-6 md:px-6 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)]",
      className
    )}>
      {children}
    </div>
  );
}

interface FormAlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  className?: string;
}

export function FormAlert({ type, message, className }: FormAlertProps) {
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  const icons = {
    success: <CheckCircle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
  };

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl border",
      styles[type],
      className
    )}>
      <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}


'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    direction?: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-white border-gray-200',
  primary: 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20',
  success: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200',
  warning: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200',
  danger: 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200',
  info: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200',
  grey: 'bg-gray-50 border-gray-200',
  active: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200',
};

const iconContainerStyles: Record<string, string> = {
  default: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
  info: 'bg-blue-100 text-blue-600',
  grey: 'bg-gray-200 text-gray-600',
  active: 'bg-indigo-100 text-indigo-600',
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  loading = false,
  className,
}: MetricCardProps) {
  const trendDirection = trend?.direction || (
    trend?.value && trend.value > 0 ? 'up' : trend?.value && trend.value < 0 ? 'down' : 'neutral'
  );

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-card-hover",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 truncate">
              {title}
            </p>
            {loading ? (
              <div className="mt-2">
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse-soft" />
              </div>
            ) : (
              <p className="mt-1 text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">
                {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
              </p>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "flex-shrink-0 p-2.5 rounded-xl",
              iconContainerStyles[variant]
            )}>
              {icon}
            </div>
          )}
        </div>

        {trend && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded",
              {
                'bg-emerald-100 text-emerald-700': trendDirection === 'up',
                'bg-red-100 text-red-700': trendDirection === 'down',
                'bg-gray-100 text-gray-600': trendDirection === 'neutral',
              }
            )}>
              {trendDirection === 'up' && <TrendingUp className="h-3 w-3" />}
              {trendDirection === 'down' && <TrendingDown className="h-3 w-3" />}
              {trendDirection === 'neutral' && <Minus className="h-3 w-3" />}
              <span>{Math.abs(trend.value)}%</span>
            </span>
            {trend.label && (
              <span className="text-xs text-gray-500">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Grid wrapper for metric cards
export function MetricCardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
      className
    )}>
      {children}
    </div>
  );
}


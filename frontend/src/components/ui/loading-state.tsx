'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  variant?: 'fullscreen' | 'inline' | 'card' | 'overlay';
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  variant = 'inline',
  className,
}: LoadingStateProps) {
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-gray-200" />
            <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className={cn(
        "absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl",
        className
      )}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-gray-600">{message}</span>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "bg-white rounded-xl border border-gray-200 p-8",
        className
      )}>
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
    );
  }

  // inline variant
  return (
    <div className={cn(
      "flex items-center justify-center gap-3 py-8",
      className
    )}>
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span className="text-sm text-gray-500">{message}</span>
    </div>
  );
}

// Skeleton components for loading states
export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn(
      "h-4 bg-gray-200 rounded animate-pulse-soft",
      className
    )} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 p-4 space-y-3",
      className
    )}>
      <SkeletonLine className="h-5 w-3/4" />
      <SkeletonLine className="h-4 w-1/2" />
      <SkeletonLine className="h-4 w-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-gray-200">
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="h-4 w-40" />
        <SkeletonLine className="h-4 w-20" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-4 w-40" />
          <SkeletonLine className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonMetricGrid({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-4 gap-4",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}


'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  mobileHidden?: boolean;
  mobilePrimary?: boolean;
  mobileSecondary?: boolean;
}

interface Action<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'cancelled';
}

interface ResponsiveDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  onRowClick?: (row: T) => void;
  keyField: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions,
  onRowClick,
  keyField,
  loading = false,
  emptyMessage = "No data available",
  className,
}: ResponsiveDataTableProps<T>) {
  const primaryColumn = columns.find(c => c.mobilePrimary) || columns[0];
  const secondaryColumn = columns.find(c => c.mobileSecondary);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-line h-16" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      {/* Desktop Table - hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={String(column.key)} 
                  className={column.className}
                >
                  {column.header}
                </TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={String(row[keyField])}
                className={cn(onRowClick && "cursor-pointer hover:bg-gray-50")}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={String(column.key)} 
                    className={column.className}
                  >
                    {column.cell 
                      ? column.cell(row) 
                      : String(row[column.key as keyof T] ?? '')}
                  </TableCell>
                ))}
                {actions && actions.length > 0 && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, idx) => (
                          <DropdownMenuItem
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            className={action.variant === 'cancelled' ? 'text-red-600' : ''}
                          >
                            {action.icon}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List - shown only on mobile */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <Card
            key={String(row[keyField])}
            className={cn(
              "overflow-hidden transition-shadow",
              onRowClick && "cursor-pointer active:bg-gray-50"
            )}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Primary info */}
                  <div className="font-semibold text-gray-900 truncate">
                    {primaryColumn.cell 
                      ? primaryColumn.cell(row) 
                      : String(row[primaryColumn.key as keyof T] ?? '')}
                  </div>
                  {/* Secondary info */}
                  {secondaryColumn && (
                    <div className="text-sm text-gray-500 mt-1">
                      {secondaryColumn.cell 
                        ? secondaryColumn.cell(row) 
                        : String(row[secondaryColumn.key as keyof T] ?? '')}
                    </div>
                  )}
                  {/* Other visible columns */}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {columns
                      .filter(c => !c.mobileHidden && !c.mobilePrimary && !c.mobileSecondary)
                      .slice(0, 3)
                      .map((column) => (
                        <span key={String(column.key)}>
                          <span className="text-gray-400">{column.header}: </span>
                          {column.cell 
                            ? column.cell(row) 
                            : String(row[column.key as keyof T] ?? '')}
                        </span>
                      ))}
                  </div>
                </div>
                {/* Right side - actions or chevron */}
                <div className="flex items-center gap-1">
                  {actions && actions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, idx) => (
                          <DropdownMenuItem
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            className={action.variant === 'cancelled' ? 'text-red-600' : ''}
                          >
                            {action.icon}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {onRowClick && !actions && (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


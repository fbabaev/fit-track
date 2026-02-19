import React from 'react';
import { cn } from '../../lib/utils';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  loading?: boolean;
  emptyState?: string;
  isEmpty?: boolean;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  className,
  headerRight,
  loading = false,
  emptyState,
  isEmpty = false,
}: ChartContainerProps) {
  if (loading) {
    return (
      <div className={cn('card p-4', className)}>
        <div className="space-y-3">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-48 rounded" />
          <div className="skeleton h-48 w-full rounded-lg mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('card p-4', className)}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-48 text-neutral-400">
          <div className="text-center">
            <svg
              className="w-8 h-8 mx-auto mb-2 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-sm text-neutral-400">
              {emptyState ?? 'No data in this range.'}
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

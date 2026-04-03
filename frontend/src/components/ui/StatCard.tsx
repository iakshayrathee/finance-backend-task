'use client';

import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title:      string;
  value:      string | number;
  subtitle?:  string;
  trend?:     number;    // positive = up, negative = down
  icon?:      React.ReactNode;
  className?: string;
  loading?:   boolean;
}

export function StatCard({ title, value, subtitle, trend, icon, className, loading }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface p-6 flex flex-col gap-3 animate-count-up',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-text-muted">{title}</p>
        {icon && (
          <div className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
        )}
      </div>

      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded-lg bg-border" />
      ) : (
        <p className="text-2xl font-bold text-text-primary font-sans">{value}</p>
      )}

      {(trend !== undefined || subtitle) && (
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-text-muted'
              )}
            >
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> :
               trend < 0 ? <TrendingDown className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

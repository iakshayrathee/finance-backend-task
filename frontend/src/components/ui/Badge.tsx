'use client';

import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'indigo';

interface BadgeProps {
  variant?:  BadgeVariant;
  children:  React.ReactNode;
  className?: string;
  dot?:       boolean;
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-slate-500/20  text-slate-300  border-slate-500/30',
  success: 'bg-green-500/20  text-green-400  border-green-500/30',
  danger:  'bg-red-500/20    text-red-400    border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info:    'bg-blue-500/20   text-blue-400   border-blue-500/30',
  purple:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  indigo:  'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

const dotClass: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-green-400',
  danger:  'bg-red-400',
  warning: 'bg-yellow-400',
  info:    'bg-blue-400',
  purple:  'bg-purple-400',
  indigo:  'bg-indigo-400',
};

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClass[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotClass[variant])} />}
      {children}
    </span>
  );
}

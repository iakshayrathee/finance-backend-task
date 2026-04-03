'use client';

import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?:     'sm' | 'md' | 'lg';
  className?: string;
  label?:    string;
}

const sizeClass = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
};

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClass[size])} />
      {label && <p className="text-sm text-text-muted">{label}</p>}
    </div>
  );
}

export function PageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}

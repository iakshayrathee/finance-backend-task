'use client';

import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  icon?:     React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:   'bg-primary text-white hover:bg-indigo-500 focus:ring-indigo-500',
  secondary: 'bg-surface border border-border text-text-primary hover:bg-border focus:ring-border',
  danger:    'bg-danger text-white hover:bg-red-500 focus:ring-red-500',
  ghost:     'text-text-muted hover:text-text-primary hover:bg-white/5 focus:ring-border',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2   text-sm rounded-lg gap-2',
  lg: 'px-6 py-3   text-base rounded-xl gap-2',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin w-4 h-4" /> : icon}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export { Button };

'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'default' | 'accent' | 'brand' | 'danger';
type Size = 'sm' | 'md';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — icon buttons have no text label. */
  'aria-label': string;
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  default: 'border border-surface-border text-slate-300 hover:bg-surface-overlay hover:text-slate-100',
  accent: 'border border-accent-500/40 bg-accent-500/15 text-accent-200 hover:bg-accent-500/25',
  brand: 'bg-brand-600 text-white hover:bg-brand-500',
  danger: 'border border-surface-border text-slate-300 hover:bg-red-600/20 hover:text-red-300',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
};

/** Square, icon-only button. The shared vocabulary for compact room controls. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl transition-colors',
        'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

IconButton.displayName = 'IconButton';

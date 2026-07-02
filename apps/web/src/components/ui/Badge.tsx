import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeTone = 'neutral' | 'brand' | 'accent' | 'success' | 'danger';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-overlay text-slate-300',
  brand: 'bg-brand-500/15 text-brand-200',
  accent: 'bg-accent-500/15 text-accent-200',
  success: 'bg-success-500/15 text-success-300',
  danger: 'bg-danger-500/15 text-danger-300',
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

/** Small status/count pill. Pair color with text/icon — never color alone. */
export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

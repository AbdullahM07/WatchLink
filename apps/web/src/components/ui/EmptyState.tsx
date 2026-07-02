import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type EmptyTone = 'brand' | 'accent' | 'warning';

const chipClasses: Record<EmptyTone, string> = {
  brand: 'bg-brand-500/15 text-brand-200',
  accent: 'bg-accent-500/15 text-accent-200',
  warning: 'bg-amber-500/15 text-amber-300',
};

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  tone?: EmptyTone;
  /** Wrap in a dashed panel (page-level empties) vs. plain (inside panels). */
  bordered?: boolean;
  action?: ReactNode;
  className?: string;
}

/** Shared empty/error placeholder: optional icon chip, title, description, action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'brand',
  bordered = false,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        bordered && 'rounded-2xl border border-dashed border-surface-border bg-surface-raised/30 px-6 py-12',
        className,
      )}
    >
      {Icon && (
        <span className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-2xl', chipClasses[tone])}>
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      )}
      <p className="font-medium text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

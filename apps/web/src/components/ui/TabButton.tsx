'use client';

import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  /** `underline` for the side panel; `pill` for the mobile room switch. */
  variant?: 'underline' | 'pill';
  icon?: LucideIcon;
  count?: number;
}

/** Shared tab control for the chat/notes side panel and the mobile room switch. */
export function TabButton({
  active,
  variant = 'underline',
  icon: Icon,
  count,
  children,
  className,
  ...props
}: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400',
        variant === 'underline'
          ? cn(
              'border-b-2 px-3',
              active
                ? 'border-brand-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200',
            )
          : cn(
              'rounded-lg',
              active ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-surface-overlay',
            ),
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
      {typeof count === 'number' && count > 0 && (
        <span
          className={cn(
            'rounded-full px-1.5 text-[10px]',
            variant === 'pill' ? 'bg-black/20' : 'bg-surface-border text-slate-300',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

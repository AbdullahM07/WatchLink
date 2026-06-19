'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'h-11 w-full rounded-xl border bg-surface-raised px-3 text-slate-100 placeholder:text-slate-500',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/60',
              icon && 'pl-10',
              error ? 'border-red-500/70' : 'border-surface-border',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

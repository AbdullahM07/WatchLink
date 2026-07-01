'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  /** Show a reveal toggle for password fields (only when `type="password"`). */
  revealToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, type, revealToggle, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const [reveal, setReveal] = useState(false);
    const hasToggle = revealToggle && type === 'password';
    const inputType = hasToggle ? (reveal ? 'text' : 'password') : type;

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
            type={inputType}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'h-11 w-full rounded-xl border bg-surface-raised px-3 text-slate-100 placeholder:text-slate-400',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/60',
              icon && 'pl-10',
              hasToggle && 'pr-11',
              error ? 'border-red-500/70' : 'border-surface-border',
              className,
            )}
            {...props}
          />
          {hasToggle && (
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? 'Hide password' : 'Show password'}
              aria-pressed={reveal}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:text-slate-200"
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
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

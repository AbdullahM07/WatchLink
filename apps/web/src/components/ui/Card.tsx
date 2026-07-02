import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type CardVariant = 'raised' | 'overlay' | 'interactive';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const base = 'rounded-2xl border transition-colors';

const variantClasses: Record<CardVariant, string> = {
  // Default surface panel — a hair of inset light gives depth without glass.
  raised: 'border-surface-border bg-surface-raised/60 ring-1 ring-inset ring-white/5',
  // Floating surfaces: menus, popovers, on-video overlays.
  overlay: 'border-surface-border bg-surface-overlay ring-1 ring-inset ring-white/5 shadow-xl shadow-black/30',
  // Clickable cards warm their border toward brand on hover.
  interactive:
    'border-surface-border bg-surface-raised/60 ring-1 ring-inset ring-white/5 hover:border-brand-500/40',
};

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Canonical card classes — use when the element can't be a `<div>` (e.g. `<li>`,
 * `<Link>`) so every surface shares one treatment.
 */
export function cardClasses(
  variant: CardVariant = 'raised',
  padding: CardPadding = 'md',
  className?: string,
) {
  return cn(base, variantClasses[variant], paddingClasses[padding], className);
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

/** The one surface primitive. Every panel/tile/menu builds on this. */
export function Card({ variant = 'raised', padding = 'md', className, ...props }: CardProps) {
  return <div className={cardClasses(variant, padding, className)} {...props} />;
}

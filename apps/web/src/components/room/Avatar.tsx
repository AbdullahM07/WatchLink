'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

const SIZES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
} as const;

interface Props {
  name: string;
  avatar?: string | null;
  size?: keyof typeof SIZES;
  /** Adds a warm "on-air" ring + glow while the person is talking. */
  speaking?: boolean;
  /** Ring color when idle (used to separate overlapping avatars). */
  idleRing?: string;
  className?: string;
}

/** Shared participant avatar — image when available, initials fallback. */
export function Avatar({
  name,
  avatar,
  size = 'sm',
  speaking = false,
  idleRing = 'ring-transparent',
  className,
}: Props) {
  const sizeCls = SIZES[size];
  const [broken, setBroken] = useState(false);
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        'ring-2 transition-shadow',
        speaking ? 'ring-accent-400 shadow-glow' : idleRing,
        sizeCls,
        className,
      )}
    >
      {avatar && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt={name}
          className="h-full w-full rounded-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-brand-600/25 text-brand-200">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}

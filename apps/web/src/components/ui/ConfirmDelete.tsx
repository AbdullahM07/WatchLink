'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  onConfirm: () => void;
  /** Accessible label for the idle state, e.g. "Delete message". */
  label: string;
  /** Layout/visibility classes from the parent (e.g. hover-reveal). */
  className?: string;
}

/**
 * Destructive icon button with a two-click safety: the first click arms it
 * (turns red, swaps to a check), a second click within 2.5s confirms. Moving
 * away or waiting disarms it — no accidental deletes, no modal.
 */
export function ConfirmDelete({ onConfirm, label, className }: Props) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const disarm = () => {
    clearTimeout(timer.current);
    setArmed(false);
  };

  const handleClick = () => {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 2500);
    } else {
      disarm();
      onConfirm();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseLeave={disarm}
      onBlur={disarm}
      aria-label={armed ? `Confirm: ${label}` : label}
      title={armed ? 'Click again to confirm' : label}
      className={cn(
        'transition-colors',
        armed ? 'text-red-400 opacity-100' : 'text-slate-400 hover:text-red-400',
        className,
      )}
    >
      {armed ? <Check className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}

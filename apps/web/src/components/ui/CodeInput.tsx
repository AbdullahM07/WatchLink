'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

interface CodeInputProps {
  /** Current value (controlled). Uppercased, alphanumeric, up to `length` chars. */
  value: string;
  onChange: (value: string) => void;
  /** Number of segments. */
  length: number;
  /** Fired when all segments are filled. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
}

/** Keep only room-code characters: uppercase letters and digits. */
const sanitize = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Segmented, OTP-style input for short room codes. One box per character with
 * auto-advance, backspace-to-previous, arrow navigation, and full/partial paste.
 * The parent owns the value string; each box just renders `value[i]`.
 */
export function CodeInput({
  value,
  onChange,
  length,
  onComplete,
  disabled,
  autoFocus,
  'aria-label': ariaLabel = 'Room code',
}: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusBox = (index: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, index))];
    el?.focus();
    el?.select();
  };

  const commit = (next: string) => {
    const clean = sanitize(next).slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  const handleChange = (index: number, raw: string) => {
    const chars = sanitize(raw);
    if (!chars) return;
    // Take the last typed character so retyping over a filled box replaces it.
    const char = chars[chars.length - 1];
    const arr = value.split('');
    arr[index] = char;
    const next = commit(arr.join('').slice(0, length));
    // Advance to the next empty box (or the one after the edited box).
    focusBox(Math.min(index + 1, next.length));
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = value.split('');
      if (arr[index]) {
        // Clear the current box in place.
        arr[index] = '';
        commit(arr.join(''));
      } else if (index > 0) {
        // Empty box: clear the previous box and step back.
        arr[index - 1] = '';
        commit(arr.join(''));
        focusBox(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = sanitize(e.clipboardData.getData('text'));
    if (!pasted) return;
    const arr = value.split('');
    // Drop the pasted characters starting at the focused box.
    for (let i = 0; i < pasted.length && index + i < length; i += 1) {
      arr[index + i] = pasted[i];
    }
    const next = commit(arr.join('').slice(0, length));
    focusBox(next.length);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label={ariaLabel}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={1}
          aria-label={`${ariaLabel} character ${i + 1} of ${length}`}
          className={cn(
            'h-14 w-11 rounded-xl border bg-surface-raised text-center font-mono text-xl font-semibold uppercase text-slate-100',
            'border-surface-border transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/60',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
      ))}
    </div>
  );
}

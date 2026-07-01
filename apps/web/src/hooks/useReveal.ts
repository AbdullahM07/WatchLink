'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Scroll-reveal: returns a ref plus a `shown` flag that flips true when the
 * element scrolls into view. Pair with a transition from an offset/hidden state
 * to visible. Under `prefers-reduced-motion` it reveals immediately (no travel),
 * so content is never left hidden behind a neutralized animation.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, shown };
}

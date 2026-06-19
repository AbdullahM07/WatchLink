'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

/**
 * Redirects to /login once auth resolution finishes and the user is a guest.
 * Returns the current status so pages can render a spinner while `loading`.
 */
export function useRequireAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  return { status, user };
}

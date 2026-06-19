'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { fetchMe } from '@/lib/auth-api';
import { getToken } from '@/lib/token';

/** Restores the session on first load by validating the stored token. */
function AuthBootstrap({ children }: { children: ReactNode }) {
  const resolve = useAuthStore((s) => s.resolve);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = getToken();
    if (!token) {
      resolve(null);
      return;
    }
    fetchMe()
      .then(({ user }) => resolve(user))
      .catch(() => resolve(null));
  }, [resolve]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}

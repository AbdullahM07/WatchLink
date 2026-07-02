'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ErrorPage } from '@/components/ui/ErrorPage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface it for now; a real error reporter can hook in here later.
    console.error(error);
  }, [error]);

  return (
    <ErrorPage
      title="Something went wrong"
      message="An unexpected error interrupted this page. You can try again, or head back home."
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <Link href="/">
            <Button variant="secondary">Back home</Button>
          </Link>
        </>
      }
    />
  );
}

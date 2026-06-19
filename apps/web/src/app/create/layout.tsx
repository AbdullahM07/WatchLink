import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create a room',
  description: 'Start a new WatchLink room and invite friends to watch together.',
  robots: { index: false, follow: false },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

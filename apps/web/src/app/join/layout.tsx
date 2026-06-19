import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join a room',
  description: 'Enter a room code to join a WatchLink watch-together session.',
  robots: { index: false, follow: false },
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

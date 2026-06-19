import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/providers/Providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'WatchLink — Watch Together',
  description:
    'Create a room, drop in a video link, and watch in sync with friends — chat, react and talk with push-to-talk.',
};

export const viewport: Viewport = {
  themeColor: '#0b0b12',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

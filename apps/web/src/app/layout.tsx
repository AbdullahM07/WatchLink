import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/providers/Providers';
import { Navbar } from '@/components/Navbar';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'WatchLink — Watch Videos Together in Sync',
    template: '%s · WatchLink',
  },
  description:
    'Create a room, drop in a video link, and watch in perfect sync with friends — with live chat, emoji reactions, timestamped notes and WebRTC push-to-talk voice.',
  applicationName: 'WatchLink',
  keywords: [
    'watch together',
    'watch party',
    'sync video',
    'watch videos with friends',
    'youtube watch party',
    'group video chat',
    'push to talk',
    'synchronized streaming',
  ],
  authors: [{ name: 'WatchLink' }],
  creator: 'WatchLink',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'WatchLink',
    title: 'WatchLink — Watch Videos Together in Sync',
    description:
      'Watch videos in perfect sync with friends — live chat, emoji reactions, timestamped notes and push-to-talk voice.',
    url: '/',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WatchLink — Watch Videos Together in Sync',
    description:
      'Watch videos in perfect sync with friends — chat, react, take notes and talk with push-to-talk.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'technology',
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

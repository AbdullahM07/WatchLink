import type { MetadataRoute } from 'next';

// Web App Manifest — makes WatchLink installable (PWA). Auto-wired by Next into
// <link rel="manifest">.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WatchLink — Watch Together',
    short_name: 'WatchLink',
    description:
      'Watch videos in perfect sync with friends — live chat, reactions, timestamped notes and push-to-talk voice.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b12',
    theme_color: '#0b0b12',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}

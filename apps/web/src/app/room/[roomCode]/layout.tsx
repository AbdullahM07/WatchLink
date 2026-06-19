import type { Metadata } from 'next';

export function generateMetadata({ params }: { params: { roomCode: string } }): Metadata {
  return {
    title: `Room ${params.roomCode.toUpperCase()}`,
    description: 'A private WatchLink watch-together room.',
    // Rooms are private and ephemeral — keep them out of search indexes.
    robots: { index: false, follow: false },
  };
}

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

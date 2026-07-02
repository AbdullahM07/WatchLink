'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Lock, Radio, Tv, Users } from 'lucide-react';
import type { PublicRoom } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { listPublicRoomsRequest } from '@/lib/rooms-api';

/**
 * Live directory of open rooms anyone can hop into straight from the landing
 * page. Joinability follows each room's protection: open rooms join in one tap,
 * locked rooms are surfaced but not joinable, and password/private rooms stay
 * code-only (so they never appear here).
 */
export function PublicRooms() {
  const query = useQuery({
    queryKey: ['public-rooms'],
    queryFn: listPublicRoomsRequest,
    // Keep the list feeling live without hammering the API.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const rooms = query.data?.rooms ?? [];
  const liveCount = rooms.reduce((n, r) => n + r.participantCount, 0);

  return (
    <section id="rooms" className="mx-auto w-full max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            <Radio className="h-5 w-5 text-brand-300" />
            Rooms you can hop into
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Open rooms join in one tap — locked ones wait for the host.
          </p>
        </div>
        {liveCount > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-overlay px-3 py-1 text-xs font-medium text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {liveCount} watching now
          </span>
        )}
      </div>

      <div className="mt-6">
        {query.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-7 w-7" />
          </div>
        ) : rooms.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.roomCode} room={room} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={query.isError ? AlertTriangle : Tv}
            tone={query.isError ? 'warning' : 'brand'}
            bordered
            title={query.isError ? 'Could not load rooms' : 'No open rooms right now'}
            description={
              query.isError
                ? 'Check your connection and try again in a moment.'
                : 'Be the first — start a room and your friends can drop in.'
            }
            action={
              query.isError ? (
                <Button size="sm" variant="secondary" onClick={() => query.refetch()} isLoading={query.isFetching}>
                  Retry
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </section>
  );
}

function RoomCard({ room }: { room: PublicRoom }) {
  const isPlaying = room.player.status === 'playing' && Boolean(room.player.mediaUrl);
  const isFull = room.participantCount >= room.maxParticipants;
  const joinable = !room.isLocked && !isFull;

  return (
    <Card variant="interactive" className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate font-semibold">{room.name}</h3>
        <ProtectionBadge room={room} isFull={isFull} />
      </div>

      <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
        <span className="font-mono tracking-widest text-slate-300">{room.roomCode}</span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {room.participantCount}/{room.maxParticipants}
        </span>
        {isPlaying && (
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Playing
          </span>
        )}
      </div>

      <div className="mt-4">
        {joinable ? (
          <Link href={`/room/${room.roomCode}`} className="block">
            <Button size="sm" className="w-full">
              Join room
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="secondary" className="w-full" disabled>
            {room.isLocked ? (
              <>
                <Lock className="h-4 w-4" /> Locked
              </>
            ) : (
              'Room full'
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}

function ProtectionBadge({ room, isFull }: { room: PublicRoom; isFull: boolean }) {
  if (room.isLocked) {
    return (
      <Badge tone="accent">
        <Lock className="h-3 w-3" /> Locked
      </Badge>
    );
  }
  if (isFull) {
    return <Badge tone="neutral">Full</Badge>;
  }
  return <Badge tone="success">Open</Badge>;
}

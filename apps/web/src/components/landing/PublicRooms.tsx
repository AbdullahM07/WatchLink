'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Lock, Radio, Tv, Users } from 'lucide-react';
import type { PublicRoom } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { listPublicRoomsRequest } from '@/lib/rooms-api';
import { cn } from '@/lib/cn';

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
    <section className="mx-auto w-full max-w-6xl">
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
          <EmptyState error={query.isError} />
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
    <div className="flex flex-col rounded-2xl border border-surface-border bg-surface-raised/60 p-4 transition-colors hover:border-brand-600/50">
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
    </div>
  );
}

function ProtectionBadge({ room, isFull }: { room: PublicRoom; isFull: boolean }) {
  if (room.isLocked) {
    return (
      <Badge className="bg-amber-500/15 text-amber-300">
        <Lock className="h-3 w-3" /> Locked
      </Badge>
    );
  }
  if (isFull) {
    return <Badge className="bg-surface-overlay text-slate-400">Full</Badge>;
  }
  return <Badge className="bg-emerald-500/15 text-emerald-300">Open</Badge>;
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        className,
      )}
    >
      {children}
    </span>
  );
}

function EmptyState({ error }: { error: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-raised/30 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-200">
        <Tv className="h-6 w-6" />
      </span>
      <p className="mt-4 font-medium text-slate-200">
        {error ? 'Could not load rooms' : 'No open rooms right now'}
      </p>
      <p className="mt-1 max-w-xs text-sm text-slate-400">
        {error
          ? 'Check your connection and try again in a moment.'
          : 'Be the first — start a room and your friends can drop in.'}
      </p>
    </div>
  );
}

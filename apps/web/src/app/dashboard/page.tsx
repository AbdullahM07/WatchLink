'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Lock, Mail, Plus, Sparkles, Tv, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageSpinner, Spinner } from '@/components/ui/Spinner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { listMyRoomsRequest } from '@/lib/rooms-api';

export default function DashboardPage() {
  const { status, user } = useRequireAuth();
  const router = useRouter();

  const myRooms = useQuery({
    queryKey: ['my-rooms'],
    queryFn: listMyRoomsRequest,
    enabled: status === 'authenticated',
  });

  if (status !== 'authenticated' || !user) return <PageSpinner />;

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.name} 👋</h1>
        <p className="mt-1 text-slate-400">Start a room or jump back into one.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => router.push('/create')}
          className="group flex items-center gap-4 rounded-2xl border border-surface-border bg-surface-raised p-6 text-left transition-colors hover:border-brand-600/60"
        >
          <span className="rounded-xl bg-brand-600/15 p-3 text-brand-300">
            <Plus className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-semibold">Create a room</span>
            <span className="text-sm text-slate-400">Pick a video and invite friends</span>
          </span>
        </button>

        <button
          onClick={() => router.push('/join')}
          className="group flex items-center gap-4 rounded-2xl border border-surface-border bg-surface-raised p-6 text-left transition-colors hover:border-brand-600/60"
        >
          <span className="rounded-xl bg-brand-600/15 p-3 text-brand-300">
            <Tv className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-semibold">Join with a code</span>
            <span className="text-sm text-slate-400">Enter a 6-character room code</span>
          </span>
        </button>
      </div>

      <section className="rounded-2xl border border-surface-border bg-surface-raised/60 p-6">
        <h2 className="mb-4 text-lg font-semibold">Your account</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-slate-400" />
            <div>
              <dt className="text-xs text-slate-500">Email</dt>
              <dd className="text-sm">{user.email}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-slate-400" />
            <div>
              <dt className="text-xs text-slate-500">Role</dt>
              <dd className="text-sm capitalize">{user.role}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-slate-400" />
            <div>
              <dt className="text-xs text-slate-500">Member since</dt>
              <dd className="text-sm">{memberSince}</dd>
            </div>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Your rooms</h2>
        {myRooms.isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : myRooms.data && myRooms.data.rooms.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myRooms.data.rooms.map((room) => (
              <Link
                key={room.roomCode}
                href={`/room/${room.roomCode}`}
                className="rounded-2xl border border-surface-border bg-surface-raised p-4 transition-colors hover:border-brand-600/60"
              >
                <div className="flex items-center justify-between">
                  <h3 className="truncate font-medium">{room.name}</h3>
                  {room.isPrivate && <Lock className="h-4 w-4 text-slate-400" />}
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
                  <span className="font-mono tracking-widest text-slate-300">{room.roomCode}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {room.participantCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-raised/30 py-14 text-center">
            <Tv className="h-10 w-10 text-slate-600" />
            <p className="mt-3 text-slate-400">No rooms yet</p>
            <p className="text-sm text-slate-500">Create one to get started.</p>
          </div>
        )}
      </section>
    </div>
  );
}

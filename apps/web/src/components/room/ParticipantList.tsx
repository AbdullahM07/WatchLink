'use client';

import { useState } from 'react';
import { Crown, MicOff, MoreVertical, ShieldCheck, ShieldOff, SlidersHorizontal, UserCog, UserMinus } from 'lucide-react';
import type { Participant } from '@watchlink/shared';
import { cn } from '@/lib/cn';

interface Props {
  participants: Participant[];
  selfId: string | null;
  hostId: string;
  amHost: boolean;
  onKick: (userId: string) => void;
  onTransfer: (userId: string) => void;
  onGrantControl: (userId: string) => void;
  onRevokeControl: (userId: string) => void;
}

function Avatar({ p }: { p: Participant }) {
  if (p.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.avatar} alt={p.name} className="h-8 w-8 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/25 text-xs font-semibold text-brand-200">
      {p.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function ParticipantList({
  participants,
  selfId,
  hostId,
  amHost,
  onKick,
  onTransfer,
  onGrantControl,
  onRevokeControl,
}: Props) {
  const [openFor, setOpenFor] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      <h3 className="px-1 pb-2 text-sm font-semibold text-slate-300">
        Participants · {participants.length}
      </h3>
      <ul className="space-y-1">
        {participants.map((p) => {
          const isSelf = p.userId === selfId;
          const isHostRow = p.userId === hostId;
          const canManage = amHost && !isSelf;
          return (
            <li
              key={p.userId}
              className="group relative flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-surface-overlay"
            >
              <div className="relative">
                <Avatar p={p} />
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface-raised',
                    p.isSpeaking ? 'bg-emerald-400' : 'bg-emerald-500/40',
                  )}
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {p.name}
                  {isSelf && <span className="ml-1 text-xs text-slate-500">(you)</span>}
                </p>
                {p.isGuest && <p className="text-xs text-slate-500">Guest</p>}
              </div>

              {p.isMuted && <MicOff className="h-3.5 w-3.5 text-slate-500" aria-label="Muted" />}

              {/* Controller badge (non-host with control) */}
              {!isHostRow && p.canControl && (
                <SlidersHorizontal className="h-3.5 w-3.5 text-brand-300" aria-label="Has control" />
              )}
              {isHostRow && <Crown className="h-4 w-4 text-amber-400" aria-label="Host" />}

              {canManage && (
                <div className="relative">
                  <button
                    onClick={() => setOpenFor((v) => (v === p.userId ? null : p.userId))}
                    className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-surface-border group-hover:opacity-100"
                    aria-label={`Manage ${p.name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openFor === p.userId && (
                    <div
                      className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-xl border border-surface-border bg-surface-overlay py-1 shadow-xl"
                      onMouseLeave={() => setOpenFor(null)}
                    >
                      {p.canControl ? (
                        <button
                          onClick={() => {
                            onRevokeControl(p.userId);
                            setOpenFor(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-border"
                        >
                          <ShieldOff className="h-4 w-4" /> Revoke control
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onGrantControl(p.userId);
                            setOpenFor(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-border"
                        >
                          <ShieldCheck className="h-4 w-4" /> Grant control
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onTransfer(p.userId);
                          setOpenFor(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-border"
                      >
                        <UserCog className="h-4 w-4" /> Make host
                      </button>
                      <button
                        onClick={() => {
                          onKick(p.userId);
                          setOpenFor(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-surface-border"
                      >
                        <UserMinus className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Crown, MicOff, MoreVertical, Radio, ShieldCheck, ShieldOff, SlidersHorizontal, UserCog, UserMinus } from 'lucide-react';
import type { Participant } from '@watchlink/shared';
import { cn } from '@/lib/cn';
import { Avatar } from './Avatar';

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
              <Avatar
                name={p.name}
                avatar={p.avatar}
                size="sm"
                speaking={p.isSpeaking}
                idleRing="ring-surface-raised"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {p.name}
                  {isSelf && <span className="ml-1 text-xs text-slate-400">(you)</span>}
                </p>
                {p.isGuest && <p className="text-xs text-slate-400">Guest</p>}
              </div>

              {p.isSpeaking && (
                <Radio className="h-3.5 w-3.5 animate-live-pulse text-accent-400" aria-label="Speaking" />
              )}
              {p.isMuted && <MicOff className="h-3.5 w-3.5 text-slate-400" aria-label="Muted" />}

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

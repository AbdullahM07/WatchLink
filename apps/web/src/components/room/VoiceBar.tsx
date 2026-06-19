'use client';

import { Loader2, Mic, MicOff, PhoneOff, Radio } from 'lucide-react';
import type { VoiceApi } from '@/hooks/useVoiceChat';
import { cn } from '@/lib/cn';

interface Props {
  voice: VoiceApi;
}

/**
 * Push-to-talk controls, shown above the chat input. Before joining it's a single
 * "Join voice" button; once in voice it becomes a hold-to-talk button + mute/leave.
 * Hold the button (mouse/touch) or the "V" key to transmit.
 */
export function VoiceBar({ voice }: Props) {
  const { inVoice, connecting, muted, talking, joinVoice, leaveVoice, toggleMute, startTalking, stopTalking } =
    voice;

  if (!inVoice) {
    return (
      <div className="border-t border-surface-border p-3">
        <button
          onClick={joinVoice}
          disabled={connecting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-overlay px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-surface-border disabled:opacity-50"
        >
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          {connecting ? 'Connecting…' : 'Join voice'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t border-surface-border p-3">
      <div className="flex items-center gap-2">
        {/* Push-to-talk button — hold to transmit. */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            startTalking();
          }}
          onPointerUp={stopTalking}
          onPointerLeave={stopTalking}
          onPointerCancel={stopTalking}
          disabled={muted}
          aria-pressed={talking}
          className={cn(
            'flex flex-1 select-none items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition',
            muted
              ? 'cursor-not-allowed bg-surface-overlay text-slate-500'
              : talking
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 scale-[0.98]'
                : 'bg-brand-600 text-white hover:bg-brand-500',
          )}
        >
          {talking ? <Radio className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
          {muted ? 'Muted' : talking ? 'Talking…' : 'Hold to talk'}
        </button>

        {/* Hard mute toggle. */}
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          title={muted ? 'Unmute microphone' : 'Mute microphone'}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border transition',
            muted ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30' : 'text-slate-200 hover:bg-surface-overlay',
          )}
        >
          {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        {/* Leave voice. */}
        <button
          onClick={leaveVoice}
          aria-label="Leave voice"
          title="Leave voice"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border text-slate-300 transition hover:bg-red-600/20 hover:text-red-300"
        >
          <PhoneOff className="h-4 w-4" />
        </button>
      </div>
      <p className="text-center text-[11px] text-slate-500">
        Hold the button or the <kbd className="rounded bg-surface-border px-1 font-mono">V</kbd> key to talk
      </p>
    </div>
  );
}

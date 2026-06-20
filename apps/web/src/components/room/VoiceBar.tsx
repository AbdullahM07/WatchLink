'use client';

import { Mic, MicOff, PhoneOff, Radio } from 'lucide-react';
import type { VoiceApi } from '@/hooks/useVoiceChat';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
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
        <Button variant="secondary" className="w-full" onClick={joinVoice} isLoading={connecting}>
          {!connecting && <Mic className="h-4 w-4" />}
          {connecting ? 'Connecting…' : 'Join voice'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t border-surface-border p-3">
      <div className="flex items-center gap-2">
        {/* Push-to-talk button — hold to transmit. "On air" warm glow when live. */}
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
            'flex flex-1 select-none items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
            'focus-visible:outline-none',
            muted
              ? 'cursor-not-allowed bg-surface-overlay text-slate-400'
              : talking
                ? 'scale-[0.98] bg-accent-500 text-surface shadow-glow'
                : 'bg-brand-600 text-white hover:bg-brand-500',
          )}
        >
          {talking ? <Radio className="h-4 w-4 animate-live-pulse" /> : <Mic className="h-4 w-4" />}
          {muted ? 'Muted' : talking ? 'On air…' : 'Hold to talk'}
        </button>

        {/* Hard mute toggle. */}
        <IconButton
          onClick={toggleMute}
          aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
          title={muted ? 'Unmute microphone' : 'Mute microphone'}
          variant={muted ? 'danger' : 'default'}
          className={cn(muted && 'bg-red-600/20 text-red-300')}
        >
          {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </IconButton>

        {/* Leave voice. */}
        <IconButton onClick={leaveVoice} aria-label="Leave voice" title="Leave voice" variant="danger">
          <PhoneOff className="h-4 w-4" />
        </IconButton>
      </div>
      <p className="text-center text-[11px] text-slate-400">
        Hold the button or the <kbd className="rounded bg-surface-border px-1 font-mono text-slate-200">V</kbd>{' '}
        key to talk
      </p>
    </div>
  );
}

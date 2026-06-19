'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizonal, Trash2 } from 'lucide-react';
import type { ChatMessage } from '@watchlink/shared';
import { MAX_CHAT_LENGTH } from '@watchlink/shared';
import { formatClock } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { VoiceApi } from '@/hooks/useVoiceChat';
import { VoiceBar } from './VoiceBar';

interface Props {
  messages: ChatMessage[];
  selfId: string | null;
  amHost: boolean;
  voice: VoiceApi;
  onSend: (text: string) => void;
  onDelete: (messageId: string) => void;
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={name} className="h-7 w-7 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600/25 text-[10px] font-semibold text-brand-200">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function Chat({ messages, selfId, amHost, voice, onSend, onDelete }: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">No messages yet — say hi 👋</p>
        )}
        {messages.map((m, i) => {
          const mine = m.userId === selfId;
          const prev = messages[i - 1];
          const grouped = prev?.userId === m.userId;
          return (
            <div
              key={m.id}
              className={cn('group flex items-end gap-2', mine && 'flex-row-reverse', grouped && 'mt-0.5')}
            >
              <div className="w-7 shrink-0">{!grouped && !mine && <Avatar name={m.name} avatar={m.avatar} />}</div>
              <div className={cn('max-w-[78%]', mine ? 'items-end text-right' : 'items-start')}>
                {!grouped && (
                  <div className={cn('mb-0.5 flex items-baseline gap-2 px-1', mine && 'flex-row-reverse')}>
                    <span className={cn('text-xs font-medium', mine ? 'text-brand-300' : 'text-slate-300')}>
                      {mine ? 'You' : m.name}
                    </span>
                    <span className="text-[10px] text-slate-500">{formatClock(m.createdAt)}</span>
                  </div>
                )}
                <div className={cn('relative inline-flex items-start gap-1', mine && 'flex-row-reverse')}>
                  <p
                    className={cn(
                      'whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm',
                      mine
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md bg-surface-overlay text-slate-200',
                    )}
                  >
                    {m.text}
                  </p>
                  {(mine || amHost) && (
                    <button
                      onClick={() => onDelete(m.id)}
                      className="mt-1 text-slate-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                      aria-label="Delete message"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <VoiceBar voice={voice} />

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-surface-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_CHAT_LENGTH}
          placeholder="Type a message…"
          aria-label="Chat message"
          className="h-10 flex-1 rounded-xl border border-surface-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-500 disabled:opacity-50"
          aria-label="Send"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

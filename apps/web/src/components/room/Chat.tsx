'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, SendHorizonal } from 'lucide-react';
import type { ChatMessage } from '@watchlink/shared';
import { MAX_CHAT_LENGTH } from '@watchlink/shared';
import { formatClock } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { VoiceApi } from '@/hooks/useVoiceChat';
import { IconButton } from '@/components/ui/IconButton';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import { EmptyState } from '@/components/ui/EmptyState';
import { fieldClasses } from '@/components/ui/Input';
import { Avatar } from './Avatar';
import { VoiceBar } from './VoiceBar';

interface Props {
  messages: ChatMessage[];
  selfId: string | null;
  amHost: boolean;
  voice: VoiceApi;
  onSend: (text: string) => void;
  onDelete: (messageId: string) => void;
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
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Say hi to the room 👋"
            className="py-12"
          />
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
              <div className="w-7 shrink-0">
                {!grouped && !mine && <Avatar name={m.name} avatar={m.avatar} size="xs" />}
              </div>
              <div className={cn('max-w-[78%]', mine ? 'items-end text-right' : 'items-start')}>
                {!grouped && (
                  <div className={cn('mb-0.5 flex items-baseline gap-2 px-1', mine && 'flex-row-reverse')}>
                    <span className={cn('text-xs font-medium', mine ? 'text-brand-300' : 'text-slate-300')}>
                      {mine ? 'You' : m.name}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatClock(m.createdAt)}</span>
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
                    <ConfirmDelete
                      onConfirm={() => onDelete(m.id)}
                      label="Delete message"
                      className="mt-1 opacity-0 group-hover:opacity-100"
                    />
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
          className={cn(fieldClasses, 'h-10 flex-1 px-3 text-sm')}
        />
        <IconButton type="submit" disabled={!text.trim()} variant="brand" aria-label="Send message">
          <SendHorizonal className="h-4 w-4" />
        </IconButton>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { MessageSquare, StickyNote } from 'lucide-react';
import type { ChatMessage, RoomNote } from '@watchlink/shared';
import { Chat } from './Chat';
import { NotesPanel } from './NotesPanel';
import { cn } from '@/lib/cn';
import type { VoiceApi } from '@/hooks/useVoiceChat';

interface Props {
  messages: ChatMessage[];
  notes: RoomNote[];
  selfId: string | null;
  amHost: boolean;
  canControl: boolean;
  voice: VoiceApi;
  getTime: () => number;
  hasMedia: boolean;
  onSend: (text: string) => void;
  onDeleteMessage: (id: string) => void;
  onAddNote: (time: number, text: string) => void;
  onDeleteNote: (id: string) => void;
  onJump: (time: number) => void;
}

type Tab = 'chat' | 'notes';

export function SidePanel(props: Props) {
  const [tab, setTab] = useState<Tab>('chat');

  const tabBtn = (key: Tab, label: string, Icon: typeof MessageSquare, count: number) => (
    <button
      onClick={() => setTab(key)}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
        tab === key
          ? 'border-brand-500 text-white'
          : 'border-transparent text-slate-400 hover:text-slate-200',
      )}
      role="tab"
      aria-selected={tab === key}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count > 0 && (
        <span className="rounded-full bg-surface-border px-1.5 text-[10px] text-slate-300">{count}</span>
      )}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 border-b border-surface-border" role="tablist">
        {tabBtn('chat', 'Chat', MessageSquare, props.messages.length)}
        {tabBtn('notes', 'Notes', StickyNote, props.notes.length)}
      </div>

      <div className="min-h-0 flex-1">
        {tab === 'chat' ? (
          <Chat
            messages={props.messages}
            selfId={props.selfId}
            amHost={props.amHost}
            voice={props.voice}
            onSend={props.onSend}
            onDelete={props.onDeleteMessage}
          />
        ) : (
          <NotesPanel
            notes={props.notes}
            selfId={props.selfId}
            amHost={props.amHost}
            canControl={props.canControl}
            getTime={props.getTime}
            hasMedia={props.hasMedia}
            onAdd={props.onAddNote}
            onDelete={props.onDeleteNote}
            onJump={props.onJump}
          />
        )}
      </div>
    </div>
  );
}

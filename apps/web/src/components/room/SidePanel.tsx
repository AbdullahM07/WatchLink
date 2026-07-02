'use client';

import { useState } from 'react';
import { MessageSquare, StickyNote } from 'lucide-react';
import type { ChatMessage, RoomNote } from '@watchlink/shared';
import { Chat } from './Chat';
import { NotesPanel } from './NotesPanel';
import { TabButton } from '@/components/ui/TabButton';
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 border-b border-surface-border" role="tablist">
        <TabButton
          active={tab === 'chat'}
          icon={MessageSquare}
          count={props.messages.length}
          onClick={() => setTab('chat')}
        >
          Chat
        </TabButton>
        <TabButton
          active={tab === 'notes'}
          icon={StickyNote}
          count={props.notes.length}
          onClick={() => setTab('notes')}
        >
          Notes
        </TabButton>
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

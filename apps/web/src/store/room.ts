'use client';

import { create } from 'zustand';
import type {
  ChatMessage,
  Participant,
  PlayerState,
  PublicRoom,
  ReactionEvent,
  RoomNote,
} from '@watchlink/shared';

/** A reaction enriched with a client-side horizontal position for the float animation. */
export interface FloatingReaction extends ReactionEvent {
  /** Horizontal offset within the overlay, 0–100 (%). */
  x: number;
}

/** Cap concurrent floating emojis so a burst can't grow the array unbounded. */
const MAX_FLOATING_REACTIONS = 60;

export type RoomStatus =
  | 'idle'
  | 'connecting'
  | 'joining'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'kicked'
  | 'closed';

interface RoomState {
  status: RoomStatus;
  selfId: string | null;
  room: PublicRoom | null;
  participants: Participant[];
  messages: ChatMessage[];
  notes: RoomNote[];
  /** In-flight floating reactions; each removes itself once its animation ends. */
  reactions: FloatingReaction[];
  error: string | null;
  /** Bumped on every incoming player update so the player can reconcile. */
  playerVersion: number;

  setStatus: (status: RoomStatus) => void;
  applyPlayer: (player: PlayerState) => void;
  setNotes: (notes: RoomNote[]) => void;
  addNote: (note: RoomNote) => void;
  removeNote: (noteId: string) => void;
  setSelf: (selfId: string) => void;
  setRoom: (room: PublicRoom) => void;
  patchRoom: (patch: Partial<PublicRoom>) => void;
  setParticipants: (participants: Participant[]) => void;
  setParticipantSpeaking: (userId: string, speaking: boolean) => void;
  setParticipantMuted: (userId: string, muted: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  removeMessage: (messageId: string) => void;
  addReaction: (reaction: ReactionEvent) => void;
  removeReaction: (reactionId: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initial = {
  status: 'idle' as RoomStatus,
  selfId: null,
  room: null,
  participants: [],
  messages: [],
  notes: [],
  reactions: [],
  error: null,
  playerVersion: 0,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initial,
  setStatus: (status) => set({ status }),
  applyPlayer: (player) =>
    set((s) => (s.room ? { room: { ...s.room, player }, playerVersion: s.playerVersion + 1 } : {})),
  setNotes: (notes) => set({ notes: [...notes].sort((a, b) => a.time - b.time) }),
  addNote: (note) =>
    set((s) =>
      s.notes.some((n) => n.id === note.id)
        ? {}
        : { notes: [...s.notes, note].sort((a, b) => a.time - b.time) },
    ),
  removeNote: (noteId) => set((s) => ({ notes: s.notes.filter((n) => n.id !== noteId) })),
  setSelf: (selfId) => set({ selfId }),
  setRoom: (room) => set({ room }),
  patchRoom: (patch) => set((s) => (s.room ? { room: { ...s.room, ...patch } } : {})),
  setParticipants: (participants) => set({ participants }),
  setParticipantSpeaking: (userId, speaking) =>
    set((s) => ({
      participants: s.participants.map((p) =>
        p.userId === userId ? { ...p, isSpeaking: speaking } : p,
      ),
    })),
  setParticipantMuted: (userId, muted) =>
    set((s) => ({
      participants: s.participants.map((p) => (p.userId === userId ? { ...p, isMuted: muted } : p)),
    })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((s) => (s.messages.some((m) => m.id === message.id) ? {} : { messages: [...s.messages, message] })),
  removeMessage: (messageId) => set((s) => ({ messages: s.messages.filter((m) => m.id !== messageId) })),
  addReaction: (reaction) =>
    set((s) =>
      s.reactions.some((r) => r.id === reaction.id)
        ? {}
        : {
            reactions: [
              ...s.reactions.slice(-(MAX_FLOATING_REACTIONS - 1)),
              { ...reaction, x: 8 + Math.random() * 84 },
            ],
          },
    ),
  removeReaction: (reactionId) => set((s) => ({ reactions: s.reactions.filter((r) => r.id !== reactionId) })),
  setError: (error) => set({ error }),
  reset: () => set({ ...initial }),
}));

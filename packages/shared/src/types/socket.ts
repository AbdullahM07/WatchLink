import type { ApiResponse } from './api';
import type { ChatMessage, ReactionEmoji, ReactionEvent, RoomNote } from './chat';
import type { Participant, PublicRoom } from './room';
import type { PlayerState, QueueItem } from './player';

/**
 * Socket.IO event contracts shared by client and server.
 * Implemented incrementally across phases 2–4; the full surface is declared here
 * so both sides type-check against one source of truth.
 */

// --- Generic ack ------------------------------------------------------------
export type Ack<T = unknown> = (response: ApiResponse<T>) => void;

// --- Auth handshake (sent via socket.handshake.auth) ------------------------
export interface SocketAuth {
  /** JWT for registered users (optional for guests). */
  token?: string;
  /** Guest display name when no token is provided. */
  guestName?: string;
}

// --- Payloads ---------------------------------------------------------------
export interface JoinRoomPayload {
  roomCode: string;
  password?: string;
}

export interface MediaChangePayload {
  roomCode: string;
  url: string;
}

export interface QueueAddPayload {
  roomCode: string;
  url: string;
}

export interface QueueRemovePayload {
  roomCode: string;
  id: string;
}

export interface PlayerPlayPayload {
  roomCode: string;
  currentTime: number;
}

export interface PlayerPausePayload {
  roomCode: string;
  currentTime: number;
}

export interface PlayerSeekPayload {
  roomCode: string;
  currentTime: number;
}

export interface ChatSendPayload {
  roomCode: string;
  text: string;
}

export interface NoteAddPayload {
  roomCode: string;
  time: number;
  text: string;
}

export interface ReactionSendPayload {
  roomCode: string;
  emoji: ReactionEmoji;
}

export interface HostActionPayload {
  roomCode: string;
  targetUserId: string;
}

// --- Voice / WebRTC signaling (phase 4) -------------------------------------
export interface VoiceSignalPayload {
  roomCode: string;
  /** Target peer's userId. */
  to: string;
  /** SDP or ICE candidate payload. Kept opaque on the wire. */
  data: unknown;
}

export interface VoiceSpeakingPayload {
  roomCode: string;
  speaking: boolean;
}

export interface VoiceMuteStatePayload {
  roomCode: string;
  muted: boolean;
}

// --- Server -> Client -------------------------------------------------------
export interface ServerToClientEvents {
  /** Sent right after connection so the client knows its trusted identity. */
  session: (payload: { userId: string; name: string; isGuest: boolean }) => void;

  'room:state': (room: PublicRoom) => void;
  'participant:list': (participants: Participant[]) => void;
  'participant:joined': (participant: Participant) => void;
  'participant:left': (payload: { userId: string }) => void;
  'room:locked': (payload: { isLocked: boolean }) => void;
  'room:host-changed': (payload: { hostId: string }) => void;
  'room:kicked': (payload: { reason: string }) => void;
  'room:closed': (payload: { reason: string }) => void;

  'media:changed': (player: PlayerState) => void;
  'player:sync-state': (player: PlayerState) => void;
  'queue:list': (items: QueueItem[]) => void;

  'chat:message': (message: ChatMessage) => void;
  'chat:history': (messages: ChatMessage[]) => void;
  'chat:deleted': (payload: { messageId: string }) => void;
  'reaction:received': (reaction: ReactionEvent) => void;

  'note:added': (note: RoomNote) => void;
  'note:list': (notes: RoomNote[]) => void;
  'note:deleted': (payload: { noteId: string }) => void;
  'control:changed': (payload: { userId: string; canControl: boolean }) => void;

  // Voice
  'voice:peer-joined': (payload: { userId: string }) => void;
  'voice:peer-left': (payload: { userId: string }) => void;
  'voice:offer': (payload: { from: string; data: unknown }) => void;
  'voice:answer': (payload: { from: string; data: unknown }) => void;
  'voice:ice-candidate': (payload: { from: string; data: unknown }) => void;
  'voice:speaking': (payload: { userId: string; speaking: boolean }) => void;
  'voice:mute-state': (payload: { userId: string; muted: boolean }) => void;

  error: (payload: { message: string; code?: string }) => void;
}

// --- Client -> Server -------------------------------------------------------
export interface ClientToServerEvents {
  'room:join': (payload: JoinRoomPayload, ack: Ack<PublicRoom>) => void;
  'room:leave': (payload: { roomCode: string }) => void;
  'room:delete': (payload: { roomCode: string }, ack: Ack) => void;
  'room:lock': (payload: { roomCode: string; isLocked: boolean }, ack: Ack) => void;
  'room:kick': (payload: HostActionPayload, ack: Ack) => void;
  'room:host-transfer': (payload: HostActionPayload, ack: Ack) => void;
  'room:grant-control': (payload: HostActionPayload, ack: Ack) => void;
  'room:revoke-control': (payload: HostActionPayload, ack: Ack) => void;

  'media:change': (payload: MediaChangePayload, ack: Ack<PlayerState>) => void;
  /** Clear the current media — returns the room to the empty "nothing playing" stage. */
  'media:clear': (payload: { roomCode: string }, ack: Ack<PlayerState>) => void;
  'queue:add': (payload: QueueAddPayload, ack: Ack<QueueItem>) => void;
  'queue:remove': (payload: QueueRemovePayload, ack: Ack) => void;
  'queue:next': (payload: { roomCode: string }, ack: Ack<PlayerState>) => void;
  /** Step back to the previously-played item, re-queueing the current one. */
  'queue:previous': (payload: { roomCode: string }, ack: Ack<PlayerState>) => void;
  'player:play': (payload: PlayerPlayPayload) => void;
  'player:pause': (payload: PlayerPausePayload) => void;
  'player:seek': (payload: PlayerSeekPayload) => void;
  'player:sync-request': (payload: { roomCode: string }) => void;

  'chat:message': (payload: ChatSendPayload) => void;
  'chat:delete': (payload: { roomCode: string; messageId: string }) => void;
  'reaction:send': (payload: ReactionSendPayload) => void;

  'note:add': (payload: NoteAddPayload, ack: Ack<RoomNote>) => void;
  'note:delete': (payload: { roomCode: string; noteId: string }) => void;

  // Voice
  'voice:join': (payload: { roomCode: string }, ack: Ack<{ peers: string[] }>) => void;
  'voice:leave': (payload: { roomCode: string }) => void;
  'voice:offer': (payload: VoiceSignalPayload) => void;
  'voice:answer': (payload: VoiceSignalPayload) => void;
  'voice:ice-candidate': (payload: VoiceSignalPayload) => void;
  'voice:speaking': (payload: VoiceSpeakingPayload) => void;
  'voice:mute-state': (payload: VoiceMuteStatePayload) => void;
}

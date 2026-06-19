import type { ROOM_VISIBILITY } from '../constants';
import type { PlayerState } from './player';

export type RoomVisibility = (typeof ROOM_VISIBILITY)[number];

/** A participant currently connected to a room (runtime, not persisted as-is). */
export interface Participant {
  userId: string;
  name: string;
  avatar: string | null;
  isGuest: boolean;
  isHost: boolean;
  /** Whether the host has granted this participant playback/media control. */
  canControl: boolean;
  /** Whether this participant currently has their PTT mic open. */
  isSpeaking: boolean;
  /** Whether this participant has self-muted their voice broadcast. */
  isMuted: boolean;
  joinedAt: string;
}

/**
 * Public room shape returned by the API / socket. No password hashes.
 */
export interface PublicRoom {
  roomCode: string;
  name: string;
  hostId: string;
  isPrivate: boolean;
  hasPassword: boolean;
  isLocked: boolean;
  maxParticipants: number;
  player: PlayerState;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

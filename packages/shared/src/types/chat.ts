import type { REACTIONS } from '../constants';

export type ReactionEmoji = (typeof REACTIONS)[number];

export interface ChatMessage {
  id: string;
  roomCode: string;
  userId: string;
  name: string;
  avatar: string | null;
  text: string;
  createdAt: string;
}

export interface ReactionEvent {
  id: string;
  userId: string;
  name: string;
  emoji: ReactionEmoji;
  createdAt: string;
}

/** A note pinned to a specific moment in the video. Any participant can add one. */
export interface RoomNote {
  id: string;
  roomCode: string;
  userId: string;
  name: string;
  avatar: string | null;
  /** Playback position in seconds the note refers to. */
  time: number;
  text: string;
  createdAt: string;
}

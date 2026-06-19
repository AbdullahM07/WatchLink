import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  PLAYER_STATUSES,
  PROVIDERS,
  VIEWING_MODES,
  type PlayerState,
  type Provider,
  type PlayerStatus,
  type PublicRoom,
  type ViewingMode,
} from '@watchlink/shared';

/** Embedded authoritative player state (the host is the source of truth). */
export interface PlayerSubdoc {
  mediaUrl: string | null;
  provider: Provider;
  mode: ViewingMode;
  status: PlayerStatus;
  currentTime: number;
  playbackRate: number;
  serverTimestamp: number;
  updatedBy: string | null;
}

export interface RoomDoc {
  roomCode: string;
  name: string;
  hostId: string;
  isPrivate: boolean;
  passwordHash: string | null;
  isLocked: boolean;
  maxParticipants: number;
  player: PlayerSubdoc;
  /** Registered users who have joined — powers "your rooms" on the dashboard. */
  members: string[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface RoomMethods {
  verifyPassword(candidate: string): Promise<boolean>;
  toPublic(participantCount: number): PublicRoom;
}

export type RoomModel = Model<RoomDoc, Record<string, never>, RoomMethods>;
export type RoomDocument = HydratedDocument<RoomDoc, RoomMethods>;

const playerSchema = new Schema<PlayerSubdoc>(
  {
    mediaUrl: { type: String, default: null },
    provider: { type: String, enum: PROVIDERS, default: 'unsupported' },
    mode: { type: String, enum: VIEWING_MODES, default: 'cinema' },
    status: { type: String, enum: PLAYER_STATUSES, default: 'paused' },
    currentTime: { type: Number, default: 0 },
    playbackRate: { type: Number, default: 1 },
    serverTimestamp: { type: Number, default: () => Date.now() },
    updatedBy: { type: String, default: null },
  },
  { _id: false },
);

const roomSchema = new Schema<RoomDoc, RoomModel, RoomMethods>(
  {
    roomCode: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    hostId: { type: String, required: true, index: true },
    isPrivate: { type: Boolean, default: false },
    passwordHash: { type: String, default: null, select: false },
    isLocked: { type: Boolean, default: false },
    maxParticipants: { type: Number, default: 20, min: 2 },
    player: { type: playerSchema, default: () => ({}) },
    members: { type: [String], default: [] },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL index — Mongo removes the room shortly after expiresAt passes.
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

roomSchema.methods.verifyPassword = function (candidate: string): Promise<boolean> {
  if (!this.passwordHash) return Promise.resolve(true);
  return bcrypt.compare(candidate, this.passwordHash);
};

roomSchema.methods.toPublic = function (participantCount: number): PublicRoom {
  const player: PlayerState = {
    mediaUrl: this.player.mediaUrl,
    provider: this.player.provider,
    mode: this.player.mode,
    status: this.player.status,
    currentTime: this.player.currentTime,
    playbackRate: this.player.playbackRate,
    serverTimestamp: this.player.serverTimestamp,
    updatedBy: this.player.updatedBy,
  };
  return {
    roomCode: this.roomCode,
    name: this.name,
    hostId: this.hostId,
    isPrivate: this.isPrivate,
    hasPassword: Boolean(this.passwordHash),
    isLocked: this.isLocked,
    maxParticipants: this.maxParticipants,
    player,
    participantCount,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
    expiresAt: this.expiresAt.toISOString(),
  };
};

export const Room = model<RoomDoc, RoomModel>('Room', roomSchema);

export function hashRoomPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

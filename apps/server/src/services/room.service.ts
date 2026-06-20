import type { CreateRoomInput, UpdateRoomInput } from '@watchlink/shared';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { generateRoomCode } from '../utils/roomCode';
import { Room, hashRoomPassword, type RoomDocument } from '../models/Room';

/** Compute a fresh expiry timestamp from now. */
function nextExpiry(): Date {
  return new Date(Date.now() + env.ROOM_EXPIRATION_HOURS * 60 * 60 * 1000);
}

/** Generate a room code that isn't already taken (retries on the rare collision). */
async function uniqueRoomCode(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const code = generateRoomCode();
    const exists = await Room.exists({ roomCode: code });
    if (!exists) return code;
  }
  throw ApiError.internal('Could not allocate a room code, please retry', 'CODE_ALLOC');
}

export async function createRoom(hostId: string, input: CreateRoomInput): Promise<RoomDocument> {
  const roomCode = await uniqueRoomCode();
  const maxParticipants = Math.min(input.maxParticipants, env.MAX_ROOM_PARTICIPANTS);

  const passwordHash =
    input.isPrivate && input.password ? await hashRoomPassword(input.password) : null;

  const room = await Room.create({
    roomCode,
    name: input.name,
    hostId,
    isPrivate: input.isPrivate,
    passwordHash,
    maxParticipants,
    members: [hostId],
    expiresAt: nextExpiry(),
  });

  return room;
}

/** Fetch a room by code or throw 404. Optionally includes the password hash. */
export async function getRoomByCode(roomCode: string, withSecret = false): Promise<RoomDocument> {
  const query = Room.findOne({ roomCode: roomCode.toUpperCase() });
  if (withSecret) query.select('+passwordHash');
  const room = await query;
  if (!room) throw ApiError.notFound('Room not found', 'ROOM_NOT_FOUND');
  return room;
}

export async function updateRoom(
  roomCode: string,
  userId: string,
  input: UpdateRoomInput,
): Promise<RoomDocument> {
  const room = await getRoomByCode(roomCode);
  if (room.hostId !== userId) {
    throw ApiError.forbidden('Only the host can update this room', 'NOT_HOST');
  }
  if (input.name !== undefined) room.name = input.name;
  if (input.isLocked !== undefined) room.isLocked = input.isLocked;
  if (input.maxParticipants !== undefined) {
    room.maxParticipants = Math.min(input.maxParticipants, env.MAX_ROOM_PARTICIPANTS);
  }
  await room.save();
  return room;
}

export async function deleteRoom(roomCode: string, userId: string): Promise<void> {
  const room = await getRoomByCode(roomCode);
  if (room.hostId !== userId) {
    throw ApiError.forbidden('Only the host can delete this room', 'NOT_HOST');
  }
  await room.deleteOne();
}

/** Rooms the user hosts or has joined (for the dashboard). */
export async function listMyRooms(userId: string): Promise<RoomDocument[]> {
  return Room.find({ $or: [{ hostId: userId }, { members: userId }] })
    .sort({ updatedAt: -1 })
    .limit(12);
}

/**
 * Public rooms anyone can browse and join from the landing page.
 * Private rooms are intentionally excluded — they're only reachable by code.
 */
export async function listPublicRooms(): Promise<RoomDocument[]> {
  return Room.find({ isPrivate: false })
    .sort({ updatedAt: -1 })
    .limit(24);
}

/** Push the room's expiry forward (called on activity like joins). */
export async function touchRoom(roomCode: string): Promise<void> {
  await Room.updateOne({ roomCode }, { $set: { expiresAt: nextExpiry() } });
}

/** Record a registered member so it shows up in their room list. */
export async function addMember(roomCode: string, userId: string): Promise<void> {
  await Room.updateOne({ roomCode }, { $addToSet: { members: userId } });
}

/** Durably persist the player state so it survives an empty room / rejoin. */
export async function persistPlayer(
  roomCode: string,
  player: import('@watchlink/shared').PlayerState,
): Promise<void> {
  await Room.updateOne({ roomCode }, { $set: { player } });
}

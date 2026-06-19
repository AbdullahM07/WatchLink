import type { Request, Response } from 'express';
import type { CreateRoomInput, JoinRoomInput, UpdateRoomInput } from '@watchlink/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { presence } from '../realtime/presence';
import {
  createRoom,
  deleteRoom,
  getRoomByCode,
  listMyRooms,
  updateRoom,
} from '../services/room.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const room = await createRoom(req.auth!.sub, req.body as CreateRoomInput);
  sendSuccess(res, room.toPublic(presence.distinctUserCount(room.roomCode)), 'Room created', 201);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const room = await getRoomByCode(req.params.roomCode!);
  sendSuccess(res, room.toPublic(presence.distinctUserCount(room.roomCode)), 'OK');
});

/**
 * Pre-flight access check before connecting the socket: validates the room
 * exists, isn't locked, has room, and the password matches (if any).
 */
export const checkJoin = asyncHandler(async (req: Request, res: Response) => {
  const room = await getRoomByCode(req.params.roomCode!, true);
  const { password } = req.body as JoinRoomInput;

  if (room.isLocked) throw ApiError.forbidden('This room is locked', 'ROOM_LOCKED');

  if (room.passwordHash) {
    const ok = password ? await room.verifyPassword(password) : false;
    if (!ok) throw ApiError.unauthorized('Incorrect room password', 'BAD_ROOM_PASSWORD');
  }

  const count = presence.distinctUserCount(room.roomCode);
  if (count >= room.maxParticipants) {
    throw ApiError.forbidden('This room is full', 'ROOM_FULL');
  }

  sendSuccess(res, room.toPublic(count), 'Access granted');
});

export const patch = asyncHandler(async (req: Request, res: Response) => {
  const room = await updateRoom(req.params.roomCode!, req.auth!.sub, req.body as UpdateRoomInput);
  sendSuccess(res, room.toPublic(presence.distinctUserCount(room.roomCode)), 'Room updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await deleteRoom(req.params.roomCode!, req.auth!.sub);
  sendSuccess(res, null, 'Room deleted');
});

export const mine = asyncHandler(async (req: Request, res: Response) => {
  const rooms = await listMyRooms(req.auth!.sub);
  sendSuccess(
    res,
    { rooms: rooms.map((r) => r.toPublic(presence.distinctUserCount(r.roomCode))) },
    'OK',
  );
});

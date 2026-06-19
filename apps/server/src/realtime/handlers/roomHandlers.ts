import type {
  Ack,
  ApiResponse,
  HostActionPayload,
  JoinRoomPayload,
  PlayerState,
  PublicRoom,
} from '@watchlink/shared';
import { logger } from '../../config/logger';
import { addMember, getRoomByCode, touchRoom } from '../../services/room.service';
import { getHistory } from '../../services/chat.service';
import { listNotes } from '../../services/note.service';
import { Room } from '../../models/Room';
import { presence } from '../presence';
import { dropPlayer, hasPlayer, setPlayer, snapshot } from '../playerStore';
import {
  clearRoom as clearGrants,
  grantControl,
  grantedIds,
  hasControl,
  revokeControl,
} from '../controlStore';
import type { AppServer, AppSocket } from '../types';

function ok<T>(ack: Ack<T> | undefined, data: T, message = 'OK'): void {
  ack?.({ success: true, message, data } satisfies ApiResponse<T>);
}
function fail<T>(ack: Ack<T> | undefined, message: string): void {
  ack?.({ success: false, message, data: null });
}

/** Broadcast the deduplicated participant list to everyone in the room. */
export function broadcastParticipants(io: AppServer, roomCode: string, hostId: string): void {
  io.to(roomCode).emit(
    'participant:list',
    presence.listParticipants(roomCode, hostId, grantedIds(roomCode)),
  );
}

/**
 * Remove a socket from a room (used by room:leave, kick, and disconnect).
 * Handles host reassignment when the host leaves while others remain.
 */
export async function leaveRoom(io: AppServer, socket: AppSocket, roomCode: string): Promise<void> {
  const removed = presence.remove(socket.id);
  socket.leave(roomCode);
  if (!removed) return;

  const { entry } = removed;
  // Only announce a full "left" once the user has no other sockets in the room.
  const stillConnected = presence.has(roomCode, entry.userId);
  if (!stillConnected) {
    io.to(roomCode).emit('participant:left', { userId: entry.userId });
  }

  // Room is now empty — drop the in-memory player + control grants
  // (DB copies persist for rejoin).
  if (presence.distinctUserCount(roomCode) === 0) {
    dropPlayer(roomCode);
    clearGrants(roomCode);
  }

  const room = await Room.findOne({ roomCode });
  if (!room) return;

  // Host left and the room still has people → promote the earliest remaining user.
  if (room.hostId === entry.userId && !stillConnected) {
    const remaining = presence.listParticipants(roomCode, room.hostId);
    const next = remaining[0];
    if (next) {
      room.hostId = next.userId;
      await room.save();
      io.to(roomCode).emit('room:host-changed', { hostId: next.userId });
    }
  }
  broadcastParticipants(io, roomCode, room.hostId);
}

export function registerRoomHandlers(io: AppServer, socket: AppSocket): void {
  const me = socket.data.identity;

  socket.on('room:join', async (payload: JoinRoomPayload, ack: Ack<PublicRoom>) => {
    try {
      const roomCode = String(payload.roomCode ?? '').toUpperCase();
      const room = await getRoomByCode(roomCode, true);

      const alreadyHere = presence.has(roomCode, me.id);

      if (room.isLocked && room.hostId !== me.id && !alreadyHere) {
        return fail(ack, 'This room is locked');
      }
      if (room.passwordHash && room.hostId !== me.id && !alreadyHere) {
        const valid = payload.password ? await room.verifyPassword(payload.password) : false;
        if (!valid) return fail(ack, 'Incorrect room password');
      }
      if (!alreadyHere && presence.distinctUserCount(roomCode) >= room.maxParticipants) {
        return fail(ack, 'This room is full');
      }

      socket.join(roomCode);
      presence.add(roomCode, {
        socketId: socket.id,
        userId: me.id,
        name: me.name,
        avatar: me.avatar,
        isGuest: me.isGuest,
        isSpeaking: false,
        isMuted: false,
        joinedAt: Date.now(),
      });

      if (!me.isGuest) {
        await addMember(roomCode, me.id);
      }
      await touchRoom(roomCode);

      const publicRoom = room.toPublic(presence.distinctUserCount(roomCode));
      ok(ack, publicRoom, 'Joined');

      // Bootstrap the joining socket, then tell the room.
      socket.emit('room:state', publicRoom);
      socket.emit('chat:history', await getHistory(roomCode));
      socket.emit('note:list', await listNotes(roomCode));

      // Hydrate the in-memory player from the DB on first join, then send the
      // joining socket a fresh playback snapshot so it lands in sync.
      if (!hasPlayer(roomCode) && room.player?.mediaUrl) {
        setPlayer(roomCode, room.player as PlayerState);
      }
      const playerSnap = snapshot(roomCode);
      if (playerSnap?.mediaUrl) socket.emit('player:sync-state', playerSnap);

      socket.to(roomCode).emit('participant:joined', {
        userId: me.id,
        name: me.name,
        avatar: me.avatar,
        isGuest: me.isGuest,
        isHost: room.hostId === me.id,
        canControl: room.hostId === me.id || hasControl(roomCode, me.id),
        isSpeaking: false,
        isMuted: false,
        joinedAt: new Date().toISOString(),
      });
      broadcastParticipants(io, roomCode, room.hostId);
    } catch (err) {
      logger.warn({ err }, 'room:join failed');
      fail(ack, err instanceof Error ? err.message : 'Could not join room');
    }
  });

  socket.on('room:leave', async ({ roomCode }) => {
    await leaveRoom(io, socket, String(roomCode).toUpperCase());
  });

  socket.on('room:lock', async ({ roomCode, isLocked }, ack) => {
    try {
      const code = String(roomCode).toUpperCase();
      const room = await getRoomByCode(code);
      if (room.hostId !== me.id) return fail(ack, 'Only the host can lock the room');
      room.isLocked = Boolean(isLocked);
      await room.save();
      io.to(code).emit('room:locked', { isLocked: room.isLocked });
      ok(ack, null, 'Room updated');
    } catch (err) {
      fail(ack, err instanceof Error ? err.message : 'Failed to update room');
    }
  });

  socket.on('room:kick', async ({ roomCode, targetUserId }: HostActionPayload, ack) => {
    try {
      const code = String(roomCode).toUpperCase();
      const room = await getRoomByCode(code);
      if (room.hostId !== me.id) return fail(ack, 'Only the host can remove participants');
      if (targetUserId === me.id) return fail(ack, 'You cannot remove yourself');

      const sockets = presence.socketIdsForUser(code, targetUserId);
      for (const sid of sockets) {
        const target = io.sockets.sockets.get(sid) as AppSocket | undefined;
        if (!target) continue;
        target.emit('room:kicked', { reason: 'You were removed by the host' });
        presence.remove(sid);
        target.leave(code);
      }
      io.to(code).emit('participant:left', { userId: targetUserId });
      broadcastParticipants(io, code, room.hostId);
      ok(ack, null, 'Participant removed');
    } catch (err) {
      fail(ack, err instanceof Error ? err.message : 'Failed to remove participant');
    }
  });

  socket.on('room:host-transfer', async ({ roomCode, targetUserId }: HostActionPayload, ack) => {
    try {
      const code = String(roomCode).toUpperCase();
      const room = await getRoomByCode(code);
      if (room.hostId !== me.id) return fail(ack, 'Only the host can transfer host');
      if (!presence.has(code, targetUserId)) return fail(ack, 'That user is not in the room');

      room.hostId = targetUserId;
      await room.save();
      io.to(code).emit('room:host-changed', { hostId: targetUserId });
      broadcastParticipants(io, code, room.hostId);
      ok(ack, null, 'Host transferred');
    } catch (err) {
      fail(ack, err instanceof Error ? err.message : 'Failed to transfer host');
    }
  });

  socket.on('room:grant-control', async ({ roomCode, targetUserId }: HostActionPayload, ack) => {
    try {
      const code = String(roomCode).toUpperCase();
      const room = await getRoomByCode(code);
      if (room.hostId !== me.id) return fail(ack, 'Only the host can grant control');
      if (!presence.has(code, targetUserId)) return fail(ack, 'That user is not in the room');
      grantControl(code, targetUserId);
      io.to(code).emit('control:changed', { userId: targetUserId, canControl: true });
      broadcastParticipants(io, code, room.hostId);
      ok(ack, null, 'Control granted');
    } catch (err) {
      fail(ack, err instanceof Error ? err.message : 'Failed to grant control');
    }
  });

  socket.on('room:revoke-control', async ({ roomCode, targetUserId }: HostActionPayload, ack) => {
    try {
      const code = String(roomCode).toUpperCase();
      const room = await getRoomByCode(code);
      if (room.hostId !== me.id) return fail(ack, 'Only the host can revoke control');
      revokeControl(code, targetUserId);
      io.to(code).emit('control:changed', { userId: targetUserId, canControl: false });
      broadcastParticipants(io, code, room.hostId);
      ok(ack, null, 'Control revoked');
    } catch (err) {
      fail(ack, err instanceof Error ? err.message : 'Failed to revoke control');
    }
  });
}

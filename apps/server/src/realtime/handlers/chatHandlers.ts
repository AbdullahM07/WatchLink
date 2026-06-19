import {
  CHAT_RATE_LIMIT,
  chatMessageSchema,
  type ChatSendPayload,
} from '@watchlink/shared';
import { getRoomByCode } from '../../services/room.service';
import { deleteMessage, saveMessage } from '../../services/chat.service';
import { allow } from '../rateLimiter';
import type { AppServer, AppSocket } from '../types';

export function registerChatHandlers(io: AppServer, socket: AppSocket): void {
  const me = socket.data.identity;

  socket.on('chat:message', async (payload: ChatSendPayload) => {
    const roomCode = String(payload?.roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(roomCode)) {
      return socket.emit('error', { message: 'Join the room before chatting', code: 'NOT_IN_ROOM' });
    }
    if (!allow(`${socket.id}:chat`, CHAT_RATE_LIMIT.points, CHAT_RATE_LIMIT.durationMs)) {
      return socket.emit('error', { message: 'You are sending messages too fast', code: 'RATE_LIMITED' });
    }

    const parsed = chatMessageSchema.safeParse({ text: payload?.text });
    if (!parsed.success) {
      return socket.emit('error', {
        message: parsed.error.issues[0]?.message ?? 'Invalid message',
        code: 'INVALID_MESSAGE',
      });
    }

    try {
      const message = await saveMessage(
        roomCode,
        { userId: me.id, name: me.name, avatar: me.avatar },
        parsed.data.text,
      );
      io.to(roomCode).emit('chat:message', message);
    } catch {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('chat:delete', async ({ roomCode, messageId }) => {
    const code = String(roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(code)) return;
    try {
      const room = await getRoomByCode(code);
      const isHost = room.hostId === me.id;
      await deleteMessage(String(messageId), me.id, isHost);
      io.to(code).emit('chat:deleted', { messageId: String(messageId) });
    } catch (err) {
      socket.emit('error', {
        message: err instanceof Error ? err.message : 'Failed to delete message',
      });
    }
  });
}

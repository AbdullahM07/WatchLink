import {
  NOTE_RATE_LIMIT,
  noteSchema,
  type Ack,
  type NoteAddPayload,
  type RoomNote,
} from '@watchlink/shared';
import { getRoomByCode } from '../../services/room.service';
import { deleteNote, saveNote } from '../../services/note.service';
import { allow } from '../rateLimiter';
import type { AppServer, AppSocket } from '../types';

function failAck<T>(ack: Ack<T> | undefined, message: string): void {
  ack?.({ success: false, message, data: null });
}

export function registerNoteHandlers(io: AppServer, socket: AppSocket): void {
  const me = socket.data.identity;

  // Any participant (including guests / non-controllers) may add a note.
  socket.on('note:add', async (payload: NoteAddPayload, ack: Ack<RoomNote>) => {
    const code = String(payload?.roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(code)) return failAck(ack, 'Join the room first');
    if (!allow(`${socket.id}:note`, NOTE_RATE_LIMIT.points, NOTE_RATE_LIMIT.durationMs)) {
      return failAck(ack, 'You are adding notes too fast');
    }
    const parsed = noteSchema.safeParse({ time: payload?.time, text: payload?.text });
    if (!parsed.success) {
      return failAck(ack, parsed.error.issues[0]?.message ?? 'Invalid note');
    }
    try {
      const note = await saveNote(
        code,
        { userId: me.id, name: me.name, avatar: me.avatar },
        parsed.data.time,
        parsed.data.text,
      );
      ack?.({ success: true, message: 'Note added', data: note });
      io.to(code).emit('note:added', note);
    } catch {
      failAck(ack, 'Failed to add note');
    }
  });

  socket.on('note:delete', async ({ roomCode, noteId }) => {
    const code = String(roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(code)) return;
    try {
      const room = await getRoomByCode(code);
      const isHost = room.hostId === me.id;
      await deleteNote(String(noteId), me.id, isHost);
      io.to(code).emit('note:deleted', { noteId: String(noteId) });
    } catch (err) {
      socket.emit('error', {
        message: err instanceof Error ? err.message : 'Failed to delete note',
      });
    }
  });
}

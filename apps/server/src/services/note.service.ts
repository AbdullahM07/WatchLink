import { NOTE_HISTORY_LIMIT, type RoomNote as RoomNoteDTO } from '@watchlink/shared';
import { ApiError } from '../utils/ApiError';
import { RoomNote } from '../models/RoomNote';

export interface NoteAuthor {
  userId: string;
  name: string;
  avatar: string | null;
}

export async function saveNote(
  roomCode: string,
  author: NoteAuthor,
  time: number,
  text: string,
): Promise<RoomNoteDTO> {
  const doc = await RoomNote.create({
    roomCode,
    userId: author.userId,
    name: author.name,
    avatar: author.avatar,
    time,
    text,
  });
  return doc.toDTO();
}

/** Notes for a room, ordered by their timestamp in the video. */
export async function listNotes(roomCode: string): Promise<RoomNoteDTO[]> {
  const docs = await RoomNote.find({ roomCode }).sort({ time: 1 }).limit(NOTE_HISTORY_LIMIT);
  return docs.map((d) => d.toDTO());
}

/** Delete a note. Allowed for the note's author or the room host. */
export async function deleteNote(
  noteId: string,
  requesterId: string,
  isHost: boolean,
): Promise<void> {
  const note = await RoomNote.findById(noteId);
  if (!note) throw ApiError.notFound('Note not found', 'NOTE_NOT_FOUND');
  if (!isHost && note.userId !== requesterId) {
    throw ApiError.forbidden('You can only delete your own notes', 'NOT_OWNER');
  }
  await note.deleteOne();
}

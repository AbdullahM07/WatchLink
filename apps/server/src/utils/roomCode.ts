import { customAlphabet } from 'nanoid';
import { ROOM_CODE_LENGTH } from '@watchlink/shared';

// Unambiguous alphabet (no 0/O/1/I/L) — easy to read aloud and type.
const nano = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', ROOM_CODE_LENGTH);

export function generateRoomCode(): string {
  return nano();
}

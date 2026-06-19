import { CHAT_HISTORY_LIMIT, type ChatMessage as ChatMessageDTO } from '@watchlink/shared';
import { ApiError } from '../utils/ApiError';
import { ChatMessage } from '../models/ChatMessage';

export interface ChatAuthor {
  userId: string;
  name: string;
  avatar: string | null;
}

/** Persist a chat message and return its DTO. */
export async function saveMessage(
  roomCode: string,
  author: ChatAuthor,
  text: string,
): Promise<ChatMessageDTO> {
  const doc = await ChatMessage.create({
    roomCode,
    userId: author.userId,
    name: author.name,
    avatar: author.avatar,
    text,
  });
  return doc.toDTO();
}

/** Return the most recent messages for a room, oldest-first for display. */
export async function getHistory(roomCode: string): Promise<ChatMessageDTO[]> {
  const docs = await ChatMessage.find({ roomCode })
    .sort({ createdAt: -1 })
    .limit(CHAT_HISTORY_LIMIT);
  return docs.reverse().map((d) => d.toDTO());
}

/**
 * Delete a message. Allowed for the message author or the room host.
 * Returns the roomCode so the caller can broadcast the deletion.
 */
export async function deleteMessage(
  messageId: string,
  requesterId: string,
  isHost: boolean,
): Promise<void> {
  const msg = await ChatMessage.findById(messageId);
  if (!msg) throw ApiError.notFound('Message not found', 'MSG_NOT_FOUND');
  if (!isHost && msg.userId !== requesterId) {
    throw ApiError.forbidden('You can only delete your own messages', 'NOT_OWNER');
  }
  await msg.deleteOne();
}

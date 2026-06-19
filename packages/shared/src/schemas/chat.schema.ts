import { z } from 'zod';
import { MAX_CHAT_LENGTH, MAX_NOTE_LENGTH, REACTIONS } from '../constants';

export const chatMessageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(MAX_CHAT_LENGTH, `Message must be at most ${MAX_CHAT_LENGTH} characters`),
});

export const reactionSchema = z.object({
  emoji: z.enum(REACTIONS),
});

export const noteSchema = z.object({
  time: z.number().min(0).max(24 * 60 * 60),
  text: z
    .string()
    .trim()
    .min(1, 'Note cannot be empty')
    .max(MAX_NOTE_LENGTH, `Note must be at most ${MAX_NOTE_LENGTH} characters`),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type NoteInput = z.infer<typeof noteSchema>;

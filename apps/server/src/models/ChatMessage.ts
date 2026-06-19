import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import type { ChatMessage as ChatMessageDTO } from '@watchlink/shared';

export interface ChatMessageDoc {
  roomCode: string;
  userId: string;
  name: string;
  avatar: string | null;
  text: string;
  createdAt: Date;
}

export interface ChatMessageMethods {
  toDTO(): ChatMessageDTO;
}

export type ChatMessageModel = Model<ChatMessageDoc, Record<string, never>, ChatMessageMethods>;
export type ChatMessageDocument = HydratedDocument<ChatMessageDoc, ChatMessageMethods>;

const chatMessageSchema = new Schema<ChatMessageDoc, ChatMessageModel, ChatMessageMethods>(
  {
    roomCode: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: null },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Fast history lookups per room, newest first.
chatMessageSchema.index({ roomCode: 1, createdAt: -1 });

chatMessageSchema.methods.toDTO = function (): ChatMessageDTO {
  return {
    id: this._id.toString(),
    roomCode: this.roomCode,
    userId: this.userId,
    name: this.name,
    avatar: this.avatar,
    text: this.text,
    createdAt: this.createdAt.toISOString(),
  };
};

export const ChatMessage = model<ChatMessageDoc, ChatMessageModel>(
  'ChatMessage',
  chatMessageSchema,
);

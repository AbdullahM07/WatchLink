import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import type { RoomNote as RoomNoteDTO } from '@watchlink/shared';

export interface RoomNoteDoc {
  roomCode: string;
  userId: string;
  name: string;
  avatar: string | null;
  time: number;
  text: string;
  createdAt: Date;
}

export interface RoomNoteMethods {
  toDTO(): RoomNoteDTO;
}

export type RoomNoteModel = Model<RoomNoteDoc, Record<string, never>, RoomNoteMethods>;
export type RoomNoteDocument = HydratedDocument<RoomNoteDoc, RoomNoteMethods>;

const roomNoteSchema = new Schema<RoomNoteDoc, RoomNoteModel, RoomNoteMethods>(
  {
    roomCode: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: null },
    time: { type: Number, required: true, min: 0 },
    text: { type: String, required: true, maxlength: 280 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Notes are read ordered by their position in the video.
roomNoteSchema.index({ roomCode: 1, time: 1 });

roomNoteSchema.methods.toDTO = function (): RoomNoteDTO {
  return {
    id: this._id.toString(),
    roomCode: this.roomCode,
    userId: this.userId,
    name: this.name,
    avatar: this.avatar,
    time: this.time,
    text: this.text,
    createdAt: this.createdAt.toISOString(),
  };
};

export const RoomNote = model<RoomNoteDoc, RoomNoteModel>('RoomNote', roomNoteSchema);

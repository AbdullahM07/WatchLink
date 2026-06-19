import { z } from 'zod';
import { DEFAULT_MAX_PARTICIPANTS, ROOM_PARTICIPANTS_HARD_CAP } from '../constants';

export const createRoomSchema = z.object({
  name: z.string().trim().min(2, 'Room name is too short').max(60, 'Room name is too long'),
  isPrivate: z.boolean().default(false),
  password: z.string().min(1).max(128).optional(),
  maxParticipants: z
    .number()
    .int()
    .min(2)
    .max(ROOM_PARTICIPANTS_HARD_CAP)
    .default(DEFAULT_MAX_PARTICIPANTS),
});

export const joinRoomSchema = z.object({
  password: z.string().max(128).optional(),
});

export const updateRoomSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    isLocked: z.boolean().optional(),
    maxParticipants: z.number().int().min(2).max(ROOM_PARTICIPANTS_HARD_CAP).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

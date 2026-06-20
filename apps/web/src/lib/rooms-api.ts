import type {
  CreateRoomInput,
  JoinRoomInput,
  PublicRoom,
  UpdateRoomInput,
} from '@watchlink/shared';
import { apiFetch } from './api';

export function createRoomRequest(input: CreateRoomInput): Promise<PublicRoom> {
  return apiFetch<PublicRoom>('/rooms', { method: 'POST', body: input });
}

export function getRoomRequest(roomCode: string): Promise<PublicRoom> {
  return apiFetch<PublicRoom>(`/rooms/${roomCode}`, { method: 'GET' });
}

/** Pre-flight access check (lock/password/capacity) before connecting the socket. */
export function checkJoinRequest(roomCode: string, input: JoinRoomInput): Promise<PublicRoom> {
  return apiFetch<PublicRoom>(`/rooms/${roomCode}/join`, {
    method: 'POST',
    body: input,
    skipAuth: true,
  });
}

export function listMyRoomsRequest(): Promise<{ rooms: PublicRoom[] }> {
  return apiFetch<{ rooms: PublicRoom[] }>('/rooms/mine', { method: 'GET' });
}

/** Browsable public rooms for the landing page (no auth required). */
export function listPublicRoomsRequest(): Promise<{ rooms: PublicRoom[] }> {
  return apiFetch<{ rooms: PublicRoom[] }>('/rooms/public', { method: 'GET', skipAuth: true });
}

export function updateRoomRequest(
  roomCode: string,
  input: UpdateRoomInput,
): Promise<PublicRoom> {
  return apiFetch<PublicRoom>(`/rooms/${roomCode}`, { method: 'PATCH', body: input });
}

export function deleteRoomRequest(roomCode: string): Promise<null> {
  return apiFetch<null>(`/rooms/${roomCode}`, { method: 'DELETE' });
}

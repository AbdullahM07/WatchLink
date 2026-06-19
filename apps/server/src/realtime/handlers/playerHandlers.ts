import {
  resolveProvider,
  type PlayerState,
  type MediaChangePayload,
  type PlayerPlayPayload,
  type PlayerPausePayload,
  type PlayerSeekPayload,
  type Ack,
} from '@watchlink/shared';
import { getRoomByCode, persistPlayer } from '../../services/room.service';
import { getPlayer, setPlayer, snapshot } from '../playerStore';
import { hasControl } from '../controlStore';
import type { AppServer, AppSocket } from '../types';

function failAck<T>(ack: Ack<T> | undefined, message: string): void {
  ack?.({ success: false, message, data: null });
}

/** Clamp a client-supplied time to a sane, finite, non-negative number. */
function safeTime(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 24 * 60 * 60); // cap at 24h
}

export function registerPlayerHandlers(io: AppServer, socket: AppSocket): void {
  const me = socket.data.identity;

  /** Resolve the room and confirm this socket may control playback (host or granted). */
  async function asController(roomCode: string) {
    const code = String(roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(code)) throw new Error('Join the room first');
    const room = await getRoomByCode(code);
    if (room.hostId !== me.id && !hasControl(code, me.id)) {
      throw new Error('You do not have control in this room');
    }
    return { code, room };
  }

  function persist(code: string, state: PlayerState): void {
    setPlayer(code, state);
    void persistPlayer(code, state);
  }

  socket.on('media:change', async (payload: MediaChangePayload, ack: Ack<PlayerState>) => {
    try {
      const { code } = await asController(payload.roomCode);
      const resolution = resolveProvider(payload.url);
      if (resolution.provider === 'unsupported') {
        return failAck(ack, resolution.reason ?? 'Unsupported video link');
      }
      const state: PlayerState = {
        mediaUrl: payload.url.trim(),
        provider: resolution.provider,
        mode: resolution.mode,
        status: 'paused',
        currentTime: 0,
        playbackRate: 1,
        serverTimestamp: Date.now(),
        updatedBy: me.id,
      };
      persist(code, state);
      ack?.({ success: true, message: 'Media changed', data: state });
      socket.to(code).emit('media:changed', state);
    } catch (err) {
      failAck(ack, err instanceof Error ? err.message : 'Could not change media');
    }
  });

  socket.on('player:play', async (payload: PlayerPlayPayload) => {
    try {
      const { code } = await asController(payload.roomCode);
      const prev = getPlayer(code);
      if (!prev) return;
      const state: PlayerState = {
        ...prev,
        status: 'playing',
        currentTime: safeTime(payload.currentTime),
        serverTimestamp: Date.now(),
        updatedBy: me.id,
      };
      persist(code, state);
      socket.to(code).emit('player:sync-state', state);
    } catch {
      socket.emit('error', { message: 'You do not have control in this room', code: 'NO_CONTROL' });
    }
  });

  socket.on('player:pause', async (payload: PlayerPausePayload) => {
    try {
      const { code } = await asController(payload.roomCode);
      const prev = getPlayer(code);
      if (!prev) return;
      const state: PlayerState = {
        ...prev,
        status: 'paused',
        currentTime: safeTime(payload.currentTime),
        serverTimestamp: Date.now(),
        updatedBy: me.id,
      };
      persist(code, state);
      socket.to(code).emit('player:sync-state', state);
    } catch {
      socket.emit('error', { message: 'You do not have control in this room', code: 'NO_CONTROL' });
    }
  });

  socket.on('player:seek', async (payload: PlayerSeekPayload) => {
    try {
      const { code } = await asController(payload.roomCode);
      const prev = getPlayer(code);
      if (!prev) return;
      const state: PlayerState = {
        ...prev,
        currentTime: safeTime(payload.currentTime),
        serverTimestamp: Date.now(),
        updatedBy: me.id,
      };
      persist(code, state);
      socket.to(code).emit('player:sync-state', state);
    } catch {
      socket.emit('error', { message: 'You do not have control in this room', code: 'NO_CONTROL' });
    }
  });

  socket.on('player:sync-request', ({ roomCode }) => {
    const code = String(roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(code)) return;
    const snap = snapshot(code);
    if (snap) socket.emit('player:sync-state', snap);
  });
}

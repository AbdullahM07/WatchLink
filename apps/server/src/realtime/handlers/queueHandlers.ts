import { nanoid } from 'nanoid';
import {
  resolveProvider,
  type Ack,
  type PlayerState,
  type QueueItem,
  type QueueAddPayload,
  type QueueRemovePayload,
} from '@watchlink/shared';
import { getRoomByCode, persistPlayer } from '../../services/room.service';
import { setPlayer } from '../playerStore';
import { addToQueue, listQueue, removeFromQueue, shiftQueue } from '../queueStore';
import { hasControl } from '../controlStore';
import type { AppServer, AppSocket } from '../types';

function failAck<T>(ack: Ack<T> | undefined, message: string): void {
  ack?.({ success: false, message, data: null });
}

export function registerQueueHandlers(io: AppServer, socket: AppSocket): void {
  const me = socket.data.identity;

  /** Resolve the room and confirm this socket may control the queue (host or granted). */
  async function asController(roomCode: string) {
    const code = String(roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(code)) throw new Error('Join the room first');
    const room = await getRoomByCode(code);
    if (room.hostId !== me.id && !hasControl(code, me.id)) {
      throw new Error('You do not have control in this room');
    }
    return { code, room };
  }

  socket.on('queue:add', async (payload: QueueAddPayload, ack: Ack<QueueItem>) => {
    try {
      const { code } = await asController(payload.roomCode);
      const resolution = resolveProvider(payload.url);
      if (resolution.provider === 'unsupported') {
        return failAck(ack, resolution.reason ?? 'Unsupported video link');
      }
      const item: QueueItem = {
        id: nanoid(10),
        url: payload.url.trim(),
        provider: resolution.provider,
        mode: resolution.mode,
        addedBy: me.id,
      };
      if (!addToQueue(code, item)) return failAck(ack, 'The queue is full');
      ack?.({ success: true, message: 'Added to queue', data: item });
      io.to(code).emit('queue:list', listQueue(code));
    } catch (err) {
      failAck(ack, err instanceof Error ? err.message : 'Could not add to queue');
    }
  });

  socket.on('queue:remove', async (payload: QueueRemovePayload, ack: Ack) => {
    try {
      const { code } = await asController(payload.roomCode);
      removeFromQueue(code, payload.id);
      ack?.({ success: true, message: 'Removed', data: null });
      io.to(code).emit('queue:list', listQueue(code));
    } catch (err) {
      failAck(ack, err instanceof Error ? err.message : 'Could not remove from queue');
    }
  });

  socket.on('queue:next', async (payload: { roomCode: string }, ack: Ack<PlayerState>) => {
    try {
      const { code } = await asController(payload.roomCode);
      const next = shiftQueue(code);
      if (!next) return failAck(ack, 'The queue is empty');
      const state: PlayerState = {
        mediaUrl: next.url,
        provider: next.provider,
        mode: next.mode,
        status: 'paused',
        currentTime: 0,
        playbackRate: 1,
        serverTimestamp: Date.now(),
        updatedBy: me.id,
      };
      setPlayer(code, state);
      void persistPlayer(code, state);
      ack?.({ success: true, message: 'Now playing next', data: state });
      socket.to(code).emit('media:changed', state);
      io.to(code).emit('queue:list', listQueue(code));
    } catch (err) {
      failAck(ack, err instanceof Error ? err.message : 'Could not play next');
    }
  });
}

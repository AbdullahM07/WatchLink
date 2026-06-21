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
import { getPlayer, setPlayer } from '../playerStore';
import {
  addToQueue,
  listQueue,
  popHistory,
  pushHistory,
  removeFromQueue,
  shiftQueue,
  unshiftQueue,
} from '../queueStore';
import { hasControl } from '../controlStore';
import type { AppServer, AppSocket } from '../types';

function failAck<T>(ack: Ack<T> | undefined, message: string): void {
  ack?.({ success: false, message, data: null });
}

/** A queue item describing whatever is playing now, or null if the stage is empty. */
function currentAsQueueItem(roomCode: string, addedBy: string): QueueItem | null {
  const player = getPlayer(roomCode);
  if (!player?.mediaUrl || player.provider === 'unsupported') return null;
  return {
    id: nanoid(10),
    url: player.mediaUrl,
    provider: player.provider,
    mode: player.mode,
    addedBy,
  };
}

/** Build the paused-at-start player state for promoting a queue item to the stage. */
function playerFromItem(item: QueueItem, updatedBy: string): PlayerState {
  return {
    mediaUrl: item.url,
    provider: item.provider,
    mode: item.mode,
    status: 'paused',
    currentTime: 0,
    playbackRate: 1,
    serverTimestamp: Date.now(),
    updatedBy,
  };
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
      // Record the outgoing item so "previous" can return to it.
      const outgoing = currentAsQueueItem(code, me.id);
      if (outgoing) pushHistory(code, outgoing);
      const state = playerFromItem(next, me.id);
      setPlayer(code, state);
      void persistPlayer(code, state);
      ack?.({ success: true, message: 'Now playing next', data: state });
      socket.to(code).emit('media:changed', state);
      io.to(code).emit('queue:list', listQueue(code));
    } catch (err) {
      failAck(ack, err instanceof Error ? err.message : 'Could not play next');
    }
  });

  socket.on('queue:previous', async (payload: { roomCode: string }, ack: Ack<PlayerState>) => {
    try {
      const { code } = await asController(payload.roomCode);
      const prev = popHistory(code);
      if (!prev) return failAck(ack, 'Nothing to go back to');
      // Re-queue the current item at the front so the step is reversible via "next".
      const outgoing = currentAsQueueItem(code, me.id);
      if (outgoing) unshiftQueue(code, outgoing);
      const state = playerFromItem(prev, me.id);
      setPlayer(code, state);
      void persistPlayer(code, state);
      ack?.({ success: true, message: 'Playing previous', data: state });
      socket.to(code).emit('media:changed', state);
      io.to(code).emit('queue:list', listQueue(code));
    } catch (err) {
      failAck(ack, err instanceof Error ? err.message : 'Could not play previous');
    }
  });
}

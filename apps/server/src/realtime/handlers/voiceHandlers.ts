import {
  MAX_VOICE_PARTICIPANTS,
  type Ack,
  type VoiceMuteStatePayload,
  type VoiceSignalPayload,
  type VoiceSpeakingPayload,
} from '@watchlink/shared';
import { getRoomByCode } from '../../services/room.service';
import { presence } from '../presence';
import { voiceStore } from '../voiceStore';
import { broadcastParticipants } from './roomHandlers';
import type { AppServer, AppSocket } from '../types';

/**
 * WebRTC push-to-talk signaling. The server is a pure relay: it never inspects
 * SDP/ICE payloads, it just routes offers/answers/candidates between peers and
 * tracks who is in each room's voice mesh. Voice itself flows peer-to-peer.
 *
 * Glare-free by construction: the newcomer initiates all offers (the `voice:join`
 * ack tells them who's already there); existing members only answer.
 */
export function registerVoiceHandlers(io: AppServer, socket: AppSocket): void {
  const me = socket.data.identity;

  /** Relay a signaling payload to every voice socket of the target user. */
  const relay = (
    event: 'voice:offer' | 'voice:answer' | 'voice:ice-candidate',
    payload: VoiceSignalPayload,
  ) => {
    const roomCode = String(payload?.roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(roomCode)) return;
    const targets = voiceStore.socketIdsForUser(roomCode, String(payload?.to ?? ''));
    for (const sid of targets) {
      io.to(sid).emit(event, { from: me.id, data: payload.data });
    }
  };

  socket.on('voice:join', async ({ roomCode }, ack: Ack<{ peers: string[] }>) => {
    const code = String(roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(code)) {
      return ack?.({ success: false, message: 'Join the room first', data: null });
    }
    // Enforce the mesh cap on distinct users (a returning user doesn't recount).
    if (!voiceStore.hasUser(code, me.id) && voiceStore.userIds(code).length >= MAX_VOICE_PARTICIPANTS) {
      return ack?.({ success: false, message: 'Voice chat is full', data: null });
    }

    const peers = voiceStore.userIds(code).filter((id) => id !== me.id);
    voiceStore.join(code, socket.id, me.id);

    ack?.({ success: true, message: 'Joined voice', data: { peers } });
    socket.to(code).emit('voice:peer-joined', { userId: me.id });
  });

  socket.on('voice:leave', async ({ roomCode }) => {
    await handleLeave();
    // roomCode is implied by the socket's voice membership; param kept for symmetry.
    void roomCode;
  });

  socket.on('voice:offer', (payload: VoiceSignalPayload) => relay('voice:offer', payload));
  socket.on('voice:answer', (payload: VoiceSignalPayload) => relay('voice:answer', payload));
  socket.on('voice:ice-candidate', (payload: VoiceSignalPayload) =>
    relay('voice:ice-candidate', payload),
  );

  socket.on('voice:speaking', ({ roomCode, speaking }: VoiceSpeakingPayload) => {
    const code = String(roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(code)) return;
    presence.update(socket.id, { isSpeaking: Boolean(speaking) });
    io.to(code).emit('voice:speaking', { userId: me.id, speaking: Boolean(speaking) });
  });

  socket.on('voice:mute-state', ({ roomCode, muted }: VoiceMuteStatePayload) => {
    const code = String(roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(code)) return;
    presence.update(socket.id, { isMuted: Boolean(muted) });
    io.to(code).emit('voice:mute-state', { userId: me.id, muted: Boolean(muted) });
  });

  socket.on('disconnect', () => {
    if (voiceStore.roomOf(socket.id)) void handleLeave();
  });

  /** Shared teardown for explicit leave and disconnect. */
  async function handleLeave(): Promise<void> {
    const left = voiceStore.leave(socket.id);
    if (!left) return;
    const { roomCode, userId, lastForUser } = left;
    if (!lastForUser) return;

    io.to(roomCode).emit('voice:peer-left', { userId });
    // Clear any lingering speaking/muted flag so the participant list is accurate.
    for (const sid of presence.socketIdsForUser(roomCode, userId)) {
      presence.update(sid, { isSpeaking: false, isMuted: false });
    }
    io.to(roomCode).emit('voice:speaking', { userId, speaking: false });
    try {
      const room = await getRoomByCode(roomCode);
      broadcastParticipants(io, roomCode, room.hostId);
    } catch {
      /* room gone — nothing to refresh */
    }
  }
}

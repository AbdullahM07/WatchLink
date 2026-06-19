'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { iceServers } from '@/lib/env';
import type { AppClientSocket } from '@/lib/socket';

interface Options {
  /** The live room socket (from useRoomConnection). Null while disconnected. */
  socket: AppClientSocket | null;
  roomCode: string;
}

export interface RemoteAudio {
  userId: string;
  stream: MediaStream;
}

export interface VoiceApi {
  inVoice: boolean;
  connecting: boolean;
  muted: boolean;
  talking: boolean;
  remoteStreams: RemoteAudio[];
  joinVoice: () => void;
  leaveVoice: () => void;
  toggleMute: () => void;
  startTalking: () => void;
  stopTalking: () => void;
}

/** Keyboard key (event.code) that acts as push-to-talk while held. */
const PTT_CODE = 'KeyV';

/**
 * WebRTC push-to-talk over a full mesh. The room socket relays signaling; audio
 * flows peer-to-peer. The mic track exists from join but stays disabled until the
 * user holds push-to-talk (and isn't muted). Glare-free: the newcomer offers to
 * everyone already in voice (returned by the `voice:join` ack); peers only answer.
 */
export function useVoiceChat({ socket, roomCode }: Options): VoiceApi {
  const socketR = useRef(socket);
  socketR.current = socket;
  const roomR = useRef(roomCode);
  roomR.current = roomCode;

  const pcs = useRef(new Map<string, RTCPeerConnection>());
  const pending = useRef(new Map<string, RTCIceCandidateInit[]>());
  const localStream = useRef<MediaStream | null>(null);

  const inVoiceR = useRef(false);
  const mutedR = useRef(false);
  const talkingR = useRef(false);
  const lastSpeakingR = useRef(false);

  const [inVoice, setInVoice] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [talking, setTalking] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<RemoteAudio[]>([]);

  // --- Remote stream bookkeeping --------------------------------------------
  const addRemote = useCallback((userId: string, stream: MediaStream) => {
    setRemoteStreams((prev) =>
      prev.some((r) => r.userId === userId)
        ? prev.map((r) => (r.userId === userId ? { userId, stream } : r))
        : [...prev, { userId, stream }],
    );
  }, []);

  const removeRemote = useCallback((userId: string) => {
    setRemoteStreams((prev) => prev.filter((r) => r.userId !== userId));
  }, []);

  const closePeer = useCallback(
    (userId: string) => {
      const pc = pcs.current.get(userId);
      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.close();
        pcs.current.delete(userId);
      }
      pending.current.delete(userId);
      removeRemote(userId);
    },
    [removeRemote],
  );

  // --- Peer connection setup -------------------------------------------------
  const createPeer = useCallback(
    (userId: string) => {
      const existing = pcs.current.get(userId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers });
      localStream.current?.getTracks().forEach((t) => pc.addTrack(t, localStream.current!));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketR.current?.emit('voice:ice-candidate', {
            roomCode: roomR.current,
            to: userId,
            data: e.candidate.toJSON(),
          });
        }
      };
      pc.ontrack = (e) => {
        const [stream] = e.streams;
        if (stream) addRemote(userId, stream);
      };
      pc.onconnectionstatechange = () => {
        // Temporary diagnostic: confirms the peer media path actually establishes.
        console.debug(`[voice] peer ${userId} → ${pc.connectionState}`);
        if (pc.connectionState === 'failed') closePeer(userId);
      };

      pcs.current.set(userId, pc);
      return pc;
    },
    [addRemote, closePeer],
  );

  const flushPending = useCallback(async (userId: string, pc: RTCPeerConnection) => {
    const list = pending.current.get(userId);
    if (!list) return;
    for (const c of list) {
      try {
        await pc.addIceCandidate(c);
      } catch {
        /* ignore late/duplicate candidates */
      }
    }
    pending.current.delete(userId);
  }, []);

  const makeOffer = useCallback(
    async (userId: string) => {
      const pc = createPeer(userId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketR.current?.emit('voice:offer', { roomCode: roomR.current, to: userId, data: offer });
      } catch {
        /* negotiation aborted */
      }
    },
    [createPeer],
  );

  // --- Signaling listeners ---------------------------------------------------
  const onOffer = useCallback(
    async ({ from, data }: { from: string; data: unknown }) => {
      if (!localStream.current) return;
      const pc = createPeer(from);
      try {
        await pc.setRemoteDescription(data as RTCSessionDescriptionInit);
        await flushPending(from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketR.current?.emit('voice:answer', { roomCode: roomR.current, to: from, data: answer });
      } catch {
        closePeer(from);
      }
    },
    [createPeer, flushPending, closePeer],
  );

  const onAnswer = useCallback(
    async ({ from, data }: { from: string; data: unknown }) => {
      const pc = pcs.current.get(from);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(data as RTCSessionDescriptionInit);
        await flushPending(from, pc);
      } catch {
        /* stale answer */
      }
    },
    [flushPending],
  );

  const onCandidate = useCallback(async ({ from, data }: { from: string; data: unknown }) => {
    const cand = data as RTCIceCandidateInit;
    const pc = pcs.current.get(from);
    if (pc?.remoteDescription) {
      try {
        await pc.addIceCandidate(cand);
      } catch {
        /* ignore */
      }
    } else {
      const list = pending.current.get(from) ?? [];
      list.push(cand);
      pending.current.set(from, list);
    }
  }, []);

  const onPeerLeft = useCallback(({ userId }: { userId: string }) => closePeer(userId), [closePeer]);

  useEffect(() => {
    if (!socket) return;
    const offer = (p: { from: string; data: unknown }) => void onOffer(p);
    const answer = (p: { from: string; data: unknown }) => void onAnswer(p);
    const candidate = (p: { from: string; data: unknown }) => void onCandidate(p);
    socket.on('voice:offer', offer);
    socket.on('voice:answer', answer);
    socket.on('voice:ice-candidate', candidate);
    socket.on('voice:peer-left', onPeerLeft);
    return () => {
      socket.off('voice:offer', offer);
      socket.off('voice:answer', answer);
      socket.off('voice:ice-candidate', candidate);
      socket.off('voice:peer-left', onPeerLeft);
    };
  }, [socket, onOffer, onAnswer, onCandidate, onPeerLeft]);

  // --- Transmit state (mic enabled + speaking broadcast) ---------------------
  const applyTransmit = useCallback(() => {
    const transmit = talkingR.current && !mutedR.current;
    localStream.current?.getAudioTracks().forEach((t) => {
      t.enabled = transmit;
    });
    if (transmit !== lastSpeakingR.current) {
      lastSpeakingR.current = transmit;
      socketR.current?.emit('voice:speaking', { roomCode: roomR.current, speaking: transmit });
    }
  }, []);

  const teardownLocal = useCallback(() => {
    pcs.current.forEach((_, id) => closePeer(id));
    pcs.current.clear();
    pending.current.clear();
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    inVoiceR.current = false;
    talkingR.current = false;
    mutedR.current = false;
    lastSpeakingR.current = false;
    setInVoice(false);
    setTalking(false);
    setMuted(false);
    setRemoteStreams([]);
  }, [closePeer]);

  // --- Public actions --------------------------------------------------------
  const joinVoice = useCallback(() => {
    const s = socketR.current;
    if (!s || inVoiceR.current || connecting) return;
    setConnecting(true);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
        localStream.current = stream;
        s.emit('voice:join', { roomCode: roomR.current }, (res) => {
          setConnecting(false);
          if (!res.success || !res.data) {
            stream.getTracks().forEach((t) => t.stop());
            localStream.current = null;
            toast.error(res.message || 'Could not join voice');
            return;
          }
          inVoiceR.current = true;
          setInVoice(true);
          res.data.peers.forEach((peerId) => void makeOffer(peerId));
        });
      })
      .catch(() => {
        setConnecting(false);
        toast.error('Microphone access is required for voice chat');
      });
  }, [connecting, makeOffer]);

  const leaveVoice = useCallback(() => {
    if (!inVoiceR.current) return;
    socketR.current?.emit('voice:leave', { roomCode: roomR.current });
    teardownLocal();
  }, [teardownLocal]);

  const startTalking = useCallback(() => {
    if (!inVoiceR.current || mutedR.current || talkingR.current) return;
    talkingR.current = true;
    setTalking(true);
    applyTransmit();
  }, [applyTransmit]);

  const stopTalking = useCallback(() => {
    if (!talkingR.current) return;
    talkingR.current = false;
    setTalking(false);
    applyTransmit();
  }, [applyTransmit]);

  const toggleMute = useCallback(() => {
    if (!inVoiceR.current) return;
    const next = !mutedR.current;
    mutedR.current = next;
    setMuted(next);
    applyTransmit();
    socketR.current?.emit('voice:mute-state', { roomCode: roomR.current, muted: next });
  }, [applyTransmit]);

  // Keyboard push-to-talk (held), ignored while typing.
  useEffect(() => {
    if (!inVoice) return;
    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      if (e.code !== PTT_CODE || e.repeat || isTyping()) return;
      e.preventDefault();
      startTalking();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== PTT_CODE) return;
      stopTalking();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [inVoice, startTalking, stopTalking]);

  // Socket dropped (room disconnect / unmount) → tear down locally.
  useEffect(() => {
    if (!socket && inVoiceR.current) teardownLocal();
  }, [socket, teardownLocal]);

  useEffect(() => () => teardownLocal(), [teardownLocal]);

  return {
    inVoice,
    connecting,
    muted,
    talking,
    remoteStreams,
    joinVoice,
    leaveVoice,
    toggleMute,
    startTalking,
    stopTalking,
  };
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ReactionEmoji, SocketAuth } from '@watchlink/shared';
import { createSocket, type AppClientSocket } from '@/lib/socket';
import { getToken } from '@/lib/token';
import { useRoomStore } from '@/store/room';

interface Options {
  roomCode: string;
  password?: string;
  /** Provided when joining as a guest (no account). */
  guestName?: string;
  /** Gate connection until the caller has resolved password / guest name. */
  enabled: boolean;
}

/**
 * Owns the socket lifecycle for a room: connect, join (with ack), live updates,
 * reconnect resync, and the host/chat actions. State lands in the room store.
 */
export function useRoomConnection({ roomCode, password, guestName, enabled }: Options) {
  const socketRef = useRef<AppClientSocket | null>(null);
  // Exposed so sibling hooks (e.g. useVoiceChat) can attach their own listeners.
  const [socket, setSocketInstance] = useState<AppClientSocket | null>(null);
  const store = useRoomStore();
  const {
    setStatus, setSelf, setRoom, patchRoom, setParticipants, setParticipantSpeaking,
    setParticipantMuted, setMessages, addMessage, removeMessage, addReaction, removeReaction,
    setError, applyPlayer, setNotes, addNote, removeNote, setQueue, reset,
  } = store;

  // Keep latest join params without re-subscribing listeners on every change.
  const joinParams = useRef({ roomCode, password });
  joinParams.current = { roomCode, password };

  useEffect(() => {
    if (!enabled) return;

    const token = getToken();
    const auth: SocketAuth = token ? { token } : { guestName: guestName || 'Guest' };
    const socket = createSocket(auth);
    socketRef.current = socket;
    setSocketInstance(socket);

    const join = () => {
      setStatus('joining');
      socket.emit('room:join', joinParams.current, (res) => {
        if (res.success && res.data) {
          setRoom(res.data);
          setStatus('connected');
          setError(null);
        } else {
          setError(res.message);
          setStatus('error');
        }
      });
    };

    socket.on('connect', join);
    socket.on('disconnect', () => setStatus('reconnecting'));
    socket.on('connect_error', (err) => {
      setError(err.message);
      setStatus('error');
    });

    socket.on('session', ({ userId }) => setSelf(userId));
    socket.on('room:state', (room) => setRoom(room));
    socket.on('participant:list', (list) => setParticipants(list));
    socket.on('participant:joined', (p) => toast(`${p.name} joined`));
    socket.on('room:locked', ({ isLocked }) => {
      patchRoom({ isLocked });
      toast(isLocked ? 'Room locked' : 'Room unlocked');
    });
    socket.on('room:host-changed', ({ hostId }) => {
      patchRoom({ hostId });
      toast('Host changed');
    });
    socket.on('chat:history', (messages) => setMessages(messages));
    socket.on('chat:message', (message) => addMessage(message));
    socket.on('chat:deleted', ({ messageId }) => removeMessage(messageId));
    socket.on('reaction:received', (reaction) => addReaction(reaction));
    socket.on('voice:speaking', ({ userId, speaking }) => setParticipantSpeaking(userId, speaking));
    socket.on('voice:mute-state', ({ userId, muted }) => setParticipantMuted(userId, muted));
    socket.on('media:changed', (player) => applyPlayer(player));
    socket.on('player:sync-state', (player) => applyPlayer(player));
    socket.on('queue:list', (items) => setQueue(items));
    socket.on('note:list', (notes) => setNotes(notes));
    socket.on('note:added', (note) => addNote(note));
    socket.on('note:deleted', ({ noteId }) => removeNote(noteId));
    socket.on('control:changed', ({ canControl }) => {
      toast(canControl ? 'You were granted control 🎛️' : 'Your control was revoked');
    });
    socket.on('room:kicked', ({ reason }) => {
      setError(reason);
      setStatus('kicked');
      socket.disconnect();
    });
    socket.on('room:closed', ({ reason }) => {
      setError(reason);
      setStatus('closed');
      socket.disconnect();
    });
    socket.on('error', ({ message }) => toast.error(message));

    setStatus('connecting');
    socket.connect();

    return () => {
      socket.emit('room:leave', { roomCode: joinParams.current.roomCode });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomCode]);

  // --- Actions ---------------------------------------------------------------
  const sendMessage = useCallback((text: string) => {
    socketRef.current?.emit('chat:message', { roomCode, text });
  }, [roomCode]);

  const deleteMessage = useCallback((messageId: string) => {
    socketRef.current?.emit('chat:delete', { roomCode, messageId });
  }, [roomCode]);

  const sendReaction = useCallback((emoji: ReactionEmoji) => {
    socketRef.current?.emit('reaction:send', { roomCode, emoji });
  }, [roomCode]);

  const setLocked = useCallback((isLocked: boolean) => {
    socketRef.current?.emit('room:lock', { roomCode, isLocked }, (res) => {
      if (!res.success) toast.error(res.message);
    });
  }, [roomCode]);

  const kick = useCallback((targetUserId: string) => {
    socketRef.current?.emit('room:kick', { roomCode, targetUserId }, (res) => {
      if (!res.success) toast.error(res.message);
      else toast.success('Participant removed');
    });
  }, [roomCode]);

  const transferHost = useCallback((targetUserId: string) => {
    socketRef.current?.emit('room:host-transfer', { roomCode, targetUserId }, (res) => {
      if (!res.success) toast.error(res.message);
      else toast.success('Host transferred');
    });
  }, [roomCode]);

  // --- Player actions (host only — server enforces) --------------------------
  const changeMedia = useCallback((url: string) => {
    socketRef.current?.emit('media:change', { roomCode, url }, (res) => {
      if (res.success && res.data) applyPlayer(res.data);
      else toast.error(res.message);
    });
  }, [roomCode, applyPlayer]);

  const addToQueue = useCallback((url: string) => {
    socketRef.current?.emit('queue:add', { roomCode, url }, (res) => {
      if (res.success) toast.success('Added to queue');
      else toast.error(res.message);
    });
  }, [roomCode]);

  const removeFromQueue = useCallback((id: string) => {
    socketRef.current?.emit('queue:remove', { roomCode, id }, (res) => {
      if (!res.success) toast.error(res.message);
    });
  }, [roomCode]);

  const playNext = useCallback(() => {
    socketRef.current?.emit('queue:next', { roomCode }, (res) => {
      if (res.success && res.data) applyPlayer(res.data);
      else toast.error(res.message);
    });
  }, [roomCode, applyPlayer]);

  const play = useCallback((currentTime: number) => {
    socketRef.current?.emit('player:play', { roomCode, currentTime });
  }, [roomCode]);

  const pause = useCallback((currentTime: number) => {
    socketRef.current?.emit('player:pause', { roomCode, currentTime });
  }, [roomCode]);

  const seek = useCallback((currentTime: number) => {
    socketRef.current?.emit('player:seek', { roomCode, currentTime });
  }, [roomCode]);

  const requestSync = useCallback(() => {
    socketRef.current?.emit('player:sync-request', { roomCode });
  }, [roomCode]);

  // --- Notes -----------------------------------------------------------------
  const addNoteAt = useCallback((time: number, text: string) => {
    socketRef.current?.emit('note:add', { roomCode, time, text }, (res) => {
      if (!res.success) toast.error(res.message);
    });
  }, [roomCode]);

  const deleteNote = useCallback((noteId: string) => {
    socketRef.current?.emit('note:delete', { roomCode, noteId });
  }, [roomCode]);

  // --- Control grants (host only — server enforces) --------------------------
  const grantControl = useCallback((targetUserId: string) => {
    socketRef.current?.emit('room:grant-control', { roomCode, targetUserId }, (res) => {
      if (!res.success) toast.error(res.message);
    });
  }, [roomCode]);

  const revokeControl = useCallback((targetUserId: string) => {
    socketRef.current?.emit('room:revoke-control', { roomCode, targetUserId }, (res) => {
      if (!res.success) toast.error(res.message);
    });
  }, [roomCode]);

  return {
    socket,
    status: store.status,
    selfId: store.selfId,
    room: store.room,
    participants: store.participants,
    messages: store.messages,
    notes: store.notes,
    queue: store.queue,
    reactions: store.reactions,
    error: store.error,
    playerVersion: store.playerVersion,
    sendMessage,
    deleteMessage,
    sendReaction,
    removeReaction,
    setLocked,
    kick,
    transferHost,
    grantControl,
    revokeControl,
    changeMedia,
    addToQueue,
    removeFromQueue,
    playNext,
    play,
    pause,
    seek,
    requestSync,
    addNoteAt,
    deleteNote,
  };
}

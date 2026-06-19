/**
 * Playback sync smoke test: host changes media and drives play/pause/seek;
 * a follower receives synchronized state. Also checks host-only enforcement
 * and rejection of unsupported URLs.
 */
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { io as ioClient, type Socket } from 'socket.io-client';

const PORT = 4558;
const BASE = `http://127.0.0.1:${PORT}`;

let failures = 0;
const check = (name: string, cond: boolean, extra?: unknown) => {
  // eslint-disable-next-line no-console
  console.log(`${cond ? '✅' : '❌'} ${name}`);
  if (!cond) {
    failures++;
    if (extra !== undefined) console.log('   →', JSON.stringify(extra));
  }
};

const once = <T>(socket: Socket, event: string, timeoutMs = 4000): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs);
    socket.once(event, (p: T) => {
      clearTimeout(timer);
      resolve(p);
    });
  });

const emitAck = <T>(socket: Socket, event: string, payload: unknown): Promise<T> =>
  new Promise((resolve) => socket.emit(event, payload, resolve as (r: T) => void));

async function main() {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/watchlink_sync_test';
  process.env.JWT_SECRET = 'test_secret_test_secret_0123456789';
  process.env.NODE_ENV = 'test';
  process.env.PORT = String(PORT);

  const { createApp } = await import('../src/app');
  const { setupSocket } = await import('../src/realtime');
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();

  const httpServer = createServer(createApp());
  setupSocket(httpServer);
  await new Promise<void>((r) => httpServer.listen(PORT, r));

  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Host', email: 'h@e.com', password: 'supersecret' }),
  }).then((r) => r.json());
  const token = reg.data.token;
  const room = await fetch(`${BASE}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Sync Room', isPrivate: false }),
  }).then((r) => r.json());
  const roomCode = room.data.roomCode;

  const host = ioClient(BASE, { auth: { token }, transports: ['websocket'] });
  await once(host, 'connect');
  await emitAck(host, 'room:join', { roomCode });

  const guest = ioClient(BASE, { auth: { guestName: 'Guest' }, transports: ['websocket'] });
  await once(guest, 'connect');
  await emitAck(guest, 'room:join', { roomCode });

  // media:change (YouTube) — host succeeds, guest is notified.
  const mediaChangedP = once<any>(guest, 'media:changed');
  const mediaAck = await emitAck<any>(host, 'media:change', {
    roomCode,
    url: 'https://youtu.be/dQw4w9WgXcQ',
  });
  check('media:change ack success', mediaAck?.success === true, mediaAck);
  check('media provider = youtube', mediaAck?.data?.provider === 'youtube', mediaAck?.data?.provider);
  const changed = await mediaChangedP;
  check('guest received media:changed', changed?.mediaUrl?.includes('dQw4w9WgXcQ'), changed);

  // play
  const playP = once<any>(guest, 'player:sync-state');
  host.emit('player:play', { roomCode, currentTime: 30 });
  const playState = await playP;
  check('guest sees status=playing', playState?.status === 'playing', playState);
  check('guest sees currentTime≈30', Math.abs((playState?.currentTime ?? 0) - 30) < 1, playState?.currentTime);

  // pause
  const pauseP = once<any>(guest, 'player:sync-state');
  host.emit('player:pause', { roomCode, currentTime: 45 });
  const pauseState = await pauseP;
  check('guest sees status=paused', pauseState?.status === 'paused', pauseState);
  check('guest sees currentTime≈45', Math.abs((pauseState?.currentTime ?? 0) - 45) < 1, pauseState?.currentTime);

  // seek
  const seekP = once<any>(guest, 'player:sync-state');
  host.emit('player:seek', { roomCode, currentTime: 90 });
  const seekState = await seekP;
  check('guest sees seek to ≈90', Math.abs((seekState?.currentTime ?? 0) - 90) < 1, seekState?.currentTime);

  // host-only enforcement: guest tries to control → gets an error
  const guestErrP = once<any>(guest, 'error');
  guest.emit('player:play', { roomCode, currentTime: 5 });
  const guestErr = await guestErrP;
  check('guest control rejected (NOT_HOST)', guestErr?.code === 'NOT_HOST', guestErr);

  // unsupported url rejected
  const badAck = await emitAck<any>(host, 'media:change', { roomCode, url: 'https://example.com/page' });
  check('unsupported media rejected', badAck?.success === false, badAck);

  // sync-request returns current state
  const reqP = once<any>(host, 'player:sync-state');
  host.emit('player:sync-request', { roomCode });
  const reqState = await reqP;
  check('sync-request returns state', reqState?.mediaUrl?.includes('dQw4w9WgXcQ'), reqState);

  host.close();
  guest.close();
  await new Promise((r) => setTimeout(r, 300));
  await new Promise<void>((r) => httpServer.close(() => r()));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();

  // eslint-disable-next-line no-console
  console.log(failures === 0 ? '\nALL SYNC SMOKE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

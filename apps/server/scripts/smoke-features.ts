/**
 * Smoke test for control grants + timestamped notes:
 * a non-host can't control until granted, then can; can add notes anytime;
 * loses control again when revoked.
 */
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { io as ioClient, type Socket } from 'socket.io-client';

const PORT = 4559;
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

const once = <T>(s: Socket, event: string, timeoutMs = 4000): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs);
    s.once(event, (p: T) => {
      clearTimeout(timer);
      resolve(p);
    });
  });
const emitAck = <T>(s: Socket, event: string, payload: unknown): Promise<T> =>
  new Promise((resolve) => s.emit(event, payload, resolve as (r: T) => void));

async function main() {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/watchlink_feat_test';
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
    body: JSON.stringify({ name: 'Grants Room', isPrivate: false }),
  }).then((r) => r.json());
  const roomCode = room.data.roomCode;

  const host = ioClient(BASE, { auth: { token }, transports: ['websocket'] });
  await once(host, 'connect');
  await emitAck(host, 'room:join', { roomCode });

  const guest = ioClient(BASE, { auth: { guestName: 'Guest' }, transports: ['websocket'] });
  // The server sends `session` with our trusted id right after connect.
  const sessionP = once<{ userId: string }>(guest, 'session');
  await once(guest, 'connect');
  const gid = (await sessionP).userId;
  check('found guest id via session', typeof gid === 'string' && gid.length > 0, gid);

  const guestNoteListP = once<any[]>(guest, 'note:list');
  await emitAck(guest, 'room:join', { roomCode });
  const noteList = await guestNoteListP;
  check('guest receives note:list on join', Array.isArray(noteList) && noteList.length === 0, noteList);

  // 1) guest cannot control before being granted
  const errP = once<any>(guest, 'error');
  guest.emit('player:play', { roomCode, currentTime: 5 });
  const err = await errP;
  check('guest control denied before grant', err?.code === 'NO_CONTROL', err);

  // 2) host sets media + grants control
  await emitAck(host, 'media:change', { roomCode, url: 'https://youtu.be/dQw4w9WgXcQ' });

  const ctrlChangedP = once<any>(guest, 'control:changed');
  const grantAck = await emitAck<any>(host, 'room:grant-control', { roomCode, targetUserId: gid });
  check('grant-control ack success', grantAck?.success === true, grantAck);
  const ctrlChanged = await ctrlChangedP;
  check('guest notified control granted', ctrlChanged?.canControl === true, ctrlChanged);

  // 3) guest can now control — host receives the sync
  const hostSyncP = once<any>(host, 'player:sync-state');
  guest.emit('player:play', { roomCode, currentTime: 20 });
  const hostSync = await hostSyncP;
  check('granted guest controls playback', hostSync?.status === 'playing' && Math.abs(hostSync.currentTime - 20) < 1, hostSync);

  // 4) guest adds a timestamped note
  const hostNoteP = once<any>(host, 'note:added');
  const noteAck = await emitAck<any>(guest, 'note:add', { roomCode, time: 12, text: 'look here!' });
  check('note:add ack success', noteAck?.success === true, noteAck);
  const hostNote = await hostNoteP;
  check('host receives note at t=12', hostNote?.time === 12 && hostNote?.text === 'look here!', hostNote);

  // 5) revoke → guest denied again
  const ctrlRevokedP = once<any>(guest, 'control:changed');
  await emitAck(host, 'room:revoke-control', { roomCode, targetUserId: gid });
  const revoked = await ctrlRevokedP;
  check('guest notified control revoked', revoked?.canControl === false, revoked);
  const err2P = once<any>(guest, 'error');
  guest.emit('player:pause', { roomCode, currentTime: 1 });
  const err2 = await err2P;
  check('guest control denied after revoke', err2?.code === 'NO_CONTROL', err2);

  host.close();
  guest.close();
  await new Promise((r) => setTimeout(r, 300));
  await new Promise<void>((r) => httpServer.close(() => r()));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();

  // eslint-disable-next-line no-console
  console.log(failures === 0 ? '\nALL FEATURE SMOKE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

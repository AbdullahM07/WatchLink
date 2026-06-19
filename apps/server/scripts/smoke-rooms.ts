/**
 * Realtime smoke test: boots the full app + Socket.IO against the running local
 * MongoDB and drives two clients (a registered host and a guest) through
 * join → participant list → chat → host kick.
 */
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { io as ioClient, type Socket } from 'socket.io-client';

const PORT = 4557;
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
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

async function main() {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/watchlink_test';
  process.env.JWT_SECRET = 'test_secret_test_secret_0123456789';
  process.env.NODE_ENV = 'test';
  process.env.PORT = String(PORT);

  const { createApp } = await import('../src/app');
  const { setupSocket } = await import('../src/realtime');

  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase(); // clean slate

  const httpServer = createServer(createApp());
  setupSocket(httpServer);
  await new Promise<void>((r) => httpServer.listen(PORT, r));

  // --- Register a host + create a room over REST ---------------------------
  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Host', email: 'host@example.com', password: 'supersecret' }),
  }).then((r) => r.json());
  const token: string = reg.data.token;
  check('host registered', !!token);

  const roomRes = await fetch(`${BASE}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Movie Night', isPrivate: false }),
  }).then((r) => r.json());
  const roomCode: string = roomRes.data.roomCode;
  check('room created with code', typeof roomCode === 'string' && roomCode.length === 6, roomCode);

  // --- Connect host socket --------------------------------------------------
  const host = ioClient(BASE, { auth: { token }, transports: ['websocket'] });
  await once(host, 'connect');
  const hostJoin = await new Promise<any>((resolve) =>
    host.emit('room:join', { roomCode }, resolve),
  );
  check('host join ack success', hostJoin?.success === true, hostJoin);

  // --- Connect guest socket -------------------------------------------------
  const guest = ioClient(BASE, { auth: { guestName: 'Buddy' }, transports: ['websocket'] });
  await once(guest, 'connect');

  const hostSeesListP = once<any[]>(host, 'participant:list');
  const guestHistoryP = once<any[]>(guest, 'chat:history');
  const guestJoin = await new Promise<any>((resolve) =>
    guest.emit('room:join', { roomCode }, resolve),
  );
  check('guest join ack success', guestJoin?.success === true, guestJoin);

  const list = await hostSeesListP;
  check('host sees 2 participants', list.length === 2, list.map((p) => p.name));
  check('host flagged isHost', !!list.find((p) => p.name === 'Host')?.isHost);

  await guestHistoryP; // guest received (empty) history
  check('guest received chat history', true);

  // --- Chat round-trip ------------------------------------------------------
  const guestGetsMsgP = once<any>(guest, 'chat:message');
  host.emit('chat:message', { roomCode, text: 'hello everyone' });
  const msg = await guestGetsMsgP;
  check('guest received host chat message', msg?.text === 'hello everyone', msg);
  check('message attributed to Host', msg?.name === 'Host');

  // --- Host kicks guest -----------------------------------------------------
  const guestKickedP = once<any>(guest, 'room:kicked');
  const guestUserId = list.find((p) => p.name === 'Buddy')?.userId;
  const kickAck = await new Promise<any>((resolve) =>
    host.emit('room:kick', { roomCode, targetUserId: guestUserId }, resolve),
  );
  check('kick ack success', kickAck?.success === true, kickAck);
  const kicked = await guestKickedP;
  check('guest received room:kicked', !!kicked?.reason, kicked);

  host.close();
  guest.close();
  // Let server-side disconnect handlers (leaveRoom queries) finish before teardown.
  await new Promise((r) => setTimeout(r, 300));
  await new Promise<void>((r) => httpServer.close(() => r()));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();

  // eslint-disable-next-line no-console
  console.log(failures === 0 ? '\nALL ROOM SMOKE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

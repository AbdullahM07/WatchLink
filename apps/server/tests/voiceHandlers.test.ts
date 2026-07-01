import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { setupSocket } from '../src/realtime';
import type { AppServer } from '../src/realtime/types';

/**
 * A room member who never joined the voice mesh must not be able to send or
 * receive WebRTC signaling — regression test for the voice relay sender check.
 */
describe('voice signaling requires actual voice-mesh membership', () => {
  const ROOM_CODE = 'TESTRM';
  let httpServer: ReturnType<typeof createServer>;
  let appServer: AppServer;
  let baseUrl: string;
  let clientA: ClientSocket;
  let clientB: ClientSocket;
  let userIdA: string;
  let userIdB: string;

  function connectGuest(name: string): Promise<{ client: ClientSocket; userId: string }> {
    const client = ioClient(baseUrl, { auth: { guestName: name }, forceNew: true });
    return new Promise((resolve, reject) => {
      client.on('connect_error', reject);
      client.on('session', (payload: { userId: string }) => {
        resolve({ client, userId: payload.userId });
      });
    });
  }

  /** Wait for an event, or resolve `null` if it doesn't arrive within the window. */
  function waitForEventOrTimeout<T>(client: ClientSocket, event: string, ms = 150): Promise<T | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), ms);
      client.once(event, (payload: T) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });
  }

  beforeAll(async () => {
    httpServer = createServer();
    appServer = setupSocket(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;

    const [a, b] = await Promise.all([connectGuest('Alice'), connectGuest('Bob')]);
    clientA = a.client;
    userIdA = a.userId;
    clientB = b.client;
    userIdB = b.userId;

    // Put both sockets in the room directly (bypassing the REST/Mongo-backed
    // room:join flow, which isn't under test here).
    appServer.sockets.sockets.get(clientA.id!)?.join(ROOM_CODE);
    appServer.sockets.sockets.get(clientB.id!)?.join(ROOM_CODE);
  });

  afterAll(() => {
    clientA?.close();
    clientB?.close();
    appServer?.close();
    httpServer?.close();
  });

  it('does not relay an offer from a room member who never joined voice', async () => {
    // Only Alice joins the voice mesh; Bob stays a room member only.
    await new Promise<void>((resolve) => {
      clientA.emit('voice:join', { roomCode: ROOM_CODE }, () => resolve());
    });

    const receivedPromise = waitForEventOrTimeout(clientA, 'voice:offer');
    clientB.emit('voice:offer', { roomCode: ROOM_CODE, to: userIdA, data: { sdp: 'fake' } });

    expect(await receivedPromise).toBeNull();
  });

  it('does not broadcast speaking/mute state from a non-voice room member', async () => {
    const receivedPromise = waitForEventOrTimeout(clientA, 'voice:speaking');
    clientB.emit('voice:speaking', { roomCode: ROOM_CODE, speaking: true });

    expect(await receivedPromise).toBeNull();
  });

  it('still relays signaling between two genuine voice-mesh members', async () => {
    await new Promise<void>((resolve) => {
      clientB.emit('voice:join', { roomCode: ROOM_CODE }, () => resolve());
    });

    const receivedPromise = waitForEventOrTimeout<{ from: string; data: unknown }>(clientB, 'voice:offer');
    clientA.emit('voice:offer', { roomCode: ROOM_CODE, to: userIdB, data: { sdp: 'real' } });

    const received = await receivedPromise;
    expect(received).not.toBeNull();
    expect(received?.from).toBe(userIdA);
  });
});

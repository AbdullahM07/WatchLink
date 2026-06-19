/**
 * Public client configuration. Only NEXT_PUBLIC_* values are available in the
 * browser; never put secrets here.
 */
export const clientEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000',
  stunUrl: process.env.NEXT_PUBLIC_STUN_URL ?? 'stun:stun.l.google.com:19302',
  turnUrl: process.env.NEXT_PUBLIC_TURN_URL ?? '',
  turnUsername: process.env.NEXT_PUBLIC_TURN_USERNAME ?? '',
  turnPassword: process.env.NEXT_PUBLIC_TURN_PASSWORD ?? '',
};

/**
 * ICE servers for WebRTC voice. STUN is enough for most same-network / simple-NAT
 * calls; add a TURN server (via NEXT_PUBLIC_TURN_*) for reliable cross-NAT relay.
 */
export const iceServers: RTCIceServer[] = [
  ...(clientEnv.stunUrl ? [{ urls: clientEnv.stunUrl }] : []),
  ...(clientEnv.turnUrl
    ? [
        {
          urls: clientEnv.turnUrl,
          username: clientEnv.turnUsername,
          credential: clientEnv.turnPassword,
        },
      ]
    : []),
];

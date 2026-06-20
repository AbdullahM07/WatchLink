/**
 * Public client configuration. Only NEXT_PUBLIC_* values are available in the
 * browser; never put secrets here.
 */
export const clientEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000',
};

/**
 * ICE servers for WebRTC voice.
 *
 * STUN alone is enough for same-network calls, but cross-network voice (especially
 * mobile / CGNAT, where peers can't reach each other directly) needs a TURN relay.
 * We ship a Metered TURN config that exposes the relay over multiple ports
 * (80 + 443 + TCP/TLS) so voice survives strict mobile networks and firewalls.
 *
 * NOTE: TURN credentials are necessarily exposed to the browser — WebRTC needs them
 * client-side — so keeping them in the bundle is no less safe than a NEXT_PUBLIC_*
 * env var. Rotate/replace them from the Metered dashboard if usage runs out.
 */
const TURN_HOST = 'global.relay.metered.ca';
const TURN_USERNAME = '9644c1f081efc60130ab5311';
const TURN_CREDENTIAL = 'Flu7bYLI6qb0cndI';

export const iceServers: RTCIceServer[] = [
  { urls: 'stun:stun.relay.metered.ca:80' },
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: [
      `turn:${TURN_HOST}:80`,
      `turn:${TURN_HOST}:80?transport=tcp`,
      `turn:${TURN_HOST}:443`,
      `turns:${TURN_HOST}:443?transport=tcp`,
    ],
    username: TURN_USERNAME,
    credential: TURN_CREDENTIAL,
  },
];

# WatchLink — Watch Together Platform

Create a room, drop in a video link, and watch in sync with friends — with live chat,
reactions and WebRTC push-to-talk voice.

> **Legal:** WatchLink uses only official players and allowed embeds. It never downloads,
> re-hosts, or bypasses platform protections (YouTube, Facebook, TikTok, Instagram).
> Sources that don't allow full control run in **Social Mode** instead of claiming precise sync.

## Monorepo layout

```
watchlink/
├── apps/
│   ├── web/      # Next.js 14 (App Router) frontend
│   └── server/   # Express + Socket.IO + MongoDB backend
├── packages/
│   ├── shared/   # Shared types, socket contracts, Zod schemas
│   └── config/   # Shared TS / Prettier config
└── package.json  # npm workspaces root
```

## Tech stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Zustand, React Query, React Hook Form, Zod, Socket.IO client, WebRTC, sonner.
- **Backend:** Node.js, Express, TypeScript, Socket.IO, MongoDB/Mongoose, JWT, bcrypt, Helmet, CORS, rate limiting, Pino.

## Requirements

- Node.js ≥ 20
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

## Local setup

```bash
# 1. Install all workspace dependencies
npm install

# 2. Build the shared package (types/schemas) once
npm run build:shared

# 3. Configure environment
cp .env.example apps/server/.env      # then edit values
cp .env.example apps/web/.env.local   # only NEXT_PUBLIC_* are read here
# (dev defaults are already provided so it runs out of the box)

# 4. Make sure MongoDB is running, e.g. locally:
#    mongod --dbpath /your/data/path
#    or use a MongoDB Atlas connection string in apps/server/.env

# 5. Run both apps (server on :4000, web on :3000)
npm run dev
```

Then open http://localhost:3000.

## Useful scripts (run from the repo root)

| Command | Description |
| --- | --- |
| `npm run dev` | Run server + web together |
| `npm run dev:server` | Run only the backend |
| `npm run dev:web` | Run only the frontend |
| `npm run build:shared` | Build the shared types package |
| `npm run typecheck` | Type-check every workspace |
| `npm run build` | Build everything for production |

## Status / roadmap

- [x] **Phase 1** — Monorepo, TypeScript, MongoDB, JWT authentication (register / login / me / profile)
- [x] **Phase 2** — Rooms, Socket.IO, participants/presence, host controls, chat
- [x] **Phase 3** — YouTube, direct/HLS, Facebook + other social providers, playback sync, queue
- [x] **Phase 4** — WebRTC push-to-talk voice
- [x] **Phase 5** — Reactions, timestamped notes, UI polish
- [ ] Phase 6 — Admin, broader test coverage, deployment

## What works now

- Register a new account, log in, and stay logged in across refreshes; guests can join rooms without an account.
- View and edit your profile (display name + avatar URL). Protected routes redirect guests to login.
- Create/lock/password-protect a room, join by code, and see live presence with host reassignment.
- Playback stays in sync across everyone in a room (YouTube, direct/HLS, and social embeds where the
  provider allows it), with a host-managed queue (add / remove / next / previous).
- Live chat, timestamped notes, and floating emoji reactions — all rate-limited per socket.
- WebRTC push-to-talk voice: peer-to-peer audio with the server acting as a signaling relay only
  (never inspects SDP/ICE payloads), scoped so only actual voice-mesh members can signal or be signaled.
- Hardened API: Helmet, CORS allow-list, rate limiting, Zod validation, bcrypt hashing,
  JWT auth, and `passwordHash` is never returned.
- Automated tests: player sync reconciliation (`apps/web`), rate limiter and voice-mesh signaling
  (`apps/server`) — run with `npm test`.

### Try the API directly

```bash
curl -s http://localhost:4000/api/health

curl -s -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sara","email":"sara@example.com","password":"supersecret"}'
```

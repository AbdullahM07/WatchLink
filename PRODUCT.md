# Product

## Register

product

## Users

Friends and small groups (2–8 people) who want to watch the same video together while physically apart. They arrive socially — someone shares a room link or code — often on a whim ("let's watch this"). Mixed devices: laptops for the host, phones for guests. They are not power users of streaming tooling; they're here for the shared moment, not the controls. The core context is leisure: evenings, weekends, late-night hangouts.

## Product Purpose

WatchLink keeps a video in perfect sync across everyone in a room, layered with the things that make watching *together* feel together: live chat, floating emoji reactions, timestamped notes, presence, and push-to-talk voice. It exists to collapse the distance between people watching the same thing apart. Success looks like a group that forgets they're using a tool — playback just stays in sync, reactions land in the moment, and talking is one keypress away.

## Brand Personality

**Movie night with friends.** Three words: cinematic, playful, cozy. The video is the star — the UI should dim like house lights and let the content take the room. But it is not a cold broadcast console; it's a warm, social space where presence and reactions are felt. Voice/tone: friendly, low-ceremony, never corporate. Energy peaks in the social moments (a reaction floats up, someone joins, voice goes live) and recedes everywhere else.

## Anti-references

- **Generic dark-mode SaaS dashboard** — the violet-on-near-black "developer tool" look that could be any B2B product. We are evolving away from this.
- **Cold broadcast/streaming-console UIs** (OBS, enterprise webinar tools) — clinical, control-dense, joyless.
- **Over-blurred glassmorphism** and decorative gradient-text heroes — AI-slop tells.
- **Kid-app over-playfulness** — bouncy, cartoonish, emoji-soup. Playful, not childish.

## Design Principles

1. **The content is the room.** When media is playing, the interface yields — dim chrome, restrained color, attention on the video. Decoration never competes with the film.
2. **Presence is the feature.** Who's here, who's talking, who's reacting — make people feel each other. Social signals get the warmth and the motion budget.
3. **One keypress from the moment.** The things you do constantly (react, talk, send) are immediate and obvious; host/admin controls recede until needed.
4. **Cozy, not clinical.** Warmth comes from color temperature, soft light, and motion that feels alive — not from stock gradients or glass. Earned familiarity over novelty in the controls.
5. **Every state is designed.** Loading, empty, error, kicked, reconnecting — a watch party is fragile (networks drop, hosts leave). Reassure at every seam.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text ≥4.5:1 on its surface (the current muted-slate-on-dark needs verification). Full keyboard path for primary actions (send, react, push-to-talk, join). Visible focus rings (already present). Reactions and voice state must not be conveyed by color/animation alone — pair with text/icon. Respect `prefers-reduced-motion` for floating reactions and reveals. Touch targets ≥44px for the phone guests who make up half the room.

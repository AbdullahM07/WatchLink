---
target: apps/web — WatchLink UI
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-06-20T22-42-33Z
slug: apps-web-watchlink-ui
---
# Design Critique — WatchLink (apps/web)

Method: source review of all surfaces + bundled slop detector. No live browser (room needs MongoDB + sockets).

## Design Health Score: 26/40 (Acceptable)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good status/toasts/talk-state; spinners where skeletons belong |
| 2 | Match System / Real World | 3 | Friendly language; "movie night" model never shown visually |
| 3 | User Control & Freedom | 3 | "Leave" is a loud danger button; delete has no undo/confirm |
| 4 | Consistency & Standards | 2 | Room controls hand-rolled vs shared Button/Input — two vocabularies |
| 5 | Error Prevention | 3 | Good zod validation; destructive actions unguarded |
| 6 | Recognition vs Recall | 3 | Icons mostly labeled; V-to-talk hint good |
| 7 | Flexibility & Efficiency | 2 | Only one shortcut (V) |
| 8 | Aesthetic & Minimalist | 2 | Generic dark-violet SaaS; gradient-text tell; flat room layout |
| 9 | Error Recovery | 3 | Good error cards + specific inline errors |
| 10 | Help & Documentation | 2 | No in-room first-run guidance |

## Anti-Patterns Verdict
Partly AI-generated, landing worst. Tells: gradient-text hero (page.tsx:31, real ban), identical icon-card grid, badge eyebrow, cards-everywhere chrome. Detector: gradient-text confirmed; side-tab borders in OG/icon assets (low prio); VoiceBar gray-on-color = FALSE POSITIVES (transparent /20 tints).

## Priority Issues
- [P1] Generic identity — no cinematic/playful/cozy personality. Fix: evolve palette (warm cinema-dark + warm social accent) + type pairing; kill gradient hero. -> colorize, typeset
- [P1] Room not cinematic — flat 1fr/340px grid, chrome competes with video, presence buried in card below. Fix: dim chrome on play, bring presence into stage, unify layout. -> craft/layout
- [P1] Two component vocabularies — Chat/MediaBar/VoiceBar bypass Button/Input. Fix: route through primitives, extract IconButton. -> extract, polish
- [P2] Presence/social moments under-played — joins/reactions/voice quiet; tiny motion budget. -> delight, animate
- [P2] Landing slop tells — gradient text, identical cards, eyebrow. -> quieter, typeset

## Persona Red Flags
- Casey (mobile): desktop layout reflowed; chat far below fold behind fixed participant card; Leave out of thumb zone.
- Jordan (first-timer): no in-room orientation for reactions/voice/V key.
- Riley (stress): delete message/note no confirm/undo; Leave loud-red but harmless.

## Minor
Contrast risk on slate-400/500 + placeholders; "Leave" wrongly uses danger variant; spinners vs skeletons; OG assets side-stripe.

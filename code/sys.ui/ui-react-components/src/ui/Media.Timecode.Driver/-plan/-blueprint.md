VirutalClock

“You are in conformance review mode: treat the plan as closed, do not add ideas, bullets, invariants, or scope; only check for internal inconsistency, incompleteness that blocks implementation, or contradictions with already-locked upstream contracts — and report nothing unless one of those strictly applies.”

## A — State machine surface (reducer + cmds/events contract)
- Only `video:time(vTime)` may auto-advance `currentBeat`; everything else is a discrete jump (`init/seek/next/prev/ended`).
- On discrete jumps, reducer sets `currentBeat` + `vTime` and emits descriptive cmds: `deck:load`, `deck:seek`, and (if intent is play) `deck:play`.
- Segment boundaries are keyed by `beat.segmentId`; crossing boundary swaps decks and re-bases active media.
- `video:ended` on the active deck is treated as authoritative: jump to next segment’s `beat.from`, or enter terminal `phase:'ended'`.
- Hardening: treat “definition too short / media ends early” as a first-class case → `video:ended` must win, and the machine must rearm cleanly on next user action.

===========

## B — Clock driver (what consumes A and produces inputs)
### Blueprint
- When intent is play and not in a pause window: drive `vTime` from the active deck’s `<video>` observed time (signals) → emit `video:time`.
- When in a pause window: keep `<video>` paused and drive `vTime` with an internal monotonic timer → emit `video:time`.
- Obey reducer cmds (cmd-complete) and keep mapping consistent across deck swaps and discrete jumps.
- Never invent progression past real media end: if `<video>` emits `ended` early, forward `video:ended` and let reducer decide next/terminal.
- **Gating: exactly one authoritative time source; after `video:ended(active)`, suppress all `video:time` until rebase (post `load/seek/swap`), then resume from the new active source.**
- B must be cmd-complete: B’s imperative runtime surface must be able to execute every cmd emitted by A’s Playback.reduce (the cmd union defined under m.playback/t.protocol.effect.ts → t.ts).
- B never computes beats/segments; it only forwards observations and executes A’s cmds (cmd-complete), with a single time-authority latch and post-ended suppression until cmd-based rebase.
- Missing media is an author-failure: if resolveBeatMedia(activeBeat) returns undefined when executing cmd:deck:load, emit runner:error and suppress all video:time until rebase; missing standby preload is skipped (logged) and becomes fatal only when that segment is activated.

### Quality Discipline / Implemetation Constraint-rules:
- Bridge-only.
- Explicit tiny driver state.
- One invariant → one test → one change.

Expanded:
1. Single responsibility: B is only a bridge between (a) reducer surface A and (b) runtime video/timer signals + imperative deck ops. No extra policy, no hidden state-machine.
2. Small algebra + explicit state: B is implemented as a tiny, typed set of explicit driver states and transitions. No emergent behavior, no “smart” inference, no cross-file distributed logic.
3. Prove-by-invariants: each new behavior is introduced as one atomic invariant + one focused test. No batch features. No patch layering. If it can’t be tested crisply, it doesn’t ship.


# @sys/ui-state

Framework-agnostic **UI state orchestration**.

Provides framework-agnostic UI state orchestration via pure state machines, reducers, and command algebras.

No **rendering**, **DOM access**, or **framework bindings**.

<p>&nbsp;</p>

---

<p>&nbsp;</p>


## import: @sys/ui-state/timecode

Deterministic, framework-agnostic **playback state** for time-based UI.

Models *what should happen as time advances*, independent of rendering, clocks, or media elements.
Designed to be embedded into any host environment capable of supplying time.

- Pure UI state (no side-effects)
- Explicit inputs, stable invariants
- Reducer-driven; testable in isolation

Internally, this module relies on the upstream **pure timecode primitives** from `@sys/std/timecode`.
Those primitives define the canonical semantics of time, beats, and ordering; this layer applies them to the UI domain, without extending or reinterpreting them. The result is predictable behavior and clear separation between **time semantics** and **UI orchestration**.

**Invariant:** `video:time` is the only input that may auto-advance `currentBeat`.


```ts
import { Playback } from '@sys/ui-state/timecode';
import { type t } from '@sys/std';


/**
 * Minimal playback state.
 */
const playback = Playback.init({
  beats: [
    {
      at: 0 as t.Msecs,
      id: 'intro',
      // ↑ Beat identifier:
      //   a stable semantic label for this moment in the timeline.
      //   Used for selection, UI binding, and orchestration —
      //   not derived from position or index.
    },
    {
      at: 1000 as t.Msecs,
      id: 'cut',
    },
  ],
});

/**
 * Advance state using video time.
 */
const next = Playback.reduce(playback, {
  kind: 'video:time',
  time: 1200 as t.Msecs,
});

next.currentBeat; // -> 'cut'
```

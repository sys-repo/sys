# @sys/ui-state

Playback state and commands, independent of any UI framework. The library does not render UI, read
the DOM, run a clock, or control media elements. The root exports `pkg` and types; `/timecode`
exports `Timecode.Playback`.

## Playback snapshots

`init` returns `{ state, cmds, events }`. Pass its **state**, not the whole snapshot, to `reduce`.
Your application supplies inputs and carries out the returned commands; the reducer only describes
what should happen.

```ts
import { Timecode } from 'jsr:@sys/ui-state/timecode';
import type { TimecodeState } from 'jsr:@sys/ui-state/t';

const timeline: TimecodeState.Playback.Timeline = {
  beats: [
    { index: 0, vTime: 0, duration: 1000, segmentId: 'scene' },
    { index: 1, vTime: 1000, duration: 1000, segmentId: 'scene' },
  ],
  segments: [{ id: 'scene', beat: { from: 0, to: 2 } }],
  virtualDuration: 2000,
};

const initial = Timecode.Playback.init({ timeline });
const next = Timecode.Playback.reduce(initial.state, {
  kind: 'video:time',
  deck: initial.state.decks.active,
  vTime: 1200,
});

console.info(next.state.currentBeat); // → 1 (a beat index, not a semantic ID)
```

Times are milliseconds on the virtual timeline; segment beat ranges are half-open `[from, to)`.
`video:time` derives the beat from virtual time. Initialization and navigation can also select
beats; `video:ended` from the active deck can jump to the next segment. Once playback has ended,
time ticks are ignored until an action such as play or seek makes it active again.

A play command expresses intent; it does not prove that media is playing. Your application owns the
clock and players and reports their readiness and status.

[Timecode state API](https://jsr.io/@sys/ui-state/doc/timecode)

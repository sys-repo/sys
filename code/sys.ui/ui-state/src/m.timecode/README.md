# m.timecode

Pure UI state (no side-effects).

- Types: `./m.playback/t.ts`, `./m.playback/t.protocol.*.ts`
- Spec: `./m.playback/-test/*`
- Implementation: `./m.playback/u.init.ts`, `./m.playback/u.reduce.ts`

Invariant: `video:time` is the only input that may auto-advance `currentBeat`.

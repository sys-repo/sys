# notes.md — Clock Driver B (contracts + derived semantics)

## What we now know (locked contracts)

### 1) Timeline pause semantics (ui-state)
- `PlaybackBeat` has:
  - `vTime` (global virtual time, msecs)
  - `duration` (media portion, msecs)
  - optional `pause` (extra virtual time after the beat, msecs)
- The authoritative “beat containment” rule is already encoded in `beatIndexFromVTime`:
  - a beat owns the interval: `[beat.vTime, beat.vTime + beat.duration + (beat.pause ?? 0))`
- Therefore, “pause window” is not a separate beat; it is the tail of the current beat:
  - media region: `t ∈ [beat.vTime, beat.vTime + beat.duration)`
  - pause region: `t ∈ [beat.vTime + beat.duration, beat.vTime + beat.duration + pause)`

### 2) Seek command semantics (ui-state → runner)
- `cmd:deck:seek` is expressed in **global** `vTime` (msecs).
- Runner must map `vTime → deck-local media seconds`.
- `setCurrentBeat` explicitly relies on `segmentId` boundaries to align with media identity:
  - Adjacent beats with different `url|slice` MUST have different `segmentId`.
  - This is the invariant that makes deck swaps and time bases coherent.

### 3) Video element / Signals binding (ui-react-components)
- `Player.Video.Element` reports time via `onTimeUpdate({ secs })` where `secs` is **CROPPED** time
  (it uses `Crop.lens(slice, fullDuration)` and publishes `lens.toCropped(el.currentTime)`).
- `jumpTo.second` is interpreted in the **cropped** domain:
  - `useJumpTo` maps cropped seconds → full seconds via `lens.toFull(croppedSec)` then sets `el.currentTime`.
- `endedTick` is a monotonic marker incremented when the element observes an “ended happened” boundary.

## Derived requirements for Driver B (no extra policy, just truthful mapping)

### A) Detect pause window using timeline (not guesses)
Given `timeline` and current `vTime`:
1. `beatIndex = beatIndexFromVTime(timeline, vTime)`
2. `beat = timeline.beats[beatIndex]`
3. `offset = vTime - beat.vTime`
4. Pause detection:
   - `inMedia = offset < beat.duration`
   - `inPause = !inMedia && offset < (beat.duration + (beat.pause ?? 0))`

### B) Map vTime → deck-local media time (must subtract pauses)
Because `vTime` includes pauses, but media time does not, the runner needs a segment-local mapping
that ignores pause durations.

For a given segment (identified by `segmentId` + `segment.beat.from/to`):
- Precompute `mediaMsAtBeatStart[i]` for each beat in the segment:
  - `mediaMsAtBeatStart[from] = 0`
  - `mediaMsAtBeatStart[i+1] = mediaMsAtBeatStart[i] + beats[i].duration`
  - (note: **pause is excluded** from media time)
- Then for any `vTime` within beat `i`:
  - `within = clamp(vTime - beats[i].vTime, 0, beats[i].duration)`
  - `mediaMs = mediaMsAtBeatStart[i] + within`
  - `mediaSecs = mediaMs / 1000`

Important: if `vTime` is in the pause region of beat `i`, clamp ensures `within = beats[i].duration`,
so `mediaSecs` stays pinned at end-of-beat while virtual time advances.

### C) Consequence for time authority in Blueprint B
- In media region:
  - authoritative source can be video signals `currentTime` (cropped secs) converted to vTime via the mapping above.
- In pause region:
  - keep video paused and advance `vTime` via monotonic timer;
  - media time stays constant (end-of-beat), so no seeking is required unless we detect drift.

### D) Resolver and author-failure behavior (already locked)
- `cmd:deck:load` uses injected `resolveBeatMedia(beatIndex) -> { src, slice? } | undefined`.
- If undefined for ACTIVE:
  - emit `runner:error` (author-failure) and suppress `video:time` until cmd-based rebase.
- If undefined for STANDBY preload:
  - skip preload (optionally log); only becomes fatal when that segment becomes active.

## Scope reminder (anti-sprawl)
These notes exist only to:
- prevent inventing pause semantics
- prevent inventing time mapping
- keep B strictly cmd-complete and bridge-only
Nothing here adds new features beyond Blueprint B.

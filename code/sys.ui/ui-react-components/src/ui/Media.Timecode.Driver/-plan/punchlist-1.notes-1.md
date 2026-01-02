# Video binding notes (Player.Video.Element + Player.Video.Signals)

Context:
These notes lock the contract between:
- Player.Video.Signals (signals surface B talks to)
- Player.Video.Element (the <video> binding that mutates those signals)

The Clock Driver (B) must treat these as upstream truth.

---

## Signals surface

- `VideoPlayerSignals.props` includes:
  - media: src, playing, currentTime, duration, buffering, buffered, slice
  - ended marker: endedTick (monotonic)
  - command: jumpTo (one-shot)

- `signals.jumpTo(second, { play? })` sets `props.jumpTo` only.
- `signals.play()/pause()/toggle()` only flip `props.playing` (intent), not the element directly.

---

## Element → signal wiring (observations)

### Ended
- `<video>` 'ended' event:
  - forces playing false outward (`onPlayingChange(false, 'media-ended')`)
  - triggers `onEnded({ reason: 'ended' })`
- Signals hook `usePlayerSignals` handles `onEnded` by bumping `endedTick`.
- `bumpEndedTick` is confirmed as strict monotonic `+1`:
  - `endedTick.value = endedTick.value + 1`
- Contract for B:
  - detect ended by observing `endedTick` increments per deck
  - emit: `{ kind: 'video:ended', deck }`

### Buffering
- Buffer start events: 'waiting', 'stalled' → `buffering=true`
- Buffer end event: 'canplay' → `buffering=false`
- Contract for B:
  - observe `props.buffering` transitions
  - emit: `{ kind:'video:buffering', deck, is:boolean }`

### Ready
- `props.ready` is derived in `onDurationChange`:
  - ready = `!!src && duration finite && duration > 0`
- Contract for B:
  - observe `props.ready` true per deck
  - emit: `{ kind:'video:ready', deck }`

### Time + duration (CROP-PROJECTED)
Time/duration published to signals are not "full media"; they are **cropped** if `slice` is set.

Wiring (`useMediaProgressEvents`):
- Listens to `<video>`:
  - `loadedmetadata`, `durationchange`, `timeupdate`
- On every update:
  - `fullDuration = finite(el.duration) ? el.duration : 0`
  - `lens = Crop.lens(slice, fullDuration)`
  - publishes **cropped duration**:
    - `onDurationChange({ secs: lens.duration.cropped })`
  - clamps and reads full currentTime:
    - `secsFull = clamp(el.currentTime, 0..fullDuration)`
  - publishes **cropped currentTime**:
    - `secsCropped = lens.toCropped(secsFull)`
    - `onTimeUpdate({ secs: secsCropped })`
  - also stores the full values internally in React state
    (`setDurationFull`, `setCurrentTimeFull`) for lens math.

Signals hook (`usePlayerSignals`) then:
- rate-limits publishing `props.currentTime` to ~50ms deltas.
- writes `props.duration` and derives `props.ready`.

Contract for B:
- `signals.props.currentTime` and `signals.props.duration` are already in the **slice/crop coordinate system**.
- Therefore, if B seeks/plays within a segment using `slice`, B should use **cropped seconds** consistently.
- B must not assume it can derive full-media seconds from these signals without applying the lens itself (if it ever needs that, which it probably should not).

---

## Signal → element wiring (commands)

### Seek (jumpTo)
- `props.jumpTo` is one-shot:
  - set by caller
  - cleared next macrotask by signals hook (guarded against newer cmd)
- Element hook `useJumpTo` applies:
  - map `jumpTo.second` through crop lens
  - set `el.currentTime = fullSec`
  - if play===true → attempt el.play() (errors swallowed)
  - if play===false → el.pause()
- Contract for B:
  - for `cmd:deck:seek(vTime)` set jumpTo with `{ play: undefined }` (preserve)
  - pause windows may explicitly force pause separately

---

## Implications for the Clock Driver (B)

1) Ended latch
- `endedTick` increments are the authoritative ended detector (per deck).
- After `video:ended(active)`, B must suppress `video:time` until cmd-based rebase.

2) Single time source
- When using the active video as the time authority:
  - the authoritative time signal is `signals.props.currentTime` (cropped seconds).
- When in pause windows (and video paused):
  - B’s monotonic timer becomes authority and must emit `video:time` in the same coordinate system.

3) Slice consistency
- Because Player.Video.Element publishes cropped time, B’s internal "playerSecs" should be treated as cropped seconds for that deck.
- The resolver should provide `{ src, slice? }` so B can keep that mapping consistent across load/seek.

# Recap: Seek Stability Investigation

## Chat Bootstrap (Short)
- Repo guidance in `/Users/phil/code/org.sys-repo/AGENTS.md` (LIGHT PASS default, DEEP PASS opt‑in; follow SYS.md).
- Bug: beat selection snapped to 0 / played from 0, especially on first load.
- Reducer issued correct seek cmds; media element ignored duplicate `jumpTo`.
- Fix: `Player.Video.Element/use.JumpTo.ts` only debounce if already at target.
- Driver hardening kept: pending seek through play, load gating, ready handling.
- Harness overlay shows `jumpTo` + click‑to‑copy JSON for quick debug.
- Pause-window regression: fails on first load; works after a seek.

## Problem
- Selecting a beat while playback is running often snapped to beat 0 or played from 0.
- The grid selection would stay on the clicked beat, but media would start at the beginning.
- Issue was intermittent and more visible on cold loads.

## Key Findings
- Reducer produced correct seek commands (`cmd:deck:seek` to target vTime).
- The seek command reached the video signals, but the HTML video element ignored it when it was a duplicate.
- `useJumpTo` debounced identical jump commands even if the element was not at the target time.
- This caused a “seek was issued but not applied” effect, leading to playback from 0 and later snapping.
- Root cause layer: `Player.Video.Element/use.JumpTo.ts` debounce policy (element-level).
- Confirming signal: `lastJumpTo` updated while `currentTime` stayed low until the debounce fix.

## Core Fix
- In `Player.Video.Element/use.JumpTo.ts`, only debounce identical `jumpTo` commands **when the element is already at the target** (within 50ms).
- This makes repeated seeks to the same target re-apply correctly.

## Supporting Hardening
- `Media.Timecode.PlaybackDriver/u.driver.ts`:
  - preserve pending seek through `cmd:deck:play`
  - gate seeks while media is not ready / pending load
  - prevent video:time from applying while load is pending

## Debug Tooling Kept
- Harness video overlay now shows `jumpTo`, `lastJumpTo`, `ready`, `currentTime`, and supports click-to-copy JSON.

## Notes
- Pause-window fix (“short media then pause”) is separate; this seek fix is independent.
- Current behavior: on first load, pause-window does not trigger; after performing a seek/jump, pause-window works.
- Once this is stable, we can revisit the pause behavior.

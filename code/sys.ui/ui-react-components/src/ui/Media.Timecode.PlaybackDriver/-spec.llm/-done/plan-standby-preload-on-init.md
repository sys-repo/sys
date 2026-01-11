# Plan: Preload Standby Deck on Init (ui-state)
Status: Done

## Goal
Ensure standby deck is preloaded on initial load without changing hooks.

## Problem
`usePlaybackDriver` calls `Playback.init()` directly, so the `playback:init` reducer path
and its `loadForBeat` standby preload are never exercised on first boot.

## Approach
1) Update `Playback.init()` to enqueue standby preload using the same policy as
   `playback:init` / `loadForBeat` (active beat + next segment preload).
2) Remove media-url guard so preload always issues `cmd:deck:load` when a next segment exists.
3) Keep the hook unchanged; let ui-state own preload policy.
4) Add/adjust ui-state tests to assert standby `cmd:deck:load` on init even without media URL.

## Files
- ui-state: `code/sys.ui/ui-state/src/m.timecode/m.playback/u.init.ts`
- ui-state tests: `code/sys.ui/ui-state/src/m.timecode/m.playback/-test/-u.init.invariants.test.ts`

## Resolution
- Preload command now emitted on init even without media URL.
- Added init invariant test for missing media URL case.

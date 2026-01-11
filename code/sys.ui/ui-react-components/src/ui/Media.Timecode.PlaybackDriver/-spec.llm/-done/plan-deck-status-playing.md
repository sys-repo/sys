# Plan: Deck Status Playing/Paused Accuracy
Status: Done

## Goal
Ensure deck status reflects actual playback state (playing/paused), not stale intent.

## Problem
InfoPanel shows decks as "playing" even during virtual pause or when standby is not actually playing.

## Approach
1) Emit `video:playing` from the driver when deck `playing` signal toggles.
2) Add reducer handling to update deck status for `video:playing`.
3) Add unit tests for reducer + driver signal emission.

## Files
- ui-state: `code/sys.ui/ui-state/src/m.timecode/m.playback/t.protocol.input.ts`
- ui-state: `code/sys.ui/ui-state/src/m.timecode/m.playback/u.reduce.ts`
- ui-state test: `code/sys.ui/ui-state/src/m.timecode/m.playback/-test/-u.reduce.reduce.intent-vs-status.test.ts`
- driver: `code/sys.ui/ui-react-components/src/ui/Media.Timecode.PlaybackDriver/u.driver.ts`
- driver test: `code/sys.ui/ui-react-components/src/ui/Media.Timecode.PlaybackDriver/-test/-u.driver.test.ts`

## Resolution
- Driver emits `video:playing` on playback toggles.
- Reducer updates deck status to `playing/paused`.
- Added driver + reducer unit tests to lock behavior.

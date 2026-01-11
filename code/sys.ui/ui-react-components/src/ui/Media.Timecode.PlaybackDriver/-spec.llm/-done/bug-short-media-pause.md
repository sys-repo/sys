# Playback Driver: short media skips virtual pause

## Context
- Files: `u.driver.ts`, `-test/-u.driver.test.ts` in this package.
- Architecture: pure state machine lives in `@sys/ui-state/timecode`; bug is isolated to the driver bridge.
- Scenario: timeline beat expects > media duration (authoring error) plus a virtual pause (eg: beat total 12s, media 4s, pause 2s).

## Bug
1. `mapDeckSecondToVTime` never reaches `pause.from` because deck seconds stop when media ends early.
2. `endedTick` bump triggers `video:ended` immediately (`u.driver.ts`), swapping segment/beat without honoring pause window.
3. Reducer believes beat (including pause) finished, so virtual pause is skipped.

## Fix outline
- In the driver’s ended handler, detect when `state.intent === 'play'`, a pause window exists for `state.currentBeat`, and `state.vTime < pause.from`.
- Instead of dispatching `video:ended`, clamp to `pause.from`, pause the deck, start the pause timer, and suppress ended emission until the pause timer reaches `pause.to`.
- When the timer completes, dispatch the final `video:time` (already happens) and only then allow `video:ended` to fire (if the deck truly ended).
- Ensure `timeSource` transitions mirror the existing pause clamp path.

## Test plan
Add a unit test beside the other pause-window tests in `-test/-u.driver.test.ts`:
1. Build the pause clamp fixture where beat.duration is intentionally wrong (already provided).
2. Drive currentTime to just before pauseFrom, then simulate `endedTick` bump (media ends early).
3. Assert the driver (a) pauses the deck, (b) dispatches a `video:time` clamped to `pause.from`, (c) starts the pause timer (advance schedule to confirm it emits through `pause.to`), and (d) only emits `video:ended` after the pause window completes (or suppresses it if redundant).

## Notes
- No ui-state reducer changes needed.
- Keep the fix minimal: mostly in the `observeDeck` ended effect and possibly a helper to gate `video:ended` emission until pause windows finish.
- After coding, rerun `pnpm test --filter @sys/ui-react-components Media.Timecode.PlaybackDriver/-test/-u.driver.test.ts` (or equivalent) to cover the new case.

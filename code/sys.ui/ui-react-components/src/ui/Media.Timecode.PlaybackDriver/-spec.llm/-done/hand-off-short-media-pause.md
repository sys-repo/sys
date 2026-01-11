### Hand-off: Short media skips pause window

- **Files already loaded:** `u.driver.ts`, `use.PlaybackDriver.ts`, `-test/-u.driver.test.ts`, `-plan/bug-short-media-pause.md`.
- **Bug recap:** When media ends before the beat’s pause window (`pause.from`), the driver dispatches `video:ended` immediately. No pause timer starts, and the reducer auto-advances to the next beat, skipping the virtual pause.
- **Fix intent:** Update `u.driver.ts` so that if `endedTick` fires while `state.intent === 'play'` and `state.vTime < pause.from`, it clamps vTime to `pause.from`, pauses the deck, starts the pause timer, and defers `video:ended` until the pause completes. No reducer changes required.
- **Test to add:** Extend `-test/-u.driver.test.ts` near the pause-window tests; simulate currentTime < pauseFrom, bump `endedTick`, advance deterministic schedule, and assert `video:time` clamps to `pause.from`, timer runs through `pause.to`, and `video:ended` only appears after the pause window.
- **Next steps:** Implement driver change + test, run the targeted unit test (`pnpm test --filter ...u.driver.test.ts`), then update docs/plan if needed.

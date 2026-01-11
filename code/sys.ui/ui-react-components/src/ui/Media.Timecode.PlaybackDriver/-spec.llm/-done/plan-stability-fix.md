# Plan: PlaybackDriver Stability Fix (vTime Redraw + Segment Rollover)
Status: Done

## Goal
Keep vTime updating during play, including across segment boundaries, without manual seeks.
Fix first-load time stall where no grid updates or pause windows occur until a manual seek.

## Steps
1) Verify `log: true` reaches `u.driver.ts` and driver logs are still silent.
2) Fix Player.Video.Element time reporting: when media duration is 0/NaN/Infinity,
   do NOT clamp `currentTime` to `fullDuration=0`; pass through `el.currentTime`.
3) Confirm driver `currentTime → video:time` emits immediately on first load (no seek).
4) Remove temporary diagnostics once stable.

## Notes
- Root issue: `suppressTimeAfterEnded()` was being applied for non-terminal ends.
- Fix: suppress only when there is no next segment.
- New root issue: `use.Media.ProgressEvents` clamps time to 0 when duration is not finite,
  so `currentTime` never advances and driver does not emit `video:time`.

## Resolution
- Allow time updates before duration is known.
- Clear pending seek once the current time surpasses the target, so `video:time` emits.

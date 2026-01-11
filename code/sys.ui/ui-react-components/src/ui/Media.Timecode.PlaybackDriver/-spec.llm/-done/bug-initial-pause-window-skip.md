# Bug: Initial Pause Window Skips (First Play Only)

## Status
Done.

## Repro
1) Fresh load
2) Click grid to beat 3 (1-based)
3) Press play (controller cmd)

## Expected
After the media time (short media), the synthetic pause window should run
(eg media ~4s then pause ~2s) before advancing.

## Actual
Pause window does not happen; it advances immediately to beat 4
(first beat in segment 2).

## Note
If you click back to beat 3 and play again, the pause window behaves correctly.

## Resolution
Guard `endedTick` during pause-timer ownership to prevent a second end signal
from skipping the pause window (`u.driver.ts`).

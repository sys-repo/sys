# Bug: Seek Back from Beat-4 Jumps to Beat-1
Status: Done (not reproducible after pending-seek fix)

## Repro
1) Play from beat-1 to beat-4 (segment 2 begins; initial load now stable).
2) Click grid to seek back from beat-4 to beat-3.

## Expected
Playback seeks to beat-3 and continues there.

## Actual
Playback jumps to beat-1.

## Notes
- Occurs after successful segment rollover (beat-4).
- Looks like a seek/segment boundary regression.

## Resolution
- No longer reproducible after pending-seek overshoot fix in driver.

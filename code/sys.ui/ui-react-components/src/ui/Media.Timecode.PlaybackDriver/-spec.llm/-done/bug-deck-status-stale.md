# Bug: Deck Status/Ready Stale While vTime Advances
Status: Done

## Repro
1) Fresh load harness with a bundle.
2) Observe KV panel (time advances) and deck status rows.

## Expected
Active deck reports ready/non-empty when media is loaded and time advances.

## Actual
`Deck-A`/`Deck-B` show `not-ready | empty` even while time is advancing and media is visible.

## Notes
- vTime advances via `video:time`, but deck `ready/status` are not updated.
- Likely missing `video:ready` (and/or status) dispatches from the driver.

## Resolution
- Driver now emits `video:ready` and `video:buffering` from deck signal transitions, updating reducer deck status.

@sys.driver-vite
ready-screen-collapse.plan.md
- [x] 310e46428 fix(driver-vite): shrink the ready log tail before hiding shortcuts

## What the operator sees

When shrinking, give up older output first, then the shortcut strip, then the newest output. At the handoff, the operator loses the shortcuts but sees exactly the same log entries. Growing the window retraces the same frames. This is a priority rule, not a set of terminal-height breakpoints.

## One tuning point

In `code/sys.driver/driver-vite/src/m.vite/u.dev/u.screen.layout.ts`, give the ready formatter one internal default: `READY_LAYOUT.preferredTailRows = 5`. It means the number of recent output rows worth keeping ahead of shortcut hints. Tune this one nonnegative whole-row value and rerun the screen. Do not encode the default again in the allocator, viewport breakpoints or test expectations. It is independent of the existing `logLines` option (the maximum visible tail) and of buffer retention. No public option, flag or runtime configuration plumbing.

## Allocation before rendering

`DevScreenLayout.toString` decides how many log rows and whether the footer can coexist before passing them to `Cli.Screen.Dock.bottom`. The dock's placement and clipping contract is unchanged.

Use one pure, Vite-local row-budget function. It takes counts only: `room` (after cursor and actual fixed frame rows), `wanted` (lesser of retained rows and normalized `logLines`), `footerRows` (length of the actual width-resolved footer), and `preferredTailRows`. It returns `{ logRows, showFooter }`. Compute these together so the renderer cannot budget the same rows twice.

- No width-fitting footer: use up to `min(room, wanted)` log rows. Reserve nothing.
- Otherwise protect `tail = min(wanted, preferredTailRows)`. If `room >= tail + footerRows`, show the whole footer and use up to `min(wanted, room - footerRows)` logs.
- Below that boundary, hide the whole footer and use `min(tail, room)` logs. Any residual space smaller than the footer stays unused; spending it on older rows is precisely what causes a rebound. Never emit filler for a hidden footer.

The runtime still supplies the viewport and cursor reservation. The renderer owns the nonnegative row budget, newest-suffix selection (including zero), sequence-column alignment and formatting. The dock still owns bottom placement, padding and final clipping. No generic layout engine, startup/ready unification, changes to retained output, key handling or resize state.

## Proof

1. In `code/sys.driver/driver-vite/src/m.vite/-test/-u.dev.screen.test.ts`, start with a red rendered-frame regression: at fixed width and with overflow, there must be a height where the complete footer is visible while the tail is shorter than the allowed maximum. Sweep adjacent heights across the handoff. Assert the exact same newest suffix on either side, both hints and their divider present or absent together, no older row reappearing on shrink, and identical output on the reverse sweep. Size the fixture relative to the preference, not today's terminal height or sequence numbers. Exercise the shortened-tail-with-footer case when demand exceeds the preference; when the preference covers all possible demand, the entire wanted tail correctly takes priority.
2. Prove tunability independently of the shipped default. With six available rows, twelve wanted and a two-row footer, a preference of two must yield four logs plus shortcuts; a preference of seven must yield six logs without shortcuts. These are test inputs, not production breakpoints. Assert concrete expected results, not a test-side copy of the formula. Cover empty/sparse demand, a `logLines` cap below the preference (including zero), no width-fitting footer and tiny heights. Keep retention-only tests independent of the tuning point, e.g. by choosing a width without shortcuts. Preserve existing frame bounds, startup and docking coverage.
3. The rendered-frame regression failed before the fix. The formatter and runtime screen suites passed together (60 steps), and `deno task check` passed. After the test-only `expectBudget` extraction, the formatter suite passed again (32 steps); exact-file format checks passed.
4. Live terminal proof is still outstanding: with overflowing logs, shrink and grow one row at a time. Try another preference by changing only the internal default; verify the handoff moves, the history never jumps backwards, and no stale footer remains. Choose the final value by feel.

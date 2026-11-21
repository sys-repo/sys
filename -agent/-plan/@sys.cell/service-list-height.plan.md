@sys.cell
service-list-height.plan.md
- [x] b2c4490f2 fix(cli): preserve the last visible row on full-height repaint
- [x] f8f80bd18 feat(cell): preserve the service list as terminal height shrinks

## Outcome

Interactive `cell start` keeps service names visible ahead of access URLs, and access URLs ahead of configuration. At fixed width with unchanged inputs and callback results, shrinking does not restore discarded fields; growing restores them in their original order. Full-fit rendering, raw output, and saved `serviceText` are unchanged. HTTP output remains unbudgeted.

## 1. Paint the last row

`Cli.Screen.repaint(frame)` used to erase down after painting the last row. When the cursor address below the frame clamped to the bottom margin, the erase cleared the row just painted. Repaint now erases before painting the final row. It remains stateless and independent of Cell, uses one synchronized write, and preserves final cursor placement, empty frames, explicit blank rows, and redirected output. Callers do not reserve a spare row.

## 2. Select service rows

The Cell reporter reserves the header and visible completion summary on every repaint, then passes the remaining **physical body rows** as `maxRows` to `Cli.Fmt.Service`. Reporter spacing uses only spare rows; its final slice bounds the frame, not the choice of services. The formatter drops dashed dividers before content and selects rows globally: first title lines, first valid URL per service, valid secondary URLs, then other detail lines. Ties follow display order. It emits the selection in the original order, retaining prefixes of fitted multiline pairs and preserving authored blanks within those prefixes.

The first valid URL need not be clickable. Invalid placeholders and URL-looking details do not qualify. If the original URL-label row is hidden, the retained main URL inherits its fitted label without changing the linked target. The last visible title gets a dim `+N more` for hidden services if it fits. If an errored service loses both its state and diagnostic rows, its title uses the captured error state, not a detail label: keep the name with `error` if possible, otherwise a fitted name with `!`, or just `!` at the narrowest width. State and identity take precedence over annotation and count.

| Body rows | Visible facts, in display order |
|---:|---|
| 4 | A / A's main URL / B / B's main URL |
| 3 | A / A's main URL / B |
| 2 | A / B |
| 1 | A with `+1 more` if it fits |
| 0 | none |

The formatter fits and validates all original pairs at a shared width before selecting physical row prefixes. Hidden rows still count toward the original limits, including padding, separator width, and encoded targets. Detail callbacks retain their order, arguments, and failure behavior even at zero body rows with usable width. An unusable width still exits before formatting. Replacements and selected output are checked separately, without charging the selected output against the full original again. Service lifecycle behavior is unchanged.

## Verification and limits

- The Screen regression checks final cells in a bounded terminal model across a 2 → 1 → 2 resize, including bottom-margin clamping and removal of stale rows and tails. Byte-level tests also cover the synchronized payload and non-TTY behavior.
- The CLI formatter tests cover shrinking and restoration, authored blank continuations, URL admission and link targets, compact errors and omission styling, exact 65,535-code-unit and 4,096-line limits, and rejection of padded-label overflow before the callback even when the row is hidden.
- The Cell reporter harness verifies resize after header and summary reservation, full raw and saved output, and both outcomes at a summary-only height: successful completion paints the summary; a hidden callback failure reports the original cause without repainting.
- Final pre-landing checks passed: full CLI unit suite (55 tests, 442 steps), keyboard entry proof, focused Cell suites (7 tests, 71 steps), both module type checks, targeted formatting and lint, and `git diff --check`. No live-terminal resize smoke test was performed.

The remaining type-assertion, documentation, and terminal-limit cleanups are separate from this landed work.

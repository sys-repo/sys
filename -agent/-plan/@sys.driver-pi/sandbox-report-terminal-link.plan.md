sandbox-report-terminal-link.plan.md
- [x] df34601d5 feat(cli): add OSC 8 terminal hyperlink formatting
- [x] ad7b0b86d fix(driver-pi): link persisted sandbox report path
- [x] dedc60db0 fix(driver-pi): preserve sandbox sheet width with report links

## Purpose

Make the compact sandbox sheet expose its persisted report as one short, clickable filename that opens the exact report file.

## Original seam

- `PiSandboxFmt.table` owned the compact launch sheet.
- `formatReportPath` rendered a cwd-relative path and ellipsized it to the table budget.
- `PiSandboxReport.write` supplied the complete persisted path.
- `@sys/cli` had terminal detection, ANSI stripping, and cell-width measurement, but no terminal hyperlink primitive.

## DMIND frame

- Subject: the persisted sandbox report.
- Need: open the report directly without scanning or copying a compressed path.
- Affordance: a compact underlined clickable basename in the `report` row.
- Constraint: this is raw terminal output, not a Markdown rendering surface.
- Feedback: a stable underline plus terminal-native hover/click behavior without exposing the target.
- Fit: shared terminal encoding in `@sys/cli`; Driver Pi owns report-specific label and fallback policy.

## Decision

Use an OSC 8 hyperlink whose visible label is the underlined report basename and whose target is the canonical absolute `file:` URL. Do not emit literal `[filename](full-path)` Markdown: Ghostty supports terminal hyperlinks, while raw terminal output does not generally interpret Markdown.

Keep non-terminal output truthful by preserving the current plain display path. Hyperlink control sequences must not alter measured width, stripped output, table alignment, or repaint behavior.

## Implementation boundary

### `@sys/cli`

- Add one minimal OSC 8 formatter under `Cli.Fmt`.
- Keep encoding independent of Driver Pi and filesystem policy.
- Prove exact open/close control framing, ANSI stripping, and zero-width measurement behavior.
- Avoid terminal-brand detection and Markdown parsing.

### `@sys/driver-pi`

- Use the shared formatter only for terminal output.
- Render the underlined basename as the visible report label.
- Target the complete absolute report path through `Path.toFileUrl(...)`.
- Preserve the existing relative/ellipsized report path as the non-terminal fallback.
- Keep all other sandbox rows and launch-frame ownership unchanged.

## Verification

- Focused `@sys/cli` tests: exact OSC 8 framing, stripped label, measured label width, and serialized file URL target.
- Focused Driver Pi formatter tests: underlined terminal basename link, complete target path, non-terminal fallback, narrow-width alignment, and no change to permissions rows.
- Driver Pi profile-launch tests: preview and final repaint still contain one truthful persisted report reference.
- Runtime probe in Ghostty: clicking the basename opens the exact generated `.sandbox.log.md` file.

## Non-goals

- No Markdown renderer in the CLI.
- No Ghostty-specific behavior or configuration.
- No hyperlinking of every displayed path.
- No change to report persistence, contents, or lifecycle.

## Current evidence

- `df34601d5 feat(cli): add OSC 8 terminal hyperlink formatting` is landed.
- `ad7b0b86d fix(driver-pi): link persisted sandbox report path` is landed and renders an underlined linked basename only for terminal output while preserving the plain non-terminal fallback.
- A post-landing narrow-terminal regression showed Cliffy counting OSC 8 target bytes during layout and padding the permissions row beyond the physical screen width.
- `dedc60db0 fix(driver-pi): preserve sandbox sheet width with report links` is landed and applies the OSC 8 hyperlink after table rendering so metadata cannot distort row geometry.
- Driver Pi formatting and type checks pass.
- Focused verification passes: 2 suites, 19 steps.
- Full Driver Pi verification passes: 48 suites, 248 steps.
- Ghostty recognizes the report as a modifier-hover link; clicking through to the exact generated report remains the runtime acceptance.

## Retirement boundary

Complete the Ghostty click-through acceptance, then retire this plan.

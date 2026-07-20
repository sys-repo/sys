# Stable dev reporter DMIND plan

stable-dev-reporter.plan.md
- [ ] refactor(driver-vite): harden dev spawn output ownership
- [ ] feat(driver-vite): add stable screen reporter for dev output
- [ ] test(driver-vite): pin dev reporter raw, screen, and failure visibility

## Intent

Upgrade `deno task dev` from raw Vite scrollback into a stable, parent-owned console window:
  - `--reporter=auto|screen|raw`;

```text
Info
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module   @sys/ui-components@0.0.317
         http://localhost:1235/
         ↓
         input    src/index.html
         output   dist/ ← digest:sha256:#4c5a1

vite
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
 out     VITE v8.1.5 ready in 183 ms
 out     Local: http://localhost:1235/
 err     warning: ...
```

The key design move is not decoration. It is terminal ownership.

The Vite child remains the substrate truth. `@sys/driver-vite` owns the frame, redraw cadence, bounded log view, and failure surfacing.

## BMIND review

Read paths:

- `code/sys.driver/driver-vite/src/m.vite/u.dev.ts`
- `code/sys.driver/driver-vite/src/m.vite/u.keyboard.ts`
- `code/sys.driver/driver-vite/src/m.vite/u.log.ts`
- `code/sys.driver/driver-vite/src/m.vite/u.wrangle.ts`
- `code/sys.process/src/m.process/u.proc/u.spawn.ts`
- `code/sys.process/src/m.process/u/u.kill.ts`
- `code/sys.process/src/m.process/u/u.ts`

### What is already principled

- Vite is launched through `Deno.Command` argv, not shell string assembly.
- `Wrangle.command(...)` centralizes the Deno/Vite command construction and bootstrap cleanup.
- `Process.spawn(...)` gives a long-running handle with stdout/stderr events, readiness, and lifecycle disposal.
- Readiness is semantically real: output-derived URL detection followed by HTTP confirmation.
- Startup failure already preserves captured stderr.
- Cleanup is explicit: child dispose first, bootstrap cleanup after.

### What is not yet clean enough for the stable reporter

- Raw mode and screen mode currently share the same terminal surface.
  - `Process.spawn({ silent: false })` writes child chunks directly to stdout.
  - Keyboard redraws later clear/reprint info.
  - A stable frame requires one writer: the parent reporter.
- Output capture is stderr-only today for startup errors.
  - The screen reporter needs stdout and stderr captured as line events.
  - Failure reports should include a bounded recent tail, not only stderr.
- Chunk events are not line events.
  - Vite can emit partial chunks.
  - The reporter needs a line assembler so table rows are truthful and stable.
- `open` currently uses shell sugar in `keyboardFactory`.
  - The Vite child path is argv-clean already.
  - A tidy pass can consider direct argv invocation for `open` as a small Unix-discipline cleanup, but it is not the core reporter seam.

## DMIND frame

The experience should feel like a small instrument panel, not a prettier pipe.

Principles:

- Stable frame over scrollback.
- One terminal writer in screen mode.
- Raw Vite truth remains available.
- Bounded memory, bounded terminal height.
- No curses/PTY/alternate-screen dependency in the first pass.
- No hidden failures: all startup and runtime failures keep a visible recent tail.
- Non-TTY automation should not receive redraw control sequences by default.

## Reporter modes

Introduce dev reporter mode:

```ts
type DevReporterMode = 'auto' | 'screen' | 'raw';
```

Default:

- `auto`
  - screen when interactive terminal support is available;
  - raw when not interactive or when keyboard support is unavailable early enough to know.
- `screen`
  - force stable screen reporter.
- `raw`
  - preserve current Vite passthrough behavior as closely as possible.

CLI shape, exact names to confirm during implementation:

```text
--reporter=auto|screen|raw
--log-lines=10
```

Public API shape, exact names to confirm in `t.ts` first:

```ts
reporter?: 'auto' | 'screen' | 'raw';
logLines?: number;
```

## Target screen behavior

### Startup default

- Clear/redraw into one stable frame.
- Show compact `Info` block.
- Do not show `options` by default.
- Show `vite` tail below info.
- Keep log tail height bounded by `logLines` and terminal height.

### Keyboard

- `i` toggles or shows options/help panel.
- `shift+i` keeps extended workspace detail, likely as an expanded info render.
- `k` clears the visible log buffer and redraws.
- `o` opens browser.
- `ctrl+c` disposes child and exits.

### Log tail

Keep two representations:

- raw chunks/lines for diagnostics and final error text;
- stripped, layout-safe lines for screen rendering.

Render as a minimal reality table:

```text
vite
┄┄┄┄┄┄┄┄┄┄┄┄
 out     ready in 183 ms
 err     warning: dependency pre-bundled again
```

Open design detail:

- Timestamp is optional. Start without it unless it earns its place.
- Source labels should be quiet (`out` / `err`) and not dominate the content.
- Very long lines should be clipped or softly truncated to terminal width.

## Implementation phases

### Phase 1: tidy-first spawn/output ownership

Goal: make the seams explicit before changing the experience.

- Add dev reporter options to the `Vite.Dev.Args` type surface.
- Add CLI parsing support in `ViteEntry.Args.Dev`.
- Normalize reporter mode in one helper.
- In raw mode, keep current behavior.
- In screen mode, force child `silent: true` and make the parent the only terminal writer.
- Capture both stdout and stderr before `whenReady()` so startup failures have full context.
- Add a small line-buffer helper for process events.
- Preserve existing readiness detection behavior byte-for-byte except for routing through captured events if needed.

Acceptance:

- Raw mode still shows Vite output directly.
- Screen mode never lets the child write directly to stdout/stderr.
- Startup failure includes stderr and recent captured tail.
- Existing dev startup tests still pass.

### Phase 2: compact info polish

Goal: prepare the stable frame with less vertical waste.

- Remove double blank-line spacing in `Log.Help.toString(...)` or introduce a compact `Log.DevScreen.Info` formatter.
- Keep the existing full help formatter available for `i` if it remains useful.
- Keep screen-width top HR.
- Keep secondary dashed dim-green rule for options/help sections.
- Keep `options:` colon dim green.

Acceptance:

- Compact info matches the visual target from the screenshot.
- Existing options rendering remains available, but not necessarily default on startup.

### Phase 3: screen reporter renderer

Goal: build a pure render surface before wiring runtime redraw.

- Add a formatter that accepts a snapshot:
  - pkg
  - dist
  - paths
  - url
  - log lines
  - options visibility
  - terminal width/height if available
- Return a complete frame string.
- Strip child ANSI for layout by default.
- Bound visible log lines by `logLines` and terminal height.
- Keep the renderer pure enough to test without spawning Vite.

Acceptance:

- Renderer output is deterministic under fixed width/height.
- Log view never exceeds the configured line count.
- Options block can be hidden or shown.

### Phase 4: runtime redraw loop

Goal: convert process output into stable frames without overflow.

- Subscribe to `proc.$`.
- Feed stdout/stderr events into the line buffer.
- Redraw after line changes with a small throttle to avoid flicker.
- Use a simple clear + full-frame print strategy first.
- Avoid alternate screen unless a later proof shows clear/redraw is insufficient.
- Stop redraw cleanly on dispose.

Acceptance:

- Vite output does not scroll the terminal in screen mode.
- The visible frame stays bounded.
- Rapid output does not flood redraws.
- Ctrl+C still disposes the Vite child and bootstrap.

### Phase 5: keyboard integration

Goal: make controls act on the screen state, not ad hoc prints.

- Give keyboard handler access to reporter state/actions:
  - toggle options
  - clear log tail
  - redraw now
  - open URL
  - dispose/exit
- Keep unsupported keyboard fallback sane.
- If keyboard is unavailable and reporter is `auto`, prefer raw mode before emitting screen control sequences.

Acceptance:

- `i` shows options without losing log tail.
- `k` clears the visible log tail.
- `shift+i` can show extended info without breaking the stable frame.
- Unsupported keyboard does not crash dev server lifecycle.

### Phase 6: failure and exit behavior

Goal: failures stay visible and truthful.

- On startup failure, stop screen redraw and print a final failure block with:
  - cwd
  - requested/resolved port context when known
  - stderr
  - recent log tail
- On runtime child exit after readiness, surface the exit status and recent tail if available.
- Do not swallow raw Vite diagnostics.

Acceptance:

- A Vite startup error is more diagnosable than today, not less.
- Raw mode remains available for exact stream behavior.

## Tests and proof

Use narrow tests first.

Suggested test seams:

- line-buffer chunk assembly;
- max-tail trimming;
- compact info spacing;
- screen renderer with options hidden/shown;
- raw reporter mode passes `silent: false` or equivalent passthrough behavior;
- screen reporter mode passes `silent: true` and captures stdout/stderr;
- startup error includes recent tail.

Runtime proof:

- run a sample `deno task dev` under `@sys/driver-vite`;
- observe stable frame with no scroll overflow;
- trigger `i`, `k`, `o`, and `ctrl+c`;
- run raw mode and confirm current Vite output remains available.

## Non-goals for first pass

- No PTY emulation.
- No alternate-screen/curses dependency.
- No full scrollback viewer.
- No persistence of logs to disk.
- No attempt to parse every Vite message semantically.
- No broad `@sys/process` refactor unless a concrete seam is required.

## Open decisions

1. Should `i` toggle options persistently, or show options for a short-lived redraw only?
2. Should log rows include timestamps, or are `out` / `err` labels enough?
3. Should `shift+i` become an expanded frame mode rather than a one-off extended print?
4. Should raw mode be named `raw`, `vite`, or `passthrough` on the CLI?

Initial bias:

- `i` toggles options persistently.
- no timestamps initially.
- `shift+i` toggles expanded frame mode.
- CLI name: `raw`, because it is short and honest.

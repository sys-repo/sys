# Stable dev reporter / terminal presentation plan

## Commit arc

- [x] af3bdfdce refactor(driver-vite): harden dev spawn output ownership
- [x] 240eb80e0 refactor(driver-vite): group vite utility files under /u/*
- [x] 64bc287b2 refactor(driver-vite): group vite config utility files under /u/*
- [x] d20ce7631 feat(driver-vite): add stable screen reporter for dev output
- [x] cdda1df03 fix(driver-vite): suppress benign import-map warning in screen reporter
- [x] 1dc6f70fb chore(driver-vite): bump
- [x] 31facd721 fix(driver-vite): polish dev screen flow and compact header
- [x] fac77a0a7 fix(driver-vite): make build output width aware
- [x] 45fb5d7a6 fix(driver-vite): make task help output width aware
- [x] 779303663 fix(driver-vite): keep dev screen rows width safe
- [x] a98c84fb2 fix(driver-vite): keep info bundle rows width safe
- [x] de84dfd80 refactor(driver-vite): rename API task formatter
- [x] 1ef3f368d fix(driver-vite): polish workspace import-map output
- [x] 448049bd0 fix(driver-vite): show dev startup spinner in screen reporter
- [x] c81d37d5d feat(cli): expose spinner test double

Related, not part of this plan arc:

- [x] 20f68c55c chore(workspace): refreshed 10 workspace packages (49 jsr:publish modules)

## Last landing

Landed commit:

```text
c81d37d5d feat(cli): expose spinner test double
```

This landing completed the reusable spinner test-double follow-up:

- added `@sys/cli/testing`;
- added `FakeSpinner.create(...)` as a tiny spinner-compatible test helper;
- kept runtime/Ora behavior unchanged;
- kept the fake free of timers, terminal writes, and `this` binding;
- split implementation into canonical `common.ts`, `t.ts`, `m.FakeSpinner.ts`, and `mod.ts`;
- split tests into API export proof and behavior/type tests;
- replaced the local `driver-vite` fake spinner with `FakeSpinner`.

## Previous landing: startup spinner

Landed commit:

```text
448049bd0 fix(driver-vite): show dev startup spinner in screen reporter
```

This landing completed the startup spinner pass by keeping startup and ready frames on the same
visible dev-log affordance:

- startup clears immediately, prints the static `Dev` header, then lets Ora own only the dynamic
  body underneath;
- the parent seeds exactly one visible log row: `1 out starting…`;
- real Vite rows append normally after the seeded row;
- startup and ready frames render the same `DevOutputLog` rows;
- duplicate child/toolchain `starting…`/`starting Vite…` rows are suppressed only in screen mode;
- raw reporter behavior remains exact.

## Previous landing: workspace import-map output

Landed commit:

```text
1ef3f368d fix(driver-vite): polish workspace import-map output
```

This landing completed the current `@sys/driver-vite` terminal-presentation pass by polishing the
`shift+i` workspace import-map output.

### Scope boundary

Workspace import-map display belongs in `m.vite.config.workspace/*` because the rendered data is
`t.ViteDenoWorkspace.aliases`, projected for Vite/Rollup resolution.

It is not:

- generic `@sys/esm` module-specifier formatting;
- generic `@sys/workspace` graph/CI display;
- `@sys/driver-deno` workspace loading.

### Implemented files

- `src/m.vite.config.workspace/common.ts`
- `src/m.vite.config.workspace/mod.ts`
- `src/m.vite.config.workspace/t.ts`
- `src/m.vite.config.workspace/u.aliases.ts`
- `src/m.vite.config.workspace/u.log.ts`
- `src/m.vite.config.workspace/u.log.table.ts`
- `src/m.vite.config.workspace/-test/-.test.ts`
- `src/m.vite/u/u.dev.screen.ts`
- `src/m.vite/-test/-u.dev.screen.test.ts`

### Current reality

- `common.ts` is the standard local common surface:
  ```ts
  export * from '../common.ts';
  ```
- `mod.ts` owns the public `workspace(...)` composition.
- `u.aliases.ts` owns Deno workspace → Vite alias discovery, sorting, and filtering.
- `u.log.ts` owns the public workspace terminal presenter.
- `u.log.table.ts` owns the width-aware import-map table layout/rendering.
- `DevScreen` only threads terminal width into `ws.toString({ width })`; it does not know table
  internals.

### Target output

```text
Docs
  Workspace <ESM Module> import-map

  Export                   Maps to
  import @sys/tmpl/testing  →  ./code/-tmpl/src/m.testing/mod.ts
  import @sys/tmpl/types    →  ./code/-tmpl/src/types.ts
```

Filtered output keeps the suffix without restoring a trailing colon:

```text
Workspace <ESM Module> import-map (filtered)
```

### Required invariants

- no `Workspace <ESM Module> import-map:` trailing colon;
- no `Export:` or `Maps to:` header colons;
- header labels are Title Case: `Export`, `Maps to`;
- header row has no arrow;
- table is a real `Cli.table(...)` three-column table: export cell, arrow cell, path cell;
- `Maps to` aligns over the path column, not the arrow column;
- row seam remains compact: two spaces, `→`, two spaces;
- row arrow is green;
- arrow columns align across rows;
- wide output keeps the gray `import` prefix;
- narrow output drops the `import` prefix globally before clipping values;
- tighter output middle-ellipsizes both module specifier and path;
- path is gray operative value, not dim background detail;
- clipped path ellipsis is cyan;
- standalone workspace log rows, including title rows, are bounded to requested width;
- `shift+i` dev-screen workspace info remains bounded.

### Landing proof

```sh
cd ./code/sys.driver/driver-vite
deno fmt src/m.vite.config.workspace/-test/-.test.ts src/m.vite.config.workspace/mod.ts src/m.vite.config.workspace/t.ts src/m.vite.config.workspace/u.aliases.ts src/m.vite.config.workspace/u.log.ts src/m.vite.config.workspace/u.log.table.ts src/m.vite/u/u.dev.screen.ts src/m.vite/-test/-u.dev.screen.test.ts
deno task test --trace-leaks ./src/m.vite.config.workspace/-test/-.test.ts ./src/m.vite/-test/-u.dev.screen.test.ts ./src/m.vite/-test/-u.keyboard.test.ts
deno task check
deno task test --trace-leaks ./src/m.vite.config.workspace/-test/-.test.ts ./src/m.vite/-test/-u.dev.screen.test.ts ./src/m.vite/-test/-u.keyboard.test.ts ./src/m.vite/-test/-tasks.output-width.test.ts ./src/m.vite/-test/-info.output-width.test.ts ./src/m.vite/-test/-build.output-width.test.ts ./src/m.vite/-test/-u.log.test.ts ./src/m.vite/-test/-build.elapsed.test.ts ./src/m.vite/-test/-build.test.ts
git diff --check --cached
```

## Next side arc: startup spinner in stable screen mode

This stays in this plan for now. It is a direct child of the stable dev reporter arc and is not
large enough to justify a separate plan file yet.

Split into its own plan only if it grows into a broader `@sys/cli` spinner/display-system arc with
multiple consumers beyond `driver-vite`.

### Problem

- Screen reporter renders the stable frame immediately while Vite is still booting.
- There can be a visible blank pause before the first Vite output rows arrive.
- Keyboard shortcuts do not work during this startup phase because `Vite.dev()` returns only after
  `proc.whenReady()` and the HTTP readiness probe complete; `server.listen()` starts after that.

### Design rule

- Use active Ora only during startup, before the stable screen reporter owns the terminal.
- Do not run active Ora inside `DevScreen` after the server is ready.
- Keep exactly one dynamic terminal owner at a time:
  - startup phase: Ora owns the dynamic block under a static title/header;
  - ready phase: Ora is stopped, then `DevScreen` owns the full stable frame.
- Do not invent Vite-local spinner frames.
- Do not add `Cli.Spinner.frame(...)` in this arc; that pure-frame API is deferred until multiple
  stable-screen consumers prove the need.
- Keep the startup message truthful: synthetic startup status must not masquerade as Vite stdout.

### `fix(driver-vite): show dev startup spinner in screen reporter`

Pre-implementation decision:

- Use existing `Cli.Spinner.create(...)` / Ora for startup only.
- Clear the terminal immediately when startup screen mode begins.
- Print the static dev title/header once before starting Ora so the spinner appears under the main
  title, not before it.
- Let Ora own the multiline startup body below the title/header.
- Use a spinner with no label on the spinner line and no blank spacer after it.
- Seed the actual visible dev log once with `1 out starting…`, then append real Vite rows after it.
- Render startup and ready frames from the same visible log rows; do not overlay or renumber startup
  rows separately.
- Stop Ora and hand terminal ownership to `DevScreen` once `proc.whenReady()` and
  `Http.Client.waitFor(...)` pass.

Startup shape:

```text
Dev                                      @sys/ui-components 0.0.319
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⠋
         http://localhost:1235/
         ↑
         input    src/index.html
         output   dist/ ← digest:sha256:#ccd11

┄┄┄┄┄┄┄┄┄┄
 1  out  starting…
```

Task list:

- [ ] Add a startup-only screen renderer, separate from the ready `DevScreen` frame, if this keeps
      the Ora text construction pure and testable.
- [ ] Reuse existing `DevScreen` header/metadata formatting helpers only if doing so does not blur
      startup/ready ownership.
- [ ] Clear the terminal before printing the static startup header.
- [ ] Start Ora after printing the static title/header so the spinner line sits under the main
      title.
- [ ] Seed `DevOutputLog` once with a parent display row: `starting…`.
- [ ] Render the seeded startup row and real output rows through the same log-row formatter as ready
      output.
- [ ] Do not overlay, renumber, or inject a second startup-only row in `DevScreen.startupBody(...)`.
- [ ] Suppress duplicate child/toolchain `starting…`/`starting Vite…` visible rows in screen mode so
      the parent affordance appears exactly once.
- [ ] Defer additional synthetic startup milestones until they can be represented as chronological
      display log events rather than casual one-off row mutations.
- [ ] Update the Ora body as captured Vite stdout/stderr arrives, keeping Vite truth visible below
      or alongside the startup status.
- [ ] Stop Ora before calling the ready `DevScreen.redraw()`.
- [ ] Add internal test control to disable active Ora and assert the pure startup body/header
      output.
- [ ] Preserve raw reporter behavior exactly.
- [ ] Preserve startup failure diagnostics from retained output.
- [ ] Add tests for startup layout, status truth, width bounds, and disabled-spinner test mode.
- [ ] Add lifecycle tests proving Ora stops on ready, cleanup, and startup failure.

Out of scope:

- making quick keys work before `Vite.dev()` resolves;
- changing `Vite.dev()` to return before readiness;
- adding a full startup progress model;
- running Ora / active `Cli.spinner(...)` inside screen mode.

Later keyboard responsiveness cleanup:

- [ ] If lifecycle is deliberately refactored, consider starting ordinary key listening earlier.
- [ ] Make `shift+i` workspace loading lazy/cached so basic keys do not wait for workspace
      discovery.

## Completed follow-up: `feat(cli): expose spinner test double`

Public API:

```ts
import { FakeSpinner } from '@sys/cli/testing';

const spinner = FakeSpinner.create('starting…');
```

Completed files:

- `code/sys/cli/deno.json` export: `./testing`;
- `code/sys/cli/src/m.testing/common.ts`;
- `code/sys/cli/src/m.testing/t.ts`;
- `code/sys/cli/src/m.testing/m.FakeSpinner.ts`;
- `code/sys/cli/src/m.testing/mod.ts`;
- `code/sys/cli/src/m.testing/-test/-.test.ts`;
- `code/sys/cli/src/m.testing/-test/-api.test.ts`;
- `code/sys/cli/src/m.testing/-test/-m.FakeSpinner.test.ts`;
- `code/sys.driver/driver-vite/src/m.vite/-test/-u.dev.screen.test.ts`.

Invariants:

- `FakeSpinner.create()` returns a handle usable wherever tests inject `Cli.Spinner.create(...)`;
- the fake is assignable to `t.CliSpinner.Instance`;
- it includes an Ora-compatible `render()` method for lower-level injected handles;
- `start(text?)`, `succeed(text?)`, and `fail(text?)` update text when a label is passed;
- `succeed(...)` and `fail(...)` record status and stop semantics predictably;
- `render()` increments `renders` and returns the fake;
- methods close over the fake object and do not depend on `this` binding;
- no timers, terminal writes, stdin handling, or Ora import;
- active Ora/runtime spinner behavior is unchanged.

## Stable screen contract

Screen mode must preserve these properties:

- one terminal owner;
- no PTY, curses, or alternate-screen dependency;
- raw passthrough remains available via `reporter: 'raw'`;
- Vite stdout/stderr truth remains visible through the recent tail;
- retained output remains available for startup diagnostics;
- no semantic parser for every Vite message;
- final frame width/height clips protect extremely small terminals;
- all width decisions use visible/display width, not raw `.length`.

## Dev-screen visual contract

Wide shape:

```text
Dev                                                 @sys/ui-components 0.0.319
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

         http://localhost:1235/
         ↑
         input    src/index.html
         output   dist/ ← digest:sha256:#ccd11

┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
 1  out  VITE v8.1.5 ready in 183 ms
 2  out  ➜  Local:   http://localhost:1235/
 3  out  ➜  Network: http://192.168.1.147:1235/
```

Narrow degradation:

- header compacts: drop version → drop `Dev` → drop scope → middle-ellipsize unscoped name;
- URL middle-ellipsizes and preserves useful suffixes such as `:1235/`;
- `input` / `output` values middle-ellipsize inside their value columns;
- output digest collapses before row overflow:
  - `← digest:sha256:#ccd11`;
  - `← sha256:#ccd11`;
  - `← #ccd11`;
  - no digest;
- log rows middle-ellipsize and preserve useful suffixes;
- the final frame clip is quiet gray if presentation has to rebuild a row.

## Completed behavior

### Dev output ownership and stable screen reporter

- public dev reporter modes: `reporter?: 'auto' | 'screen' | 'raw'`;
- visible-tail bound: `logLines?: number`, capped at `200`;
- CLI flags:
  - `--reporter=auto|screen|raw`;
  - `--log-lines=<n>`;
- `auto` selects screen mode only when interactive and package metadata exists;
- screen mode makes the parent process the single terminal writer;
- child Vite output is captured silently and rendered through the stable frame;
- raw mode preserves exact passthrough behavior;
- known benign Deno `deno.json.importMap` warning is suppressed only from visible screen output and
  recent visible tail, not from raw passthrough truth.

### Width-safe build/dev/info/task terminal presentation

- `ViteLog.Tasks` replaces the old `ViteLog.API` naming;
- task help preserves table columns while compacting repeated `deno task` prefixes;
- build `cmd.output` remains exact raw truth;
- build `toString({ width })` clips presentation rows only;
- Vite's own `✓ built in ...` remains visible;
- `Bundle` summary is separated from Vite output with a blank line;
- info/build/dev digest and hash rows share formatter primitives;
- full SHA rows stay quiet gray/dim;
- short digest suffixes such as `#ccd11` stay green;
- timestamp divider uses `•`, e.g. `21 Jul 2026, 11:16am • 2m ago`.

Shared formatter primitives:

- `metadataRow(...)` for label/value/suffix width behavior;
- `digestSuffixes(...)` for digest URI collapse;
- `hashValue(...)` for full SHA row presentation;
- `clipValue(...)` for middle-ellipsis value clipping.

## Non-goals preserved

- No PTY emulation.
- No alternate-screen/curses dependency.
- No full scrollback viewer.
- No persistence of logs to disk.
- No semantic parser for every Vite message.
- No broad `@sys/process` refactor.

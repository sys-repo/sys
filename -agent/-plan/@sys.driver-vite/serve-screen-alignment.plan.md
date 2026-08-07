serve-screen-alignment.plan.md
- [x] 86cf537 chore(driver-vite): route baseline tasks through samples
- [x] [dev-screen-responsive-metadata-rail.plan.md](./dev-screen-responsive-metadata-rail.plan.md)
- [x] e0c287c refactor(driver-vite): share terminal screen layout grammar
- [x] caa857210 feat(driver-vite): align serve output with dev screen
- [x] [dist-serve-authority.plan.md](./dist-serve-authority.plan.md)

## Outcome

The first four arc items make the package's standard `dev`, `build`, `serve`, and `info` tasks thin
aliases over explicit sample call sites, then give interactive `serve` the same application-header →
server-summary → numbered-output composition as `dev`.

Their checkpoint boundary is:

```text
semantic snapshots
  → pure Vite screen layout
  → one terminal-effect owner
```

For Commit 3, the specialized screen is Vite-owned and `Http.Server.start(...)` remains the server
lifecycle and raw status-output owner. The final linked plan is the sole authority for replacing that
checkpoint with verified, server-owned Dist serving and presentation.

## Commit 1–3 invariants

- Build on `Cli.Fmt.Header`, `Cli.Fmt.Url`, `Cli.Fmt.Text.Width`, `Cli.Fmt.Path`, `Cli.Is.interactive`,
  and `Cli.Screen`; do not create parallel primitives.
- Pure formatters receive explicit unstyled snapshots and cell budgets. They perform no terminal,
  clock, filesystem, process, or server-handle reads.
- Interactive screen output may repaint; redirected/raw output is append-only and remains owned by
  the generic HTTP printer.
- `silent` suppresses output only. It does not alter server, keyboard, or lifecycle behavior.
- Dev and serve share only proven screen grammar. Dev retains process capture, spinner, phases,
  workspace/options, keyboard, and scheduling.
- No package export, public type, reporter flag, generic terminal framework, or `@sys/http` formatter
  change.
- Build and serve remain separate commands; serve never builds implicitly.

## Commit 1 — `chore(driver-vite): route baseline tasks through samples`

Use the established system task shape (`start → sample:stripe` in `@sys/cell`):

```text
dev    → sample:dev
build  → sample:build
serve  → sample:serve
info   → sample:info
```

Leaf-task authority in `code/sys.driver/driver-vite/deno.json`:

```text
sample:dev    deno run -P=dev ./-scripts/task.main.ts --cmd=dev   --dir=./src/-test/vite.sample-1
sample:build  deno run -P=dev ./-scripts/task.main.ts --cmd=build --dir=./src/-test/vite.sample-1
sample:serve  deno run -P=dev ./-scripts/task.main.ts --cmd=serve --dir=./src/-test/vite.sample-1/dist
sample:info   deno run -P=dev ./-scripts/task.main.ts --cmd=info  --dir=./src/-test/vite.sample-1
```

Each standard task contains only `deno task sample:<command>`. Each leaf contains the complete real
call site once. Keep `-P=dev`, the local task bridge, sample source, Vite config, and fixtures
unchanged. This is mechanical composition; direct task execution replaces red-first proof.

## Prerequisite — `dev-screen-responsive-metadata-rail.plan.md`

That plan remains the sole owner of the width-80 metadata rail. Its local commit must land before the
shared extraction so this plan cannot absorb another plan's fix. The extraction preserves that
breakpoint; it does not reopen it.

## Commit 2 — `refactor(driver-vite): share terminal screen layout grammar`

Extract a private pure `ViteScreenLayout`-shaped kernel beside the dev layout. Keep its cross-file
contracts in `m.vite/t.internal.ts`, outside package `types.ts` and runtime exports.

It owns only:

- standard green application header, including package-subpath hierarchy;
- source/content column geometry and the width-80 metadata rail;
- canonical URL decomposition plus Vite-local indentation/clipping;
- Dist digest/age suffix candidates;
- dashed divider and ANSI-aware row clipping; and
- one-based `out`/`err` row rendering.

Rename the private human-visible output field `index` → `sequence`; `index` is reserved for zero-based
position. Preserve displayed values and ordering.

Formatter contract:

- semantic inputs only: package, Dist, service URL, path/state, output line, render time, viewport;
- no callbacks/lazy getters, precolored labels, prebuilt rules, preformatted status, reporter flags,
  or effectful handles;
- delegate URL decomposition to `Cli.Fmt.Url` and width policy to `Cli.Fmt.Text.Width`;
- reuse existing `metadataRow(...)`, digest candidates, and clipping helpers.

Plain dev text, row order, geometry, breakpoint, height allocation, and output sequence are invariants.
If canonical URL styling changes ANSI bytes, constrain and assert that URL-only convergence directly;
extraction alone permits no visual drift.

Proof is green → refactor → green over the existing output-log, pure dev-screen, and dev-runtime
suites. No serve behavior lands in this commit.

## Commit 3 — `feat(driver-vite): align serve output with dev screen`

### Static snapshot

Resolve filesystem/Dist truth once into a private discriminated union:

```text
{ kind: 'missing'; dir: t.StringDir }
  | { kind: 'not-directory'; dir: t.StringDir }
  | { kind: 'directory'; dir: t.StringDir; dist?: t.DistPkg }
```

Derive both screen facts and raw `info.static` from this snapshot; do not probe twice or pass
independent booleans. The pure frame receives only the snapshot, driver-vite fallback package,
resolved server origin, viewport/cursor rows, and render time. It never receives `staticInfo`, HTTP
table text, callbacks, or the running server.

### Output ownership

Resolve once before server start:

| Condition | Mode | HTTP printer | Vite screen |
|---|---|---|---|
| `silent === true` | silent | suppressed | absent |
| not silent + `Cli.Is.interactive()` | screen | suppressed | owns repaint |
| not silent + non-interactive | raw | owns append-only output | absent |

Screen mode replaces the provisional task list only after successful server start. Raw mode emits no
cursor control, performs no repaint, and preserves full append-only HTTP status for pipes/logs. Add no
public reporter option.

### Interactive frame

```text
<package identity>                                      <version>
<green heavy rule>

<resolved local URL>
↑
static    <directory> <Dist digest/age | path warning>

<green dashed rule>
1  out    <truthful status>

open     o ← (in browser)
quit     ctrl + c or q
```

Rules:

1. URL, arrow, and static row are one metadata unit.
2. Widths `<= 80` use the output source column; widths `> 80` use the content column. Sequence width
   moves both columns but never changes the breakpoint.
3. Render `server.origin`, not the requested port, through the shared URL formatter.
4. Use one `static` row. Append the richest existing digest/age candidate that fits; do not repeat
   the artifact as a second `dist` row.
5. Missing renders `(does not exist)`; non-directory renders `(not a directory)`.
6. Select the sole parent-owned output row exhaustively:

   | Snapshot | Channel | Text |
   |---|---|---|
   | directory with Dist | `out` | `serving build on HTTP server…` |
   | directory without Dist | `out` | `serving static files on HTTP server…` |
   | missing | `err` | `static directory does not exist` |
   | not-directory | `err` | `static path is not a directory` |

7. Bound every row by ANSI-aware width and the frame by `viewport.height - cursorRows`. Preserve
   source order under pressure so the TTY-only keyboard footer disappears before output/header/core facts.
8. Render only the two bound HTTP keyboard actions (`o` open and `ctrl + c or q` quit); do not invent
   network URLs, build success, additional keyboard actions, or Vite child output.

### Effects and lifecycle

The private serve-screen owner may measure, observe resize, repaint, surface failure, and dispose. It
must subscribe before initial measurement, recompute the whole immutable frame on accepted resize,
and use no spinner or timer.

```text
start server
  → acquire/repaint screen
  → race server completion against reporter failure
  → dispose observation exactly once
```

Any acquisition, initial-render, or later resize-render failure closes the acquired server and
propagates the original presentation error; cleanup failure cannot mask it. Normal keyboard quit,
port fallback, static serving, and `server.finished` ownership remain unchanged. Use a narrow private
dependency seam for deterministic tests only.

## Successor — `dist-serve-authority.plan.md`

The linked plan preserves Commit 3 as a coherent presentation checkpoint while replacing its raw
filesystem-static backend with explicit pinned/local Dist authority in `@sys/server`. It exclusively
owns the cross-package authority model, verified evidence, server presentation, Vite delegation,
intentional behavior changes, and migration proof. Do not retrofit those later contracts into the
historical Commit 3 specification or maintain both presentation owners after delegation.

## Proof

### Shared refactor

Preserve:

- output assembly and one-based sequence;
- startup/ready text and width `79 → 80 → 81` rails;
- one-, two-, and three-digit sequence geometry;
- tiny viewport bounds; and
- resize, spinner, options, workspace, and disposal behavior.

### Serve feature: red → green

Start with a failing pure serve-frame test. Assert complete authored plain text with
`Str.dedent(...)` after `Cli.stripAnsi(...)`.

Prove:

- shared header, metadata rails, divider, output-row order, and TTY keyboard footer;
- resolved-port rendering;
- all four static snapshot variants and exact messages;
- Dist suffix fitting, absent Dist, Unicode paths, tiny widths/heights;
- deterministic wide → narrow → wide reprojection without input mutation;
- subscribe-before-measure, accepted resize, already-disposed events, idempotent disposal;
- surfaced resize-render failure and acquisition rollback;
- screen/raw/silent ownership, generic-printer suppression policy, lifecycle wait, and screen release;
- server close with original error preservation after any reporter failure.

Keep HTTP request/response, keyboard, port fallback, and base lifecycle proof in `@sys/http`.

## Verification

From `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite`:

```sh
deno task test --trace-leaks ./src/m.vite/-test/-u.dev.output.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-u.dev.screen.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-u.dev.screen.runtime.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-u.serve.screen.test.ts
deno task test --trace-leaks ./src/-entry/-test
deno task check
deno task test
deno task build
deno task info
deno task serve
deno task dev
deno task clean
```

Use `serve` and `dev` as interactive visual/runtime probes; resize both across width 80 and stop them
through normal keyboard paths. Confirm redirected serve output is append-only with no screen-control
sequences. Clean after runtime probes.

## Commit 1–3 boundary

Expected surfaces: `deno.json`, private `m.vite/t.internal.ts`, the existing dev output/layout and
focused tests, one shared layout helper, one pure serve-screen formatter/test, and `-entry/u.serve.ts`
with a private effect/test seam if earned.

Do not change package exports/public types, `@sys/cli`, `@sys/http`, Vite config/build/Dist output,
sample source, dev readiness/process/keyboard contracts, or HTTP request/lifecycle semantics.

Rejected: changing generic HTTP printing; rendering a Vite frame in raw mode; duplicating dev columns;
generalizing the complete dev runtime; passing preformatted strings or server handles into pure
formatters; always claiming a build exists; implicit build-on-serve; a public serve reporter flag; or
a generic terminal framework.

dist-serve-authority.plan.md
- [x] 5ea96fb46 feat(fs): verify locally observed Dist generations
- [x] 714adb95a feat(server): expose explicit local Dist serving authority
- [x] 2d072bd1a feat(server): own Dist serve terminal presentation
- [x] dfed9043a refactor(driver-vite): use width-aware digest formatting
- [x] b73384650 refactor(driver-vite): delegate serve to DistServer
- [x] fb0381d95 feat(driver-vite): dock Dev terminal controls
- [x] 95d6263b5 refactor(driver-vite): reduce Dev controls to open and quit

## Outcome

Make every production-bundle preview pass through the same verified Dist hosting path instead of
letting each build driver create a raw static HTTP server.

```text
Dist producer (Vite here)
  → explicit manifest-authority mode
  → complete Dist verification
  → verified DistServer backing
  → server-owned raw or interactive presentation
```

`DistServer.start(...)` remains pinned-only. Local convenience is a separate, conspicuously named
operation whose result is labeled `local-unpinned`; it never becomes an omitted option, boolean
escape hatch, or fallback from failed pinned verification.

## Authority model

| Mode             | Manifest integrity source                                                  | Durable claim                                                       | Intended caller                                  |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| `pinned`         | caller-supplied canonical SHA-256 obtained independently of the generation | caller-authorized exact manifest plus complete verified generation  | deployment, service, materialized/published Dist |
| `local-unpinned` | exact local `dist.json` bytes observed under finite bounds                 | stable self-consistency only; no publisher or deployment provenance | explicit local preview after a build             |

Both modes must:

- authenticate or derive the exact serialized manifest bytes, never parsed/re-serialized JSON;
- strictly admit the canonical `DistPkg`, declared parts, ignore policy, sizes, and composite
  digest;
- reject symlinks, unsafe paths, undeclared entries, malformed metadata, limit excess, and observed
  mutation;
- verify the complete generation before opening a listener;
- serve only declared parts through checksum-and-size-pinned reads; and
- return immutable verification evidence used by status and terminal presentation.

A locally derived integrity value is verification input, not provenance. Never call it trusted,
authenticated, locked, published, or pinned in types, logs, status, errors, or screen text.

## Invariants

- `DistServer.start(...)` keeps its existing required `integrity`, strict input admission, loopback
  bind, sanitized failures, strict explicit-port behavior, and verified-or-refuse semantics.
- Pinned services (`DistService`, Cell Dist hosts, Pi UI start, and deployment callers) cannot
  select local authority by omission or fallback.
- Local authority is explicit in method names and immutable runtime evidence; do not add
  `allowUnpinned`, `verify: false`, optional integrity, or a mode default.
- Required finite limits remain caller-owned at the lower-level verification/start boundary. Vite
  supplies one named finite preview policy; limits are never derived from an untrusted manifest.
- `silent` suppresses output only. It never skips verification, changes authority, disables keyboard
  behavior, builds output, or alters server lifecycle.
- Build and serve remain separate. No serving operation invokes Vite or writes a Dist.
- Interactive presentation uses verified evidence only. It never calls `Pkg.Dist.load`, probes the
  static path independently, or accepts preformatted authority/status text.
- Redirected output is append-only and cursor-free; interactive output may repaint.
- Keep `@sys/http` renderer-neutral. Do not add a generic reporter framework or change its formatter
  to encode Dist authority semantics.

## Commit 1 — `feat(fs): verify locally observed Dist generations`

Add an explicit `Pkg.Dist.Local.verify(...)` operation beside `Pkg.Dist.Pinned.verify(...)` and move
the contracts shared by both modes to a neutral `Pkg.Dist.Verify` namespace.

Contracts:

```text
Pkg.Dist.Pinned.verify({ dir, integrity, limits, until? }) → Pkg.Dist.Verify.Result
Pkg.Dist.Local.verify({ dir, limits, until? })             → Pkg.Dist.Verify.Result
```

Keep the existing `Pkg.Dist.Pinned.Verify.*` type paths as compatibility aliases to the neutral
limits/result/evidence/failure contracts; pinned callers must not break merely because local
verification now shares the result model. New cross-mode code uses `Pkg.Dist.Verify.*`, so local
evidence is never mislabeled as pinned in the type plane.

The local operation has no `integrity` input. Inside the same bounded verification pipeline it:

1. resolves and admits the real directory ancestry;
2. reads exact `dist.json` bytes under `limits.manifestBytes`;
3. derives canonical SHA-256 from those bytes;
4. runs the same strict manifest, exact-tree, part-content, repeated-observation, and cancellation
   checks as pinned verification; and
5. returns the existing immutable verification evidence, including the exact derived integrity.

Refactor the verifier around one private authority seam; do not fork or weaken tree verification.
The pinned path compares the first manifest read with caller authority before parsing. The local
path records that first read as locally observed authority. Both repeat the manifest/tree
observations and fail closed on subsequent change.

Input admission rejects unknown keys, inherited/accessor data, invalid lifecycle input, and invalid
or unbounded limits before filesystem work. Failure results remain path/cause-free and use the
existing stable verification failure family.

### Proof

Start red at the narrow filesystem layer. Prove:

- exact manifest-byte integrity is returned without JSON reserialization;
- pinned wrong-integrity behavior remains unchanged;
- local canonical success produces the same Dist/assets evidence as pinned success;
- malformed/legacy manifests, empty or oversized manifests, unexpected entries, content mismatch,
  symlinked roots/manifests/parts, unsafe paths, and finite-limit excess fail closed;
- mutation between manifest/tree observations returns `changed` or the existing narrower failure;
- pre-cancellation performs no filesystem work; and
- returned evidence remains deeply frozen.

## Commit 2 — `feat(server): expose explicit local Dist serving authority`

Extend the Dist-specific server surface without weakening its pinned entrypoint:

```text
DistServer.start(pinnedArgs)         → DistServer.Started
DistServer.Local.start(localArgs)    → DistServer.Started
```

`DistServer.Local.Args` requires `dir`, finite verification `limits`, and the existing host/lifecycle
options, but cannot accept `integrity`. `DistServer.Start.Args` remains the pinned default and
`DistServer.Start.Pinned.Args` is its explicit form. `Local` is a frozen authority family, not a verb
suffix or compatibility alias. Keep unknown-key rejection so authority shapes cannot bleed into
each other.

Widen successful Dist starts from the generic HTTP handle to a structural subtype:

```text
DistServer.Started = HttpServer.Started & {
  authority:
    | { kind: 'pinned'; integrity: t.StringHash }
    | { kind: 'local-unpinned'; integrity: t.StringHash };
  verification: FsPkg.Dist.Verify.Evidence;
}
```

Freeze the authority marker and expose only deeply immutable verification evidence. Pinned integrity
is caller authority; local integrity is observed evidence. The discriminant—not the hash
shape—controls every provenance claim.

Refactor startup around one private verified-host path:

```text
snapshot complete input
  → acquire pinned or local verification evidence
  → construct read-only backing from authenticated Dist
  → create constrained HTTP app
  → open/settle loopback listener
  → return authority-bearing handle
```

The shared host keeps accepted-host admission, exact request-path parsing, `dist.json` refusal,
per-request pinned reads, no-store responses, cancellation, startup rollback, and sanitized errors.
No listener opens after a failed verification. `DistServer.start(...)` remains strict when an
explicit port is occupied; any preview fall-forward policy belongs to the higher-level terminal
workflow, not the pinned primitive.

### Proof

Prove independently for pinned and local starts:

- complete input snapshotting before the first asynchronous boundary;
- unknown/accessor/inherited/cross-mode input rejection before verification;
- authority marker and verification evidence identity/freeze behavior;
- no listener on missing, malformed, changed, over-limit, cancelled, or failed verification;
- both modes converge on the same verified backing and per-request checksum reads;
- host, method, path, manifest-denial, response-header, and shutdown constraints remain unchanged;
- pinned address-in-use and error-classifier behavior remain unchanged; and
- existing `DistService`, Cell, and Pi pinned callers compile and retain their current semantics.

## Commit 3 — `feat(server): own Dist serve terminal presentation`

Add Dist-specific blocking terminal workflows over the two explicit start operations:

```text
DistServer.serve(args: DistServer.Start.Args)          → Promise<void>
DistServer.Local.serve(args: DistServer.Local.Args)     → Promise<void>
```

Type each authority family directly from its existing argument contract; do not add parallel
`ServeArgs`, suffixed method aliases, option bags, or authority unions. These are CLI/runtime
conveniences, not replacements for handle-returning `start` methods. They reuse the same strict input
snapshots, verification evidence, sanitized startup failures, and returned-server lifecycle
internally, then block until that lifecycle completes.

Resolve output ownership exactly once before verification: `silent === true` wins first; otherwise
`Cli.Is.interactive()` selects screen or raw mode.

| Condition                         | Mode   | Generic HTTP output     | Dist screen  |
| --------------------------------- | ------ | ----------------------- | ------------ |
| `silent === true`                 | silent | suppressed              | absent       |
| not silent + interactive terminal | screen | suppressed              | owns repaint |
| not silent + non-interactive      | raw    | owns append-only status | absent       |

Feed that resolved mode into the private verified-host path so no output is emitted before complete
verification. Silent mode forces generic HTTP printing off. Screen mode forces generic HTTP printing
and generic keyboard binding off. Raw mode delegates one startup report to the existing generic HTTP
printer with plain structured details derived from verification evidence: package identity, Dist
content digest, and exactly `pinned <manifest-integrity>` or `local (UNPINNED)` authority. Dist adds
no startup-failure or shutdown line: rejected workflows print nothing and propagate the existing
sanitized error for their caller to present. Dist does not write directly to `console` in screen
mode; raw output remains the generic printer's existing `console.info` contract.

Pinned and local workflows share one private Dist screen and lifecycle owner. The pure frame
receives only package identity from verified Dist evidence (with the server package fallback),
resolved origin, verified directory/Dist evidence, explicit authority marker, viewport/cursor rows,
and render time. It receives no server handle, callbacks, filesystem facts, generic HTTP table text,
or precolored status.

Interactive grammar:

```text
<verified package identity>                              <version>
<green heavy rule>

<resolved local URL>
↑
static     <directory> <content digest/age>
authority  pinned <manifest-integrity>
        OR local · UNPINNED

<green dashed rule>
1  out     serving pinned Dist on HTTP server…
        OR serving locally verified Dist (UNPINNED)…

<dim gray dashed rule, bottom-docked>
open: o (in browser)                              quit: ctrl + c or q
```

`static` and `authority` use the same standard white metadata-label tone as Vite Dev's `output` row;
their ordinary values remain unstyled. `UNPINNED` is the only conditional semantic accent and uses
yellow warning emphasis. The URL, arrow, digest, and structural rules retain their existing shared
grammar. `local · UNPINNED` and `(UNPINNED)` are exact semantic vocabulary and remain plain and
explicit in redirected output. Local mode is blessed for preview, so it stays an `out` row rather
than masquerading as a runtime failure.

The screen composes existing `Cli.Fmt.Header`, URL, width, rule, and screen primitives. Do not move
Vite's dev runtime, create a generic terminal framework, or teach `@sys/http` about Dist
presentation. Port display always comes from the started server origin. Add one private strict-port
switch at the verified-host seam: it remains enabled for `start`, `Local.start`, and pinned `serve`,
and is disabled only for `Local.serve`. The local workflow then retains the actual fall-forward
listener selected by the existing HTTP start primitive instead of rejecting and reopening it; it
does not verify twice or race a separate preflight probe. This preserves Vite-style requested-port
fall-forward while every lower-level and pinned public start remains strict.

The blocking `serve` methods default `keyboard` to `true`; this does not change either `start`
method's existing opt-in default. `keyboard: false` disables binding and the footer. A keyboard
object retains its existing `exit` behavior, while `print: false` keeps the binding but suppresses
keyboard rows. Silent mode keeps the same binding behavior with all presentation suppressed.

In screen mode the Dist workflow owns keyboard acquisition rather than asking the suppressed generic
printer to describe it. Start the HTTP lifecycle with generic keyboard binding disabled, bind the
existing `o`, `q`, and `ctrl+c` actions at the Dist terminal layer against the actual started
origin, and render the footer only when that binding is acquired and keyboard-row printing is
enabled. The footer is bottom-docked below the flowing status region and is the first complete
region removed under height pressure. Raw mode retains generic HTTP keyboard ownership and exposes
`pinned` or `local (UNPINNED)` authority without repaint control sequences.

Lifecycle:

```text
verify and start server
  → acquire/repaint Dist screen
  → race server completion against presentation failure
  → close on presentation failure without masking it
  → dispose terminal observation exactly once
```

Startup verification failure opens no screen. Acquisition, initial-render, and resize-render failure
close any acquired server and preserve the original presentation error over cleanup errors. Normal
keyboard quit, caller cancellation, server failure, and silent/raw completion retain one lifecycle
owner.

### Proof

Port the useful static-screen tests from driver-vite, then prove both authority modes:

- authored complete frames and exact pinned/local authority vocabulary;
- package, origin, Dist digest/age, and manifest-integrity data come from returned evidence;
- no missing-directory, non-directory, or directory-without-Dist success frame exists;
- width `79 → 80 → 81`, Unicode, tiny dimensions, height-pressure region order, and deterministic
  wide → narrow → wide reprojection;
- raw/screen/silent ownership and cursor-free redirected output;
- requested-port fall-forward only for local preview and actual-origin rendering;
- subscribe-before-measure, accepted resize, already-disposed events, and exact-once disposal;
- acquisition/resize failure rollback and original-error preservation;
- footer suppression when keyboard acquisition is unavailable; and
- `o`, `q`, and `ctrl+c` behavior through normal terminal shutdown paths.

## Commit 4 — `refactor(driver-vite): use width-aware digest formatting`

Route Vite Dist logging and the Dev screen through canonical `HashFmt.digest(hash, { maxWidth })`,
passing the measured remaining digest-cell width rather than total terminal width. Remove Vite's
parallel digest-candidate parsing while preserving existing path, build-age, and row-priority
semantics.

### Proof

- full, algorithm-qualified, and shortest digest identities collapse at the canonical boundaries;
- Dist logging and Dev metadata rows remain cell-bounded at narrow widths; and
- no Vite-local digest parser or candidate ladder remains.

## Commit 5 — `refactor(driver-vite): delegate serve to DistServer`

Replace driver-vite's raw static Hono construction with one explicit local Dist preview call
imported from `@sys/server/dist`. `ViteEntry.serve(...)` should only validate the command variant,
resolve CLI defaults, supply the named finite Vite preview limits, and await
`DistServer.Local.serve(...)`.

Use this Vite-owned finite policy unless implementation evidence requires a separately reviewed
change:

```text
manifestBytes  16 MiB
entries         8,193
fileBytes      128 MiB
totalBytes       1 GiB
```

Remove the private Vite static snapshot, warning/output semantics, serve-screen runtime/contracts,
and their implementation-coupled tests once equivalent server proof exists. Retain Vite's dev-only
screen grammar and runtime. Do not leave a direct `Http.Server.create({ static: ... })` fallback.

Behavior changes are intentional:

- `vite serve` accepts only a canonical, completely verified Dist generation;
- missing paths, non-directories, absent/invalid manifests, undeclared files, and modified output
  reject before listening instead of starting an empty/arbitrary static server;
- local manifest authority is always rendered as `UNPINNED`;
- serve never builds or repairs output; and
- HTTP request behavior becomes the constrained DistServer contract rather than generic filesystem
  static serving.

Keep the command spelling, default `dist` directory, default requested port, `silent` meaning,
interactive selection, keyboard affordances, and actual-port display. Keep Vite's public type/export
surface free of reporter and authority-mode options; pinned deployment belongs to `@sys/server`, not
a new Vite CLI flag.

### Proof

- Focused entry tests prove exact argument/policy delegation and no Vite-owned HTTP/screen
  lifecycle.
- An integration test performs Vite build → local Dist verification → server start → root/asset
  fetch → normal close without recomputing or rewriting the build manifest.
- Tampering with `dist.json`, a declared asset, or the exact tree after build fails before listener
  startup.
- Interactive Vite serve visibly reports `local · UNPINNED`; redirected output is append-only;
  silent output remains empty.
- Existing Vite dev layout/runtime tests remain unchanged and green.

## Commit 6 — `feat(driver-vite): dock Dev terminal controls`

Adopt the shared pure `Cli.Screen.Dock.bottom(...)` layout primitive in the Vite Dev ready screen.
Keep Dev output ownership unchanged: the existing flowing Vite log remains the scroll-pressure
region, while keyboard controls become one optional, complete bottom footer separated by a dashed
rule.

The footer grammar is `open: o (in browser)` and `quit: ctrl + c or q`. It renders as one balanced
horizontal control row only when its full width fits. It drops as one region when width- or
height-constrained; it never wraps, stacks, or partially displaces status/log
rows. Its divider disappears with it. Reserve the footer after calculating Dev metadata, options, and
visible logs, so these regions retain their established order. Route `q` through the existing Dev quit
path; do not create a second lifecycle or keyboard owner.

### Proof

- authored wide Dev frame proves the footer is bottom-docked below a separate divider;
- narrow and short viewports omit the entire footer without partial rows/dividers;
- resize wide → narrow → wide restores the same deterministic footer projection;
- existing Dev log retention, options, keyboard actions, and terminal lifecycle tests remain green;
- `q` and `ctrl+c` share the existing Dev disposal path.

## Commit 7 — `refactor(driver-vite): reduce Dev controls to open and quit`

Remove the obsolete Dev info, extended-workspace, and clear interaction plane after the footer becomes
the sole control presentation. Dev keyboard input recognizes only `o`, `q`, and `ctrl+c`; `o` opens
the resolved local URL, while both quit forms await the existing cleanup path before exiting. Keep one
keyboard owner and the existing unsupported-terminal wait behavior.

Delete the `i`, `shift+i`, and `k` actions and their formatter/runtime plumbing: screen reporter
toggles, ready-frame options/workspace inputs, option rows, eager workspace discovery, and the
keyboard-only `Log.Info`/`Log.Help` formatters. Narrow the keyboard factory and internal screen
contracts to the capabilities that remain. Preserve build/entry logging, retained Dev output,
metadata, footer docking, responsive repainting, and public `Vite.dev` process lifecycle semantics.
Remove fixtures and assertions only when their production capability disappears; do not retain dead
formatters or compatibility aliases.

### Proof

- `o` opens the normalized resolved URL without loading workspace state;
- `q` and `ctrl+c` independently produce the same await-dispose then exit-zero sequence;
- unsupported keyboard acquisition waits for child disposal through a deterministic test latch;
- no `i`, `shift+i`, `k`, options panel, extended-workspace frame state, or keyboard-only info/help
  formatter remains; and
- ready-frame layout, retained-log priority, resize reprojection, acquisition rollback, and exact-once
  terminal disposal remain green.

## Cross-package verification

Run the narrow red/green suites while implementing, then finish with:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs
deno task check
deno task test

cd /Users/phil/code/org.sys/sys/code/sys/server
deno task check
deno task test

cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task check
deno task test
deno task build
deno task info
deno task serve
deno task clean
```

Also run the focused pinned-caller suites for Cell Dist hosting and Pi UI start after the server
type change. Use a real TTY for pinned and local screens: resize across width 80, exercise port
fall-forward only in local preview, open the browser, and stop through both `q` and `ctrl+c`.
Capture a redirected local preview and assert no repaint/cursor sequences. Clean generated Vite
output after runtime proof.

## Boundary

Expected packages: `@sys/fs`, `@sys/cli`, `@sys/server`, and `@sys/driver-vite`, plus
compile/focused regression proof in existing pinned Cell/Pi consumers.

Do not add arbitrary-directory static serving to DistServer, weaken immutable-generation
assumptions, serve `dist.json`, expose non-loopback hosts, infer trust from a locally observed hash,
make local mode a service/deployment default, alter signing/trust policy, add implicit
build-on-serve, or create a generic terminal reporter framework.

The landed Vite serve screen is a checkpoint and migration source, not a second permanent Dist
presentation owner. Once driver-vite delegates, delete superseded private serve-only code rather
than maintaining parallel formatters or authority vocabularies.

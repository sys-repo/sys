deploy-verified-dist-preview.plan.md
- [x] 927eb549e [retire-discontinued-orbiter.plan.md](../@sys/retire-discontinued-orbiter.plan.md)
- [x] 7f0b346f9 fix(tools)!: establish one owned deterministic root Dist staging authority
- [x] b9d5e3ec8 feat(cli): add lifecycle-owned Select prompt authority
- [x] 997ba6d2c test(tools): guarantee Pull fixture cleanup
- [x] 427e24436 refactor(tools): route deploy preview through verified local Dist serving
- [x] edd7c87d3 fix(fs): preserve sibling files beside trusted child dists
- [x] a785b3304 test(tools): prove staged artifact and preview authority parity
- [x] 416a561d0 feat(cli): standardize nested-screen back controls
- [x] c388b083e refactor(driver-pi): decompose GUI startup orchestration
- [x] 7c284727f refactor(driver-pi): decompose GUI lifecycle supervision
- [x] 11420a9ff feat(cli): expose aggregate formatter presentation authority
- [x] 56611215c refactor(driver-pi): decompose GUI screen presentation
- [x] 02ace5019 refactor(driver-pi): decompose GUI identity admission
- [x] 1a1aeb96f refactor(driver-pi): use module facade for GUI identity admission
- [x] 13431dada feat(server): add nested navigation to Dist serving
- [x] 0eb9d66bb refactor(tools): reduce Deploy preview to standard Dist serving
- [x] 68edf871f refactor(tools): normalize staging utility filenames

## Reconciliation record

The parked decomposition was reconciled against current source, tests, reachable history, and the
only tracked live Deploy endpoint YAML.

- The retired Orbiter plan's final snapshot proves providerless staging, Cell retirement, Tools
  topology retirement, and product cleanup landed. The checked opening reference preserves that
  dependency without duplicating its arc.
- `DistServer.Local.start` already performs fresh strict local verification, returns frozen
  `local-unpinned` evidence, serves exact `dist.json`, serves checksum-matched declared parts, maps
  `/` to declared `index.html`, binds strict requested ports, and owns a closeable lifecycle.
- `DistServer.Local.serve` already composes that authority with the standard responsive
  `DistServeScreen`, root-browser opening, canonical keyboard ownership, and ordered cleanup. Its
  only missing embedded-navigation seam is a finite Ctrl+Arrow Left back completion.
- Local Server routing intentionally has no directory probing, trailing-slash index fallback, SPA
  fallback, or generic static fallback. The staged root `index.html` already owns exact artifact
  navigation; a terminal-generated list of nested `*/index.html` paths duplicates that artifact and
  is not a Deploy concern.
- The only tracked live endpoint is the Cell sample at
  `code/sys/cell/-sample/cell.deploy/-config/@sys.tools.deploy/stage.yaml`. It uses a dedicated
  `./.tmp/staging` root; this arc requires retirement of its redundant `clear: true` key.
- At reconciliation, legacy Tools tests encoded `staging.dir: '.'`, optional non-clearing roots,
  equal destination merge order, nested manifests, and permissive metadata fallback. The current
  item replaces those migration surfaces rather than retaining them as contracts.
- Equal or ancestor-overlapping mapping destinations have no live caller. Reject them as invalid
  before writes rather than preserving ambient concurrent composition.
- Current R2 publication remains a separate mutable flat protocol. This plan neither repairs nor
  uses it as proof of local preview truth.

This reconciliation authorizes the plan shape only. It grants no source, test, Git, deployment, or
remote mutation by itself.

## Objective

Make every completed Deploy staging operation produce one exact root Dist, then preview that exact
artifact through verified local Dist hosting.

```text
admitted dedicated staging root
  → deterministic disjoint mappings
  → one exact root dist.json with artifact-owned navigation
  → strict Pkg.Dist.Local.verify for endpoint status
  → DistServer.Local.serve with a fresh independent verification
  → standard DistServeScreen rooted at /
  → finite nested-service completion after owned cleanup
```

This is local observed authority and remains `local-unpinned`. It prepares one artifact shape for
later independently pinned publication without claiming that provider output is immutable, remotely
equal, or independently pinned. Preview is the Deploy action label; verified serving, terminal
presentation, and service lifecycle remain lower-owner concerns.

## Ownership and identity

```text
@sys/fs Rooted admission + Pkg.Dist verification
  → @sys/cli canonical terminal control grammar and presentation token
    → @sys/server/dist verified hosting + standard Dist service screen
      → @sys/tools/deploy staging policy + thin menu navigation adapter
        → separately governed provider publication
```

- `@sys/fs` owns canonical root admission, exact-tree verification, and checksum-matched reads.
- `@sys/cli` owns reusable terminal controls and aggregate formatter-presentation authority; it
  learns no Deploy endpoint, Dist, Driver Pi, or service-lifecycle policy.
- `@sys/server/dist` hosts only paths admitted by frozen verification evidence and owns the standard
  Dist screen, root-open affordance, keyboard/server arbitration, and complete presentation cleanup.
- `@sys/tools/deploy` owns staging policy, finalization, verification limits, configured preview
  port, and mapping the lower finite completion back into its endpoint-menu flow. It owns no preview
  renderer, route selector, browser target index, server generation loop, or duplicate cleanup state
  machine.
- `dist.hash.digest` identifies composite declared asset content. Verification `integrity`
  identifies the exact observed `dist.json` bytes. Neither substitutes for the other.
- `Pkg.Dist.load` remains shape-level metadata loading and is not authority for staged status or
  preview.

## Commit contracts

### `fix(tools)!: establish one owned deterministic root Dist staging authority`

Replace merge-shaped staging with one dedicated, reset, exact-root operation.

#### Root and configuration contract

- Require `staging.dir` to name a non-empty relative descendant of the Deploy working directory.
  Reject `.`, absolute paths, parent traversal, the working directory itself, edge whitespace that
  could retarget a sibling, non-canonical lexical segments other than one optional leading `./`
  explicit-relative marker, non-portable segments, symlinked ancestry, and unsafe or replaced
  cooperative root boundaries before staging writes.
- Remove `staging.clear` from the endpoint type, strict schema, initial YAML, formatter/help
  surfaces, fixtures, and the Cell sample. A valid staging root is always operation-owned and reset
  before mappings run; optional preservation is incompatible with deterministic output.
- Bind `Fs.Capability.Rooted` to the canonical Deploy working directory with `create: false`, admit
  the staging directory target, acquire one non-waiting exclusive lease, and use Rooted removal for
  the admitted old target. Release ownership on every success, failure, and cancellation path.
- Do not add caller-selected cleanup paths, broad basename deletion, an OS-sandbox claim, or a new
  FS primitive. Rooted leases and retained mapping-root identities coordinate participating writers
  and detect replacement at their explicit checks; they do not claim descriptor-relative isolation
  from a hostile same-user process swapping descendant pathnames between those checks.

#### Mapping preflight and execution

- Resolve every source and destination before root reset, build execution, index generation, copy,
  or manifest write. Treat authored path text exactly and reject authority-bearing edge whitespace;
  never trim it into a different source or destination.
- Reject equal or ancestor-overlapping mapping destinations as one deterministic config error before
  mutation. Reject copy/build source-destination overlap that could erase input or recurse into the
  owned output. Preserve index mode's explicit read-from-staging semantics only for disjoint output.
- Make `stageMappings` the sole production root-lifecycle owner. Reduce `executeStaging` to
  execution of an already-admitted disjoint mapping plan; remove its optional clean, root-manifest
  callback, merge-preservation, and overwrite policy surfaces rather than retaining a second staging
  mode.
- Run only disjoint standard mappings with bounded concurrency; run index mappings after standard
  mappings. Ambient scheduling never chooses final bytes.
- Retain every canonical `build+copy` source under a cross-process exclusive Rooted lease from
  before staging-root acquisition through build, copy, rollback, and release. Also acquire one
  cwd-scoped build-mutation lane in the staging lease batch so distinct endpoint roots cannot race
  arbitrary build side effects within one Deploy authority root.
- Expose cancellation through public `Deploy.stage`, bound each test/build child to a finite
  30-minute execution timeout with bounded termination settlement, and check cancellation through
  manifest hash progress before any resulting manifest gains authority.
- Preserve current source resolution, shard expansion, build/test ownership, marker-managed index
  behavior, custom indexes, and provider-neutral mapping semantics.

#### Exact-root finalization

- Remove manifest writes from the copy, build+copy, and index executors. One finalizer settles every
  marker-owned index and is the sole writer of temporary child manifests and the root manifest.
  Generated navigation links point to exact declared `*/index.html` files, never temporary child
  manifests or server-side directory discovery.
- Permit `trustChildDist` only as private bottom-up construction. Track the exact directories whose
  temporary child manifests are written in the current run, including admitted source-copied
  `dist.json` files that the finalizer replaces.
- Compute the final root manifest from settled child evidence, then remove only the tracked non-root
  manifests. A fresh run must recover after interruption by deterministically rebuilding and
  removing that same bounded set.
- Leave exactly `<staging-root>/dist.json` plus the regular files it declares. Symlinks, special
  entries, undeclared files, undeclared empty directories, malformed child manifests, or unsafe
  transitions fail rather than being deleted merely to make verification pass.
- Run strict `Pkg.Dist.Local.verify` as the final postcondition with one package-private frozen
  Deploy policy: `16 MiB` manifest, `8,193` observed entries, `128 MiB` per file, and `1 GiB`
  aggregate declared assets.
- Add the exact frozen verification evidence to successful `DeployTool.StageResult`; staging reports
  success only after verification. Immediate spinner/report status uses that evidence without
  reloading the filesystem.
- Keep the verifier unchanged. Add no `DistTree`, compute filter exception, projection materializer,
  alternate manifest, or R2 behavior.

#### Causal proof

Prove before landing:

- cwd, dot-root, absolute, traversal, symlink, lexical/portable alias, edge-whitespace retargeting,
  cooperative cwd/staging-root/mapping-root replacement, and ownership contention fail before
  mapping/build mutation;
- root reset is unconditional and cannot remove outside or sibling bytes;
- equal, ancestor, and unsafe source/destination overlaps fail before writes, while disjoint
  mappings retain bounded concurrency;
- two public processes using one mutable builder through distinct cwd and staging roots either fail
  busy before build mutation or retain invocation-specific output under a deterministic barrier;
- public cancellation settles a barrier-blocked owned build child and leased rollback before an
  immediate same-root retry, while multi-file manifest hashing observes cooperative cancellation;
- nested copy/build/index mappings leave one root manifest and exact declared-file equality;
- interrupted child-manifest cleanup converges on a fresh run without broad cleanup;
- generated exact-index links and custom index bytes remain stable;
- strict verification failure prevents success and returns no evidence; and
- successful result evidence distinguishes manifest integrity from composite Dist digest.

### `refactor(tools): route deploy preview through verified local Dist serving`

This landed contract records the intermediate authority correction. Its Deploy-owned presentation,
route-choice, reload, and cleanup clauses are superseded only by the later standard-serving items;
its fresh verification, exact-root, strict-port, refusal, and no-fallback invariants remain.

Replace generic arbitrary-directory serving and permissive menu metadata with one verified preview
session. No Server source or public API changes belong in this landed item.

- Use the same frozen Deploy verification policy for fresh endpoint-menu status and
  `DistServer.Local.start`.
- Derive hash, build age, bytes, mapping coverage, and preview choices only from fresh verification
  evidence. Remove `mappingDist` and nested-manifest fallback from authority-bearing Deploy views.
- A missing, malformed, changed, unsafe, over-limit, cancelled, or non-exact root has no staged
  authority. Render one sanitized verifier reason and offer no preview action.
- Resolve the requested port as `staging.serve.port ?? 4040`; bind numeric loopback with strict port
  behavior, `silent: true`, and keyboard disabled. An occupied port remains `address-in-use` and
  never rebinds or falls back.
- Load the existing narrow `@sys/server/dist/server` surface only for preview. Remove Deploy's call
  to generic `startServing`; leave the standalone `@sys/tools/serve` command unchanged.
- Build root and nested preview choices from `started.verification.dist.hash.parts`. Use `/` for the
  declared root index and exact declared `*/index.html` URLs for nested choices. Never rescan the
  filesystem or use `Pkg.Dist.load` after startup.
- Keep open, reload, and back as Tools presentation. Reload closes the current server, starts a
  fresh verification generation, and replaces all choices. Back, failure, cancellation, prompt
  disposal, and thrown presentation paths close the current lifecycle exactly once.
- Failed verification starts no listener and invokes no generic Serve/static fallback. Browser-open
  remains an operator affordance, not evidence that a loaded document is current.

Causal tests cover fresh menu evidence, mutation invalidation, exact choice derivation, root and
nested file serving, fixed-port refusal, open/reload/back ordering, cancellation, and exactly-once
closure without changing pinned hosting, Driver Pi, Driver Vite, or generic Serve behavior.

### `test(tools): prove staged artifact and preview authority parity`

Add one real-filesystem and real-loopback capstone rooted at the public Deploy staging and endpoint
preview boundaries.

- Stage nested copy/build/index fixtures and assert the physical regular-file set equals root
  `dist.hash.parts` plus root `dist.json`, with no nested manifest.
- Assert staging evidence and preview startup evidence have identical manifest integrity, Dist
  digest, part map, and verified totals for unchanged bytes.
- Fetch `/`, one exact nested `*/index.html`, representative assets, and `/dist.json`; require the
  checksummed bytes named by startup evidence and refuse unknown or directory-probing routes.
- Mutate metadata, a declared asset, an undeclared entry, and a limit boundary between generations;
  each world must remove authoritative status and open no fallback listener.
- Prove requested-port behavior and close/reload/back settlement with deterministic barriers, not
  timers or filesystem mocks.
- Retain existing owner-level tests as the causal proof; the capstone must not duplicate the
  complete FS verifier or Server routing matrices.

## Standard Dist serving design correction

### TMIND and DMIND adjudication

The subject is one locally verified staged artifact presented as a running Dist service. The user
need is to inspect or open that artifact and then leave the nested service view. Choosing among
every nested HTML entry is neither the subject nor a necessary intermediate decision.

Adversarial ownership, lifecycle, compatibility, and interaction review settles the correction as
follows:

- Leaving the selector in Deploy would preserve exact-path evidence, but that evidence adds no
  authority beyond `DistServer.Local.serve`; it pays for a second terminal renderer, stdin owner,
  generation loop, browser index, and cleanup arbiter. The strongest case for leaving it unchanged
  therefore fails the semantic-ownership and simplicity tests.
- Calling the current standalone `DistServer.Local.serve` unchanged would remove the duplicate
  renderer, but it cannot distinguish nested back from terminal closure. Treating `q`, Ctrl+C, lower
  completion, and Ctrl+Arrow Left as the same return would make the footer lie or cause the parent
  menu to reopen after quit.
- Copying Driver Pi's screen, footer fragment, key predicate, supervisor, or completion objects into
  Tools or Server is prohibited. Driver Pi demonstrates the desired nested interaction, not a
  reusable Dist presentation implementation.
- A universal service-screen framework is also rejected. Vite development output, Driver Pi boot
  state, Cell service summaries, and verified Dist serving have different semantic data and failure
  lifecycles. Visual family resemblance is insufficient authority for a new abstraction.
- The durable seam is an additive navigable mode on the existing Dist terminal-serving owner,
  composed from shared CLI control primitives. That keeps one Dist screen and one service lifecycle
  while returning only the finite distinction its embedding caller needs.
- The generated root `index.html` remains the artifact's navigation surface. Removing terminal route
  enumeration does not remove reachability: `/` is already a verified alias for that declared file,
  and its generated or custom content owns any links to nested applications.

`verified-package-ui-release.plan.md` is not a prerequisite or unlock for this correction. It
explicitly creates no higher-level package-UI abstraction and keeps Driver Pi application, terminal,
keyboard, screen, browser, and supervisor orchestration product-owned. Its Server generation work
may land independently without changing this plan's semantic boundary.

This correction was reviewed by gpt-5.6-sol at max under TMIND with DMIND pressure against semantic
ownership, interaction fit, compatibility, lifecycle linearization, failure precedence, proof
allocation, and the strongest leave-unchanged and broader-abstraction alternatives. The review
accepted the CLI, Server, and Tools design decomposition and found no unresolved design dependency.

### `feat(cli): standardize nested-screen back controls`

Expose only the generic control grammar and presentation token already shared in intent by nested
terminal screens.

- Add `Cli.Keyboard.Is.back` for exact Ctrl+Arrow Left: lowercase Cliffy key `left`,
  `ctrlKey: true`, and every other modifier explicitly false. Missing modifier evidence, Shift, Alt,
  Meta, another arrow, or plain Left must be rejected.
- Add one canonical `Cli.Fmt.Keyboard.back()` token for the existing `← ctrl` footer vocabulary.
  Keep terminal-width row choice in each screen owner; the helper owns neither a service layout nor
  navigation policy.
- Replace Driver Pi's private predicate and handwritten footer token with these shared helpers while
  preserving its state-dependent `allowsBack`, trusted-control settlement, failure lockout, and
  supervisor cleanup unchanged.
- Do not teach `Cli.Keyboard.bind` to interpret back automatically. Callers still decide whether the
  shared chord is admitted and return its existing `stop` disposition when navigation wins.
- Prove exact key admission, bounded presentation, frozen public surfaces, and unchanged Driver Pi
  preparing/ready/failure behavior. No Deploy or Server code belongs in this prerequisite.

Destination seams:

```text
code/sys/cli/src/m.core/m.Keyboard/m.Is.ts
code/sys/cli/src/m.core/m.Keyboard/t.ts
code/sys/cli/src/m.core/m.Cli/t.ts
code/sys/cli/src/m.core/m.Fmt/m/m.Keyboard.ts
code/sys/cli/src/m.core/m.Fmt/t.keyboard.ts
code/sys/cli/src/m.core/m.Keyboard/-test/-m.Is.test.ts
code/sys/cli/src/m.core/m.Fmt/-test/-m.Keyboard.test.ts
code/sys/cli/src/m.core/m.Cli/-test/-.test.ts
code/sys/cli/src/m.core/m.Cli/-test/-t.helpers.test.ts
code/sys/cli/src/m.core/m.Fmt/-test/-t.test.ts
code/sys/cli/src/m.core/m.Keyboard/-test/-entry.test.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.gui.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.screen.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/-test/-u.start.gui.test.ts
```

### `refactor(driver-pi): decompose GUI startup orchestration`

Decompose the product-owned GUI startup implementation before extending nested Dist serving. This is
one behavior-preserving maintainability checkpoint, not a new startup abstraction or service policy.

- Make `u.start/u.gui/mod.ts` the sole canonical facade for `start`, `StartGuiInput`, and the
  existing `StartGuiDependencies` re-export. Update every package call site and remove the former
  `u.start/u.gui.ts`; do not retain a compatibility shim or a second entrypoint.
- Keep private implementation beside that facade under `u.start/u.gui/`, subordinate to the existing
  `u.start` owner; do not create a peer `m.cli.profiles/u.start.gui` owner.
- Separate hostile input and dependency admission, session/status/control/cleanup orchestration,
  authority-to-application boot, and observed-operation failure publication by semantic ownership.
  Do not split helpers merely to balance line counts or create a generic startup framework.
- Preserve exact input refusal, receiverless dependency invocation, promise-transport checks,
  terminal linearization, back/quit behavior, failure text, foreground release, retained-resource
  evidence, cleanup order, and completion authentication.
- Keep existing tests importing the public facade. Add only structural/API proof needed to prevent
  accidental internal entrypoints or public-surface drift; do not rewrite behavioral fixtures to fit
  the extraction.
- Leave `u.start/u.screen.ts` unchanged in this commit. Its separate decomposition is the following
  screen-presentation checkpoint, not a reason to broaden orchestration factoring.

Expected destination seams:

```text
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.gui/mod.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.gui/t.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.gui/u.input.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.gui/u.session.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.gui/u.boot.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.gui/u.operation.ts
```

Causal proof is the unchanged profile startup matrix and process-exit proof, package checking, dry
publication, and a residue pass confirming that the facade contains no orchestration and the new
private modules do not duplicate lifecycle or authority ownership.

### `refactor(driver-pi): decompose GUI lifecycle supervision`

Split the existing lifecycle authority by owned state machine.

- Make `u.start/u.lifecycle/mod.ts` the sole canonical facade. Update every package call site and
  remove the former `u.start/u.lifecycle.ts`; do not retain a compatibility shim or alias.
- Isolate hostile status, keyboard, screen, and application owner snapshots from terminal
  arbitration. Snapshot helpers may transfer only their current narrow cleanup capabilities.
- Keep first-terminal arbitration, pending-candidate precedence, observed-reaction replacement,
  foreground release, and work admission together as the supervisor state machine.
- Isolate ordered cleanup and cleanup-evidence projection without changing screen-before-keyboard,
  application-before-lease, independently started status closure, or Promise-transport fallback.
- Isolate retained-resource ownership and listener settlement. Strong retention must remain truthful
  until absence is proved; extraction must not weaken retention or introduce eager release.
- Preserve `createSupervisor`, all currently exported lifecycle types and functions, exact errors,
  and every caller's imported symbols. Do not generalize this into a cross-service lifecycle
  framework.

Expected seams are `mod.ts`, `t.ts`, `u.snapshot.ts`, `u.supervisor.ts`, `u.cleanup.ts`, and
`u.retention.ts` beneath `u.start/u.lifecycle/`; add a smaller final-error module only if it
prevents cleanup projection from becoming a mixed owner. Existing lifecycle and supervisor suites
remain the causal proof surface.

### `feat(cli): expose aggregate formatter presentation authority`

Move formatter integrity ownership behind the canonical CLI facade before decomposing its Driver Pi
consumer.

- Add `Cli.Fmt.isReady()` as the single aggregate synchronous presentation gate. Compose the
  existing Text authority with whole-owner Set snapshots required by ordered service-URL formatting;
  do not duplicate descriptor snapshot machinery.
- Prove Text-authority composition, Set replacement, changed methods, unexpected shape additions,
  trap-free refusal, public runtime identity, and canonical type projection within `@sys/cli`.
- Reduce Driver Pi to one policy call and its existing package-owned failure translation. Remove its
  formatter method inventory and private descriptor-snapshot implementation rather than relocating
  or cosmetically reformatting them.

### `refactor(driver-pi): decompose GUI screen presentation`

Split screen acquisition, pure rendering, input admission, and resize cleanup.

- Make `u.start/u.screen/mod.ts` the sole canonical facade. Update every package call site and
  remove the former `u.start/u.screen.ts`; do not retain a compatibility shim or alias.
- Keep the screen owner transaction together: interactive admission, state subscription, initial
  measurement, repaint failure publication, redraw serialization, warning state, and retryable
  disposal.
- Move pure frame projection and value formatting away from acquisition. Preserve exact rows,
  colors, hyperlink targets, width behavior, evidence and recovery text, footer priority, and empty
  viewport behavior.
- Isolate root/manifest/service URL and viewport admission from rendering without weakening proxy,
  descriptor, Unicode-control, loopback, or presentation-authority checks.
- Keep resize acquisition and partial cleanup linearized. Failed subscription must retain the exact
  retryable cleanup authority currently returned to the screen owner.
- Preserve `StartGuiScreen`, `observeResizeWith`, all current types, failure text, and every
  caller's imported symbols. Do not create a reusable universal screen framework.

Expected seams are `mod.ts`, `t.ts`, `u.owner.ts`, `u.render.ts`, `u.render.serviceRow.ts`,
`u.input.ts`, and `u.resize.ts` beneath `u.start/u.screen/`. Existing screen owner, resize, and
render suites remain the causal proof surface; `u.start/u.screen/mod.ts` should contain exports only
after the extraction.

### `refactor(driver-pi): decompose GUI identity admission`

Split the identity firewall by evidence domain while preserving `u.start/u.identity/mod.ts` as its
stable internal facade.

- Separate source-authority and expected-package snapshots, materialization settlement admission,
  and application-owner/browser-policy admission. Each path must retain exact-shape, frozen-object,
  canonical-integrity, and package-identity refusal semantics.
- Centralize descriptor-only object snapshots narrowly for those identity domains. Do not turn the
  hostile-value admission helpers into a general validation library or reintroduce accessor reads.
- Preserve rollback-capability transfer for invalid application owners, exact native Promise
  admission, loopback origin and browser-policy checks, materialization failure evidence, diagnostic
  attachment, and every existing exported symbol.

Expected private seams are `mod.ts`, `t.ts`, `u.snapshot.ts`, `u.source.ts`, `u.materialization.ts`,
and `u.application.ts` beneath `u.start/u.identity/`. Existing identity/materialization tests and
the supervisor application-owner matrix remain the causal proof surface.

### `refactor(driver-pi): use module facade for GUI identity admission`

Move the identity facade from subject-bearing `u.start/u.identity.ts` to the canonical
`u.start/u.identity/mod.ts`, migrate every production and test caller to the explicit module entry,
and leave no compatibility alias.

#### Remaining `u.start/` factoring inventory

Do not add a decomposition task for `u.materialize.ts` merely because it is moderately long. Its
release-store acquisition, rooted target/lease admission, materializer invocation, and storage
failure projection form one cohesive release-materialization boundary; reassess only if extracting
one of the owners above exposes a concrete second responsibility. The remaining files are small,
cohesive substrate or policy modules and are not factoring candidates in this arc.

### `feat(server): add nested navigation to Dist serving`

Extend the existing pinned and local `DistServer.serve` terminal owner; do not expose
`DistServeScreen` for callers to compose and do not create a second service runner.

#### Public contract

Add an exact `navigation: 'nested'` serve variant with a finite result:

```text
{ kind: 'back' } | { kind: 'closed' }
```

- Preserve the existing no-navigation call signature and `Promise<void>` return as a source- and
  type-compatible overload. The nested overload alone returns the finite result.
- Nested mode owns visible interactive presentation. It accepts no caller override for `silent` or
  `keyboard`; contradictory runtime objects fail before verification, listener binding, screen
  acquisition, or browser opening. An unavailable interactive terminal fails rather than silently
  degrading to a raw service that cannot navigate back.
- Preserve all existing pinned/local authority inputs: directory, integrity where pinned, finite
  verification limits, loopback hostname, strict requested port, browser policy, name, package
  subpath, and caller lifecycle.

#### Interaction and lifecycle

- Reuse `DistServeScreen.create` as the only frame/runtime owner. Change only its keyboard-control
  input and pure footer projection for nested mode; do not fork or wrap its layout/runtime.
- Keep `o` as the single root-browser affordance. Never accept a caller URL, enumerate Dist parts,
  probe directories, or open a nested path. At widths that cannot fit every hint, retain back and
  quit before the optional open hint; the verified root URL remains visible and linked.
- Admit only `Cli.Keyboard.Is.back`. When it wins, latch `back`, request listener closure, and
  return the keyboard binding's `stop` disposition before another stdin read begins. Canonical
  q/Ctrl+C, external cancellation, and ordinary lower completion settle as `closed`.
- Linearize completion at the first admitted terminal source. A late back key cannot overwrite prior
  quit, cancellation, listener settlement, screen failure, or keyboard failure.
- Resolve either finite success only after listener, screen, resize observer, keyboard input, and
  pending callback work have completely settled. Cleanup failure revokes success; it cannot be
  hidden behind `back` or `closed`. Preserve the existing primary-failure and cleanup precedence.
- Re-entry is the reload mechanism: every later invocation performs fresh verification and creates a
  fresh server generation. Lowercase `r` remains screen redraw only and must never reverify or
  mutate the served artifact.

#### Owner proof

Extend Server's existing deterministic serve and screen suites rather than creating a parallel test
harness. Prove default-mode compatibility, nested-input admission before effects, wide/compact
footer priorities, exact back-key settlement, no second key read, q/Ctrl+C and lower closure,
back-versus-failure races, cleanup-before-result ordering, cleanup rejection, port reuse, and pinned
and local parity. Existing verification, routing, responsive-layout, and failure matrices remain the
lower authority and must not be duplicated in Tools.

Destination seams:

```text
code/sys/server/src/m.server.dist/t.ts
code/sys/server/src/m.server.dist/u.server.input/u.serve.ts
code/sys/server/src/m.server.dist/u.server.start/mod.ts
code/sys/server/src/m.server.dist/u.server.start/u.serve.ts
code/sys/server/src/m.server.dist/u.server.screen/u.layout.ts
code/sys/server/src/m.server.dist/-test/-server.serve.test.ts
code/sys/server/src/m.server.dist/-test/-server.serve.screen.test.ts
```

### `refactor(tools): reduce Deploy preview to standard Dist serving`

Make Deploy a thin policy and menu adapter over the nested Server contract.

- Keep fresh endpoint-menu `Pkg.Dist.Local.verify` solely for staged-status truth and action
  availability. Never pass or reuse that evidence as startup authority; `DistServer.Local.serve`
  must independently verify the exact root on every entry.
- Invoke the nested local serve variant with only the resolved staging root, `DIST_VERIFY_LIMITS`,
  configured port or `4040`, endpoint display name, and caller lifecycle. Let Server own loopback
  defaults, strict binding, standard screen, root opening, keyboard arbitration, and cleanup.
- Map `{ kind: 'back' }` to repainting the same endpoint menu only after lower cleanup has settled.
  Map `{ kind: 'closed' }` to the existing clean interactive Deploy exit without another prompt or
  repaint. Verification/startup refusal remains a sanitized `Preview unavailable` result on the
  endpoint screen.
- Delete `deployPreviewChoices`, encoded path construction, the Select prompt, reload generations,
  prompt/listener races, browser-open callbacks, and Deploy's duplicate close/abort state machine.
  Remove the obsolete `DeployPreview` choice/action/prompt/start dependency types and prompt
  fixture.
- Retain only a small preview-status helper if it earns the menu-local name; do not preserve a
  `u.preview.ts` facade merely to hide one direct Server call.
- Rewrite the capstone around the public staging result and the standard verified root. Assert exact
  staged-tree/evidence truth, one `/` response and manifest response, unknown-route refusal, fresh
  mutation refusal, configured-port behavior, and cleanup/port reuse. Remove nested route-choice,
  reload, and presentation-lifecycle matrices now owned by Server.
- Add focused menu orchestration proof that back re-enters the same endpoint, closed exits the tool,
  and no Select prompt or generic `@sys/tools/serve` fallback is reachable. Perform one real TTY
  run: enter Preview, observe the standard `DistServeScreen`, open `/`, Ctrl+Arrow Left back to the
  same endpoint, re-enter for fresh verification, and q out with immediate port reuse.

Destination seams:

```text
code/sys.tools/src/cli.deploy/u.endpointAction.ts
code/sys.tools/src/cli.deploy/u.preview.ts
code/sys.tools/src/cli.deploy/t.preview.ts
code/sys.tools/src/cli.deploy/common.t.ts
code/sys.tools/src/cli.deploy/t.namespace.ts
code/sys.tools/src/cli.deploy/u.menu/menu.endpoint.ts
code/sys.tools/src/cli.deploy/-test/-u.preview.test.ts
code/sys.tools/src/cli.deploy/-test/-u.preview.parity.test.ts
code/sys.tools/src/cli.deploy/-test/u.preview.fixture.ts
code/sys.tools/src/cli.deploy/-test/-u.endpointAction.test.ts
code/sys.tools/src/cli.deploy/u.menu/-test/-menu.endpoint.preview.test.ts
```

### `refactor(tools): normalize staging utility filenames`

Normalize the private utility filenames beneath `cli.deploy/u.staging/` without changing runtime,
type, lifecycle, or failure behavior.

- Remove the redundant `staging` qualifier from build-lease, cancellation, execution, identity,
  lease-settlement, manifest, preparation, and concurrency filenames.
- Keep `u.stageMappings.ts` as the explicit orchestration seam and retain existing exported symbol
  names, including `executeStaging`, `PreparedStagingPlan`, and `StagingManifestLedger`.
- Rename the matching execution test, update only module specifiers and facade exports, and leave the
  private `u.staging/` grouping boundary intact.

## External boundaries

### Orbiter

Orbiter retirement is complete and preserved by the checked prerequisite reference. This plan adds
no tombstone, compatibility provider, product migration, origin, or replacement target.

### R2 publication

[r2-dist-generation-publication.plan.md](r2-dist-generation-publication.plan.md) exclusively owns
strict publication admission, checksum-pinned upload reads, immutable generation paths, conditional
settlement, remote readback, activation evidence, and generation-qualified public URLs.

This plan must not add a partial R2 correction, compare local preview with permissive flat-R2
output, or claim remote/pinned parity.

## Verification commands

Run the narrow owner proof first and record only commands actually run and exact outcomes.

From `code/sys/cli` after the shared CLI items:

```sh
deno test -P=test --trace-leaks ./src/m.core/m.Keyboard/-test/-m.Is.test.ts ./src/m.core/m.Fmt/-test/-m.Keyboard.test.ts ./src/m.core/m.Fmt/-test/-u.authority.test.ts
deno task test
deno task check
deno task dry
```

From `code/sys.driver/driver-pi` after replacing its private back predicate and token:

```sh
deno task test:profiles
deno task check
deno task dry
```

From `code/sys/server` after the nested Dist serving item:

```sh
deno test -P=test --trace-leaks ./src/m.server.dist/-test/-server.serve.test.ts ./src/m.server.dist/-test/-server.serve.screen.test.ts
deno task test
deno task check
deno task dry
```

From `code/sys.tools` after each Tools item:

```sh
deno task test:deploy
deno task test:deploy:authority
deno task check
```

After the preview item and capstone:

```sh
deno task test:serve
deno task test
deno task dry
```

From `code/sys/cell` after removing the live sample's redundant `staging.clear` key:

```sh
deno task test:deploy:authority
deno task sample:deploy
deno task check
deno task test
deno task dry
```

Run `deno fmt --check` against every attributable formatter-supported file without formatting or
absorbing unrelated clean-baseline findings.

Final workspace proof from `/Users/phil/code/org.sys/sys`:

```sh
git diff --check
deno task ci
```

Before closeout, reopen the complete reconciled arc, inspect target attribution and unrelated
deltas, and prove every retained external claim against live owner source or reachable history.

## Landed implementation evidence

Verified local Dist preview landed as `427e24436` after its standalone CLI lifecycle prerequisite
landed as `b9d5e3ec8`. Pull fixture cleanup landed independently as `997ba6d2c`. The real staged
workflow then exposed a trusted-child path-boundary regression: `edd7c87d3` corrected containment
and preserved recursively ignored Rooted lock metadata. The staged-artifact/preview authority-parity
capstone landed as `a785b3304`, completing the original authority-parity phase before the standard
serving design correction was added.

### Review adjudication

- The first blind falsification pass returned four material findings: portable destination-ancestor
  aliases, finalizer-owned mapping names, cyclic nested index projection, and permissive sparse
  index-source overlap. Each finding was reproduced, corrected at its owning boundary, and retained
  as a focused regression.
- The fresh independent replication returned two further blockers: concurrent mutation of one
  `build+copy` source across Deploy roots, and incomplete public cancellation/child/hash settlement.
  Canonical cross-process build-source leases, public `Deploy.stage` cancellation, a finite build
  timeout, cancellable Dist hash progress, frozen plan snapshots, truthful absolute result types,
  and pre-mutation unknown-mode rejection close those findings.
- The final S-tier lease/cancellation residue audit found one nested-lifetime defect: build-source
  ownership was released before staging ownership. Release now unwinds in reverse acquisition order
  and a focused failure-preserving regression pins staging release before build-source release.
- Orthogonal call-site and residue inspection found no production `staging.clear`, direct platform
  filesystem mutation, second root-lifecycle owner, preview/provider expansion, or stale permissive
  mapping-mode path.
- Preview review found that a bare raced prompt promise did not own stdin cancellation, listener
  completion, or losing-prompt disposal. `Cli.Input.Select.start` now owns prompt input and cleanup,
  while Deploy treats prompt settlement, listener completion, browser-open, reload, back, and close
  as one causal lifecycle.
- A fresh blind replication, reviewed by `gpt-5.6-sol` at `max`, found two remaining blockers:
  synthetic Enter could not terminate every Cliffy Select grammar, and cleanup rejection could
  replace an established sanitized or primary outcome. Private reader interruption now makes
  cancellation grammar-independent, and explicit cleanup precedence preserves primary failures while
  preventing false successful back or reload results.
- Deterministic regressions cover grouped and searchable Select options, custom keymaps, immediate
  stdin reacquisition, listener rejection, cancellation plus close rejection, presentation failure
  plus close rejection, successful-back cleanup failure, and exactly-once production-faithful close.
  No named review risk remains unresolved.

### Executed validation

- From `code/sys.tools`, `deno task test:deploy` passed 33 suites with 273 steps;
  `deno task test:deploy:authority` passed its restricted owner tests and printed
  `Deploy.stage authority proof passed.`; `deno task check` and `deno task dry` passed.
- The focused staging owner suite passed 42 steps, including cross-process build-source exclusion,
  public cancellation and immediate retry, cooperative multi-file manifest-hash cancellation,
  failed-generation rollback settlement, and nested lease-release ordering.
- From `code/sys/cell`, `deno task test:deploy:authority`, `deno task sample:deploy`,
  `deno task check`, `deno task test`, and `deno task dry` passed. The package test run passed 36
  suites with 310 steps; existing dynamic-import publication warnings remain unrelated.
- A human-run root `deno task ci` completed successfully: 53 packages, 9,093 tests, 42 reports
  collected, and 11 not applicable. The workspace test phase completed in seven minutes.
- Targeted attributable formatting and lint passed, and root `git diff --check` returned no output.
- After the final preview lifecycle corrections, CLI passed 49 suites with 342 steps, including its
  denied-authority keyboard proof. Tools Deploy passed 33 suites with 285 steps; restricted Deploy
  authority passed 4 suites with 40 steps and printed `Deploy.stage authority proof passed.`
- Tools Pull passed 23 suites with 96 steps, Serve passed 11 suites with 73 steps, and the full
  Tools package passed 118 suites with 708 steps. Tools and CLI checks and dry runs passed; the
  exact 30-file attributable formatter check and root `git diff --check` also passed.
- After the trusted-child containment correction and capstone extension, the complete FS package
  passed 60 suites with 586 steps plus check, lint, formatting, and dry publication. The real
  six-mapping package-local Deploy workflow staged successfully. Deploy, restricted-authority,
  Serve, full Tools, check, formatting, lint, and dry-publication validation passed again; final
  `git diff --check` returned no output.
- After reducing Deploy preview to standard nested Dist serving, Tools check, targeted formatting,
  targeted lint, Deploy, restricted Deploy authority, Serve, full package tests, and dry publication
  all passed. Residue searches found no retired `DeployPreview`, `runDeployPreviewSession`,
  `verifyDeployPreview`, `deployPreviewChoices`, or `u.preview` authority.
- A real pseudo-TTY run entered the verified `tdb.fs` preview on port `4040`, rendered the standard
  `DistServeScreen`, exercised `o` for `/`, returned with Ctrl+Arrow Left only after cleanup,
  re-entered through fresh verification, and closed with `q`. No listener remained on port `4040`.
- After staging utility filename normalization, targeted formatting and lint, Tools check, Deploy,
  restricted Deploy authority, the full 119-suite/704-step package test, and dry publication all
  passed. Residue searches found no old staging-prefixed utility or execution-test paths.

### Shared back-control validation

The focused CLI command first produced the expected four missing-contract TS2339 errors, then passed
2 files with 22 steps. `deno task test`, `deno task check`, and `deno task dry` passed from
`code/sys/cli`; the test task passed 49 suites with 348 steps and its denied-authority keyboard
proof. From `code/sys.driver/driver-pi`, `deno task test:profiles` passed 30 suites with 355 steps
plus its 5-step process proof; `deno task check` and `deno task dry` passed. The dry run retained
its existing unanalyzable-dynamic-import warnings. Targeted 14-file `deno fmt --check`, `deno lint`,
and `git diff --check` passed.

### Aggregate formatter-authority validation

The focused CLI authority, API, type, and lower Text suites passed 4 suites with 16 steps. The full
CLI package passed 50 suites with 350 steps plus its denied-authority keyboard proof; package check
and dry publication passed. Driver Pi's complete unit run passed 68 suites with 550 steps, profiles
passed 30 suites with 355 steps plus the 5-step process proof, and preview passed 16 steps; package
check and dry publication passed with only the existing unanalyzable-dynamic-import warnings. The
screen owner, render, and resize suites passed 39 steps. Targeted formatting, lint, and diff checks
passed.

## Non-goals

- no new Deploy preview renderer, route selector, static indexer, or lifecycle owner;
- no copied Driver Pi screen, supervisor, completion object, or product policy;
- no universal service-screen framework and no merger of Vite, Driver Pi, Cell, or Dist semantic
  layouts;
- no reuse of generic `@sys/tools/serve`, its filesystem target discovery, or its Select menu;
- no Server routing expansion, directory probing, SPA fallback, watch mode, or verification-policy
  change;
- no Orbiter compatibility or product migration;
- no R2 publication, provider semantics, remote mutation, or remote parity claim;
- no public or private `DistTree` API or local projection materializer;
- no browser-document freshness attestation or automatic nested-path opening;
- no TOFU, mutable-latest authority, independently pinned release claim, or publication provenance;
- no dependency on `verified-package-ui-release.plan.md` and no migration of Driver Pi or Driver
  Vite service policy beyond consuming shared CLI back-control primitives; and
- no absorption of unrelated worktree changes.

verified-package-ui-release.plan.md
- [x] 9159b6770 feat(fs): expose leased owned-tree batch removal
- [x] f122a2bef refactor(fs): remove Rooted type alias facade
- [x] 13a913ab8 refactor(fs): group Rooted operations by capability noun
- [x] 23b18c40d refactor(driver-pi): consume leased owned-tree batch removal in GUI reset
- [x] b627146ef feat(server): expose owned pinned Dist generation sessions
- [x] 038e8cd7e Commit: refactor(driver-pi): adopt Server-owned Dist generations
- [x] f710d3aa0 plan(snapshot): direct-gui-release-composition.plan.md
- [x] 35d8b54a6 [direct-gui-release-composition.plan.md](direct-gui-release-composition.plan.md)

## Purpose

Move generic verified-release mechanisms that accumulated in Driver Pi to their existing semantic
owners. The landed ownership-foundation commits establish an ownership foundation, not the final
minimal call-site shape. The Driver Pi migration is a behavior-preserving bridge that adopts
Server-owned Generation authority and removes the superseded local release-owner substrate.

The final referenced child,
[direct-gui-release-composition.plan.md](direct-gui-release-composition.plan.md), completed the fresh
endpoint assessment and direct-composition correction from landed public contracts without treating
this plan's local orchestration, proof matrix, or preservation choices as design requirements.

The ownership-foundation flow is:

```text
Driver Pi frozen evidence and package policy
  → Server-owned pinned generation session
  → Driver Pi package admission
  → existing verified Dist host
  → Driver Pi browser and terminal glue
```

The reset flow is:

```text
Driver Pi store-root and target policy
  → FS-owned leased batch removal
  → Driver Pi operator presentation
```

This plan is the planning-only handoff from
[start-ui-release-evidence.plan.md](start-ui-release-evidence.plan.md). It authorizes no Git
mutation, package publication, provider choice, public release, or passage through the governing
release-owner gate.

## Architecture decision

The semantic owners are:

```text
@sys/fs Rooted              admitted targets, stable leases, sealing, owned-tree removal
@sys/fs Pkg.Dist            exact manifest and part verification
@sys/http                   bounded transport and constrained response bytes
@sys/server Dist            authenticated materialization and sealed generations
@sys/server DistServer      independently verified local hosting
@sys/driver-pi              package policy, launcher evidence, recovery, UI, and operator tasks
```

For the ownership foundation, the extraction adds no new package and no `VerifiedPackageUi` facade.
`t.FsRooted` becomes the one canonical public Rooted type namespace; the legacy `t.Fs.Rooted` alias
facade is removed before the runtime capability-noun migration. Existing low-level APIs remain
independently usable through the final capability-noun shape:

- `rooted.Target.admit`, `rooted.Lease.acquire`, and `rooted.Tree.remove` remain available;
- `Dist.materialize` remains available;
- `DistServer.start` remains separate from generation ownership; and
- the Driver Pi bridge directly composes the selected package owners after deleting its reusable
  lifecycle framework, without claiming that the remaining local orchestration is minimal.

The ownership bridge retained the following Driver Pi responsibilities for the referenced child's
first-principles assessment of durable product policy versus inherited coordination:

- immutable package expectation and both generation-time and host-time package checks;
- `.pi/@sys/dist`, current and legacy package target names, and exact ancestry-selection policy;
- manifest source, pin, credential, retry, byte, timeout, and verification limits;
- generated evidence module format, comments, output path, direct write seam, and commit suggestion;
- service name, verified-loopback browser policy, recovery text, failure categories, terminal state,
  menu behavior, and operator tasks; and
- the bridge's existing application/status/keyboard/screen sequencing, whose disposition is recorded
  in the completed direct-composition plan.

The TypeScript evidence renderer remains Driver Pi-owned. Its output is a package build/evidence
format, not Server generation lifecycle.

## Ownership-foundation bridge shape

Driver Pi retains one conceptual policy adapter at:

```text
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.start.gui.service.ts
```

It freezes:

- service name `sys.ui:pi`;
- generated evidence selected from `u.start.gui.service.evidence.ts`;
- package expectation bound from immutable `src/pkg.ts` authority;
- release-store root and target policy; and
- local-rehearsal recovery guidance.

Adjacent package-policy leaves retain materialization limits and verified-loopback browser policy.
The bridge directly invokes the Generation and hosting packages and removes the prior reusable
release lifecycle framework. Separate physical files remain where presentation warrants them. At
that bridge baseline, the surviving session still carried supervisor-shaped local coordination and
was not accepted as the final thin endpoint; the completed referenced child owns that endpoint and
its module budget.

## FS-owned batch removal

### Public contract

Add one operation-owned batch removal method to `Fs.Capability.Rooted.Instance`:

```text
rooted.removeTreeBatch(targets, { until? })
```

This is the exact surface introduced by the feature slice. The next commit removes the legacy Rooted
type alias facade without changing this runtime operation. The subsequent Rooted capability-noun
refactor moves it to `rooted.Tree.removeBatch` before any cross-package caller adopts the batch
operation; neither refactor changes the transaction described here.

`targets` is a snapshotted `readonly t.StringPath[]`. Directory kind is intrinsic to this method, so
callers do not construct Rooted target-input records. The operation captures every path before I/O
and admits the complete batch through this instance. Options are admitted as exact own-data input;
nested lifecycle arrays are recursively snapshotted and frozen while valid lifecycle leaves remain
borrowed by reference. Sparse, accessor, cyclic, Proxy, and Proxy-prototype lifecycle containers are
rejected without invoking caller code. Input that cannot yield one complete owned path and lifecycle
snapshot rejects with a typed Rooted failure before a batch settlement, lock metadata, or target
observation exists; every operational outcome after successful snapshotting uses the result union
below.

The method owns the complete generic transaction:

```text
snapshot every caller-order path and lifecycle container
  → establish one batch-owned cancellation latch for the complete transaction
  → admit every directory target through this Rooted instance
  → acquire one non-waiting exclusive lease batch in stable lock-identity order
  → map any contended lock back to its immutable caller index and admitted path
  → refuse busy before any removal
  → remove targets in caller order by borrowing that lease
  → attempt complete lease release exactly once
  → settle exact removal and release truth
```

There is no `wait` option. A batch operation must not spin behind an owner, and it must not wait on
a lease held by the same process through another capability. Existing
`acquireLease(..., { wait: true })` remains available to lower-level callers that explicitly own
such waiting. One operation-owned abortable lifecycle subscribes immediately after non-empty input
capture, supplies its stable signal to every lower operation, remains latched across every composed
operation boundary, and is disposed only after mandatory lease release and settlement. An empty
batch creates no lifecycle observer.

The exact frozen settlement is:

- `settled`: every target has an ordered `{ index, path, kind: removed | absent }` result and an
  optional orthogonal `releaseError: FsRooted.Failure`;
- `busy`: no target changed, with the exact contended caller `index` and admitted relative `path`;
  partial acquisition was released cleanly before this result exists; and
- `failed`: ordered `completed` results, optional exact `current: { index, path }`, the exact
  `unattempted` caller-order suffix, primary typed `failure`, optional independent `releaseError`,
  and `changed`.

`changed` is true exactly when a completed prefix result is `removed` or the primary
`FsRooted.Failure.committed` is true. Lease-release failure does not claim tree mutation. A release
failure after all removals remains a `settled` result carrying `releaseError`; it never overwrites
or relabels the known removal results. Failure while unwinding partial acquisition is a `failed`
settlement, not `busy`.

A failure before removal has an empty completed prefix, no current removal target, and the complete
input as unattempted. A failure during one removal identifies that target as `current` and excludes
it from the suffix. The operation never reconstructs state from post-failure path probing and never
invents success for the current or unattempted targets.

An empty snapshotted batch is the frozen identity settlement `{ kind: 'settled', results: [] }`. It
performs no filesystem call and creates no Rooted metadata. The method reuses existing Rooted
admission, stable lock ordering, private handles, lease borrowing, permission restoration, identity
validation, and single-tree removal; it does not reimplement those algorithms.

### Boundary

FS does not own Driver Pi workspace spelling. Driver Pi continues to:

- resolve and inspect its workspace and `.pi/@sys/dist` ancestry;
- reject symlinked, redirected, non-directory, or non-canonical selected ancestry;
- settle a missing store root as package-level absence without creating it; and
- supply only its two package target names to the Rooted batch operation.

FS still proves that admitted target paths cannot escape the Rooted instance and that the operation
preserves siblings, parents, and stable `.sys.rooted/locks` metadata. Rooted remains cooperative
ownership, not hostile same-user confinement.

### Destination and proof

```text
code/sys/fs/src/m.Fs.capability/m.Rooted/t.ts
code/sys/fs/src/m.Fs.capability/m.Rooted/mod.ts
code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.create.ts
code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.remove.batch.ts
code/sys/fs/src/m.Fs.capability/m.Rooted/-test/-.test.ts
code/sys/fs/src/m.Fs.capability/m.Rooted/-test/-removeTreeBatch.test.ts
code/sys/fs/src/m.Fs.capability/m.Rooted/-test/-removeTreeBatch.process.ts
code/sys/fs/src/m.Fs.capability/m.Rooted/-test/u.fixture.removeTreeBatch.process.ts
code/sys/fs/deno.json
code/sys/fs/README.md
```

Register the real process proof in `test:process`; `deno task test` must execute it. Keep child
permissions at the existing `test-process-child` boundary and do not widen them for convenience.

Owner proof must cover exact input capture, sparse/accessor/proxy and invalid batches before I/O,
recursive sparse/accessor/Proxy/Proxy-prototype/cyclic lifecycle-container rejection without caller
execution, post-call lifecycle-array mutation isolation, empty-batch identity without metadata or a
lifecycle subscription, caller-order results, mixed absence/removal, all-or-none contention,
continuously latched hot-observable cancellation across admission/acquisition/removal boundaries,
cancellation after committed current removal, second-target failure after a committed first target,
release-only failure, simultaneous primary and release failure, exact `changed` derivation, stable
lock acquisition across opposing caller orders in real processes, sealed-tree removal, sibling
preservation, and retained lock metadata. The opposing-order proof must establish that contention
reports the lock encountered in stable lock order while the public result maps it back to the
original caller index; it must not infer ordering from whichever process happens to print first.

## Rooted type namespace cleanup

### Design decision

After the batch feature lands, make `t.FsRooted` the one public Rooted type namespace. Remove the
`Rooted` namespace from `code/sys/fs/src/m.Fs/t.ts` and migrate every in-workspace `t.Fs.Rooted.*`
reference to its semantically identical `t.FsRooted.*` spelling.

`Fs.Capability.Rooted` remains the runtime entry point. This commit changes type spelling only: it
preserves every Rooted contract, handle, operation, result, failure, and runtime object key. Do not
retain aliases, re-exports, deprecated shims, or a second compatibility namespace. Do not mix in the
runtime capability-noun refactor, Driver Pi batch adoption, or behavior changes.

### Migration boundary and proof

The migration owns the complete live-workspace residue rather than only the aliases added by batch
removal. Its current closure is:

```text
code/sys/fs/src/m.Fs/t.ts
code/sys/fs/src/m.Fs.capability/m.Rooted/-test/
code/sys/http/src/http.server/m.HttpPull/
code/sys/server/src/m.server.dist/
code/sys.tools/src/cli.deploy/
```

Proof must establish zero live `t.Fs.Rooted` references, removal of the alias namespace itself,
unchanged assignability through `t.FsRooted`, and successful checks and tests for every affected
package. Run the FS dry publication and workspace graph check so the canonical exported type surface
and dependency closure are independently verified.

## Rooted capability-noun API

### Design decision

After the type alias facade has been removed, reshape the complete `Fs.Capability.Rooted.Instance`
operation surface around the durable capability nouns already present in the model:

```text
rooted.path
rooted.Target.admit(...)
rooted.Lease.acquire(...)
rooted.Tree.inspectSeal(...)
rooted.Tree.seal(...)
rooted.Tree.remove(...)
rooted.Tree.removeBatch(...)
rooted.File.publish(...)
rooted.Stage.create(...)
rooted.Stage.discard(...)
rooted.Stage.promote(...)
```

`Rooted.create` and `Rooted.Is` remain on the package-level Rooted library. A returned lease keeps
`lease.release()` and async disposal because release belongs to that acquired owner. `Stage.files`
continues to be a complete Rooted instance and therefore exposes the same noun families.

This organization is warranted only as one complete vocabulary correction. The flat surface now
contains five stable subjects—target admission, lease ownership, tree operations, file publication,
and stage lifecycle—and adding only `Tree` would create a less coherent mixed API. Keeping the flat
surface is the strongest alternative because it has fewer objects and makes each verb-object pair
explicit; it is rejected because the established nouns now support predictable discovery without
inventing a new abstraction. Extra depth such as `Tree.Seal.inspect`, a generic operation registry,
or a higher-level filesystem facade is design theater and remains out of scope.

### Contract preservation

This is a public runtime-shape refactor, not a semantic rewrite:

- map every existing method one-to-one into exactly one singular PascalCase noun family;
- keep all existing handles, options, settlements, type names, failure kinds, failure operation
  identifiers, cancellation boundaries, lock ordering, borrowing, release, sealing, staging, and
  publication behavior unchanged;
- freeze the Rooted instance and each nested family as stable own data properties with exact keys;
- keep every operation receiver-independent so destructuring or passing a method reference does not
  introduce `this` authority;
- keep the batch implementation composed from the same admitted-target, lease, and single-tree
  operations without exposing a second internal or public path;
- remove the old flat instance keys atomically; do not retain aliases, getters, deprecations, or
  dual-shaped mocks; and
- keep public operation/result types flat and stable in `FsRooted`; runtime noun grouping does not
  authorize a nested type-taxonomy migration or reintroduce a compatibility namespace.

The implementation may retain descriptive internal function names such as `acquireLease` and
`removeTree`; only the public instance surface changes. Tests may update invocation shape and exact
surface assertions, but must not weaken behavioral assertions or replace real filesystem/process
proof with mocks.

### Migration boundary and proof

The migration owns every in-workspace Rooted consumer visible through the dependency graph,
including FS tests plus current HTTP pull, Server Dist, Cell fixtures, Sys Tools pull/deploy, and
Driver Pi reset/profile call sites. Update typed seams, `Pick` projections, wrappers, spies, and
fixtures to the nested shape in the same commit. Do not mix in Driver Pi batch-reset adoption,
Server Generation work, unrelated package cleanup, permission changes, or algorithm changes.

Primary destinations and dependent closure:

```text
code/sys/fs/src/m.Fs.capability/m.Rooted/t.ts
code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.create.ts
code/sys/fs/src/m.Fs.capability/m.Rooted/-test/
code/sys/fs/README.md
code/sys/http/src/http.server/m.HttpPull/
code/sys/server/src/m.server.dist/
code/sys/server/src/-test/u.fixture.dist.ts
code/sys/cell/src/m.cell/-test/u.fixture.dist.ts
code/sys.tools/src/cli.pull/
code/sys.tools/src/cli.deploy/
code/sys.driver/driver-pi/-scripts/
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/
```

Proof must establish the exact frozen outer keys `path`, `Target`, `Lease`, `Tree`, `File`, and
`Stage`; exact frozen family keys; receiver-independent invocation; recursively shaped
`Stage.files`; unchanged result and failure truth through the existing owner suites; and successful
checks/tests for every affected package. Finish with a focused repository residue scan proving no
old flat `Rooted.Instance` member access, object-shape seam, or documentation example remains.
Internal helper names are not residue.

### Landed implementation and attribution state

The batch feature, Rooted type-namespace cleanup, and capability-noun migration are landed. The live
Rooted implementation exposes only `path`, `Target`, `Lease`, `Tree`, `File`, and `Stage`, with
frozen family objects, receiver-independent methods, and recursively shaped `Stage.files`. The
affected package checks, tests, dry publications, graph proof, residue scan, formatting, lint, and
diff checks were completed before landing.

Reachable commit `13a913ab8` has the exact noun-migration subject, but it also added the unrelated
`-agent/-plan/@sys.archive.zip/zip.plan.md`. No history rewrite is authorized. Preserve this as a
known attribution defect for human disposition rather than importing that plan into any later slice
or silently rewriting reachable history.

## Server-owned pinned generation session

### Public contract

Add a narrow `Dist.Generation` family at `@sys/server/dist`:

```text
Dist.Generation.open({
  store: { root, target },
  manifestUrl,
  integrity,
  policy,
  credentials?,
  until?,
})
```

The operation owns:

```text
snapshot every caller authority field
  → recursively prepare the complete caller-selected store.root ancestry
  → canonicalize the prepared root
  → bind that exact canonical root through Rooted with create:false
  → admit the caller-selected package-store target
  → acquire one non-waiting shared outer lease before lower work
  → call existing Dist.materialize with owner.store.dir
  → admit the complete lower settlement
  → return one verified generation owner or one bounded failed-open settlement
```

Recursive root preparation is generic Server storage mechanics. Driver Pi still selects the root and
target and owns its stricter workspace-ancestry policy; Generation neither discovers a workspace nor
interprets a missing package store as reset truth. After preparation, Generation canonicalizes the
root, requires `Rooted.path` to match it exactly, and takes the normalized relative target from
Rooted admission.

The exact frozen successful shape is:

```text
{
  kind: 'opened',
  generation: Dist.Existing | Dist.Promoted,
  owner: Dist.Generation.Owner,
}
```

The nested `generation` is the complete admitted materialization settlement; its `dir`, external
manifest pin, fresh verification evidence, seal, source, totals, and private-stage cleanup are not
duplicated or flattened. The async-disposable owner holds the outer shared Rooted lease and exposes:

```text
owner.store = { root: canonicalRoot, target: admittedTarget, dir: canonicalStoreDir }
owner.release(): Promise<void>
```

The owner and its frozen store echo are the only returned outer-lifetime authority. Release has no
caller cancellation input and exposes one idempotent terminal operation: concurrent and later calls
return the same Promise. Observable `undefined` completion proves release. Rejection, non-void
settlement, or an opaque transport yields a sanitized rejection, leaves the owner strongly retained
for the process lifetime, and never invokes the lower release again.

`until` governs opening work only. A complete admitted `Dist.Failed` returned by materialization is
classified before generic cancellation and retains its exact stage, reason, cleanup, publication,
and checksum truth with independent outer ownership. Generic cancellation projection applies only to
a successful lower settlement before opening commits it. Once committed under the acquired outer
lease, cancellation does not convert success into failed-open or release the owner behind the
caller. The Driver Pi session retains an opened owner before applying package policy or observing a
later cancellation checkpoint.

A failed-open result keeps two independent truths:

1. the exact nested `generation: Dist.Failed` when materialization returned a failed settlement; and
2. outer `ownership: not-acquired | released | pending`.

Its exact frozen alternatives are:

```text
{
  kind: 'failed',
  phase: 'materialization',
  generation: Dist.Failed,
  reason?: undefined,
  ownership: 'released' | 'pending',
}
|
{
  kind: 'failed',
  phase: 'input' | 'store' | 'materialization',
  generation?: undefined,
  reason: Dist.Generation.Failure.Reason,
  ownership: 'not-acquired' | 'released' | 'pending',
}
```

The failure union distinguishes a nested materialization failure from bounded Generation failures at
`input`, `store`, or `materialization` with finite reasons
`invalid-input | cancelled | busy |
filesystem-failure | execution-failure`. A nested `Dist.Failed`
is valid only with phase `materialization`, carries no duplicate Generation reason, and has
ownership `released | pending` because lower work cannot run before acquisition. `not-acquired` is
valid only when opening failed before outer acquisition; every failure after acquisition reports
`released | pending`.

Package-internal filesystem, Rooted, and materialization methods are trusted non-Proxy callables,
including Rooted's all-or-none acquisition-failure semantics, and must return exact undecorated
native Promises. Generation captures and validates each transport before awaiting it and never
assimilates arbitrary thenables or decorated Promises. A violating transport becomes bounded
`execution-failure`, with conservatively `pending` ownership when it may hide acquisition or lower
work. Retention does not claim to handle an autonomous rejection from a decorated Promise that
violates this private contract, and Generation does not claim ownership truth for an arbitrary
replacement callable that performs hidden work before throwing. A throw from canonical authority, a
rejection from an admitted exact Promise, or malformed returned settlement becomes bounded; no raw
cause or untrusted settlement escapes through the Generation result.

`Dist.Cleanup` remains private-stage cleanup truth and is never reused to claim outer lease release.
`not-acquired` means no outer lease was obtained. `released` means a lease acquired during this open
was completely released. If outer release is opaque, invalid, or fails, Server reports `pending` and
strongly retains the lease owner for the process lifetime rather than claiming cleanup or returning
a path as safely unowned. Rooted release itself is terminal, so failed-open retention has no retry
sweep. Keep separate package-internal retention sets for failed opens whose owner cannot be returned
and for returned owners whose explicit/disposal release remains pending; neither lifetime may be
hidden in a generic operation set.

The generation API does not accept `expectedPkg`. Package expectation remains caller policy. Driver
Pi compares expected package identity against the fresh nested generation verification before
hosting and again admits the independently verified application host result.

The generation API does not start a listener. The static proof roots the authored
`m.Dist.ts`/`u.generation` implementation closure and excludes `m.DistServer.ts`, `u.server.*`, and
browser-hosting modules. Every resolved file identity is canonicalized through the host real path
before required and forbidden matching so case-equivalent and aliased spellings cannot bypass the
proof. It does not forbid aggregate `@sys/http/server` modules inherited from existing
`Dist.materialize`, because that import closure already contains `HttpServer`; instead, runtime
seams prove zero listener invocation. Driver Pi separately proves zero `DistServer.start` calls
after failed-open and after package refusal.

### Destination and proof

```text
code/sys/server/src/m.server.dist/mod.ts
code/sys/server/src/m.server.dist/t.ts
code/sys/server/src/m.server.dist/m.Dist.ts
code/sys/server/src/m.server.dist/u.generation/common.ts
code/sys/server/src/m.server.dist/u.generation/mod.ts
code/sys/server/src/m.server.dist/u.generation/u.input.ts
code/sys/server/src/m.server.dist/u.generation/u.is.ts
code/sys/server/src/m.server.dist/u.generation/u.owner.ts
code/sys/server/src/m.server.dist/u.generation/u.open.ts
code/sys/server/src/m.server.dist/u.generation/u.result.ts
code/sys/server/src/m.server.dist/u.generation/u.retention.ts
code/sys/server/src/m.server.dist/-test/-.test.ts
code/sys/server/src/m.server.dist/-test/-generation.open.test.ts
code/sys/server/src/m.server.dist/-test/-generation.authority.test.ts
code/sys/server/src/m.server.dist/-test.process.ts
code/sys/server/src/m.server.dist/-test.external/common.ts
code/sys/server/src/m.server.dist/-test.external/-dist-server.graph.process.ts
code/sys/server/src/m.server.dist/-test.external/-generation.graph.process.ts
code/sys/server/src/m.server.dist/-test.external/-generation.lease.process.ts
code/sys/server/src/m.server.dist/-test.external/-local.permission.process.ts
code/sys/server/src/m.server.dist/-test.external/u.fixture.generation.lease.process.ts
code/sys/server/src/m.server.dist/-test.external/u.fixture.local.permission.process.ts
code/sys/server/deno.json
code/sys/server/README.md
```

Register both Generation process proofs in `test:dist:process`; `deno task test` must execute them.
Use the existing Server test permission profile unless a narrower named child profile is required;
do not widen network, process, read, or write authority for convenience.

Owner proof must cover exact hostile input capture, recursive creation of a missing multi-segment
store root, canonical root/target confinement, outer ownership acquired before materialization, cold
materialization, warm zero-network reuse, malformed lower settlement refusal, cancellation before
acquisition, cancellation after acquisition with `released | pending`, late cancellation after
successful materialization returning `opened`, materialization failure plus outer release failure,
exact nested `Dist.Failed` preservation across concurrent cancellation with both released and
pending outer ownership, successful owner release, one terminal idempotent release, process-lifetime
retention after release failure, reset-style exclusive contention throughout the owner lifetime,
contender success after clean release, both pending-owner retention paths, frozen `owner.store`
evidence, pre-await transport and callable-Proxy refusal, canonical case-equivalent graph identity
matching, and the achievable static and runtime absence-of-hosting proofs above.

The public contract must remain testable without a public result-minting backdoor. Package-internal
fixtures may inject lower dependencies before Server creates the public settlement; callers admit
the complete public output at their boundary.

### Landed attribution note

Reachable commit `b627146ef` has the exact Server feature subject, but it also modified the
unrelated `code/sys/archive/README.md`. No current worktree delta exists for that path and no
history rewrite is authorized. Keep any corrective Archive attribution separate from the final
Driver Pi slice.

## Driver Pi migration

### Release-store reset

Current source and proof:

```text
code/sys.driver/driver-pi/-scripts/task.start.gui.reset.ts
code/sys.driver/driver-pi/-scripts/-test/-task.start.gui.reset.test.ts
code/sys.driver/driver-pi/-scripts/-test.external/-task.start.gui.reset.process-proof.ts
code/sys.driver/driver-pi/-scripts/-test.external/-task.start.gui.reset.lease.process.ts
```

Retain Driver Pi root selection, current and legacy target names, exact output, actionable busy
message, authenticated exit-code `1` projection, package-level unrelated-store proof, and the exact
`test:reset:process` task and permission profile. Replace only local batch admission, lease,
per-target removal, and release choreography with `rooted.Tree.removeBatch` over the two Driver
Pi-owned path names.

The package adapter admits the complete FS settlement before presentation:

- authenticated `busy` is accepted only when its index/path exactly names one of the two snapshotted
  Driver Pi targets, then maps to the existing actionable refusal and exit code `1`;
- clean `settled` maps ordered results to the existing `GuiReleaseStoreReset` rows;
- `settled` with `releaseError` is a reset failure even though every removal result is retained;
- `failed` preserves completed/current/unattempted and `changed` truth in the lower result while
  Driver Pi emits its bounded reset error; and
- no non-busy failure is reclassified as package-authenticated contention.

Retain `-task.start.gui.reset.lease.process.ts` and its Driver Pi process capstone. The FS process
proof establishes generic shared-versus-exclusive lock causality; the Driver Pi process proof still
owns product-level readiness framing, exact refusal/output, both current and legacy stores, no
partial deletion under either holder, process liveness, and clean retry after explicit release.

### Runtime ownership bridge

Current source:

```text
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.authority.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.bootstrap.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.browser.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.deps.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.error.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.failure.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.failure.materialization.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.final.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.gui/
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.identity/
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.limits.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.screen/
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.source.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.state.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.url.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.start.gui.service.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.start.gui.settlement.ts
```

Migration order:

```text
snapshot Driver Pi evidence and policy
  → open Server generation owner
  → consume the package-owned open settlement
  → map package-owned materialization failure for Driver Pi presentation
  → compare fresh generation package identity with Driver Pi expectation
  → start existing DistServer host under Driver Pi browser policy
  → independently compare the freshly hosted package identity
  → publish ready
  → stop screen and keyboard presentation
  → close application host
  → release generation owner
  → close status
```

Replace the `materialize`, `ensureDir`, and `createRooted` dependency trio with one receiverless
`openGeneration` seam while retaining `DistServer.start` independently. Driver Pi copies its own
store root/target and source policy before invocation. `Dist.Generation` is trusted package boundary
authority, so Driver Pi consumes its public result directly rather than revalidating the complete
owner/store/result graph. On `opened`, the session stores the returned owner before package
comparison or any later cancellation checkpoint.

Narrow lower-boundary admission while retaining the existing Driver Pi session behavior as a
migration bridge:

- `u.identity/` compares `generation.verification.dist.pkg` with Driver Pi's expected package and
  returns the generation directory; the independently hosted result receives the second package
  check without duplicating Server's complete result graph;
- `u.failure.materialization.ts` copies only browser-safe `Dist.Failed` evidence for Driver Pi's
  existing terminal state, while `u.failure.ts` maps the outer Generation result into finite product
  categories;
- `u.gui/` stops presentation first and closes the application before invoking the Generation
  owner's terminal release. On a clean application close it invokes release before status closure;
  on close failure it reports both application failure and unresolved release, closes status, and
  defers that one release invocation until `application.finished`; and
- `u.deps.ts` exposes only package-level Generation, host, status, browser, keyboard, and screen
  seams. `u.source.ts` continues to own Driver Pi's materialization policy.

Delete `u.materialize.ts`, the duplicated Generation graph validator, `u.lifecycle/`,
`u.promise.ts`, the captured-intrinsic facade, and their hostile-runtime implementation-detail test
matrices. Rooted snapshots, local store preparation and leasing, generic terminal supervision,
operation registries, retention registries, Promise transport admission, and cleanup graphs are
removed as named reusable mechanisms rather than renamed. Package-internal seams are trusted typed
package contracts.

The bridge nevertheless retained a first-terminal gate, direct owner references, explicit cleanup
sequencing, and bounded final-error handling. Those responsibilities preserved behavior across the
ownership migration; they were not evidence of a minimal endpoint and became the explicit assessment
target of the referenced child plan. Generation release remained terminal; the bridge invoked it
once and scheduled no retry sweep.

Failed-open projection remains bounded:

- a nested `Dist.Failed` keeps the current materialization category and checksum diagnostics;
- outer `cancelled` maps to the existing authenticated cancellation state; and
- any other outer acquisition/opening failure maps to `local-failure` with existing local operation
  `release-owner`, never to fabricated materialization cleanup.

Outer failed-open ownership is Server truth and is not re-retained or re-released by Driver Pi.
Package refusal after `opened` occurs only after the session holds the returned generation owner,
invokes no `DistServer.start`, and releases that owner during normal cleanup. Keep development
authority and the independent second package check after the host freshly verifies the generation.
The bridge's local terminal gate preserves the `back | quit | external-cancellation` taxonomy,
failure foreground presentation, and clean-only back navigation without claiming that this
supervisor-shaped coordination belongs in the final Driver Pi endpoint.

### Evidence binder and browser proof

These stay Driver Pi-owned:

```text
code/sys.driver/driver-pi/-scripts/m.start.gui.evidence.local/
code/sys.driver/driver-pi/-scripts/task.start.gui.evidence.local.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.start.gui.service.evidence.ts
code/sys.driver/driver-pi/-scripts/-test.external/-task.start.gui.release.local.ts
code/sys.driver/driver-pi/-scripts/-test.external/u.fixture.start.gui.release.local.ts
code/sys.driver/driver-pi/-scripts/-test.browser.ts
```

Preserve:

- exact generated provenance: ``// AUTO-GENERATED by `deno task bind:gui:evidence:local`.``
- direct throwing `Deno.writeTextFile` and `Driver Pi local GUI evidence output write failed.`;
- fixed manifest URL, generated module format, package label, rehearsal label, output path, and
  `chore(driver-pi): bind rebuilt local GUI evidence` suggestion;
- exact candidate pin and package match before binding;
- no launcher evidence or recovery authority in browser pages; and
- `Browser.ServiceWorker.scenario` with tombstone registration, worker-side loopback denial,
  owned-cache cleanup, unregistration, and final no-controller/no-registration proof.

No generated evidence change belongs in the implementation commit. If browser bytes change,
deliberately abandon the candidate, rebuild, bind, and prove the new candidate as a separate
operation. Do not rebuild after binding the selected candidate.

### Retained product behavior

The refactor preserves:

- `configuration-invalid`, `source-unavailable`, `artifact-refused`, `repair-required`,
  `local-failure`, and `cancelled` projection;
- manifest checksum `expected` versus diagnostic-only `received`;
- the manifest-byte pin as security authority and `verification.dist.hash.digest` as presentation
  identity only;
- `manifest   dist/ ← digest:sha256:#84346` presentation through `HashFmt.digest`;
- the admitted manifest link and exact verified generation-directory link;
- `Intended local build? In Driver Pi run deno task bind:dev, then relaunch.`;
- actionable busy-reset refusal and exit code `1` only for package-authenticated contention;
- finite `back | quit`, failure foreground retention, and clean-only profile-menu return owned by
  `Profiles.main`; and
- package-authenticated completion and settled-failure identity.

These were bridge preservation requirements, not automatic constraints on the referenced child
plan. That plan classified each behavior from first principles and explicitly retained, moved, or
retired it while preserving security and authority boundaries.

## Commit slices

### `feat(fs): expose leased owned-tree batch removal`

Add only `removeTreeBatch`, public types, unit/real-process owner proof, registered task coverage,
README contract, and package proof. Do not import Driver Pi vocabulary or paths.

### `refactor(fs): group Rooted operations by capability noun`

This was the intended semantic slice even though concurrent behavior-preserving factoring moved
individual files or hunks. Its exact attribution comes from the settled baseline; the unrelated
Archive plan recorded above is a known commit-purity defect rather than part of this slice.

Replace the complete flat `Rooted.Instance` operation surface with the exact frozen `Target`,
`Lease`, `Tree`, `File`, and `Stage` families; migrate every workspace consumer and public example
in the same commit. Preserve all lower semantics and public operation/result type names. Do not
retain flat aliases, add deeper taxonomy, adopt batch reset in Driver Pi, or change permissions or
algorithms.

### `refactor(driver-pi): consume leased owned-tree batch removal in GUI reset`

Replace only Driver Pi reset's generic batch admission/lease/removal/release choreography with
landed `rooted.Tree.removeBatch`. Preserve Driver Pi ancestry policy, target names, exact output and
busy authority, unit proof, real process holder/capstone, task, and permissions. Do not touch
runtime generation or evidence binding.

### `feat(server): expose owned pinned Dist generation sessions`

Add only the outer generation owner around existing `Dist.materialize`, exact failed-open and owner
contracts, registered process/graph proofs, README, and package proof. Keep hosting separate and do
not add package expectation, browser policy, terminal behavior, or Driver Pi failure categories.

### `Commit: refactor(driver-pi): adopt Server-owned Dist generations`

Consume the landed Generation capability in one behavior-preserving ownership migration and remove
the superseded local release-owner mechanism in the same commit. Keep package policy, generated
evidence, reset adoption, independent host admission, and currently selected visible behavior. Do
not leave compatibility wrappers, duplicate lower-authority paths, dead fixtures, or transitional
exports. This bridge is a stable baseline for the referenced child assessment; it does not claim the
final one-to-three-module composition endpoint.

### Landed implementation and attribution state

Reachable commit `038e8cd7e` contains the complete 53-path Driver Pi ownership bridge. Its literal
subject is `Commit: refactor(driver-pi): adopt Server-owned Dist generations`; the opening arc
records that reachable subject exactly. The commit excludes both plan artifacts and leaves generated
release evidence unchanged. Its surviving session-local terminal gate was an explicit input to the
child assessment, not proof of the final endpoint.

### `plan(snapshot): direct-gui-release-composition.plan.md`

Reachable commit `f710d3aa0` snapshotted the fresh child plan as a plan-only handoff after the
ownership bridge landed. It preserved the hard module budget, DMIND entry assessment, explicit
shadow-lifecycle exclusions, and fresh blind pre-implementation and post-implementation review
sequence without importing the foundation plan's implementation detail. The following filename
reference remained unchecked until that child plan completed.

### Child completion and retirement

The child completed in reachable final snapshot `35d8b54a6` and was removed by reachable retirement
commit `a548000c4`. The checked reference is its durable recovery anchor. Its completed assessment,
implementation, proof, and review establish the direct-composition endpoint required by this plan
without resolving or passing the governing release-owner gate.

## Proof ownership

### FS owns

- the exact frozen Rooted capability-noun surface, receiver-independent methods, and recursively
  shaped stage publishers;
- unchanged Rooted handle, operation, settlement, cancellation, and failure semantics across the
  public-shape migration;
- path-input snapshotting, directory admission, and stable batch lock ordering;
- empty-batch identity and all-or-none non-waiting exclusive contention;
- caller-order removal settlements and exact contended caller index mapping;
- sealed-tree permission restoration and identity-safe removal;
- exact `changed`, partial progress, release-only failure, and simultaneous primary/release failure;
- cancellation and registered real-process settlement; and
- sibling and Rooted metadata preservation.

### Server owns

- generation input snapshots, recursive root preparation, and caller-selected store confinement;
- shared outer ownership acquired before materialization;
- exact handoff to and admission of existing `Dist.materialize`;
- cold/warm and late-cancellation generation settlement;
- nested materialization versus outer ownership truth;
- frozen owner-store evidence, terminal release, both process-lifetime pending retention paths, and
  process contention; and
- an authored Generation graph without DistServer/browser-hosting modules plus runtime zero-listener
  proof.

Existing Server materialization and hosting suites remain the deep owners of bounded transport,
staging, promotion, sealing, final verification, pinned-root request reads, browser headers, and
exact part bytes.

### Driver Pi owns

- package expectation at generation and host boundaries;
- release-store names, reset root-selection policy, exact reset projection, and retained process
  capstone;
- evidence rendering and binding tasks;
- source, credential, retry, byte, timeout, and verification policy;
- service name, browser policy, recovery, outer-owner/materialization failure mapping, terminal
  state, and menu behavior;
- exact Generation-open policy, package admission, and direct application-before-generation cleanup;
- zero host start after failed-open or Generation-package refusal, fresh host-package refusal with
  both owners cleaned, late-open ownership after cancellation, deferred release after application
  close failure, and bridge release/development composition proof;
- frozen-candidate preservation; and
- product browser and Service Worker behavior.

## Task and permission invariants

Preserve exactly:

```text
bind:dev = deno task build && deno task bind:gui:evidence:local
```

`bind:gui:evidence:local` must not build, serve, contact `:8080`, reset stores, inspect Git, stage,
or commit. It retains candidate-only read authority and one evidence-leaf write.

`deno task test:browser` remains build-owning. Frozen post-bind proof remains
`test:release:local:browser:frozen`.

The release-local runtime continues to deny:

- writes to `dist/`, package/workspace `.pi`, and the generated evidence leaf;
- `DENO_DIR` authority;
- ambient process execution;
- wildcard bind; and
- operator-owned `127.0.0.1:8080`.

No implementation item may widen FS, Server, or Driver Pi permissions merely to simplify
composition.

## Verification order

Use declared nearest-package task surfaces.

FS capability:

```text
cd code/sys/fs
deno task test:unit --trace-leaks ./src/m.Fs.capability/m.Rooted
deno task test:process
deno task check
deno task test
deno task dry
```

Rooted capability-noun migration after the batch feature commit is green:

```text
(cd code/sys/fs && deno task check && deno task test && deno task dry)
(cd code/sys/http && deno task check && deno task test && deno task dry)
(cd code/sys/server && deno task check && deno task test && deno task dry)
(cd code/sys/cell && deno task check && deno task test && deno task dry)
(cd code/sys.tools && deno task check && deno task test && deno task dry)
(cd code/sys.driver/driver-pi && deno task check && deno task test && deno task dry)
deno task check:graph
```

Run the block from the repository root. Reconcile the live dependency graph before execution and add
any newly discovered Rooted consumer rather than trusting this static list. Keep agent-run proof to
this affected-package and graph surface; hand any selected full-workspace check, test, or dry run to
the operator.

Driver Pi reset adoption after both FS commits is green:

```text
cd code/sys.driver/driver-pi
deno task test:unit
deno task test:reset:process
deno task check
deno task test
deno task dry
```

Server Generation:

```text
cd code/sys/server
deno task test:unit --trace-leaks ./src/m.server.dist
deno task test:dist:process
deno task check
deno task test
deno task dry
```

Driver Pi runtime migration verification surface:

```text
cd code/sys.driver/driver-pi
deno task test:unit
deno task test:reset:process
deno task test:profiles:process
deno task test:serve:process
deno task test:release:local
deno task check
deno task test
deno task dry
```

For the ownership bridge, review and proof are bounded to migration integrity: safe adoption of the
Server owner, preservation of selected behavior, complete removal of superseded lower mechanisms,
and a bisectable result. The bridge-integrity review must explicitly avoid blessing the surviving
Driver Pi orchestration as the desired endpoint.

`test:serve:process` requires an available `127.0.0.1:8080`; frozen browser proof requires an
admitted `CHROME_BIN`. Environmental unavailability must be reported rather than resolved by
terminating an operator listener, inferring an executable, or weakening admission.

Run build-owning browser proof only before a deliberate new evidence bind. Run
`test:release:local:browser:frozen` against the selected bound candidate. Finish each slice with
scoped format/lint as configured, public-type and export checks, dependency-graph inspection,
package dry publication, residue search, and repository `git diff --check`.

Behavior and causality outrank final-value assertions. Real process, browser, and terminal behavior
outrank synthetic green.

## Publication and release boundary

The FS feature, FS public-shape refactor, and Server feature commits affect public API surface, so
their package checks, README contracts, export proofs, dependent-package checks, and dry-publication
evidence must be complete. This plan does not authorize publishing them.

This plan does not:

- select or configure an immutable artifact provider;
- publish a Dist;
- choose a public HTTPS proof origin;
- establish browser, OS, or filesystem support floors;
- decide prior-local-worker migration;
- pass the governing release-owner gate; or
- bind published Driver Pi evidence.

The governing plan now holds this plan as an explicit prerequisite before its release-owner gate.
With this plan and its referenced child complete, control returns to that parent gate. Provider and
migration decisions remain separate from this ownership and composition correction.

## Ownership-foundation stop and replan conditions

The following constraints govern the landed ownership extraction and the bridge. They do not
predetermine the referenced child's first-principles answer about the minimal endpoint or a missing
lower-owner contract.

Stop the ownership-foundation implementation if it requires:

- a higher-level package-UI, app-runtime, navigation, output, or diagnostic facade;
- moving Driver Pi service identity, package expectation, recovery, store names, terminal state, or
  browser policy into FS or Server;
- combining Generation opening with `DistServer.start`;
- collapsing private-stage cleanup and outer ownership into one field;
- losing exact partial batch or lease-release truth;
- introducing a partial noun grouping, retaining both flat and nested Rooted surfaces, or changing
  Rooted behavior under the naming migration;
- deleting independent application-host admission or its package check;
- changing `Pkg.Dist` path or verification algorithms;
- widening permissions;
- claiming hostile same-user confinement, crash durability, or browser attestation;
- merging development and release authority;
- changing Service Worker tombstone semantics;
- rebuilding or rebinding the selected candidate incidentally; or
- performing publication, staging, commit, push, provider, or release-gate work without explicit
  authority.

## Ownership-foundation non-goals

These non-goals bounded the extraction and bridge; only independently justified security, authority,
and product boundaries carry into the referenced child plan.

- No `VerifiedPackageUi` abstraction or new shared package.
- No shared evidence-source serializer.
- No product UI extraction from Driver Pi.
- No second bootstrap or browser control plane.
- No configurable generic Server lifecycle.
- No shared terminal presentation or recovery framework.
- No browser exposure of hashes, source URLs, cache state, or recovery commands.
- No mutable `latest`, TOFU, fallback generation, automatic reset, or self-repair.
- No descriptor-relative hostile-writer confinement redesign.
- No provider SDK, uploader, receipt store, signature system, or release channel.
- No broad HTTP, Process, Testing, Vite, or workspace refactor.

## Closure boundary

This plan completes only when:

- all seven local commit items are landed with exact reachable hashes and the final referenced child
  plan is complete;
- FS owns and proves the complete leased batch-removal transaction;
- Rooted exposes only the exact capability-noun instance surface and every workspace consumer uses
  it without behavioral drift;
- Driver Pi reset uses that transaction while retaining its package process capstone;
- Server owns and proves the complete pinned-generation lifetime;
- the Driver Pi ownership bridge removes its duplicate lower-owner mechanism, reusable supervisor,
  Promise substrate, retention registry, and captured-intrinsic facade without claiming endpoint
  minimality;
- deleted implementation-detail matrices are replaced by focused bridge behavior proofs while deep
  lifecycle invariants stay with Server, BootstrapStatus, DistServer, CLI, and FS owners;
- the referenced child independently establishes the final direct-composition endpoint;
- application-host admission and both package checks remain independent unless that child proves and
  records a stronger package-owned contract;
- no compatibility shim, speculative facade, duplicate mechanism, or stale fixture remains;
- public package checks and dry-publication proofs pass; and
- frozen local evidence and browser behavior remain intact.

Landing the ownership bridge permitted the fresh child assessment; it did not complete this plan or
bless the bridge as the endpoint. This plan's closure permits the parent prerequisite reference to be
checked but does not resolve, select, or pass the parent's release-owner gate. Planning, readiness,
review, and completion never authorize Git mutation or publication.

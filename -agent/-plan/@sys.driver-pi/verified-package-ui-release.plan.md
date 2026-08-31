verified-package-ui-release.plan.md
- [ ] feat(fs): expose leased owned-tree batch removal
- [ ] refactor(driver-pi): consume leased owned-tree batch removal in GUI reset
- [ ] feat(server): expose owned pinned Dist generation sessions
- [ ] refactor(driver-pi): reduce GUI release composition to package policy

## Purpose

Move generic verified-release mechanisms that accumulated in Driver Pi to their existing semantic
owners. The architecture owner has selected this ownership correction now. It does not create a
higher-level package-UI abstraction.

The target flow is:

```text
Driver Pi frozen evidence and package policy
  → Server-owned pinned generation session
  → Driver Pi package admission
  → existing verified Dist host
  → Driver Pi browser, terminal, and supervisor lifecycle
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

The extraction adds no new package and no `VerifiedPackageUi` facade. Existing low-level APIs remain
independently usable:

- `Rooted.admit`, `Rooted.acquireLease`, and `Rooted.removeTree` remain available;
- `Dist.materialize` remains available;
- `DistServer.start` remains separate from generation ownership; and
- Driver Pi continues to compose the selected capabilities under its supervisor.

The following stay in Driver Pi because they are product or package policy, not generic mechanism:

- immutable package expectation and both generation-time and host-time package checks;
- `.pi/@sys/dist`, current and legacy package target names, and exact ancestry-selection policy;
- manifest source, pin, credential, retry, byte, timeout, and verification limits;
- generated evidence module format, comments, output path, direct write seam, and commit suggestion;
- service name, verified-loopback browser policy, recovery text, failure categories, terminal state,
  menu behavior, and operator tasks; and
- application, status, keyboard, screen, browser, and final cleanup orchestration.

The TypeScript evidence renderer remains Driver Pi-owned. Its output is a package build/evidence
format, not Server generation lifecycle.

## Target Driver Pi shape

Driver Pi retains one conceptual policy adapter at:

```text
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.start.gui.service.ts
```

It freezes:

- service name `sys.ui:pi`;
- generated evidence selected from `u.start.gui.service.evidence.ts`;
- package expectation bound from immutable `src/pkg.ts` authority;
- release-store root and target policy;
- materialization and verification limits;
- verified-loopback browser policy;
- local-rehearsal recovery guidance; and
- the FS, generation, and hosting capabilities composed by Driver Pi.

Separate physical files remain where authority requires them. The target is thin semantic glue, not
one tiny file and not a generic app runtime.

## FS-owned batch removal

### Public contract

Add one operation-owned batch removal method to `Fs.Capability.Rooted.Instance`:

```text
rooted.removeTreeBatch(targets, { until? })
```

`targets` is a snapshotted `readonly t.StringPath[]`. Directory kind is intrinsic to this method, so
callers do not construct Rooted target-input records. The operation captures every path before I/O
and admits the complete batch through this instance. Input that cannot yield one complete owned path
snapshot rejects with a typed Rooted failure before a batch settlement, lock metadata, or target
observation exists; every operational outcome after successful snapshotting uses the result union
below.

The method owns the complete generic transaction:

```text
snapshot every caller-order path
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
`acquireLease(..., { wait:
true })` remains available to lower-level callers that explicitly own
such waiting.

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
empty-batch identity without metadata, caller-order results, mixed absence/removal, all-or-none
contention, cancellation, second-target failure after a committed first target, release-only
failure, simultaneous primary and release failure, exact `changed` derivation, stable lock
acquisition across opposing caller orders in real processes, sealed-tree removal, sibling
preservation, and retained lock metadata. The opposing-order proof must establish that contention
reports the lock encountered in stable lock order while the public result maps it back to the
original caller index; it must not infer ordering from whichever process happens to print first.

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
  → bind that exact root through Rooted with create:false
  → admit the caller-selected package-store target
  → acquire one non-waiting shared outer lease before lower work
  → call existing Dist.materialize with owner.store.dir
  → admit the complete lower settlement
  → return one verified generation owner or one bounded failed-open settlement
```

Recursive root preparation is generic Server storage mechanics. Driver Pi still selects the root and
target and owns its stricter workspace-ancestry policy; Generation neither discovers a workspace nor
interprets a missing package store as reset truth. After preparation, `Rooted.path` supplies the
canonical root and the admitted target supplies the normalized relative target.

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

The owner and its frozen store echo are the only returned outer-lifetime authority. Release is
idempotent, has no caller cancellation input, and remains retryable after an unobservable or failed
attempt.

`until` governs opening work only. Once a complete admitted `Dist.Existing | Dist.Promoted` result
has been observed under the acquired outer lease, opening has committed to `opened`: a cancellation
that arrives at or after that linearization point does not convert success into failed-open or
release the owner behind the caller. The Driver Pi supervisor must admit and retain that returned
owner before observing cancellation as terminal work.

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
  reason: Dist.Generation.FailureReason,
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
`released | pending`. A throw, malformed lower settlement, or otherwise unadmittable lower
completion becomes bounded `materialization/execution-failure`; no raw cause or untrusted result
escapes.

`Dist.Cleanup` remains private-stage cleanup truth and is never reused to claim outer lease release.
`not-acquired` means no outer lease was obtained. `released` means a lease acquired during this open
was completely released. If outer release is unobservable or fails, Server reports `pending` and
strongly retains the lease owner rather than claiming cleanup or returning a path as safely unowned.
Keep separate package-internal retention sets for failed opens whose owner cannot be returned and
for returned owners whose explicit/disposal release remains pending; neither lifetime may be hidden
in a generic operation set.

The generation API does not accept `expectedPkg`. Package expectation remains caller policy. Driver
Pi compares expected package identity against the fresh nested generation verification before
hosting and again admits the independently verified application host result.

The generation API does not start a listener. The static proof roots the authored
`m.Dist.ts`/`u.generation` implementation closure and excludes `m.DistServer.ts`, `u.server.*`, and
browser-hosting modules. It does not forbid aggregate `@sys/http/server` modules inherited from
existing `Dist.materialize`, because that import closure already contains `HttpServer`; instead,
runtime seams prove zero listener invocation. Driver Pi separately proves zero `DistServer.start`
calls after failed-open and after package refusal.

### Destination and proof

```text
code/sys/server/src/m.server.dist/t.ts
code/sys/server/src/m.server.dist/m.Dist.ts
code/sys/server/src/m.server.dist/u.generation/mod.ts
code/sys/server/src/m.server.dist/u.generation/u.input.ts
code/sys/server/src/m.server.dist/u.generation/u.owner.ts
code/sys/server/src/m.server.dist/u.generation/u.open.ts
code/sys/server/src/m.server.dist/u.generation/u.result.ts
code/sys/server/src/m.server.dist/u.generation/u.retention.ts
code/sys/server/src/m.server.dist/-test/-.test.ts
code/sys/server/src/m.server.dist/-test/-generation.open.test.ts
code/sys/server/src/m.server.dist/-test/-generation.authority.test.ts
code/sys/server/src/m.server.dist/-test.external/-generation.graph.process.ts
code/sys/server/src/m.server.dist/-test.external/-generation.lease.process.ts
code/sys/server/src/m.server.dist/-test.external/u.fixture.generation.lease.process.ts
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
exact nested `Dist.Failed` preservation, successful owner release, release idempotence and retry,
reset-style exclusive contention throughout the owner lifetime, contender success after clean
release, both pending-owner retention paths, frozen `owner.store` evidence, and the achievable
static and runtime absence-of-hosting proofs above.

The public contract must remain testable without a public result-minting backdoor. Package-internal
fixtures may inject lower dependencies before Server creates the public settlement; callers admit
the complete public output at their boundary.

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
per-target removal, and release choreography with `rooted.removeTreeBatch` over the two Driver
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

### Runtime release branch

Current source:

```text
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.authority.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.deps.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.gui.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.identity.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.lifecycle.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.materialize.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.source.ts
```

Migration order:

```text
snapshot Driver Pi evidence and policy
  → open Server generation owner
  → admit the complete open settlement
  → retain nested materialization and outer ownership failure truth
  → compare fresh generation package identity with Driver Pi expectation
  → start existing DistServer host under Driver Pi browser policy
  → independently admit host pin, package, origin, policy, and lifecycle
  → publish ready
  → close application host
  → release generation owner
  → settle remaining launcher resources
```

Replace the `materialize`, `ensureDir`, and `createRooted` dependency trio with one receiverless
`openGeneration` seam while retaining `DistServer.start` independently. Driver Pi snapshots its own
store root/target and source policy before invocation. The supervisor admits the exact open result,
and on `opened` it snapshots and retains the generation owner before package comparison or any later
cancellation checkpoint.

Retarget rather than delete materialization admission:

- `u.identity.ts` admits the exact `{ kind: 'opened', generation, owner }` shape, exact frozen
  `owner.store`, nested `Dist.Existing | Dist.Promoted`, and the complete failed-open union;
- its existing nested Dist success/failure, verification, manifest-checksum, and package admission
  helpers remain authoritative under the new outer shape;
- new `u.failure.materialization.ts` retains the package-owned materialization error marker and
  immutable failure-evidence snapshot currently implemented in `u.materialize.ts`, while
  `u.failure.ts` consumes that classifier and `u.state.ts` retains its existing finite evidence
  types;
- `u.lifecycle.ts` replaces its local `ReleaseLease` type with the admitted `Dist.Generation.Owner`,
  retains pending failed-open ownership as cleanup evidence, and continues to close the application
  host before releasing the generation owner; and
- `u.deps.ts` and `u.gui.ts` replace only the three lower release-owner seams with receiverless
  Generation opening. `u.source.ts` continues to own Driver Pi's materialization policy.

Delete `u.materialize.ts` only after those retained helpers and types have moved to their named
semantic owners and residue proves no caller remains. Its Rooted-owner snapshots, local store
creation, local lease acquisition, and generic operation-retention sets are superseded Server
mechanism and are removed rather than wrapped.

Failed-open projection is exact:

- a nested `Dist.Failed` keeps current materialization category and checksum diagnostics;
- outer `cancelled` maps to the existing authenticated cancellation state;
- any other outer acquisition/opening failure maps to `local-failure` with existing local operation
  `release-owner`, never to fabricated materialization cleanup;
- outer `ownership: pending` is retained independently as unresolved generation-owner cleanup; and
- materialization failure plus pending outer ownership preserves both truths without allowing
  cleanup evidence to replace the primary failure.

Package refusal after `opened` occurs only after the supervisor owns the returned generation owner,
invokes no `DistServer.start`, and releases that owner during normal cleanup. Keep development
authority and `snapshotApplicationOwner`, including its independent second package check after the
host freshly verifies the generation. The refactor must not weaken first-terminal arbitration, the
`trusted-control | external-cancellation` taxonomy, failure foreground retention, or clean-only back
navigation.

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

## Commit slices

### `feat(fs): expose leased owned-tree batch removal`

Add only `removeTreeBatch`, public types, unit/real-process owner proof, registered task coverage,
README contract, and package proof. Do not import Driver Pi vocabulary or paths.

### `refactor(driver-pi): consume leased owned-tree batch removal in GUI reset`

Replace only Driver Pi reset's generic batch admission/lease/removal/release choreography with the
landed FS method. Preserve Driver Pi ancestry policy, target names, exact output and busy authority,
unit proof, real process holder/capstone, task, and permissions. Do not touch runtime generation or
evidence binding.

### `feat(server): expose owned pinned Dist generation sessions`

Add only the outer generation owner around existing `Dist.materialize`, exact failed-open and owner
contracts, registered process/graph proofs, README, and package proof. Keep hosting separate and do
not add package expectation, browser policy, terminal behavior, or Driver Pi failure categories.

### `refactor(driver-pi): reduce GUI release composition to package policy`

Consume the landed Generation capability in one behavior-complete runtime migration and remove the
superseded local release-owner mechanism in the same commit. Keep all package policy, generated
evidence, reset adoption, and independent host admission. Do not leave compatibility wrappers,
duplicate authority paths, dead fixtures, or transitional exports.

## Proof ownership

### FS owns

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
- frozen owner-store evidence, release, retry, both pending retention paths, and process contention;
  and
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
- exact Generation-open admission and application-before-generation cleanup under the supervisor;
- zero host start after failed-open or package refusal, one thin cold/warm composition proof, and
  one broken-boundary refusal;
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

Driver Pi reset adoption after the FS commit is green:

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

Driver Pi runtime migration after the Server commit is green:

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

Run build-owning browser proof only before a deliberate new evidence bind. Run
`test:release:local:browser:frozen` against the selected bound candidate. Finish each slice with
scoped format/lint as configured, public-type and export checks, dependency-graph inspection,
package dry publication, residue search, and repository `git diff --check`.

Behavior and causality outrank final-value assertions. Real process, browser, and terminal behavior
outrank synthetic green.

## Publication and release boundary

The FS and Server commits add public API surface, so their package checks, README contracts, export
proofs, and dry-publication evidence must be complete. This plan does not authorize publishing them.

This plan does not:

- select or configure an immutable artifact provider;
- publish a Dist;
- choose a public HTTPS proof origin;
- establish browser, OS, or filesystem support floors;
- decide prior-local-worker migration;
- pass the governing release-owner gate; or
- bind published Driver Pi evidence.

The governing plan now holds this plan as an explicit prerequisite before its release-owner gate.
After this plan completes, control returns to that parent gate. Provider and migration decisions
remain separate from this internal ownership correction.

## Stop and replan conditions

Stop if implementation requires:

- a higher-level package-UI, app-runtime, navigation, output, or diagnostic facade;
- moving Driver Pi service identity, package expectation, recovery, store names, terminal state, or
  browser policy into FS or Server;
- combining Generation opening with `DistServer.start`;
- collapsing private-stage cleanup and outer ownership into one field;
- losing exact partial batch or lease-release truth;
- deleting independent application-host admission or its package check;
- changing `Pkg.Dist` path or verification algorithms;
- widening permissions;
- claiming hostile same-user confinement, crash durability, or browser attestation;
- merging development and release authority;
- changing Service Worker tombstone semantics;
- rebuilding or rebinding the selected candidate incidentally; or
- performing publication, staging, commit, push, provider, or release-gate work without explicit
  authority.

## Durable non-goals

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

- all four opening items are landed with exact reachable hashes;
- FS owns and proves the complete leased batch-removal transaction;
- Driver Pi reset uses that transaction while retaining its package process capstone;
- Server owns and proves the complete pinned-generation lifetime;
- Driver Pi retains policy and thin composition without duplicate lower-owner mechanism;
- every removed Driver Pi proof has an owner-level replacement before deletion, while retained
  product proofs remain registered;
- application-host admission and both package checks remain independent;
- no compatibility shim, speculative facade, duplicate mechanism, or stale fixture remains;
- public package checks and dry-publication proofs pass; and
- frozen local evidence and browser behavior remain intact.

Closure permits the parent prerequisite reference to be checked; it does not resolve, select, or
pass the parent's release-owner gate. Planning, readiness, review, and completion never authorize
Git mutation or publication.

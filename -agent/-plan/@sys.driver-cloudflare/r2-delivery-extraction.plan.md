@sys.driver-cloudflare
r2-delivery-extraction.plan.md
- [x] ff24c6d98 refactor(pkg): extract verified Dist projections and shared selection
- [x] df5f3c67e refactor(driver-cloudflare): adopt shared Dist projections and pins in the sample
- [x] 626c8c5ce test(driver-cloudflare): right-size R2 sample coverage
- [x] 1cac22d67 fix(driver-vite): pass captured build base to the Vite child
- [x] 9c569c13e refactor(driver-cloudflare): construct read routes from pinned Dist manifests
- [x] cc074d82a refactor(driver-cloudflare): move ReadRoute helpers into u/
- [x] a1e8be68d refactor(tools): expose safe Deploy failure diagnostics
- [x] 652d1daa7 fix(http): settle server shutdown and completion failures together
- [x] b3f14a5ee refactor(driver-cloudflare): reduce the R2 sample to policy and library calls

## Purpose and record boundary

Extract reusable delivery mechanisms from the R2 sample into their existing library owners. Retain
sample configuration, audience/filename policy, credentials, HTTP/UI behavior, presentation, and
explicit build/push/serve/proof composition.

This is the completed extraction record consumed by
[r2-public-delivery.plan.md](r2-public-delivery.plan.md) and
[r2-web-exposure.plan.md](r2-web-exposure.plan.md). Public delivery retains template service-worker
integration, local/provider/browser evidence, and human credential closeout. Web exposure alone owns
the first Deno Deploy deployment and the `db.team` / `cdn.db.team` hosted proof. Neither consumer's
unfinished work reopens this extraction or becomes its prerequisite. Extraction completion does not
complete those obligations or authorize remote operations.

The opening arc is the sole landing ledger. All nine subjects and hashes reconcile with history
reachable from `b3f14a5ee7f28284095649c96bc273cae880e7f1`. The final sample commit contains only
`code/sys.driver/driver-cloudflare/-sample/deploy/` paths. Subsequent workspace refresh `45797a34b`
changes sample version metadata to 0.0.3, not its implementation; footprint and runtime receipts
below remain bound to the extraction candidate. Later service/Cell startup, clean-task, and
walkthrough changes are recorded as current consumer context in the exposure plan; they are not
extra extraction items or fresh extraction proof. Owner source, public types, and tests are the
detailed contracts. This record retains recovery decisions, proof, compatibility changes, and
limits—not superseded design sketches or review prompts.

## Final ownership and navigation

All sample paths below are relative to `code/sys.driver/driver-cloudflare/-sample/deploy/`.

| Owner                                           | Responsibility                                                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `@sys/types`, `@sys/std/pkg`                    | `DistPin`, pins-only `DistPins`, strict frozen capture and exhaustive name witnesses                            |
| `@sys/fs/pkg`, Rooted                           | Verified projections, whole-selection verification, aggregate budgets, stage/identity/cleanup mechanics         |
| `@sys/driver-vite`                              | Captured build base passed to the Vite child                                                                    |
| `@sys/driver-cloudflare/r2`                     | Pinned manifest acquisition/admission and bounded request delivery                                              |
| `@sys/tools/deploy`                             | Publication admission/execution and authenticated failure observations                                          |
| `@sys/http`                                     | Bounded client transport and managed server shutdown settlement                                                 |
| `src/-entry.ts`                                 | Thin `main`: load inputs, then call deployment bootstrap                                                        |
| `src/m.deployment/u.app.ts`                     | `appFrom` and private `bootstrapError`; capture inputs, resolve credentials, admit manifest, construct HTTP app |
| `src/m.deployment/u.inputs.ts`                  | Bounded JSON input and configured credential lookup                                                             |
| `src/m.deployment/u.selection.ts`               | Configuration/base admission, fixed budgets, filenames, and local selection calls                               |
| `src/m.app/u.http.ts`, `u.routes.ts`            | Synchronous `createApp({ shell })`, Hono routes, literal paths, relative filename mapping                       |
| `src/ui/`                                       | Browser UI and independent hashing of received private-manifest bytes                                           |
| `-scripts/task.build.ts`                        | Capture configuration → invalidate exact outputs → Vite → Dist projection → persist record                      |
| `-scripts/task.push.ts`                         | Paired verification → selected audience document → Deploy → safe sample presentation                            |
| `-scripts/task.serve.ts`                        | Bootstrap → status → managed listener and SIGINT-to-`until` adapter                                             |
| `-scripts/task.proof.local.ts`                  | Capture authority/expectations → announce → bootstrap → HTTP assertions → recheck → receipt → disposal          |
| `-scripts/u.fmt.ts`, `u.status.ts`, `u.task.ts` | Task presentation, local status, and cause-free error boundary                                                  |

`m.app` has no deployment/filesystem/storage runtime dependency. `m.deployment` composes the HTTP
app, not the reverse; its bootstrap imports sibling helpers directly rather than its own barrel. Its
six files are three implementation files plus common/export/type anchors. Root types flow through
`src/types.ts` and `src/common/t.ts`; the deleted root `src/t.ts` is not a forwarding layer.

The server and browser adapters are `src/-entry.ts` and `src/ui/-entry.tsx`. Build/proof helpers
live in guarded task files; importing them in tests does not execute the task. Build-only Vite
imports remain inside `import.meta.main`. Application/UI decomposition is preserved.

## Durable contracts and compatibility

### Dist pins, projection, and the sample build record

- `DistPin` identifies the exact whole `dist.json` bytes. It is not the manifest's embedded digest,
  producer provenance, or evidence that independently supplied pins share a build.
- `DistPins<N>` is `{ readonly pins: Readonly<Record<N, DistPin>> }`. Capture validates nonempty,
  own data-property records and returns frozen copies. The named overload requires
  `{ names: { private: true, public: true } }`, an exhaustive record witness—not a widened array.
  Malformed/extra/inherited/accessor/symbol input is refused with `TypeError('Invalid Dist pins.')`.
- `Pkg.Dist.project` captures inputs, verifies one source, calls synchronous selection on its frozen
  manifest, validates every destination, processes outputs serially, verifies them, and rechecks the
  source before returning all pins. Selected payload bytes and paths are unchanged. Empty
  selections, occupied destinations, and overlapping roots—including filesystem aliases—are refused.
- Projection uses Rooted stages, not another copying/lease substrate. Failure returns no pins;
  phases are `input`, `source`, `select`, `output`, `recheck`, or `cleanup`. Conservative
  `remaining` output names and an independent cleanup category preserve residue evidence without raw
  paths or causes. Cleanup never implies rollback or deletes already promoted outputs.
- `Pins.verify({ selection, dirs, limits, batch })` validates matching names and directories before
  IO, verifies every member, and returns no partial evidence. Both APIs enforce inventory and
  aggregate payload budgets. Reused paths count once per output. These are not cumulative IO,
  memory, locking, atomic-publication, or hostile-writer guarantees.
- The sample persists `dist.pins.json` as `{ publicAssetBase, selection: { pins } }`, base first. It
  owns this outer record and exact configured-base comparison, not another Dist schema.
  `BuildRecord.selection`, `DistPin`, `Pinned`, and `Pins.verify({ selection })` retain their
  meanings.
- Build invalidates both `dist.pins.json` and obsolete `dist.selection.json` before
  outputs/building; removal failure stops the build. Only `dist`, `dist.private`, and `dist.public`
  are removed. No glob or Rooted-metadata sweep is used. Persist only after successful
  projection/recheck.
- Readers use only `dist.pins.json`; missing/invalid records require rebuilding. No legacy filename,
  current-config inference, storage-discovered expectation, or automatic repinning fallback exists.
- Both audiences are locally verified before either push, including filename policy. Public-first
  `push:public && push:private` remains explicit. Stable inputs are required across publication;
  failure may leave writes/deletions and old browser sessions may break. No retry or rollback.
- Serve requires captured configuration/record and the private remote manifest, not local outputs or
  a public-bucket preflight. Status and proof verify only the private local inventory.

Fixed sample bounds remain: 65,536 manifest bytes, 256 entries, 1,048,576 file/response bytes,
4,194,304 payload bytes per inventory and across the two-inventory batch, 5,000 ms relay reads, and
four concurrent requests. Duplicate equal-to-constant JSON limits were removed, not relaxed.

Source anchors: `code/sys/types/src/t/t.Pkg.dist.ts`, `code/sys/std/src/m.Pkg/m/`,
`code/sys/fs/src/m.Pkg.Dist/`, and `code/sys/fs/src/m.Fs.capability/m.Rooted/`. Private IO/identity
contracts belong in owner-local type files. `Dist.Compat` relocation preserves behavior and is not a
new selection abstraction.

### Vite handoff

The captured `paths.app.base` reaches the build child through `--base`; captured base and output
directory override file configuration. Entry/worker/plugin configuration remains
configuration-owned. Dev behavior is unchanged. The sample shares `APP_ENTRY` with `vite.config.ts`
and no longer uses `SYS_SAMPLE_R2_PUBLIC_ASSET_BASE` or parent environment mutation/restoration.

Actual-child evidence uses Vite 8.3.0 and emitted URLs; command-only coverage does not prove another
Vite version's runtime behavior. Trusted config/plugins remain inputs, not sandboxed hostile code.
Sample worker outputs remain refused pending the parent's explicit service-worker policy change.

### R2 manifest admission

- `R2.ReadRoute.fromDist` is additive; `create` retains its existing signature and request behavior.
  Construction captures target, pin, bounds, signer/receiver, policy, and signal before awaits. It
  acquires one manifest through the shared read engine and admits its exact bytes through Dist.
  There is no synthetic Request, temporary bootstrap route, retry, prefetch, or response cache.
- Only `ready` contains a handler. Closed frozen failures are `invalid-input`, `read-refused`
  (mapped 404/413/502), `manifest-refused`, `policy-refused`, `cancelled`, and `timeout`; they
  retain no provider/callback cause, signed URL, credential, body, or cancellation reason.
- Route policy runs synchronously once after admission. It returns a copied plain/null-prototype
  own-data map from application paths to admitted relative filenames, including literal `dist.json`.
  Reject the whole invalid map; aliases and empty maps are allowed. Full storage keys and signed
  targets are checked exactly without repairing prefixes. Public/private policy remains local.
- Bootstrap validates but does not call request authorization: there is no incoming request. Every
  later mapped request authorizes before signing. The sample deliberately uses
  `authorize: () => true`; private storage does not make its anonymous application confidential.
- Native composed signals isolate caller listener overrides; ducks/proxies are refused before IO.
  Invalid input precedes pre-abort. Ordinary unchanged same-realm Promise policy rejections are
  observed without invoking constructor/species accessors; exotic async work remains callback-owned.
  This is not a hostile-realm sandbox.
- The read deadline covers signing/acquisition/body cleanup, not an overall constructor or
  synchronous policy deadline. On timeout/cancellation, the worker owns late work and cleanup; no
  late readiness. Construction cancellation ends at readiness; requests then own their signals and
  capacity slots.
- Manifest admission does not attest later payload bodies, availability, or producer provenance.
  Routed manifest requests read storage again. GET/HEAD buffering, empty refusal bodies, `no-store`,
  `nosniff`, decoded-byte limits, and exact-target checks remain with the read owner.

`appFrom` captures configuration/record and checks the recorded base before credential callbacks.
Only successful manifest admission permits HTTP app construction. `bootstrapError` translates the
closed fields without attaching causes; cancelled/timeout retain the sample's HTTP 499/504 wording.
Constructor refusal wording is distinct from client-generated **Fetch status** wording.

Source anchors: `code/sys.driver/driver-cloudflare/src/m.r2/m.ReadRoute/` and its owner tests. The
helper move into `u/` changes location, not responsibility.

### Deploy observation and safe sample exceptions

`Deploy.Error.diagnostic(error)` and `Deploy.Error.permission(error)` authenticate observations by
recorded identity. Diagnostic facts are copied/frozen; missing names are admission-only, reasons are
closed, and any R2 status is a safe integer from 100 through 599. Accessors do not traverse live
causes. Fresh outer provider failures isolate invocation facts; directly rethrown admission objects
retain identity and the first context-independent observation. Primitive throws remain unchanged.

The sample has two lanes: recognized Deploy facts are authoritative, including absence of captured
permission; only unrecognized injected publishers use `R2.Error.permission` compatibility. That
fallback authenticates neither missing names nor diagnostics. Mutating a recognized error's cause
cannot change the sample's interpretation.

Safe observations do not sanitize Deploy's detailed exceptions. Ordinary sample push failures stay
cause-free; advice accepts only the selected operation's configured names. The small private
safe-fact association and sample formatting remain local. Runtime-denial identity, one report, and
nonzero push exit are preserved. No generic registry/renderer, publication retry, or extra cleanup
was introduced.

Source anchors: `code/sys.tools/src/cli.deploy/u.error.ts`, `t.namespace.ts`, and
`u.push/u.endpoint.ts`. The transport driver does not depend on Deploy.

### HTTP settlement and proof disposal

`HttpServer.start` captures/observes native completion once and uses its existing disposal owner.
Managed disposal joins settled shutdown, native completion, and keyboard cleanup; cleanup starts
independently. `close`, `dispose`, and `Symbol.asyncDispose` share completion. Observers may request
disposal but are not work it awaits; keyboard `onQuit` does not await it either.

A lone failure retains its exact value. Distinct failures form an unflattened `AggregateError` in
shutdown → completion → keyboard order, with the first as cause. Deduplication uses `Object.is`:
identical values merge, `0` and `-0` differ, and repeated `NaN` merges. Status stays `stopping`
until all owned outcomes settle, then `stopped` or `error`. Public `finished` remains native
completion, not complete managed disposal. Existing CLI retry/terminal semantics remain delegated to
CLI.

There is no forced termination or shutdown deadline; nonsettling work can leave disposal pending.
Synchronous startup failure requests/observes cleanup and throws the original error; it cannot
attest completed asynchronous rollback. Controlled failure injection is not a naturally occurring
Deno shutdown defect or a real process-exit proof.

The sample uses an outer server `AsyncDisposableStack`, then a client `DisposableStack`, with
immediate registration inside the reporting try. Client cleanup precedes server cleanup, including
partial acquisition. With delivery D, refusal reporting R, client cleanup C, and HTTP-owner H,
combined failures are `SuppressedError(H, SuppressedError(C, SuppressedError(R, D)))`; stages that
did not fail are omitted. A lone value retains identity and H is not flattened. This intentionally
replaces the old flat `.errors`/primary `.cause` contract, and is documented beside `prove`.

The proof captures root, logger, starter, and the reader's bound `get` callable before awaiting,
including reader absence. Selected reporting settles before default dotenv loading, credentials,
storage, or listening. Failed reporters are not retried; cleanup failures are outside the refusal
catch. A verified receipt precedes cleanup and does not attest successful shutdown. `proveWith` is
an internal acquisition-test seam, not a public client-factory option or generic proof runner.

The proof retains private pinned verification → bounded Snapshot bytes → exact-byte hashing →
recheck, then bounded Fetch GET/HEAD comparisons and explicit app checks. MIME/length, HEAD
metadata, no-store/nosniff, encoding/redirect refusal, and byte comparison remain local assertions,
not a new `verifyBytes` API. Fetch statuses can be client-assigned. `/ui/` has a checksum check
rather than an independent bytewise comparison. For two inventory files: 10 application attempts, 6
storage reads, and 3 manifest reads including bootstrap; fixture counts do not measure live provider
traffic.

Snapshot deadlines are cooperative around filesystem IO; rechecking is not locking. Per-request
deadlines do not cover later Blob conversion/reporting or the whole proof. Fetch disposal aborts its
lifetime without joining all late transport work. Lossless proof suppression does not extend to
throwing `runTask` reporters or spinner `finally` failures. Serve owns the small SIGINT adapter,
removes its listener, and awaits managed disposal; real signal execution is not part of the
receipts.

Source anchors: `code/sys/http/src/http.server/m.HttpServer/u/u.start.ts`, its settlement tests, and
sample `task.proof.local.ts` / `task.serve.ts`.

## Landed footprint and attribution

Committed comparison: `652d1daa7` → `b3f14a5ee`, measured from Git blobs/numstats. Counts include
all source, support, tests, fixtures, documentation, configuration, and tracked metadata. Lines
include comments/blanks; they are not executable-statement counts. Ignored outputs are excluded.

| Category                                                           | Files before → after | Lines before → after |
| ------------------------------------------------------------------ | -------------------- | -------------------- |
| App/UI, including app types/routes                                 | 9 → 11               | 351 → 315            |
| Entry/build/push/serve, deployment policy, common/type/config glue | 19 → 19              | 649 → 653            |
| Formatting/status/task presentation                                | 3 → 3                | 208 → 216            |
| Proof implementation/task                                          | 2 → 1                | 254 → 245            |
| Tests and fixtures                                                 | 18 → 16              | 2,421 → 2,315        |
| README, JSON configuration, ignore rules                           | 4 → 4                | 341 → 199            |
| Tracked generated `src/pkg.ts`                                     | 1 → 1                | 19 → 19              |
| **Total**                                                          | **56 → 55**          | **4,243 → 3,962**    |

Runtime/support source is **1,462 → 1,429** lines; tests/fixtures fall by **106**. This is modest
source reduction, not a wholesale shrink. The incoming mixed worktree had 60 files; consolidation
removed six and the justified shared-bootstrap owner added one. It is five fewer than that incoming
snapshot, but only one fewer than the committed baseline.

The final commit has 53 raw paths: 28 modified, 13 deleted, and 12 added. Git's rename presentation
pairs three moves into 50 changed entries, with 1,191 insertions and 1,472 deletions. No removed
path is automatically an eliminated responsibility.

- Removed mechanisms: synthetic-request manifest bootstrap, arbitrary Deploy cause decoding, and
  manual proof completion observation/error accumulation.
- Consolidated: script `u.build.ts`/`u.proof.ts` into guarded tasks; script selection into
  deployment policy; credential/data helpers and tests into inputs; config fixtures into the
  existing fixture.
- Retained/relocated: HTTP/UI decomposition, deployment policy, safe presentation, and shared app
  bootstrap. Three entry/helper renames and type-spine changes are navigation, not mechanism
  savings.
- Included adjacent presentation and README work is counted, not credited to extraction. README
  shrank from 251 to 110 lines; its deletion is not a reusable-mechanism reduction. The proof's
  compatibility contract remains beside the callable rather than in setup prose.
- Build generated 14 ignored output/record files. Generated pins, temporary files, locks, and Finder
  metadata are not commit artifacts or source savings. Tracked package metadata is shown separately.

Upstream owner cost is separate from sample savings. Net physical lines in the owner paths:

| Owner change       | Source/types | Tests/fixtures | Documentation |
| ------------------ | -----------: | -------------: | ------------: |
| Dist/Rooted        |         +665 |           +840 |             0 |
| Vite owner         |           +7 |            +49 |             0 |
| R2 constructor     |         +335 |           +656 |           +51 |
| Deploy diagnostics |         +134 |           +338 |           +24 |
| HTTP settlement    |          +15 |           +254 |             0 |

The Vite row excludes its sample edits; the R2 helper relocation adds no owner capability. Earlier
sample test right-sizing added 64 test lines while removing redundant expensive scenarios, not
production code. Adjacent Vite presentation, dependency upgrades, and the broader HTTP README
rewrite are not hidden extraction savings. No repository-wide shrinking claim is made.

## Validation and adjudication

These are recorded implementation/reviewer receipts, not tests rerun during plan reconciliation.
Existing owning tasks and permissions were used. Zero-suite filters were corrected and are not
counted as evidence. Synthetic credentials/mock transports do not establish live provider behavior.

| Boundary                 | Recorded proof                                                                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dist/Rooted              | Four correction regressions red → green; native/injected alias cases. Filesystem 78 tests / 736 steps, process 4 / 6; checks passed. Named capture compiler/runtime corrections: focused 1 / 8; std 197 / 2,281. Initial types suite 21 / 79 with 7 ignored steps. |
| Dist sample adoption     | 22 / 122, explicit executable checks, credential-free build; filename/base/mutation and paired-publication witnesses.                                                                                                                                              |
| Sample test right-sizing | 23 / 113; checks/format/lint; no production-mutation red claim.                                                                                                                                                                                                    |
| Vite                     | Actual-child emitted-base regression red → green; owner 65 / 415, entry process 2 / 9, candidate 4 / 4; check and sample build passed.                                                                                                                             |
| R2 constructor           | Malformed/native-overridden signal and Promise-accessor regressions red → green; focused 2 / 19, owner 15 / 138, check; helper relocation 4 / 48.                                                                                                                  |
| Deploy diagnostics       | Observation stubs and unstable-status regression red → green; focused 4 / 40, full 40 / 341, check/format. Raw lint retained ten inherited `no-namespace` findings; not a clean whole-owner lint claim.                                                            |
| HTTP settlement          | Initial settlement regressions failed against old behavior; final focused 2 / 34 and owner 55 / 446 plus file-bytes entry process proof, check/format/lint. Reviewer also ran CLI 2 / 19 and Dispose 6 / 60 against keypress 1.3.1.                                |
| Final sample             | Incoming 24 / 111; final 22 / 104 with leak tracing, explicit executable checks, 53-file format, 49-file lint, credential-free build, and whitespace checks passed.                                                                                                |

Final pre-landing sample commands ran from
`/Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare/-sample/deploy`:

```sh
deno task test --trace-leaks --reporter=dot
deno task test --no-run ./src/-entry.ts ./src/ui/-entry.tsx ./-scripts/task.build.ts ./-scripts/task.push.ts ./-scripts/task.serve.ts ./-scripts/task.proof.local.ts ./vite.config.ts
deno fmt --check ./src ./-scripts README.md r2.config.json vite.config.ts
deno lint ./src ./-scripts vite.config.ts
deno task build
```

Runtime: Deno 2.9.7, V8 15.0.245.2-rusty, TypeScript 6.0.3, macOS ARM64. The credential-free build
used Vite 8.3.0 and transformed 838 modules. Executable checks are static validation, not execution
of serve/push/proof. Build pins are candidate-specific and are deliberately not promoted into
provider evidence or copied into this final record.

Independent review decisions retained for recovery:

- Dist named-key typing and private type ownership findings were accepted and corrected; the
  exhaustive witness and owner-local type contracts have their compiler/runtime proof above.
- Vite's bounded review found no material blocker. R2 signal/Promise findings were reproduced and
  corrected; the subsequent bounded review accepted the combined library/sample candidate. Later R2
  phase/helper reshaping has its own local receipts, not a claim of fresh independent review.
- Deploy and HTTP owner reviews found no material correctness findings and were accepted. HTTP's
  reported formatting residue cleared on an independent format rerun; broader README work was
  outside that lifecycle verdict. No additional owner review was commissioned for agreement count.
- The final consumer reviewer reported no reproduced delivery/security/cleanup defect, but rejected
  the candidate for missing proof compatibility documentation and README formatting. The contract
  was restored beside `prove`; formatting passed. Five independent controlled experiments covered
  callback capture, falsy cleanup, opaque acquisition/reporting failures, actual HTTP-owner
  settlement through a native-host seam, and byte comparison without client checksum admission. The
  temporary test was removed. The reviewer accidentally read early historical plan prose, limiting a
  strict blindness claim. These are fault injections, not production-mutation red or real-listener
  proof.
- Later entry/helper renames and shared-bootstrap placement were explicitly human-approved and
  locally reverified. The final in-thread STIER/verification pass found no landing blocker; it is
  not another independent blind review. Reviewer model/effort is not inferred from prompt settings.

## Completion limits and retirement

The extraction introduces no `verifyBytes` API, proof DSL, generic renderer/registry, sample lease
layer, release coordinator, or relocated sample workflow library. There was no sample lease kernel
to extract: Rooted/Dist and Deploy already own their stages and leases. The sample calls
captured-document `Deploy.push` with no build mappings, not `Deploy.stage`.

No source-commit or fixture receipt establishes public bucket visibility, current credential
permissions, public/browser byte delivery, hosted execution, atomic publication, bounded shutdown,
or termination of all late transport work. Parent historical human delivery receipts stay bound to
their own candidates. The sample defaults to one write-capable key pair for serve and both pushes;
separate roles remain configurable. Real `.env` values, rotation, and revocation remain human-owned.

The parent may proceed to its service-worker implementation boundary using these owners. Worker
classification, application-origin registration/scope, cross-origin dependencies, private cache
exclusion, fresh browser/provider evidence, and credential closeout remain outside this record. No
further extraction cleanup phase or review gate is implied.

Preserve this completed snapshot before archival. The lifecycle subjects are
`plan(done): r2-delivery-extraction.plan.md`, then `plan(archived): r2-delivery-extraction.plan.md`.
Both consumers' checked references survive archival; a future recovery hash must identify the
committed final plan snapshot, not the implementation commit or the removal commit. The source arc
is landed, but this plan is currently untracked; no committed completion snapshot or archival is
claimed. Preserve the record through a separately authorized plan commit before removal. No archival
or Git mutation is part of this reconciliation.

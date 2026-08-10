dispose-native-protocol-alignment.plan.md
- [x] 41329ffa4 test(std): pin explicit resource management runtime semantics
- [x] b882ddb58 fix(std): make lifetime bridges construction-safe
- [x] 67c861f5c refactor(sys): own floating async disposal branches
- [x] e531aa7a0 fix(std): serialize asynchronous disposal completion
- [x] c964fb323 refactor(types): omit native authority from lifecycle construction types
- [x] 8cedfc32a feat(std): expose native disposal on lifecycle factories
- [x] cea88234d refactor(sys): propagate synchronous disposal authority
- [x] db5535277 refactor(sys): expose async disposal on process and server handles
- [x] a3b240b02 refactor(driver): expose async disposal on managed driver handles
- [x] acbc92be3 refactor(types): require native protocols on canonical disposal types
- [x] 9a20f5087 chore(deps): align disposal protocol release authority
- [x] 44965c216 docs(std): define observable and lexical disposal contracts

## Status and runtime-floor decision

The native disposal implementation arc is complete. The separately completed and retired
post-publication external-fixture follow-up, `external-publication-proof.plan.md` under
`@sys.driver-vite`, is historical context and does not govern this native plan.

The campaign relies exclusively on the runtime's native ECMAScript Explicit Resource Management
semantics; it introduces no shim, polyfill, or fallback authority.

Decision: approved. Canonical Dispose adopts native ECMAScript Explicit Resource Management as a
runtime floor. Root `esnext` remains compile-time authority because it already includes the
`esnext.disposable` declarations; do not add a redundant compiler lib, ambient declaration, or
transpilation shim. Deno 2.9.4 directly proves `Symbol.dispose`, `Symbol.asyncDispose`, native
`using` / `await using`, synchronous fallback under `await using`, reverse lexical cleanup,
`SuppressedError` orientation, and native disposal stacks. The stack classes are observed runtime
context, not a dependency or API for this campaign.

Runtime capability checks belong at canonical resource construction, before a computed symbol
property is created. Sync construction requires native `Symbol.dispose`; async construction requires
native `Symbol.asyncDispose`. Keep module import side-effect-free, throw a clear capability error at
the unsupported construction boundary, and never mutate globals, install a polyfill, emit a string
`"undefined"` key, make final protocol methods optional, or invent a fallback protocol. Browser
consumers must target a runtime with the same native capabilities; this leaf library does not
conceal an incompatible host.

Commit 1 pins the real Deno language/runtime behavior only and changes no production factory. The
unsupported-runtime failure test lands with the later private capability guard and tests that guard
without deleting or monkeypatching native globals. Adding the protocol to low-level `@sys/std`
factories remains broader than the existing isolated native callsites in FakeSpinner and the Vite
loader resolver.

Verified baseline before implementation:

- focused `m.Dispose`: 49 passing steps;
- full `@sys/std`: 2,130 passing steps; check and publish dry-run pass;
- `@sys/types`: 51 passing steps; check and publish dry-run pass;
- root check failed at baseline outside this campaign in `deploy/@tdb.edu.slug/src/common/t.ts`
  because `StrBuilder` was not exported from `@sys/std` types;
- the root test baseline was not established in this review.

That baseline failure had to be fixed or unambiguously baselined before final workspace proof could
be attributed to this campaign. At the core-authority checkpoint, root `deno task check` passes all
53 packages, so the earlier baseline blocker is no longer active in the current tree.

## Review economics and decision gates

Token spend on this foundational authority/ownership campaign is intentional, but must follow
semantic risk rather than uniform ceremony. Deterministic compiler, runtime, package, and release
proof is stronger than an additional model pass for mechanical fallout; independent MAX review has
its highest return around re-entry, construction ordering, Promise truth, public protocol semantics,
and third-party lifecycle composition.

Review classes:

- **Full 3X**: primary-model MAX design pass, implementation and proof, independent cold
  primary-model MAX post-review, then Opus MAX review and explicit cross-model adjudication.
- **Focused 2X**: primary-model MAX planning and post-review; Opus reviews the containing semantic
  batch rather than the individual mechanical commit.
- **Deterministic**: high-reasoning implementation plus exhaustive compiler/test/check/dry-run and
  dependency-graph proof; no standalone Opus review unless evidence exposes semantic ambiguity.

For Full 3X work, do not inspect the Opus conclusion before the primary model completes and reports
its cold post-review. Give the external reviewer the exact current tree, governing plan and canon,
and require it to state source revision/timing and any canon-access gap. Adjudicate each finding as
confirmed, rejected with reason, or accepted hardening; rerun the affected proof after corrections.
Use `BLOCK`, `MATERIAL CONCERN`, or `READY` as the review verdict vocabulary.

| Arc item                                                                   | Principal risk                                                           | Primary-model review                                  | Opus placement                                                  | Class              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------- | ------------------ |
| `test(std): pin explicit resource management runtime semantics`            | Native language/runtime truth, bounded by direct runtime evidence        | One MAX semantic pass plus runtime proof              | No standalone review                                            | Focused 2X         |
| `fix(std): make lifetime bridges construction-safe`                        | Re-entry, TDZ, rollback, subscription races                              | MAX before and cold MAX after                         | Independent review, combinable with the async-kernel checkpoint | Full 3X            |
| `refactor(sys): own floating async disposal branches`                      | Cross-package omission and unhandled-rejection timing                    | MAX ownership audit before and after                  | Independent audit, combinable with the async-kernel checkpoint  | Full 3X / combined |
| `fix(std): serialize asynchronous disposal completion`                     | Promise identity, re-entry, raw failure, thenable assimilation, ordering | MAX before and cold MAX after                         | Standalone Opus MAX                                             | Full 3X            |
| `refactor(types): omit native authority from lifecycle construction types` | Structural omission and authority leakage, largely compiler-driven       | MAX design plus focused type-proof review             | Include with lifecycle-factory symbol review                    | Focused 2X         |
| `feat(std): expose native disposal on lifecycle factories`                 | Core direct/symbol identity and protocol exclusivity                     | MAX before and cold MAX after                         | Standalone Opus MAX                                             | Full 3X            |
| `refactor(sys): propagate synchronous disposal authority`                  | Wide owner delegation and projection fallout                             | MAX migration map plus MAX batch audit                | Sample in propagation/final review                              | Focused 2X         |
| `refactor(sys): expose async disposal on process and server handles`       | Async ownership, construction, promise identity, shutdown errors         | MAX before and cold MAX after                         | Standalone Opus MAX                                             | Full 3X            |
| `refactor(driver): expose async disposal on managed driver handles`        | Third-party lifecycles, startup cancellation, worker teardown            | MAX before and cold MAX after                         | Opus MAX; split by driver family if needed                      | Full 3X            |
| `refactor(types): require native protocols on canonical disposal types`    | Public source break, guards, structural implementers                     | MAX before and cold MAX after                         | Standalone Opus MAX                                             | Full 3X            |
| `chore(deps): align disposal protocol release authority`                   | Version/import/dependency ordering                                       | Focused procedural review plus exhaustive graph proof | Include with canonical-type release review                      | Deterministic      |
| `docs(std): define observable and lexical disposal contracts`              | Whole-campaign semantic fidelity                                         | Final cold MAX reconciliation                         | Final holistic Opus MAX                                         | Final 3X audit     |

Batch review checkpoints:

1. construction safety, floating rejection ownership, and the async kernel may share one kernel
   checkpoint, provided each commit retains its own source-owned proof;
2. lifecycle omission types and core factory symbols share one core-authority checkpoint;
3. synchronous propagation receives one compiler-led batch audit and escalates if ownership becomes
   ambiguous;
4. process/server async composition receives its own Full 3X checkpoint;
5. managed drivers receive a Full 3X checkpoint, split when Automerge and Vite risks cannot be
   reviewed coherently together;
6. canonical type tightening and dependency alignment share one public type/release checkpoint;
7. documentation ends with a cold arc-wide primary-model review followed by a holistic Opus review.

Before each arc item starts, record its review class, proof surface, and whether Opus is standalone
or batched. Escalate any item to Full 3X if implementation introduces a state machine, ownership or
construction ambiguity, Promise/error-policy change, public protocol break, or new third-party
lifecycle composition. Mechanical classification never relaxes red-to-green behavior proof where
behavior changes, package gates, root checks, or final residue inspection.

### Per-item review records

#### `refactor(types): omit native authority from lifecycle construction types`

- **Class:** Focused 2X.
- **Boundary:** type-only changes to `OmitDisposable` and `OmitLifecycle`; no runtime symbols,
  canonical protocol tightening, guards, factories, or downstream propagation.
- **Proof:** red-to-green compile-time construction targets containing both native symbol methods;
  `@sys/types` test/check/dry-run and dependent `@sys/std` check.
- **Opus:** batched with `feat(std): expose native disposal on lifecycle factories` at the
  core-authority checkpoint.

#### `feat(std): expose native disposal on lifecycle factories`

- **Class:** Full 3X.
- **Boundary:** native symbol authority on `disposable*`, `lifecycle*`, `toLifecycle`, and
  `abortable`; authority removal in `omitDispose`; temporary inline native return intersections.
  No canonical type tightening, `Is.disposable` change, downstream propagation, shim, or fallback.
- **Proof:** red-to-green direct/symbol identity, lexical `using` / `await using`, async completion
  identity and suppression truth, protocol exclusivity and enumerability, projection delegation,
  omission of own and inherited authority, focused/full `@sys/std` test/check/dry-run, formatting,
  lint, and residue inspection.
- **Primary post-review:** `gpt-5.6-sol • max` BMIND/STIER adversarial self-review. It is not claimed
  as context-independent because the reviewer authored the implementation. It corrected the stale
  focused-test command and removed redundant weak assertions before reporting `READY`.
- **Opus:** standalone Claude Opus 5 MAX review of the exact working tree and the batched omission
  types reported `MATERIAL CONCERN`: no behavioral defect, but the top-level capability resolver
  contradicted the plan's construction-boundary and sync/async split. It also reported authority-key
  duplication, formatting residue, three proof gaps, and stale baseline prose.
- **Adjudication:** F1 confirmed and fixed red-to-green with independent lazy sync/async capability
  checks at factory construction; module import no longer resolves either symbol. F2 accepted: the
  own-key skip and inherited-key mask now share one authority-key list. F3 accepted for authored or
  directly changed nodes and rejected for unrelated pre-existing nodes per the same formatting
  protocol. F4 accepted with permanent accidental-argument, own-accessor, projection-forwarding,
  and abortable-exclusivity proofs. F5 was already resolved concurrently in the governing plan.
- **Post-adjudication proof:** focused `m.Dispose` passes 13 tests / 81 steps; full `@sys/std` passes
  175 tests / 2,182 steps plus check and dry-run; `@sys/types` passes 21 tests / 66 steps plus check
  and dry-run; scoped formatting and lint pass. Root check passes 53/53 packages, and root parallel
  test exits successfully across 53 packages / 10,884 tests (49 reports, 4 not applicable). Current
  proof ran on Deno 2.9.5; the committed runtime-floor proof remains pinned to Deno 2.9.4.

#### `refactor(sys): propagate synchronous disposal authority`

- **Class:** Focused 2X.
- **Boundary:** synchronous native authority on the seven explicit lifecycle compositions in Time,
  Keyboard, DevHarness, and the Automerge worker document proxy. No async process/server or managed
  driver authority, canonical type tightening, shim, fallback, or new lifecycle state machine.
- **Proof:** one lexical `using` smoke test per explicit handle family; focused and full package
  tests, checks, and publish dry-runs for `@sys/std`, `@sys/ui-dom`, `@sys/ui-dev`, and
  `@sys/driver-automerge`; root check; scoped formatting, lint, and migration-residue inspection.
- **Primary post-review:** `gpt-5.6-sol • max` BMIND compiler-led ownership audit of the exact
  working tree reported `READY`. Every composite retains one canonical owner and delegates direct
  and native sync entrypoints to it; no additional manual sync projection or escalation ambiguity
  was found. The audit also removed one unrelated `require-await` residue from an already-touched
  RxBus test.
- **Opus:** no standalone review; sample in the propagation/final review checkpoint. No Full 3X
  escalation was triggered because the change adds no state machine, ownership ambiguity,
  Promise/error-policy change, protocol break, or third-party lifecycle composition.

#### `refactor(sys): expose async disposal on process and server handles`

- **Class:** Full 3X.
- **Boundary:** native async authority on Process, HTTP server, and WebSocket server handles;
  direct, domain-alias, and symbolic entrypoints share each handle's existing lifecycle completion.
  No managed-driver migration, canonical type tightening, shim, fallback, or new cleanup policy.
- **Proof:** red-to-green lexical `await using`, direct/alias/symbol Promise identity, construction
  rollback and synchronous-`until` safety, shutdown reason/state/error preservation, focused and
  full package tests/checks/dry-runs, root checks, formatting, lint, and residue inspection.
- **Primary review:** `gpt-5.6-sol • max` design pass before implementation and cold BMIND/STIER MAX
  post-review after deterministic proof. A refreshed BMIND/TMIND/STIER pass reported
  `MATERIAL CONCERN`: HTTP and WebSocket status normalization could throw before rethrowing an
  opaque shutdown failure, replacing the raw lifecycle rejection. Red tests confirmed the defect.
- **Opus:** standalone Claude Opus MAX review of the same pre-adjudication snapshot reported
  `MATERIAL CONCERN`: no behavioral defect found, but directly changed nodes retained dead nested
  `closing` memos, HTTP/WS lacked genuine synchronous-emitter construction proof, symbol-first
  `undefined` was not asserted at the projections, and two local residue issues remained. It agreed
  that existing `toLifecycle` is sync-only and that a new async projection helper is not earned
  here.
- **Adjudication:** the primary-only opaque-rejection defect was confirmed and fixed by making
  service-status normalization best-effort while always preserving the original completion
  rejection. Opus's dead memo, construction-proof, symbol-reason, catch-shadow, and redundant-cast
  findings were accepted and corrected. Its execution gap is resolved locally; asynchronous rollback
  remains documented follow-up for the campaign's documentation item. Manual direct, alias, and
  symbolic projection remains the explicit architecture; reconsider a generic async projection
  helper only after the managed-driver shapes exist.
- **Post-adjudication proof:** opaque shutdown failures fail red and pass green with exact rejection
  identity. Focused leak-traced Process, HTTP, and WebSocket files pass 12, 11, and 12 steps. Full
  leak-traced packages pass 14 tests / 73 steps, 45 / 337, and 35 / 163, respectively, with package
  checks and publish dry-runs. Scoped formatting and lint pass across all ten affected files. Root
  check passes 53/53 packages; root parallel tests pass 53 packages / 10,903 tests (49 reports, 4
  not applicable).

#### `refactor(driver): expose async disposal on managed driver handles`

- **Class:** Full 3X, with Automerge and Vite reviewed as separate ownership subfamilies inside one
  arc item.
- **Boundary:** native async authority on Automerge repo, worker-repo proxy, and sync-server handles,
  plus Vite's dev-process handle. Automerge projections retain their existing lifecycle owner while
  essential worker teardown moves into that owner. Vite gains one outer lifecycle that owns screen,
  child-process, and bootstrap teardown and becomes the public completion/event/state truth. No
  canonical type tightening, managed-service authority expansion, shim, fallback, or new cleanup
  policy.
- **Proof:** red-to-green lexical `await using`, direct/symbol Promise identity and first-reason
  semantics for each handle family; Automerge synchronous-`until`, setup rollback, worker port and
  pending-RPC teardown; Vite pre-aborted and synchronous startup cancellation, outer cleanup success
  and raw failure truth, service-status compatibility, full package tests/checks/dry-runs, root
  checks, formatting, lint, and residue inspection.
- **Primary review:** `gpt-5.6-sol • max` design pass before implementation and independent cold
  BMIND/STIER MAX post-review after deterministic proof.
- **Opus:** standalone Claude Opus MAX review after the cold primary pass. Supply separate Automerge
  and Vite evidence, adjudicate every finding, and rerun affected proof before readiness to land.
- **Cross-model adjudication:** the primary review's Vite HTTP-readiness cancellation concern was
  accepted and corrected before the independent snapshot. Opus's material sync-server startup race
  was reproduced red and fixed: construction-boundary cancellation now rejects deterministically
  after owned rollback instead of racing to return a torn-down handle or misreport a bind failure.
  Its worker rollback `never` annotation concern was accepted. Its child-first Vite reason-loss
  concern was also reproduced red and fixed with a local async-event reason projection. The existing
  sync-server cleanup swallow policy is accepted-and-deferred because this item's boundary
  explicitly excludes a cleanup-policy campaign; the asymmetry with Vite remains named follow-up
  evidence. The remaining non-blocking observations require no change in this item.
- **Post-adjudication proof:** focused leak-traced sync-server proof passes 16 steps, including
  pre-aborted and genuinely synchronous startup cancellation with port release; focused Vite dev
  proof passes 8 steps, including HTTP-wait cancellation and child-first reason fidelity. Full
  Automerge passes 52 tests / 340 steps and full Vite passes 59 / 338, with both package checks and
  publish dry-runs. Scoped formatting and lint pass across all 13 affected files, and
  `git diff --check` passes. Root check passes 53/53 packages; root parallel tests pass 53 packages
  / 10,914 tests (49 reports, 4 not applicable). The Full 3X result is ready to land.

#### `refactor(types): require native protocols on canonical disposal types`

- **Class:** Full 3X.
- **Boundary:** `t.Disposable` and `t.DisposableAsync` require their matching native protocols and
  exclude opposite authority through optional-`never` symbol keys. `Lifecycle*` inherits that
  authority; broad direct-method concepts remain broad. `Is.disposable` and the `Until` guard branch
  become truthful to the canonical synchronous type, redundant inline native intersections collapse,
  and structural implementers gain real owner-backed symbol methods. No shim, fallback, global
  mutation, dependency release change, or lifecycle ownership change.
- **Proof:** compile-time native requirements, sync/async disjointness, hybrid rejection, broad
  direct-method concepts, strict `Until`, canonical omission targets, runtime inherited authority,
  undefined opposite keys, omitted projections, structural implementers, focused/full package
  tests/checks/dry-runs, workspace proof, formatting, lint, and residue inspection.
- **Primary review:** `gpt-5.6-sol • max` design pass before implementation and a fresh-snapshot
  BMIND/TMIND/STIER MAX post-review after deterministic proof reported `READY`.
- **Opus:** standalone Claude Opus 5 MAX review of the frozen pre-adjudication working tree reported
  `MATERIAL CONCERN`: no behavioral defect, assignability hole, lying production predicate, missing
  implementer, authority leak, or scope drift; it found one deliberately hybrid test fixture with an
  unacknowledged canonical cast, omission tests detached from canonical lifecycle types, and three
  proof-accounting gaps.
- **Cross-model adjudication:** F1 was confirmed as test-fixture truthfulness debt and corrected
  with an explicit boundary-crossing cast and rationale. F2 was accepted: sync and async omission
  proofs now bind directly to `t.Lifecycle` and `t.LifecycleAsync`. P3 was accepted as
  stale-snapshot proof accounting rather than a code defect and resolved with a final exact-snapshot
  workspace rerun; no arithmetic is inferred across reporter units or different snapshots. P4 and P5
  were accepted with inherited-async rejection, explicit-`undefined` async-key acceptance, and
  omitted-projection guard proofs. O6-O8 remain intentionally assigned to the dependency/release and
  documentation items; O9-O12 are accurate non-blocking TypeScript/runtime observations and require
  no code change here.
- **Post-adjudication proof:** targeted canonical types pass 1 test / 8 steps; targeted `Is` plus
  `omitDispose` pass 2 / 121. Full `@sys/types` passes 21 / 69 and full `@sys/std` passes 175 /
  2,184, with both package checks and publish dry-runs. Changed-node formatting and lint pass. Root
  check and dry-run pass 53/53 packages; the exact final root test snapshot passes 53 packages /
  10,917 tests (49 reports, 4 not applicable). The Full 3X result is `READY`.

#### `docs(std): define observable and lexical disposal contracts`

- **Class:** Final 3X audit.
- **Boundary:** public `@sys/std/dispose` module/API documentation and canonical `@sys/types`
  disposal comments for the existing native, explicit, observable, and lifetime-input contracts. No
  runtime behavior, public type shape, export, dependency, lifecycle ownership, shim, fallback, or
  broad README campaign.
- **Proof:** local JSR documentation rendering; claim-by-claim reconciliation against `@sys/types`,
  the disposal kernels, lifecycle projections, and runtime proofs; focused/full `@sys/std`
  tests/check/dry-run; changed-node formatting and lint; root check/dry-run and residue inspection.
- **Primary review:** fresh-snapshot `gpt-5.6-sol • max` BMIND/TMIND/STIER reconciliation after
  deterministic proof.
- **Opus:** final holistic Claude Opus MAX review of whole-campaign semantic fidelity after the cold
  primary pass, followed by explicit cross-model adjudication and affected-proof reruns.

## Position

Canonical Sys disposal becomes a strict extension of ECMAScript Explicit Resource Management: native
lexical cleanup plus Sys reasons, observability, and lifecycle state. Do not create a second
permanent native-aware hierarchy and do not redefine every `.dispose()` object as a native resource.

## Reality findings

### Construction is already unsafe

`disposable()` subscribes to `until` before `lifecycle()` installs its state observer, and
`abortable()` installs its abort observer later still. A source that emits synchronously from inside
`subscribe()` currently returns:

- `lifecycle.disposed === false` after its one disposal event is already over;
- `abortable.disposed === false` with `signal.aborted === false`.

A direct runtime probe confirmed both failures. The same emission can invoke downstream async
cleanup before closed-over resources are initialized, or before downstream cleanup subscribers are
attached. Process and Automerge contain both patterns. A returned subscription can also be inserted
into the bridge set after disposal already cleared it.

### Async disposal does not represent completion truth

Current `disposableAsync()`:

- marks `_disposing` before cleanup, so a concurrent second call fulfills before the first cleanup;
- converts cleanup failure into an `error` event while resolving the disposal promise;
- wraps the kernel in another `async` function, precluding one directly returned completion;
- has no completion installed before synchronous `start` publication and possible re-entry;
- starts disposal from `until` without owning the future rejection.

### Native authority is lost structurally

`lifecycle*()` reconstructs objects from destructured string members. `toLifecycle()`,
`abortable()`, and many downstream handles manually project `.dispose`, `dispose$`, and `disposed`.
None will gain a symbol merely because the owned kernel does.

`omitDispose()` iterates `Object.entries(Object.getOwnPropertyDescriptors(...))`; it drops only an
own string `.dispose`, ignores symbol keys, and can retain inherited callable authority.

`Is.disposable` becomes a lying type predicate if `t.Disposable` is tightened before its runtime
shape test changes.

### Vite has a separate lifecycle truth defect

`Vite.Dev.Process` owns screen, child-process, and bootstrap teardown, but exposes the nested
process `dispose$` / `disposed`, does not serialize its outer cleanup, and drops direct reasons.
Screen or bootstrap cleanup can therefore fail while the public observable reports nested-process
success.

## Final type plane

After runtime migration, tighten `code/sys/types/src/t/t.Dispose.ts`:

```ts
export type Disposable = globalThis.Disposable & {
  readonly [Symbol.asyncDispose]?: never;
  readonly dispose$: t.DisposeObservable;
  dispose(reason?: unknown): void;
};

export type DisposableAsync = globalThis.AsyncDisposable & {
  readonly [Symbol.dispose]?: never;
  readonly dispose$: t.Observable<t.DisposeAsyncEvent>;
  dispose(reason?: unknown): Promise<void>;
};
```

`Lifecycle` and `LifecycleAsync` remain state-bearing intersections. Opposite optional-never keys
make the Sys categories disjoint: canonical sync resources cannot advertise callable async cleanup,
and canonical async resources cannot be consumed through synchronous `using`.

Protocol rules:

- sync resources expose `.dispose()` and `Symbol.dispose`, never callable `Symbol.asyncDispose`;
- async resources expose `.dispose()` and `Symbol.asyncDispose`, never callable `Symbol.dispose`;
- `await using` may consume a sync resource through the language fallback;
- `.dispose(reason)` remains the early/reasoned control surface;
- each symbol method is a zero-argument forwarding function, not a direct alias that can accept an
  accidental reason; symbol-first disposal therefore records `undefined`;
- core plain-object symbols use the same enumerability as the existing `.dispose` member, avoiding
  split direct/native authority under object spread;
- native interfaces permit own or inherited methods; do not impose an own-property or universal
  non-enumerability rule on every structural implementation;
- check the required well-known symbol before property construction so an unsupported runtime never
  creates a string-keyed `"undefined"` property.

## Construction-time bridge contract

Use one private bridge-attachment primitive for both kernels; do not export a new framework surface.
For each bridge:

1. Detect an emission before `subscribe()` returns and queue its disposal request to a microtask.
2. After `subscribe()` returns, retain the subscription only while the operation is idle; otherwise
   unsubscribe it immediately.
3. On the first request, unsubscribe and clear installed bridges once, retaining the current
   best-effort policy for unsubscribe failures.
4. Attach explicit rejection ownership when the request targets async disposal.

This is only a construction barrier. It is not permission for downstream cleanup closures to retain
TDZ dependencies: initialize every value a handler can read to a safe state before subscribing to
`until`, and keep essential cleanup in the owned handler rather than a late `dispose$` observer. A
factory that can throw after acquiring a resource needs rollback that also owns any queued request.

A later emission from an installed live subscription still triggers in the source's turn. A direct
call made after factory return but before the queued request wins the reason race. Do not make a
previously completed, non-replaying `dispose$` sticky in this campaign.

Prove the barrier through `lifecycle()`, `lifecycleAsync()`, `abortable()`, sync `Schedule.queue`,
Process, and Automerge. No cleanup may observe temporal-dead-zone state, no required setup observer
may miss the terminal edge, and no bridge may remain retained after terminal disposal.

## Async kernel contract

Use one private state machine:

```text
idle → running → fulfilled | rejected
```

Create a deferred completion with `Promise.withResolvers<void>()` or an equivalent side-effect-free
mechanism. Store its promise before bridge teardown, event publication, or user code. Do not use
`completion ??= new Promise(...)` if that executor publishes or invokes callbacks: assignment
finishes only after the executor returns, so re-entry can still see no completion.

The first request synchronously:

1. records the first reason, including explicit `undefined`;
2. stores the canonical completion;
3. releases lifetime bridges;
4. publishes `start`;
5. invokes the handler in the same turn and normalizes both sync and promise results.

Settlement is exact:

- success: publish `complete`, update lifecycle terminal state through the existing event path, then
  fulfill;
- failure: publish `error`, update lifecycle terminal state, then reject with the exact thrown or
  rejected value.

The event retains the existing normalized `DisposeError`; the promise retains raw rejection
identity. A synchronous throw publishes terminal error truth before `dispose()` returns. Telemetry
normalization must never replace or strand raw completion truth, including for opaque rejection
values. Observe returned Promise values with native `await` semantics rather than calling a
user-overridable `.then` method; failures while assimilating hostile Promise or thenable properties
enter the same rejection path. A handler that returns the canonical completion creates a direct
Promise self-cycle and rejects with `TypeError` instead of remaining permanently pending. Indirect
dependency cycles are caller-created and cannot be detected generally. Do not route failure through
`Observable.error()` or add observable completion semantics.

Every direct, symbolic, concurrent, re-entrant, and post-settlement call observes the one stored
completion. Core `.dispose()` and `[Symbol.asyncDispose]()` return it directly and are not declared
`async`. Build both entrypoints from the final request function; do not capture a pre-bridge
function and later replace `.dispose`.

A downstream wrapper with no additional cleanup returns its owner's promise directly. A wrapper with
additional owned cleanup has its own serialized completion and its symbol enters that outer kernel
rather than bypassing it for a nested resource.

When body execution and cleanup both fail under `await using`, let cleanup rejection escape
unchanged. The language runtime, not Sys, creates `SuppressedError`: `error` is cleanup failure and
`suppressed` is body failure for the single-resource case.

## Rejection ownership

Prepare known floating branches before core disposal starts rejecting:

- `code/sys/std/src/m.Dispose/u.dispose.ts` `until` subscriptions;
- `code/sys/std/src/m.Async/u.singleton.ts`, whose intentional swallow policy must consume both sync
  throws and promise rejections admitted by TypeScript's `void`-return assignability;
- `code/sys/http/src/http.server/m.HttpServer/u/u.start.ts` `server.finished` callbacks;
- `code/sys.driver/driver-automerge/src/m.worker/u.client.proxy.repo.ts` worker stream close;
- `code/sys.driver/driver-automerge/src/m.worker/-test/-u.client.proxy.doc.test.ts` proxy teardown;
- `code/sys.driver/driver-vite/src/m.vite/-test/-dev.test.ts` timeout cleanup.

`code/sys/server/src/m.server.websocket/u/u.create.ts` and
`code/sys/testing/src/m.server/m.Browser/u.chrome.launch.ts` already catch floating disposal and are
references for intent. A catch on a floating branch does not alter canonical promise rejection for a
later awaited caller. Preserve each owner's existing error policy; do not globally swallow awaited
failures.

### Package map (ELI5)

A floating branch is cleanup deliberately started without waiting for it. If that cleanup rejects
and nobody owns the rejection, the runtime reports an unhandled promise rejection. Each
fire-and-forget caller must therefore consume its own cleanup rejection. This does not hide failures
from callers that explicitly await disposal: awaited calls still receive the original rejection.

```text
@sys
├── std
│   ├── Dispose
│   │   └── Own rejected background lifetime cleanup
│   └── Async.singleton
│       ├── Own rejected producer cleanup
│       └── Prove teardown causes no unhandled rejection
│
├── http
│   └── HttpServer
│       └── Own rejected cleanup after server completion
│
├── driver-automerge
│   └── Worker proxy
│       ├── Own rejected repo/document stream cleanup
│       └── Own rejected proxy-test teardown
│
└── driver-vite
    └── Vite.dev tests
        └── Own rejected timeout/server cleanup
```

Conceptual ownership flow, rather than an exact package-import graph:

```text
@sys/http ───────────────┐
@sys/driver-automerge ───┼──> explicitly owned floating cleanup
@sys/driver-vite ────────┘                 │
                                           v
                              @sys/std lifecycle contract
```

In short: fire-and-forget cleanup becomes safely fire-and-forget, while explicitly awaited cleanup
remains truthful.

## Projection and boundary rules

### Lifecycle construction

- `lifecycle*()` must retain the owned kernel so direct and symbolic authority survive
  reconstruction.
- `abortable()` and `toLifecycle()` delegate direct and sync-symbol authority to the same owner.
- `OmitLifecycle<T>` is the typed authority-free API boundary; `toLifecycle*()` remains a
  construction helper rather than a runtime sanitizer.
- `toLifecycle()` installs or replaces direct and configurable sync-symbol authority with the
  supplied owner.
- `toLifecycleView()` adds only live `dispose$` and `disposed` observation.
- Use `omitDispose()` when an existing resource needs an authority-free clone.

### `omitDispose()`

Its output must:

- omit own `.dispose`, `Symbol.dispose`, and `Symbol.asyncDispose` descriptors;
- mask inherited versions with own non-callable properties while retaining the prototype;
- preserve `dispose$`, `disposed`, unrelated string and symbol descriptors, accessors, and flags;
- avoid invoking getters;
- return a type omitting the three authority keys while retaining observation.

Update construction utilities before temporary native intersections:

- `OmitDisposable<T>` removes `.dispose`, `dispose$`, and both symbol keys;
- `OmitLifecycle<T>` additionally removes `disposed`;
- `LifecycleView` remains the explicit `disposed` / `dispose$` pick.

This order is load-bearing: with current omission types, `t.Lifecycle & globalThis.Disposable` would
make `toLifecycle<T>(api)` require the supposedly omitted API target to provide `Symbol.dispose`.

### Guards and adjacent contracts

At final tightening, `Is.disposable` requires callable `.dispose`, observable `dispose$`, callable
`Symbol.dispose`, and absent `Symbol.asyncDispose`. Consequently `Is.until` / `Is.untilInput` use
the same stricter Sys-disposable branch.

Keep these boundaries unchanged:

- `DisposableLike`, `Is.disposableLike`, and `CanDispose` remain broad direct-method concepts;
- `LifeLike` remains the state-only `{ disposed }` boundary used by Schedule and accepts sync or
  async lifecycle state;
- a native-only disposable is not a Sys observable lifetime or `UntilInput`;
- an async lifecycle object is not a direct `UntilInput`, but its `dispose$` remains a valid
  observable signal;
- do not add native-only guards without a demonstrated caller.

In Automerge `toRepo()`, continue passing the async lifecycle object to `Schedule.make()`: that API
consumes `LifeLike`, not `UntilInput`; replacing it with `dispose$` would lose the state guard.

## Compatibility sequence

Do not tighten canonical types first.

1. Pin passing native runtime tests without asserting unimplemented Sys behavior.
2. Land the construction barrier and its core/downstream regressions.
3. Attach rejection ownership to known floating branches while canonical failures still resolve.
4. Repair async serialization and rejection behavior, including the core bridge catch.
5. Add both symbol keys to `OmitDisposable` / `OmitLifecycle`.
6. Add core symbols with temporary inline return intersections such as
   `t.Disposable & globalThis.Disposable`; use the same technique in migrated handle types and local
   object annotations. Do not add a named transitional hierarchy.
7. Propagate symbols through explicit downstream compositions.
8. Tighten canonical types, update `Is.disposable`, and remove redundant intersections.
9. Use the strict type plane and root check as the exhaustive structural gate.
10. Align `deps.yaml`, package/import-map authority, templates, and versions; publish in dependency
    order `@sys/types` → `@sys/std` → affected dependents.

Each behavior test lands with the behavior it proves. Use red → green locally, but do not land a
knowingly failing test-only commit. Commit 1 is independently green because it tests the runtime
rather than future Sys behavior.

The final type change is source-breaking for external structural implementers and custom
`UntilInput` disposables lacking `Symbol.dispose`. Release notes must show delegation of direct and
native methods to one kernel and call out the construction-time microtask barrier. Do not hide the
break with optional methods.

## Fallout ledger

### Explicit sync composition

- `code/sys/std/src/m.Time/m.Time.until.ts`
- `code/sys.ui/ui-dom/src/m.Keyboard/m/m.Keyboard.until.ts`
- `code/sys.ui/ui-dom/src/m.Keyboard/m/m.Keyboard.dbl.ts`
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Bus/Bus.Events.ts`
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.RxBus/u.bus.connect.ts`
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Ctx/Context.ts`
- `code/sys.driver/driver-automerge/src/m.worker/u.client.proxy.doc.ts`

Retain the owner object rather than destructuring away symbol authority. Delegate both direct and
sync-symbol entrypoints.

### Explicit async composition

System:

- `code/sys/process/src/m.process/u.proc/u.spawn.ts`
- `code/sys/http/src/http.server/m.HttpServer/u/u.start.ts`
- `code/sys/server/src/m.server.websocket/u/u.create.ts`

Drivers:

- `code/sys.driver/driver-automerge/src/m.Crdt.Repo/u.toRepo.ts`
- `code/sys.driver/driver-automerge/src/m.worker/u.client.proxy.repo.ts`
- `code/sys.driver/driver-automerge/src/m.server/u.ws.ts`
- `code/sys.driver/driver-vite/src/m.vite/u/u.dev.ts`

HTTP and WebSocket `dispose` / `close` aliases should return the owned lifecycle completion directly
rather than create forwarding `async` promises.

In Process and Automerge, initialize cleanup closure dependencies before bridge subscription. The
worker repo proxy must not depend on an essential port/pending-request cleanup subscriber installed
only after its lifecycle can already be requested.

For Vite, create an outer `LifecycleAsync` immediately after child spawn and before the first
readiness await. Its handler owns screen, process, and bootstrap teardown; its reason reaches each
child that accepts one; its promise/event/state become public truth. Route `input.until`, screen,
keyboard, startup-failure cleanup, and the final API through that owner. Do not also wire
`input.until` directly to the process. The construction barrier must preserve prompt startup
cancellation for pre-aborted and synchronously emitting inputs.

### Structural test doubles

Canonical test doubles are implementations too. Known examples are `fakeServer()` and the
`failingEvents` wrapper in Vite tests. Give them real protocol methods backed by their fake
lifecycle; do not cast through the tightened type. Treat every additional object literal found by
the final compiler gate the same way.

### Behavioral consumers

Regression-test without changing their owner policy:

- Cell service close awaits and aggregates failures;
- Browser launcher teardown intentionally catches process failure;
- Vite service combines rejection with terminal event/status observation;
- `sys.tools` CRDT commands await repo/server teardown.

### Expected automatic propagation

Core lifecycle return or `toLifecycle()` should cover Schedule, Signal, Rx time-threshold,
EffectController, event, fs, immutable, model, yaml, driver-monaco, driver-deno, Automerge
event/ref, UI/controller, and template handles. They still require package checks and representative
lexical proof.

### Deliberately not migrated

- broad `DisposableLike` watchers, Monaco disposables, playback drivers, command transports, and
  mocks;
- generic `Service.Handle` values without Sys observability;
- `TestHttpServerInstance`, browser fixtures, and other plain async `.dispose()` contracts;
- FakeSpinner and the Deno loader resolver, which are already native-only sync resources.

Do not mechanically replace explicit cleanup with lexical syntax. Borrowed handles, returned
handles, React cleanup callbacks, event-driven shutdown, reasoned disposal, and early release often
must remain explicit.

## Required proof matrix

### Native/runtime

- sync `using`, async `await using`, and sync fallback under `await using`;
- reverse lexical cleanup order;
- native `SuppressedError` orientation;
- a clear unsupported-runtime feature-gate failure and no polyfill.

### Core sync and construction

- direct → symbol and symbol → direct run once; first reason wins;
- symbol-first records `undefined`; direct-before-queued-until wins its reason;
- opposite protocol is not callable; plain-object enumerability remains coherent;
- synchronous `until` cannot outrun lifecycle state, abort signal, or later same-stack setup;
- Schedule work queued after the construction-time lifetime request does not run;
- projections share one owner and views add no authority.

### Core async

- direct and symbolic calls return the stored completion;
- concurrent/re-entrant calls remain pending until one cleanup settles;
- completion exists before a `start` subscriber re-enters;
- sync throws and async rejections emit one normalized terminal error and reject with the original
  value;
- `disposed` is false while running and true after either terminal event;
- repeated calls after rejection preserve the same rejection truth;
- construction-time bridges leave no retained subscription or unhandled rejection;
- Async singleton consumes promise rejection under its intentional swallow policy;
- body plus cleanup failure produces native `SuppressedError` truth.

### Projection/type plane

- omission removes own and inherited sync/async authority without invoking getters;
- unrelated symbol descriptors survive exactly;
- omission utilities expose the intended key sets under temporary and final types;
- `Is.disposable` rejects dispose-only, observable-without-symbol, async-only, and hybrid shapes;
- `Is.until` retains observable/AbortSignal behavior while using the strict disposable branch;
- native-only and async resource objects remain outside direct `UntilInput` classification.

### Downstream

- one lexical smoke test per explicitly composed handle family;
- Process and Automerge survive synchronous construction-time `until` and setup failure without
  missed cleanup, late-observer loss, or TDZ errors;
- Vite startup cancellation remains prompt and outer promise/event/state agree on success or
  failure;
- HTTP/server floating callbacks consume rejection without falsifying awaited failure;
- existing reason, readiness, status, state, and shutdown tests remain green.

## Exit criteria and verification

- every canonical structural implementation satisfies the final type at runtime, not by cast;
- direct and lexical entrypoints share one owned operation;
- async cleanup never reports early or converts failure to success;
- no read-only/omitted projection exposes callable disposal authority;
- no opposite protocol appears on canonical sync or async implementations;
- `@sys/std/dispose` remains leaf authority; do not widen the root barrel;
- published dependency truth matches local workspace truth.

### Test-run ownership

- Agents may run `deno task dry` from the workspace root.
- Agents must not run root `deno task test`; the human owns that full-workspace run.
- Agents must `cd` into each package under investigation and run its local `deno task test`.

From `code/sys/std`:

```sh
deno task test --trace-leaks ./src/m.Dispose/-test
deno task test --trace-leaks ./src/m.Async/-test/-singleton.test.ts
deno task test --trace-leaks
deno task check
deno task dry
```

From `code/sys/types`:

```sh
deno task test
deno task check
deno task dry
```

Run `test` and `check` in every touched downstream module, at minimum:

- `code/sys/process`
- `code/sys/http`
- `code/sys/server`
- `code/sys.ui/ui-dom`
- `code/sys.ui/ui-dev`
- `code/sys.driver/driver-automerge`
- `code/sys.driver/driver-vite`
- `code/sys/cell`
- `code/sys/testing`
- `code/sys/cli`
- `code/sys.tools`
- `code/-tmpl`

From the workspace root, agents may run:

```sh
deno task check
deno task dry
deno task lint
deno fmt --check code/sys/types code/sys/std code/sys/process code/sys/http code/sys/server code/sys.ui/ui-dom code/sys.ui/ui-dev code/sys.driver/driver-automerge code/sys.driver/driver-vite code/sys/cell code/sys/testing code/sys/cli code/sys.tools code/-tmpl
```

The human alone runs `deno task test` from the workspace root.

The earlier `@tdb/edu-slug` check baseline was resolved before the completed implementation arc;
it is not a remaining campaign condition.

## Documentation

Use `@sys/std/dispose` examples and `@sys/types` contracts. Explain:

- `UntilInput` is observed as a signal, not disposed as an owned resource;
- native-only resources have no observable Sys lifetime;
- explicit cleanup carries reasons while lexical cleanup supplies none;
- async rejection is raw completion truth and the terminal event is normalized telemetry;
- subscription-time emissions cross one construction microtask;
- external structural implementers must add the matching symbol and delegate one kernel.

## Non-goals

- no implementation during plan review;
- no optional final symbol methods or ambient polyfill;
- no `DisposableStack` / `AsyncDisposableStack` wrapper without a separate earned callsite;
- no universal own-property/non-enumerable descriptor policy;
- no sticky/replay conversion for completed `dispose$` streams;
- no broad change to `DisposableLike`, `CanDispose`, `LifeLike`, generic services, or live `until`;
- no new async lifecycle state vocabulary or observable error/completion semantics;
- no owner-specific timeout, process-tree, aggregation, or swallow-policy campaign;
- no conversion of native-only resources into Sys observable lifecycles;
- no mass explicit-to-lexical callsite rewrite.

verified-dist-materialization.plan.md
- [x] e85f8de02 fix(http): checksum fetched binary response bytes
- [x] a7c6a9f62 [verified-dist-filesystem-foundations.plan.md](../@sys.fs/verified-dist-filesystem-foundations.plan.md)
- [x] a706e811b fix(http): canonicalize fetch request authority
- [x] e34412e1b fix(http): preserve fetch cancellation authority
- [x] 043b8eb68 feat(testing): add Fetch global fixture
- [x] 15120c229 refactor(http): use Fetch global fixture in tests
- [x] bab97d098 refactor(http): canonicalize fetch and pull contracts
- [x] 27753a8b9 feat(http): enforce bounded fetch response policy
- [x] 931b4204f fix(http): confine pull writes to unique targets
- [x] c4b0a8109 fix(http): centralize pull execution ownership
- [x] GATE architecture closure
- [x] 1f74dc010 refactor(dist)!: make Dist trust authority explicit
- [x] a0853332f feat(tools)!: expose bounded GitHub pull authority
- [x] 7cedf048f feat(http)!: bind pinned pull to one bounded operation
- [x] 1e0c783a6 refactor(http): group checksum-pinned pull internals
- [x] 14eb4f400 feat(server): compose immutable verified Dist materialization
- [x] ecc2995db feat(tools)!: require pinned Dist materialization
- [x] 064f12a8c refactor(http)!: remove legacy pull materialization
- [x] 80c7cd9e5 fix(dist): harden materialization authority boundaries
- [x] af3c841aa refactor(http): centralize Fetch header snapshots
- [x] 246fa3ac1 fix(tools): latch dist projection cancellation authority

This file is the sole source of truth for this completed commit arc. Formal review execution uses
the linked [MAX closure protocol and prompt set](./verified-dist-materialization.max-review.md),
which is non-authoritative and cannot change commit scope or status without reconciliation here. The
completed filesystem child plan is preserved in reachable history:

- `a7c6a9f62 plan(done): verified-dist-filesystem-foundations.plan.md`;
- `24b3b8ca8 plan(retire): verified-dist-filesystem-foundations.plan.md`.

Retrieve the completed artifact from the done commit; the live file remains intentionally retired.
Its landed public contracts and tests—not a recreated plan—are authoritative.

Current verified Dist arc endpoint:
`246fa3ac1 fix(tools): latch dist projection cancellation authority`. Every checked commit above is
reachable from the current `HEAD`. The final landed HTTP feature is
`7cedf048f feat(http)!: bind pinned pull to one bounded operation`; its behavior-neutral follow-up,
`1e0c783a6 refactor(http): group checksum-pinned pull internals`, moves the private kernel without
changing the public/runtime contract. The landed Server composition is
`14eb4f400 feat(server): compose immutable verified Dist materialization`; the Tools convergence is
`ecc2995db feat(tools)!: require pinned Dist materialization`; and the final subtraction is
`064f12a8c refactor(http)!: remove legacy pull materialization`. All original implementation items
are landed. The internal final review accepted two narrow follow-ups before independent review:
authority-boundary hardening (`80c7cd9e5`) and canonical Fetch header snapshots (`af3c841aa`). The
independent Opus 5 final implementation review found no architecture or trust blocker and accepted
one contained mutable-projection correction before closure. That correction landed as
`246fa3ac1 fix(tools): latch dist projection cancellation authority`; its regression proves truthful
cancellation after an existing immutable generation settles and before mutable projection begins,
with no refetch and no mutation of the occupied projection. The accepted-delta proof passes Tools
Pull **22/94**, full Tools **117/643**, HTTP **44/321**, Server **29/109**, and Cell **31/241**. The
verified Dist materialization arc and its checked contracts are closed and are not reopened or
reproduced here. The `@sys/tmpl` root DSL and `m.mod` chapter were reviewed before the human-led
scaffold, and the final fixture module retains its generated type, common, and test lanes. The
combined HTTP experiment is preserved only as immutable checkpoint evidence at stash object
`5d2da64900f06cc7dfe5c3d9ce698aa3234a1c5e`; never pop or apply it wholesale. Reconstruct each commit
semantically from the landed checksum baseline, consulting the checkpoint only as reviewed research
evidence. Architecture closure is complete: the independent MAX baseline was recorded before the
completed Claude/Opus response was read, every external finding was adjudicated against repository
evidence, and the decisions are reconciled below. The linked review record preserves the closure
protocol, independent Opus verdict, adjudication, accepted correction, and final proof. Completing
or reviewing this plan or its linked protocol authorizes no runtime edit, test run, staging, or
commit.

Checkpointed pre-hardening HTTP evidence:

- exact checksum-bound resources with streamed per-file and aggregate byte limits;
- aggregate accounting includes bytes consumed by failed retry attempts;
- bounded concurrency and retries, hop-by-hop redirect admission, cancellation, progress, and final
  URL evidence;
- cross-origin redirect credential stripping and fail-closed no-write behavior;
- legacy string URL inputs remain compatible;
- canonical `t.HttpFetch.*` and `t.HttpPull.*` type ownership is applied;
- focused HTTP suites pass 111 steps with leak tracing, full `@sys/http` passes 328 steps, and
  `deno task check` passes.

Cumulative hardening invariants required before Server composition:

- fetch headers use case-insensitive canonical precedence and sensitive request credentials never
  leak through generic error metadata;
- source-origin admission and credential-origin authority are distinct; cross-origin redirects do
  not forward arbitrary caller headers by default;
- byte-size probing has explicit credential/source authority and does not collapse cancellation into
  an ordinary unknown result;
- fetch lifecycle disposal and request-signal cancellation remain truthful without exposing
  abort-controller authority;
- internal policy failures have unforgeable identity and valid HTTP status semantics;
- exact response-byte checksums are not conflated with transformed text/JSON checksums;
- `Pkg.Dist.verifyPinned` is the only public Dist `verify*` operation; local self-consistency is
  honestly named `checkSelfReported`, and no public unpinned `Pkg.Dist.fetch` convenience remains;
- publisher-owned Dist computation exposes the SHA-256 of the exact serialized `dist.json` bytes,
  but that value becomes authority only when distributed independently from the artifact fetch;
- generic GitHub Pull has distinct public inputs/results, finite owner policy, confined publication,
  and no manifest generation or verified-Dist claim;
- Pull and Server consume the landed `Fs.Capability.Rooted` and `Pkg.Dist.verifyPinned` contracts;
  neither synthesizes path admission, no-clobber publication, promotion, bounded ignore admission,
  hashing, verification, evidence, or platform guarantees;
- checksum-pinned Pull resources carry explicit root-relative targets admitted as one Rooted batch;
  URL-to-path mapping is transitional legacy behavior only and is deleted before arc closure;
- all targets are normalized, contained, observed-symlink-safe, and exact-collision-free before
  network work, with remaining physical filesystem aliases failing closed at publication;
- one Pull operation owns bounded worker scheduling, lifecycle, terminal state, deterministic input
  indexes, non-buffering observable views, and complete worker quiescence;
- resource count, per-attempt time, total operation time, retry delay/elapsed time, per-file bytes,
  aggregate bytes, concurrency, and progress cadence are all bounded;
- aggregate-budget exhaustion records one terminal cause, aborts all queued and in-flight resources,
  prevents later writes, and awaits complete worker quiescence;
- Pull remains non-transactional: writes completed before a later terminal failure remain truthful
  successful records, while the Dist stage owns operation-level containment and cleanup truth;
- policy and checksum-bound pulls own their enforcing transport; authentication customization cannot
  replace or bypass byte, checksum, source, redirect, time, or progress enforcement;
- cancellation remains cancellation on retry-disabled and final-attempt paths;
- public Pull results and terminal events are truthful discriminated unions with deterministic final
  record order;
- internally created fetch clients are disposed while transitional injected legacy clients remain
  caller-owned until the final convergence refactor removes client injection from Pull;
- disposing an observable view does not cancel the operation or complete sibling subscribers;
  operation cancellation remains explicit, and no async-iterator close path exists;
- pinned Pull has one `start` entry point and one filesystem failure contract; legacy `toDir` and
  `stream` are deleted after their sole production consumer migrates;
- adversarial tests prove header precedence, credential confinement, target confinement, collisions,
  concurrency, retry, timeout, redirect, progress, cancellation, lifecycle, quiescence, event
  non-retention, and no-late-write invariants.

## Hardening ownership

- `fix(http): canonicalize fetch request authority` owns case-insensitive direct-request header
  precedence, credential-safe generic error metadata, truthful header inspection, and a
  credentialless byte-size probe boundary that cannot inherit an injected client's ambient
  authority.
- `fix(http): preserve fetch cancellation authority` owns abort-reason propagation, canonical
  cancellation classification, private controller authority, and cancellation-aware byte-size
  probes.
- `feat(testing): add Fetch global fixture` owns the reusable lifecycle-scoped replacement and exact
  restoration of `globalThis.fetch` under `@sys/testing/web`.
- `refactor(http): use Fetch global fixture in tests` is behavior-neutral and replaces local Fetch
  global setup/restoration without moving HTTP-specific test behavior into the shared fixture.
- `refactor(http): canonicalize fetch and pull contracts` is behavior-neutral and owns canonical
  type paths, truthful existing inputs, result/event discriminants, and removal of obsolete aliases.
  It does not smuggle policy behavior or later checksum-pinned resource fields into the refactor.
- `feat(http): enforce bounded fetch response policy` owns construction-bound immutable policy,
  streamed byte/time limits, bounded progress, exact byte-checksum semantics, nominal internal
  policy failures, per-hop source-origin admission, distinct credential-origin authority, admitted
  redirects, final-URL evidence, removal of every legacy request path, and explicit consumer
  migration.
- The completed filesystem prerequisite exclusively owns canonical Dist-part admission,
  `Fs.Capability.Rooted` no-clobber publication/promotion truth, bounded ignore admission, and
  `Pkg.Dist.verifyPinned` verification/evidence/failure semantics.
- `fix(http): confine pull writes to unique targets` introduces explicit admitted target paths for
  checksum-bound resources, precomputes every normalized target, rejects escapes/collisions before
  requests, and composes only the filesystem-owned capability. Legacy string mapping stays intact.
- `fix(http): centralize pull execution ownership` owns the bounded shared task kernel,
  deterministic records, client disposal, cancellation result truth, observer isolation, bounded
  event views, and wait-for-quiescence semantics.
- `refactor(dist)!: make Dist trust authority explicit` removes unpinned remote Dist convenience,
  names local self-consistency honestly, keeps pinned verification stable, and exposes exact
  publisher-serialized manifest integrity.
- `feat(tools)!: expose bounded GitHub pull authority` owns the direct generic GitHub API, finite
  source/download policy, confined create/replace publication, distinct results, and removal of
  generated Dist metadata.
- `feat(http)!: bind pinned pull to one bounded operation` owns `HttpPull.start`, canonical policy
  transport, resource/time/byte/retry bounds, exact checksum/size evidence, aggregate termination,
  explicit observation/cancellation, and no-late-write proof.
- `refactor(http): group checksum-pinned pull internals` is a behavior-neutral organization commit;
  it leaves `HttpPull.start` as the sole checksum-pinned entry seam and changes no public/runtime
  contract.
- `feat(server): compose immutable verified Dist materialization` owns the product-neutral
  authenticated manifest-to-immutable-generation composition boundary.
- `feat(tools)!: require pinned Dist materialization` migrates the sole production legacy Pull
  consumer to the Server-owned pinned materializer and keeps mutable local projection explicitly
  outside verified materialization.
- `refactor(http)!: remove legacy pull materialization` deletes URL-array inputs, raw-directory
  authority, URL-derived targets, injected clients, universal runtime exports, compatibility policy,
  and every moved-or-renamed mirror equivalent so HttpPull has one checksum-pinned Rooted path.
- `fix(dist): harden materialization authority boundaries` owns synchronous credential-callback
  admission, canonical manifest token materialization, exact GitHub own-key input authority,
  pre-aborted zero-transport settlement, and Rooted-only GitHub target claiming found by the
  internal final review. It changes no public result, policy, or trust model.
- `refactor(http): centralize Fetch header snapshots` promotes the existing canonical Fetch
  default-header implementation through one reviewed `@sys/http/client` composition API, moves
  synchronous callback rejection and rejection-draining into that owner, and removes the duplicate
  Server/HttpPull materialization logic. It changes no credential semantics, transport policy,
  public result, or trust model and adds no Bearer/header policy to `@sys/std`.
- `fix(tools): latch dist projection cancellation authority` replaces ephemeral cancellation probes
  with one operation-scoped signal shared by materialization and mutable projection. It preserves
  immutable generation truth and changes no public config, result shape, or Dist trust authority.

## Canonical Fetch header snapshot closure

- `@sys/http` remains the sole owner of Bearer normalization and `t.HttpFetch.Mutate.Headers`
  semantics; `@sys/std` stays transport-neutral.
- Promote the existing `defaultHeaders` implementation as `Fetch.defaultHeaders`, rather than adding
  a second helper, deep-importing private package internals, or constructing a Fetch client merely
  to inspect headers.
- Snapshot the access-token callback exactly once, preserve the existing trim and single
  Bearer-prefix removal semantics, invoke the header mutator exactly once, and reject plus
  rejection-drain any thenable callback result before returning a header snapshot.
- Migrate both checksum-pinned HttpPull resource credentials and Server manifest credentials to the
  same helper. Preserve lazy zero-network credential evaluation, own-property admission, immutable
  replay snapshots, header override/deletion behavior, and zero transport on callback failure.
- Add direct `@sys/http` API proof for canonical token/header behavior and asynchronous callback
  rejection, then rerun affected HTTP and Server authority proof plus scoped format/check/residue
  checks. Do not add a generic Bearer helper to `@sys/std`.

## Dist projection cancellation closure

- Create one operation-scoped abortable in `pullDistBundle`, latch pre-aborted signal authority at
  one scheduler boundary, pass its signal to both `Dist.materialize` and `projectGeneration`, and
  dispose it once in `finally`.
- Read the shared signal directly at projection gates and remove the ephemeral `isCancelled`
  lifecycle. Do not widen cancellation authority, add a public API, alter immutable generation
  evidence, or claim that a completed non-replay generic `Disposable` can be observed retroactively.
- Add a regression with an existing verified generation and configured mutable projection that
  cancels after materialization but before projection. Require `projection.reason === 'cancelled'`
  and prove the existing projection directory remains unchanged.
- Closure proof reran Tools Pull and full tests, owner check, scoped lint/format/diff proof, and all
  five final affected suites. The added case moved the observed Tools counts to Pull **22/94** and
  full **117/643** without changing HTTP **44/321**, Server **29/109**, or Cell **31/241**.
- Clean-tree publishing remains governed by the release workflow, is not claimed by this
  implementation closure, and was never bypassed with `--allow-dirty`.

## Landed prerequisite: Fetch global fixture

The landed fixture commit adds one reusable Web Standards global fixture under `@sys/testing/web`.
It owns lifecycle-safe Fetch replacement only; HTTP response behavior, abort choreography, call
capture, routing, and assertions remain test-local or use the real `Testing.Http.server` fixture.

### Public contract latch

- Add `WebFixture.Fetch` to `t.WebFixture.Lib` and expose
  `WebFixture.Fetch.mock(replacement: t.Fetch): t.WebFixture.Fetch.Mock`.
- `mock` installs the supplied Fetch-compatible function as `globalThis.fetch` without wrapping or
  transforming its input, init, result, rejection, or signal.
- Successful disposal of the returned `t.DisposableLike` handle is idempotent and restores the exact
  prior own-property descriptor. If the property was absent, disposal restores absence rather than
  synthesizing a Fetch global. Failed restoration throws without marking the handle disposed, so the
  caller can retry after resolving the interference.
- Properly nested mocks support LIFO disposal by restoring the immediately preceding descriptor.
  Process-global mutation remains intentionally test-scoped and makes no parallel-safety claim.
- Do not expose the native Fetch function, add controller authority, or build call recording,
  queues, matchers, assertions, response factories, routing, or HTTP semantics into this primitive.

### Human-led scaffold and local grammar latch

From the workspace root, the human runs the reviewed write command:

```text
deno run -ERW jsr:@sys/tmpl --non-interactive --dir code/sys/testing/src/m.web/m.Fetch m.mod
```

The dry run confirmed creation of `mod.ts`, `t.ts`, `common.ts`, and `-test/-.test.ts`; the real
setup also updates the nearest package `src/types.ts`, which must be reviewed before implementation.
Keep the scaffolded module lanes: `m.Fetch/t.ts` owns the canonical `t.WebFixtureFetch.*` subtypes,
`m.Fetch/common.ts` owns the module import lane, and `m.Fetch/mod.ts` composes `m.mock.ts`. Module
API proof stays in `m.Fetch/-test/-.test.ts`; `m.Fetch/-test/-m.mock.test.ts` owns method behavior,
while `m.Fetch/-test/u.fixture.ts` owns exact test-global restoration helpers. All use the root
harness import `../../../-test.ts`. The aggregate `m.web/t.ts` aliases owner types into the public
`t.WebFixture.Fetch.*` path, while the generated `src/types.ts` export makes the owner namespace
available package-wide. The legacy WebSocket layout is not precedent for flattening this newly
scaffolded module.

### Exact working set

Expected final files are scaffolded `m.web/m.Fetch/mod.ts`, `m.web/m.Fetch/t.ts`,
`m.web/m.Fetch/common.ts`, and `m.web/m.Fetch/-test/-.test.ts`, plus new `m.web/m.Fetch/m.mock.ts`,
`m.web/m.Fetch/-test/-m.mock.test.ts`, and `m.web/m.Fetch/-test/u.fixture.ts`, with the necessary
`m.web/mod.ts`, `m.web/t.ts`, `src/types.ts`, aggregate API-test updates, and one terse `README.md`
ESM example. No HTTP package, WebSocket fixture, server fixture, package export map, or production
runtime file changes in this commit.

### Required red proof

Before implementation, focused tests fail on the absent public `WebFixture.Fetch` surface. The
module-local `m.Fetch/-test/-.test.ts` file owns API/export/type proof only. Canonical method proof
lives in `m.Fetch/-test/-m.mock.test.ts` and covers exact replacement identity and argument/result
passthrough, rejection identity with `finally` restoration, exact descriptor restoration,
restoration after an absent prior property, retry after both descriptor and absence-restoration
failures, idempotent disposal, and properly nested LIFO restoration. Shared test-global helpers stay
in `m.Fetch/-test/u.fixture.ts`. Every behavior test restores process-global state and any patched
intrinsic descriptor in `finally`, including when an assertion fails. The aggregate
`m.web/-test/-.test.ts` file proves package-export composition only.

### Verification and closure

The initial focused red proof failed with 12 type errors on the absent `WebFixture.Fetch` surface.
After implementation and module-lane correction:

- focused leak-traced WebFixture proof passes 3 tests and 10 steps;
- the complete `@sys/testing` test task passes 20 tests and 178 steps with one intentional ignored
  step;
- `code/sys/testing` `deno task check` and package publish dry-run pass;
- all changed TypeScript files pass targeted `deno fmt --check`;
- MAX semantic review confirms exact and retryable descriptor authority, exception-safe test
  cleanup, terse public ESM/JSDoc guidance, no generated placeholder residue, and no
  routing/assertion/HTTP API growth.

The arc item landed as `043b8eb68 feat(testing): add Fetch global fixture`; its contract and proof
are closed.

## Remaining ordered latches

These are ordering and ownership latches, not permission to preimplement later behavior. Before each
item starts, reopen this plan and the then-current upstream contracts, lock its focused red proof,
and run a fresh Ready Check. If an earlier commit changes a referenced surface, reconcile the
affected later latch before proceeding.

### `refactor(http): use Fetch global fixture in tests`

Replace manual `globalThis.fetch` save/install/restore boilerplate in the HttpFetch authority and
cancellation tests with the landed `WebFixture.Fetch.mock` lifecycle. Keep each HTTP-specific fake
implementation, call capture, abort orchestration, and assertion local to its test. Production
runtime, public HTTP contracts, and observable test behavior remain unchanged.

Focused leak-traced HttpFetch tests and `code/sys/http` `deno task check` must remain green. Do not
broaden this commit into a generic HTTP testing DSL or migrate unrelated package tests.

Landed proof:

- the authority and cancellation files import `WebFixture` through public `@sys/testing/web` and use
  `WebFixture.Fetch.mock` for every local Fetch replacement;
- HTTP-specific fakes, call capture, abort choreography, intrinsic cleanup, and assertions remain
  local;
- focused touched-file proof passes 4 tests and 20 steps with leak tracing;
- the complete leak-traced HttpFetch proof passes 6 tests and 55 steps;
- both changed files pass `deno fmt --check`, and `code/sys/http` `deno task check` passes.

No production file or public HTTP contract changed. The item landed as
`15120c229 refactor(http): use Fetch global fixture in tests`; its contract and proof are closed.

### `refactor(http): canonicalize fetch and pull contracts`

This commit is runtime behavior-neutral. It consolidates canonical public ownership beneath
`t.HttpFetch.*` and `t.HttpPull.*`, removes only aliases proven unused after repository-wide
migration, and keeps method implementation byte-for-byte or semantically unchanged.

#### Contract latch

- Preserve the legacy `readonly string[]` Pull call surface and the existing UI `(url, until)`
  byte-size consumer.
- Move Fetch response ownership to `t.HttpFetch.Response<T>`, composed from
  `t.HttpFetch.ResponseSuccess<T>` and `t.HttpFetch.ResponseFailure`, with
  `t.HttpFetch.ResponseChecksum` evidence and `t.HttpFetch.Error` beneath the same owner. Success
  keeps data and no error; failure keeps no data and one error. Preserve 499 cancellation, response
  headers, sanitized URLs, and all current runtime fields exactly.
- Move the header callback contract to `t.HttpFetch.Mutate.Headers`, with its payload at
  `t.HttpFetch.Mutate.Headers.Args`, and type absent header reads truthfully as `undefined` without
  the legacy unsafe cast. Repository-wide inventory proves `t.Headers.ts` has no direct consumer
  beyond its owner module, so remove that file without a temporary flat alias.
- Keep generic `t.Fetch`, `t.FetchInput`, `t.HttpHeaders`, and `t.HttpStatusCode` in `@sys/types`;
  use `t.FetchInput` rather than duplicating the request-input union, and migrate and remove the
  detached `FetchResponse*`, checksum, and `HttpError` contracts only after every repository
  consumer uses its semantic owner path.
- Do not force legacy `HttpClient.toJsonResponse` into the richer Fetch response contract. Type it
  as a truthful `t.HttpClient.JsonResponse<T>` success/failure union that preserves its existing
  runtime object shape and uses `t.HttpFetch.Error` on failure.
- Compose `t.HttpPull.Record` from `t.HttpPull.RecordSuccess` and `t.HttpPull.RecordFailure`:
  success requires status and byte evidence and has no error; failure requires an error, may carry
  status, and has no byte evidence. Narrow `done` events to success records and `error` events to
  failure records.
- Compose `t.HttpPull.ToDir.Result` from `t.HttpPull.ToDir.ResultSuccess` and
  `t.HttpPull.ToDir.ResultFailure`: successful aggregate results contain only success records, while
  failed results may contain the existing mixed record sequence. Preserve current empty and
  cancellation behavior, record order, event timing, and every emitted/runtime object byte-for-byte
  or semantically unchanged.
- Keep `code/sys.tools` bundle records protocol-neutral beneath `t.PullTool.Bundle.*`; GitHub pulls
  do not synthesize HTTP status evidence. Give those existing multi-protocol aggregate shapes
  truthful success/failure leaves while keeping canonical HTTP results assignable and all runtime
  objects unchanged.
- Do not add redirect, byte, retry, target, progress, source, cancellation, or checksum-pinned
  resource policy in this refactor.

#### Inventory and working-set latch

The repository inventory found no external flat header-mutation import. Detached Fetch response
types are used by HttpFetch/HttpClient/HttpPreload tests and implementation, JSR/npm registry
contracts, and the `@tdb/data` mount client. Pull records/results/events are used by HttpPull
tests/runtime and `code/sys.tools` HTTP pull consumers; the tools bundle layer also has
protocol-neutral GitHub records whose success shape has bytes but no HTTP status. Migrate those
compile-time references through each package's local `t` pool rather than deep imports, and keep the
protocol-neutral bundle contract under its tools owner.

Expected changes are confined to type spines and type-only/compile-only references in `@sys/types`,
`@sys/http`, `@sys/registry`, `code/sys.tools`, and `@tdb/data`. Runtime implementation edits are
limited to type annotations, narrowing, or shape-preserving construction needed by the compiler. No
emitted method behavior, package export map, request flow, filesystem flow, retry logic,
cancellation behavior, or observable result/event shape changes.

#### Proof latch

Start with compile-only references to the canonical owner paths so the missing contracts fail before
implementation; add no new runtime behavior assertion. Then require:

- zero repository references to removed detached aliases or `m.HttpFetch/t.Headers.ts`;
- focused leak-traced HttpFetch and HttpPull suites remain green;
- `code/sys/types`, `code/sys/http`, `code/sys/registry`, `code/sys.tools`, and `deploy/@tdb.data`
  owner checks pass;
- the existing focused `code/sys.tools` pull suite remains green when compile migration touches it;
- formatting and semantic review prove type-plane purity and no emitted runtime behavior drift.

#### Verified landing proof

- The compile-first proof failed with two `TS2694` errors on the absent
  `t.HttpFetch.Response<unknown>` owner path before implementation.
- Repository TypeScript has zero references to the removed detached aliases or header module, and
  `m.HttpFetch/t.Headers.ts` is absent.
- Focused leak-traced HttpFetch proof passes 6 tests and 55 steps; focused leak-traced HttpClient
  proof passes 2 tests and 27 steps; focused leak-traced HttpPull proof passes 3 tests and 56 steps.
- Focused leak-traced `code/sys.tools` Pull proof passes 29 tests and 92 steps.
- Owner checks pass for `code/sys/types`, `code/sys/http`, `code/sys/registry`, `code/sys.tools`,
  and `deploy/@tdb.data`; all 26 changed TypeScript files pass `deno fmt --check`.
- MAX-style review on XHIGH confirms Lib-first public contract ordering, nested
  `t.HttpFetch.Mutate.Headers.Args` ownership, canonical `t.FetchInput` reuse, localized result
  assertions, and removal of unnecessary Pull `any` casts and test `any` residue. The header-read
  cast is gone while its runtime `undefined` remains unchanged; request, response, cancellation,
  retry, filesystem, ordering, event, aggregate, registry, UI, and GitHub runtime objects and
  behavior remain unchanged.

### `feat(http): enforce bounded fetch response policy`

Land one canonical `t.HttpFetch.ResponsePolicy` as immutable construction-time authority and migrate
every production owner in the same feature commit. Every request supplies finite byte, timeout,
redirect, progress, source-origin, and credential-origin authority through its client capability. No
request-selected policy API or legacy runtime path may land.

#### Bounded behavior latch

```ts
export type ResponsePolicy = {
  readonly maxBytes: t.NumberBytes;
  readonly timeout: t.Msecs;
  readonly maxRedirects: number;
  readonly progressInterval: t.Msecs;
  readonly sourceOrigins: readonly t.StringUrl[];
  readonly credentialOrigins: readonly t.StringUrl[];
};

export namespace ResponsePolicy {
  export type SourceEvidence = {
    readonly requestedUrl: t.StringUrl;
    readonly finalUrl: t.StringUrl;
  };

  export type ProgressHandler = (event: ProgressEvent) => void;

  export type ProgressEvent = SourceEvidence & {
    readonly loaded: t.NumberBytes;
    readonly total?: t.NumberBytes;
    readonly complete: boolean;
  };

  export type FailureKind =
    | 'invalid-policy'
    | 'invalid-request'
    | 'invalid-url'
    | 'source-denied'
    | 'redirect-invalid'
    | 'redirect-downgrade'
    | 'redirect-loop'
    | 'redirect-limit'
    | 'response-timeout'
    | 'response-too-large'
    | 'progress-failure';
}
```

`HttpFetch.Error` has optional `policyFailure?: ResponsePolicy.FailureKind`; it is present only for
a policy failure. This public code is diagnostic, not authority. The outer module-owned error is
registered in a private `WeakSet` checked by a private guard; matching or cloning the name, message,
status, public code, properties, or symbols cannot forge policy identity.

Each `Instance.head/json/text/blob` method returns the single canonical `t.HttpFetch.Response<T>`.
Success requires `requestedUrl` and `finalUrl` statically; failure retains the canonical
`t.HttpFetch.ResponseFailure` shape and its sanitized diagnostic `url`.

#### Policy validation latch

- `maxBytes` and `maxRedirects` are finite safe integers greater than or equal to zero; `timeout`
  and `progressInterval` are finite safe integers greater than zero. Zero bytes and zero redirects
  are valid fail-closed limits; no policy field has a default.
- `sourceOrigins` is non-empty. Every source/credential entry must be an exact serialized HTTP(S)
  origin (`scheme://host[:port]`) with no userinfo, path, query, fragment, wildcard, predicate, or
  pattern. Entries are canonical and unique; every credential origin must also be a source origin.
- `onProgress` is accepted only by the bounded body-helper options; `head` has no checksum/progress
  options. Runtime validation mirrors the type boundary; invalid policy/request input returns
  `invalid-policy` or `invalid-request` before network work and never throws raw validation details.
- `head` requires HEAD; `json`, `text`, and `blob` require GET. Every helper rejects request bodies.
  This fixes each public verb and prevents redirect-time method/body replay semantics from entering
  this response-policy feature.

#### Source, redirect, and credential latch

The requested fetch URL must be absolute HTTP(S), contain no userinfo, and have an admitted source
origin before the first request. Its normalized fetch URL removes the fragment but preserves the
query; that value becomes successful `requestedUrl` evidence. Policy-bound requests force
`redirect: 'manual'`, `credentials: 'omit'`, and `referrerPolicy: 'no-referrer'` on every hop;
ambient browser credentials and caller referrer authority are never used.

Default/client headers and `RequestInit.headers` are merged exactly once with existing
case-insensitive caller precedence. Every caller/default header is conservatively treated as
credential-bearing. A hop receives that authoritative merged set only when its exact origin is in
`credentialOrigins`; a source-only hop receives no caller/default headers. Each redirect
reconstructs headers from the original authoritative set rather than mutating the previous hop's
request. Source admission never implies credential admission, while explicitly credential-admitting
a source permits the complete merged set for that origin.

Only 301, 302, 303, 307, and 308 are followed. GET remains GET and HEAD remains HEAD. Before a
follow, Fetch resolves one non-empty `Location` against the current URL, removes its fragment,
rejects userinfo/non-HTTP(S)/malformed targets, admits the next source origin, rejects HTTPS-to-HTTP
downgrade even when both origins are listed, and checks the redirect budget and loop set. The loop
key is the normalized full fetch URL including query. `maxRedirects` counts followed hops; zero
rejects the first redirect. Every redirect/non-success/rejected response body is
cancellation-requested exactly once before the operation follows or settles. Other 3xx responses
remain ordinary HTTP failures.

A successful terminal response reports the normalized accepted terminal URL as `finalUrl`. Failures
do not gain requested/final evidence fields, and their `url` and generated error text retain
existing sanitization. Every policy failure uses fresh empty response/error headers; ordinary
terminal HTTP failures retain their admitted response headers.

#### Byte, decode, checksum, and progress latch

Policy-bound `blob`, `text`, and `json` read the successful terminal body exactly once through its
stream. A strict decimal safe-integer `Content-Length` greater than `maxBytes` fails before reading;
missing or invalid length is treated as unknown, never as trusted size evidence. Every chunk is
charged before retention, and a chunk that would exceed the remaining budget is not retained.
Reader/body cancellation is requested on every early exit. Policy-bound `head` retains no body,
emits no progress, and cancellation-requests any unexpected body.

The bounded retained bytes are the only body source:

- Blob data and Blob checksum verification use those exact bytes;
- text decoding and the existing transformed-string checksum semantics use those bytes;
- JSON decoding and the existing transformed-value checksum semantics use those bytes.

This feature does not silently change text/JSON checksum meaning; all body helpers use the one
bounded decode path.

Progress is body-transfer evidence only. `loaded` is monotonic and emitted after bytes are charged;
`total` appears only for one valid admitted `Content-Length`. The first retained bytes may emit
immediately, non-terminal emissions occur no more often than `progressInterval`, and one
`complete: true` event is emitted after a successful end-of-stream, including an empty body. No
event occurs after settlement. Handlers are synchronous by contract; a throw or thenable return is a
`progress-failure`, any returned thenable is rejection-drained rather than awaited, and the body is
cancelled. This prevents callback overlap or a callback queue without a bound. As with all
JavaScript time bounds, synchronously blocking caller code is not preemptible and violates the
callback contract.

#### Time, failure, and cleanup latch

One monotonic timeout starts after synchronous policy validation and before the first network
request. It aborts asynchronous redirect/body waits at the deadline and is checked before and after
bounded synchronous progress, decode, and checksum work. JavaScript cannot preempt synchronously
blocking host code; the byte bound limits owner work, and an overrun is classified at the next
boundary rather than claimed as hard preemption. The timer and all composed-signal listeners are
cleared on every settlement path. A policy timeout uses private abort authority and classifies as
`response-timeout`, never as caller cancellation. Deadline races do not wait beyond exhaustion for
fetch/read/cancellation promises that ignore abort; detached settlements are rejection-drained, late
response bodies are cancellation-requested, and no late settlement can mutate the terminal latch.
Cancellation is requested exactly once for any held reader/body.

Stable policy failure classification is:

```text
400  invalid-policy | invalid-request | invalid-url | redirect-invalid
403  source-denied | redirect-downgrade
408  response-timeout
413  response-too-large
500  progress-failure
508  redirect-loop | redirect-limit
```

The first terminal cause is latched privately. Pre-aborted and first-observed caller/lifecycle
cancellation remains canonical 499; an internal timeout abort cannot forge it. Once a policy failure
is latched, later cancellation cannot rewrite it, and a latched cancellation can never become policy
failure. After successful bounded transfer, checksum mismatch remains 412; ordinary final HTTP
status and existing decode/transport classification remain unchanged. Raw abort reasons, policy
internals, credential headers, and unsanitized source values never enter the public error chain.

#### Working-set and proof latch

The runtime kernel stays inside `m.HttpFetch`; required consumer migrations span `@sys/http`,
registry, model-slug, UI, driver-automerge, tools, `@tdb.data`, and `@tdb.edu.slug` through their
local type/common lanes. No generic production policy builder, hidden URL-derived admission, public
policy class, mutable builder, origin predicate, retry behavior, aggregate budget, upload/body
policy, or compatibility alias enters this commit. Shared policy builders exist only in test
fixtures.

Start compile-first from the final construction-bound policy, canonical response evidence, progress,
and failure contracts, capturing every legacy construction and request call site before migration.
Runtime red/green proof belongs in `m.HttpFetch/-test/-policy.test.ts`, uses the Fetch fixture or
neutral loopback servers without parallel global-mock overlap, and proves:

- invalid/non-finite policy and request forms fail before network;
- declared and undeclared oversize bodies retain no excess bytes and cancel the body;
- stalled headers/body paths time out with exact cleanup and no late progress, while bounded
  synchronous overruns are classified at the next deadline boundary;
- Blob checksums use exact retained bytes while text/JSON retain their transformed checksum
  behavior;
- progress is monotonic, cadence-bounded, terminal exactly once on transfer success, and callback
  failure is bounded;
- first-hop and redirect source admission, malformed locations, downgrade, loop, and hop limits fail
  before an unadmitted request;
- source-only hops strip all caller/default headers, explicit credential origins receive the merged
  authoritative set, and ambient credentials/referrers remain disabled;
- success reports exact normalized requested/final URLs while failure alone retains sanitized
  diagnostic `url`;
- message/status/public-code lookalikes and full property/symbol clones fail the private WeakSet
  guard;
- caller/lifecycle cancellation remains 499 across redirect, body-read, checksum, and timeout races;
- redirect, failure, oversize, timeout, cancellation, and success paths release readers, request
  body cancellation, timers, and signal listeners exactly once.

Require focused leak-traced HttpFetch, HttpClient, HttpPull, and Preload green; every affected owner
check and publish dry-run; formatting, lint, residue searches, and a semantic diff proving that
every runtime request path consumes the construction snapshot without changing text/JSON checksum
meaning.

#### Verified worktree proof

- Compile-first proof exposed the final construction and request migrations before implementation.
- Complete focused leak-traced HttpFetch proof passes 7 tests and 68 steps; HttpClient compatibility
  passes 2 tests and 27 steps; HttpPull compatibility passes 3 tests and 56 steps.
- Full `@sys/http` passes 44 tests and 341 steps. Focused `code/sys.tools` Pull proof passes 29
  tests and 92 steps.
- Owner checks, explicit package tests, and publish dry-runs pass for driver-automerge, model-slug,
  tools, UI components, UI React, testing, types, HTTP, registry, workspace, `deploy/@tdb.data`,
  `deploy/@tdb.edu.slug`, and `deploy/@tdb.slc`.
- Implementation review replaced inspectable symbol branding with private WeakSet identity, split
  the runtime into focused input/operation/body/failure kernels, snapshotted constructor options,
  latched pre-aborted lifecycle authority before network work, added monotonic deadline checks
  around bounded synchronous work, and safely chunked host timer ranges without weakening the exact
  finite timeout.
- Semantic review confirms construction-time policy snapshots, exact success/failure URL evidence,
  direct byte-size probing, lifecycle disposal, bounded consumer authority, and unchanged text/JSON
  checksum meaning.
- Final exact-feature lint and source/README/plan formatting checks pass, as do module-shape,
  transitional/debug-residue, and `git diff --check` gates. The final HTTP suite and publish dry-run
  were repeated after the last runtime change.
- The single final XHIGH/STIER adversarial review found no release blocker: policy authority remains
  construction-bound, redirect headers are per-attempt evidence, cancellation retains private
  first-cause 499 authority, hostile inputs fail closed before network, and terminal cleanup remains
  deterministic.

#### Final bounded-capability contract latch

Bind one immutable response-policy snapshot to each Fetch capability at construction rather than
accepting caller-selected authority on every request:

```ts
export type Lib = {
  make(options: CreateOptions): Instance;
  readonly byteSize: ByteSize.Method;
};

export type CreateOptions = {
  readonly policy: ResponsePolicy;
  readonly headers?: Mutate.Headers;
  readonly accessToken?: t.StringJwt | (() => t.StringJwt);
  readonly until?: t.UntilInput;
  readonly contentTypePolicy?: 'corsSafe' | 'always';
};

export type Options = {
  readonly checksum?: t.StringHash;
  readonly onProgress?: ResponsePolicy.ProgressHandler;
};
```

No request-selected policy union, lifecycle shorthand, method overload, or alternate runtime branch
remains. Validate and snapshot the complete policy once while creating the client; malformed
JavaScript input remains a stable `invalid-policy` response before network work rather than leaking
a construction-time host error. A retained caller object cannot mutate the capability's admitted
origins or bounds after construction. The client owner selects source and credential authority; a
holder of the instance cannot expand it per request.

Add a canonical `t.HttpFetch.Init` that excludes `method`, `body`, `redirect`, `credentials`,
`referrer`, and `referrerPolicy`; helpers own those fields and still reject forged runtime values
before network. Keep standard Fetch `input, init` ordering. `head` accepts no checksum/progress
options; `json`, `text`, and `blob` accept optional checksum/progress `Options`. Every helper
returns the single canonical `t.HttpFetch.Response<T>`.

Keep one canonical response spine with no nested response aliases. `HttpFetch.ResponseSuccess<T>`
directly requires `ResponsePolicy.SourceEvidence`. Success exposes exact normalized `requestedUrl`
and `finalUrl`; failure alone keeps its existing sanitized diagnostic `url`. Keep `ResponseFailure`,
`ResponseChecksum`, and `Error.policyFailure` canonical, with readonly result and option fields.

`Fetch.byteSize` remains a separate credential-omitting, manual-redirect probe and performs its HEAD
request directly rather than manufacturing source admission or invoking a client without policy.
Higher-level dynamic consumers must carry truthful authority. `HttpPull.Options` and
`HttpPreload.Options` use a discriminated transport choice: either an injected already-bounded
client or an explicit response policy for an internally owned client, never neither or both. No
generic production policy factory or hidden default is introduced. Every other direct owner supplies
explicit byte, timeout, redirect, progress, source-origin, and credential-origin authority; relative
browser URLs are resolved by that owner before constructing the capability.

#### Final module latch

The implementation has earned one standard nested runtime boundary:

```text
m.HttpFetch/
├── mod.ts
├── t.ts
├── common.ts
├── m.Fetch/
│   ├── mod.ts
│   ├── common.ts
│   └── u/
│       ├── u.make.ts
│       ├── u.headers.ts
│       ├── u.signal.ts
│       ├── u.invoke.ts
│       ├── u.input.ts
│       ├── u.operation.ts
│       ├── u.body.ts
│       ├── u.failure.ts
│       ├── u.checksum.ts
│       └── u.byteSize.ts
└── -test/
    └── u.fixture.ts
```

`m.Fetch/mod.ts` composes the public `Fetch` Lib; outer `mod.ts` only exports it. Public types
remain in the canonical outer `t.HttpFetch` owner, so no redundant nested `t.ts` is added. The
singular `m.Fetch/u/` lane contains no `common.ts`; each kernel imports through the parent
`m.Fetch/common.ts`. `u/u.make.ts` owns lifecycle and instance assembly; header authority, signal
composition, orchestration, validated input, deadline/body leases, body accounting, failures,
checksums, and byte-size probing remain focused kernels. Internal names omit redundant `policy`
qualification where the enclosing Fetch boundary already supplies that meaning. Outer `common.ts` is
a pure parent re-export; status/error business constants live with their owning failure/checksum
kernels.

Delete superseded `m.Fetch.ts`, `m.Fetch.make.ts`, root `u.policy*.ts`, root `u.byteSize.ts`, root
`u.checksum.ts`, and the unreferenced `u.is.ts`/`u.ts`. Remove the checksum test's console-print
helper and post-test noise. The shared test policy builder lives only at singular
`-test/u.fixture.ts`; it accepts explicit source origins and partial bound overrides and never
becomes a production default.

#### Final proof latch

Start compile-first from the final contract and capture failures at every legacy make/call site.
Migrate live owners in `@sys/http`, registry, model-slug, UI, driver-automerge, tools, and
`@tdb.data` through their local `t`/common lanes. Prove construction-time policy snapshot
immutability, forbidden init authority, single canonical response narrowing, injected-versus-owned
Pull/Preload transport, exact lifecycle disposal, direct byte-size probing, and construction-bound
authority on every runtime request path. Then rerun focused leak-traced Fetch, HttpClient, HttpPull,
and Preload suites; every affected owner check and publish dry-run; formatting, lint, residue
searches, and a final XHIGH/STIER adversarial review. No second broad MAX pass is required unless
implementation evidence invalidates this latch.

### `fix(http): confine pull writes to unique targets`

Add a checksum-pinned Pull resource form without changing legacy URL-array behavior:

```text
Resource {
  source         absolute HTTP(S) URL
  target         Rooted-admitted root-relative path
  checksum       canonical expected SHA-256
  expectedBytes  optional authenticated exact size
}
```

The checksum-pinned overload receives an `Fs.Capability.Rooted` instance as its destination; it does
not accept a raw directory plus ambient filesystem authority. Legacy `readonly string[]` calls
continue to accept a directory and existing URL mapping options.

For secure resources, parse every source and submit the complete target batch to `Rooted.admit`
before any request, directory effect, or file publication. Reject invalid targets, lexical aliases,
exact collisions, file/directory conflicts, foreign handles, or unsupported filesystem semantics as
stable records. Use only returned owner-bound handles and `publishFile`; never concatenate a target
path, call raw filesystem writes, overwrite an occupied target, or reverse a URL into a pinned
target.

This commit establishes preflight and no-clobber confinement only. It does not yet add bounded
workers, retries, aggregate policy, or Server-level staging cleanup. Focused proof covers traversal,
absolute and backslash variants, duplicate/canonical collisions, source/target decoupling, foreign
capability handles, preflight-before-network, occupied targets, and unchanged legacy mapping.

### `fix(http): centralize pull execution ownership`

Replace separate `toDir` and `stream` execution paths with one internal task kernel; `toDir` is a
projection of the same terminal result used by `stream`.

The kernel owns:

- stable input indexes and terminal record order in input order regardless of worker completion
  order;
- one operation lifecycle, private cancellation controller, complete queued/in-flight worker
  quiescence, and no work after terminal state;
- caller ownership of injected clients and exact-once disposal of internally created clients;
- one terminal record per input, including work cancelled while queued, with cancellation distinct
  from ordinary HTTP/filesystem failure;
- bounded event delivery that coalesces or drops superseded progress rather than retaining an
  unconsumed queue without a bound;
- isolated observable views whose disposal ends only that view, not sibling subscribers or the pull;
- equivalent filesystem failure classification from `toDir` and `stream`;
- non-transactional truth: earlier published records remain successful after a later failure.

No policy-bound pinned pull may delegate enforcement to an injected client. Focused proof covers
out-of-order completion, deterministic records, early iterator return, no event consumer, multiple
observable views, view disposal, queued and in-flight cancellation, client ownership, complete
quiescence, and no late events/writes.

### `refactor(dist)!: make Dist trust authority explicit`

Close the public Dist-surface ambiguity before adding a production consumer:

- rename local/self-consistency `Pkg.Dist.verify` to `Pkg.Dist.checkSelfReported`, migrate its tests
  and sole production caller, and retain no alias;
- keep `Pkg.Dist.verifyPinned` stable as the only public Dist `verify*` operation;
- remove unbounded/unpinned `Pkg.Dist.fetch`, its public option/result types, tests, samples,
  scripts, and documentation without adding a renamed unpinned replacement;
- extend `Pkg.Dist.compute` output with `manifest.integrity`, the canonical SHA-256 of the exact
  serialized `dist.json` bytes it produced and, when `save: true`, wrote;
- surface that value from publisher-facing build/deploy output already owning the saved manifest, so
  consumers have an honest pin source before the Tools migration;
- state that computed integrity becomes artifact authority only when the publisher distributes it
  independently from the later artifact fetch.

`DenoEntry` may continue its generic local-build self-consistency check under the honest name; it
must not describe that result as pinned or externally verified. Remote FilesStatic samples either
use explicit bounded lower-level transport plus an external fixture pin or avoid teaching remote
trust entirely. No compatibility alias, deprecation shim, `fetchUntrusted`, or
checksum-from-download helper survives.

Focused `Pkg.Dist` proof covers exact written-byte integrity, deterministic no-save serialization,
rename residue, removal of the fetch surface, and unchanged `verifyPinned` behavior. A
repository-wide public-export/call-site scan and affected owner checks pass in the same commit.

### `feat(tools)!: expose bounded GitHub pull authority`

Make generic GitHub release/repository Pull a direct, honest programmatic API before Dist config
changes:

```text
@sys/tools/pull
GithubPull.release({ repo, tag?, assets?, into, mode, limits, token?, until? })
GithubPull.repo({ repo, ref?, path?, into, mode, limits, token?, until? })
  → Promise<PullOutcome>
```

Both methods accept an explicit target directory, required `mode: 'create' | 'replace'`, required
finite limits, optional token, lifecycle, and source-specific selectors. Limits bound metadata
response bytes, entry count, per-file bytes, aggregate bytes, and total operation time; no unlimited
default exists. GitHub API/source origins are owner-fixed, redirect destinations are admitted, and a
token is sent only to the admitted GitHub API credential origin. Metadata and body transport must be
bounded while reading, not checked only after Octokit/global Fetch has retained an arbitrary body.
No public downloader/client injection is accepted.

After source resolution, validate and snapshot the complete entry batch, create Rooted confinement
for the exact target internally, admit every target before download, and publish without clobbering.
`create` refuses occupied output. `replace` explicitly clears only the caller-selected target before
Rooted creation; a later failure may leave already published generic files and reports that truth.
The result remains an ordinary mutable directory, not an immutable generation or provenance claim.

Use distinct flat `DownloadedFile { source, target, bytes }` records whose target is relative to the
selected root, plus discriminated resolved release/repository evidence. These types carry no
`DistPkg`, integrity, verification evidence, HTTP status, or shape assignable to
`HttpPull.RecordSuccess`/`MaterializeResult`. Delete `computeReleaseDist`; GitHub Pull never creates
`dist.json`. Config-driven GitHub bundles call the same public operations and use the same result
types. Rename generic config mutation honestly in this breaking commit rather than retaining
`clear`/legacy result aliases.

Focused public-export and fixture-backed proof covers release/repo success, resolved tag/commit
truth, token confinement, hostile targets and symlinked parents, duplicate/collision preflight,
create/replace behavior, every finite limit, timeout/cancellation, partial-success truth, sanitized
failures, and absence of generated `dist.json`. Full `@sys/tools` Pull tests/check remain green.

### `feat(http)!: bind pinned pull to one bounded operation`

Move checksum-pinned resources off the overloaded legacy names before Server composition:

```text
HttpPull.start({ resources, rooted, policy, credentials?, until? })
  → { events, cancel, done }
```

`start` accepts only explicit checksum-bound resources and Rooted ownership. Checksum equality
proves bytes match the caller's expectation; authority comes from where the caller obtained that
checksum, not from comparison. Remove the pinned overloads from `toDir` and `stream`; those names
remain single-signature URL-array legacy only until the final subtraction commit. Server can
therefore import only a symbol that cannot express legacy materialization.

One explicit finite `t.HttpPull.ResourcePolicy` composes canonical `t.HttpFetch.ResponsePolicy` as
`response` and adds `maxResources`, `concurrency`, `maxAttempts`, `retryDelay`, `maxRetryElapsed`,
`maxTotalBytes`, and `totalTimeout`. Fetch `response.maxBytes` is the per-attempt/per-file body
bound; do not duplicate it under a drifting second field. Fetch timeout, redirects, progress
cadence, source origins, and credential origins remain owned by the composed response policy.
Validate and snapshot every policy/resource/credential value before Rooted admission or transport.

Pull constructs and owns the enforcing Fetch capability. Optional credential construction data
composes canonical Fetch types but cannot replace policy, source/credential-origin admission,
redirect handling, byte accounting, checksum/size verification, cancellation, or progress. Retries
are restricted to selected transient status/transport classes, consume total/aggregate budgets, use
`Schedule.micro` for zero-delay yields, and never retry cancellation, admission, checksum, size,
policy, or publication failures.

Each attempt streams into bounded memory, charges bytes as read including failed attempts, verifies
exact checksum and optional authenticated size before `Rooted.publishFile`, and discards every
unmatched body. Aggregate or total exhaustion records one first terminal cause, aborts queued and
in-flight work, prevents later publication, and resolves only after complete worker quiescence.
Results/events preserve deterministic input identity and actual requested/final-source,
checksum/size, byte, and committed-filesystem evidence.

The operation exposes disposable hot `events()` views, explicit `cancel()`, and canonical `done`.
Remove the async iterator and its implicit cancel-on-return behavior; disposing one event view never
cancels the operation or siblings. Use "checksum-pinned" in public documentation and stable
failures; reserve "verified" for `verifyPinned` evidence and remove `SECURE_*` naming.

Focused proof covers the one-method type surface, every finite bound, full preflight, retry
eligibility/accounting, credential/redirect policy, exact checksum/size, aggregate races,
first-cause uniqueness, cancellation on retry-disabled/final-attempt paths, view disposal,
no-late-write, prior-success truth, owned-client disposal, and complete quiescence. `@sys/tools`
legacy Pull tests remain green until their immediate migration/removal commits.

## Final Server latch

`feat(server): compose immutable verified Dist materialization` starts only after all preceding
Dist, GitHub-separation, Fetch, and pinned-Pull contracts have landed. After explicit implementation
authorization, begin with one types-first `m.server.dist` scaffold; public types, implementation,
tests, exports, and package wiring land atomically in this feature commit rather than as a
speculative empty module.

Expected module/export surface:

```text
code/sys/server/src/m.server.dist/
@sys/server/dist
Dist.materialize(args) → Promise<MaterializeResult>
```

The one-shot input is `manifestUrl`, canonical exact-byte `integrity`, `storeDir`, one reusable
`policy`, optional separately confined manifest/resource credential construction data, and `until`.
`policy` composes—not copies—the landed Fetch response policy, Pull resource policy, and
`t.Pkg.Dist.VerifyPinned.Limits`. There is no `Dist.create` factory, implicit policy, client
injection, or process-global credential source.

The result is a discriminated `existing | promoted | failed` union. Every success carries the
canonical admitted generation `dir`, exact `integrity`, immutable `verifyPinned` evidence produced
against that exact returned directory by this invocation, configured source evidence, and cleanup
truth. Only `promoted` may include an observed final manifest URL and Pull totals from this
invocation. `failed` exposes stable stage/reason classification and
`cleanup: 'not-needed' | 'complete' | 'pending'` without local paths, raw host causes, credentials,
abort reasons, integrity/evidence fields, or unverified manifest claims. When a failed settlement
has nevertheless established visible target truth, it additionally reports
`publication: 'committed' | 'occupied'`; absence means no visible target outcome was established.

A success reports `cleanup: 'not-needed' | 'complete' | 'pending'`; this preserves `Rooted` cleanup
truth when a verified final generation is known but safe private-stage cleanup could not complete. A
`published` Rooted outcome is not itself verified-generation evidence: final-target verification
must still succeed before `promoted`. If it does not, `failed` preserves `publication: 'committed'`
and never claims rollback. An invalid concurrent winner similarly preserves
`publication: 'occupied'` without becoming `existing`.

The public boundary is fixed at runtime owner `Dist`, type owner `ServerDist`, argument fields
`manifestUrl`, `integrity`, `storeDir`, `policy`, optional `credentials`, and optional `until`, with
policy fields `manifest`, `resources`, and `verification`. The scaffold composes the then-landed
canonical upstream types behind those names. No caller may supply parsed manifest data, target
handles, verification evidence, a verifier, hash/path helpers, Fetch/Pull transport, or an
already-"verified" token.

## Subject

A product-neutral materializer under the narrow `@sys/server/dist` surface:

```text
configured manifest URL
  → authenticated bounded HTTP resources
  → verified staging directory
  → immutable manifest-addressed generation
```

`@sys/server/dist` is the composition boundary because this operation crosses existing HTTP, Pkg,
and filesystem lifecycle owners. It does not become a new hash, path, HTTP, or storage kernel.

## Dependency direction

```text
@sys/http + @sys/fs (confined writes + Pkg)
  → @sys/server/dist materialization
```

This Server commit ends at the product-neutral lower surface. The subsequent required `@sys/tools`
migration consumes that surface without changing its dependency direction or importing consumer
policy into the generic implementation. All other consumer, launcher, activation, and operator
adapter work remains separate.

## Isolation boundary

`Dist.materialize` is host-neutral and activation-neutral. It does not choose a mutable current
version, enforce replay/version policy, retain or select last-known-good, launch a process, or
require a serving layer. Its immutable result preserves prior generations so higher layers can own
those policies without changing the materialization core.

The result evidence supplies userinfo/query/fragment-stripped source origin/path, exact integrity,
target, and bounded resource counts. A `promoted` result may report the final source observed by its
fetch; an untouched `existing` result reports only configured source evidence because this slice
does not persist a provenance receipt. This slice does not claim to implement signature, key
rotation, replay, activation, audit persistence, serving, or launch policy.

No consumer type, path, policy, or import enters the generic implementation or tests.

## Filesystem threat boundary

The caller grants authority to create/use `storeDir`; `Fs.Capability.Rooted.create` requires its
parent to exist. The landed Rooted owner provides canonical root binding, batch target admission,
owner-bound handles, no-clobber file publication, process-owned staging, safe cleanup by filesystem
identity, and cooperative one-winner promotion. Server and HTTP code consume those methods and
stable failures without restating their path algorithm or issuing direct filesystem mutation calls.

Rooted coordinates promotion races only among writers using the same locking protocol. It does not
claim OS-sandbox isolation, crash-durable directory entries, or resistance to a malicious concurrent
process with the same filesystem authority. Portable Deno lacks pinned directory-handle
`openat`/no-follow semantics; repeated path checks in Pull or Server cannot strengthen that
boundary. The materializer narrows exposure by using one fresh owner-created stage and treating
generations as immutable, but deployments requiring hostile same-principal resistance need a
stronger native backend.

## DRY composition rule

The Dist materializer owns orchestration and result truth only. Its implementation contains no SHA
implementation, raw `fetch`, private redirect parser, second Dist verifier, private path grammar,
direct filesystem syscall, or bespoke publication primitive. Canonical `Json.parse` may decode the
once-authenticated manifest bytes for bounded staging instructions; that parse is not verification
and cannot produce authority.

It composes these owners:

1. The landed Blob checksum behavior authenticates the exact manifest response bytes.
2. Policy-bound `HttpFetch` enforces manifest source/credential/redirect/byte/time authority and
   returns requested/final URL evidence.
3. `Pkg.Is.dist` and strict `Pkg.Dist.Part.parse` admit the authenticated manifest's canonical
   structural values. Every asset part must carry an exact size. The exact snapshotted manifest keys
   become Rooted/Pull targets; `dist.json` is reserved and cannot also be an asset target.
4. Checksum-pinned `HttpPull.start` enforces expected per-resource checksum/size, source/credential,
   count/byte/time, retry, cancellation, concurrency, and progress policy before confined no-clobber
   publication.
5. `Pkg.Dist.verifyPinned({ dir, integrity, limits, until })` alone authenticates the complete
   staged, pre-existing, concurrent-winner, or newly promoted generation and produces immutable
   owner-derived evidence.
6. `Fs.Capability.Rooted` alone owns target admission, file publication, staging, promotion,
   cooperative-winner classification, and cleanup truth. Canonical `Fs.lstat` may make the one
   read-only initial-presence observation needed to distinguish an absent generation from an
   existing generation whose manifest is missing; it grants no mutation or admission authority.

Before asset transport, reject every directly provable policy incompatibility: authenticated
manifest bytes must fit the verification manifest limit; resource count must fit Pull authority;
every parsed part must have an exact size fitting both Fetch and verification per-file limits; and
safe-integer declared totals must fit both Pull and verification aggregate limits. The canonical
owners still perform their complete validation and accounting; Server does not duplicate path,
transport, or verification algorithms.

Authenticated manifest claims may direct only bounded work inside the private stage. They are not
verification evidence and cannot authorize success or promotion. If an owner is insufficient, refine
that owner first; do not hide a substitute under `@sys/server/dist` or a product CLI.

## Public input boundary

The lower API accepts typed runtime input, not YAML or provider configuration:

```text
manifestUrl   absolute HTTP(S) URL supplied by the caller
integrity     canonical SHA-256 of exact dist.json bytes
storeDir      immutable-generation parent whose parent already exists
policy        { manifest: HttpFetch.ResponsePolicy,
                resources: HttpPull.ResourcePolicy,
                verification: Pkg.Dist.VerifyPinned.Limits }
credentials   optional separately confined canonical manifest/resource credential construction
until         optional cancellation lifecycle
```

The final type composes canonical upstream policy/limit/credential types; it does not copy their
fields into a Server-owned policy grammar. The materializer binds Rooted to `storeDir`, admits
`integrity` as one relative directory target, and obtains the canonical generation path from that
admission rather than asking callers to reconstruct it. Assets resolve by segment-encoding admitted
manifest-relative targets against the final authenticated manifest URL.

Loopback HTTP may be admitted explicitly for local operation/tests; production policy may require
HTTPS. Integrity—not transport location, profile data, target name, manifest self-report, or
`dist.hash.digest`—is artifact authority. There is no unpinned executable-materialization mode.
Transitional mutable legacy Pull semantics never enter this boundary and are deleted before arc
closure.

## Materialization transaction

Synchronously snapshot the complete top-level input, nested policy values, and credential callback
references before the first await. Validate the Server-owned shape immediately and pass only those
snapshots to canonical owners for their policy validation before transport. Do not invoke
credentials unless the network branch is reached, so an existing generation remains a zero-network
result.

```text
snapshot typed input and create Rooted(storeDir)
  → batch-admit the integrity-named directory target and obtain its canonical dir
  → observe initial target presence through canonical Fs.lstat
  → call verifyPinned on the admitted generation dir
      → verified: return `existing` with final-dir evidence and configured source only
      → any non-verified result + initially present: return `failed` with
        `publication: occupied` and no network
      → missing + initially absent: continue
      → any other failure + initially absent: fail closed without network
  → create one owned bounded HttpFetch capability
  → retrieve dist.json exactly once as bounded Blob bytes under checksum/source policy
  → dispose the Fetch capability on every settlement path
  → enforce the verification manifest-byte limit before decoding
  → decode only those authenticated bytes; structurally admit exact-sized Dist parts and reserve
    dist.json
  → enforce directly derivable resource/verification cross-limits before asset transport
  → Rooted.createStage()
  → stage.files publishes those same bytes to an admitted dist.json file target without clobber
  → HttpPull.start preflights all checksum-pinned asset targets, then authenticates and publishes
  → await Pull.done so every worker is quiescent before continuing
  → verifyPinned({ dir: stage.path, integrity, limits: policy.verification, until })
  → only `kind: verified` stage evidence permits Rooted.promoteStage(stage, target)
      → published: settle private-stage cleanup, then independently verify the final generation dir
          → verified: return `promoted` with final-dir evidence and observed source/Pull totals
          → any failure: return `failed` with `publication: committed`
      → occupied: settle private-stage cleanup, then independently verify the winner generation dir
          → verified: return `existing` with final-dir evidence and configured source only
          → any failure: return `failed` with `publication: occupied`
```

The initial presence observation closes `verifyPinned`'s intentionally broad `missing` class, which
covers both an absent root and an existing root without `dist.json`. An initially present target can
therefore never trigger network work merely because its manifest is absent. Races after that
observation remain fail-closed through fresh verification and Rooted no-clobber promotion.

Every non-verified result blocks promotion or successful settlement. Server never fabricates,
copies, or reconstructs verification evidence from manifest claims or pre-promotion stage evidence.
Every success carries evidence freshly produced against its exact returned `dir`. A pre-existing or
concurrent-winner `existing` result reports only configured source evidence; it never attributes
this invocation's redirect observation to bytes it did not publish. Only `promoted` reports the
final manifest source observed while fetching its staged bytes.

Rooted cleanup truth remains visible. Before publication, failures make one safe `discardStage`
attempt and report whether cleanup is complete or pending without exposing the private path. After
`promoteStage` reports `published` or `occupied`, make at most one additional safe cleanup attempt
when needed. Cleanup and final-target verification are mandatory settlement work and do not reuse an
already-aborted caller signal: cancellation before publication prevents promotion, while an outcome
already made visible must be classified truthfully and allowed to reach quiescence. Neither cleanup
nor final verification mutates or removes the generation target.

Returned evidence is operational snapshot output, not a reusable authority input. The materializer
does not persist a provenance receipt; downstream hosting independently invokes `verifyPinned`
again.

## Failure rules

- Never clear, merge, overwrite, or mutate an integrity-addressed target.
- Existing valid target is idempotent only after fresh owner verification. Any verification failure
  for an initially present target—including `missing` when `dist.json` is absent—blocks network work
  and target replacement.
- Existing invalid target, symlink, malformed target, target/base escape, unsupported filesystem, or
  unverified concurrent winner fails closed.
- Fetch the manifest once; parse and publish those exact authenticated bytes only.
- HTTP owns redirect-hop admission and separate source/credential forwarding authority before
  follow.
- Bound manifest bytes, resource count, declared/actual bytes, per-file and aggregate bytes
  (including failed attempts), concurrency, per-attempt/total/retry time, progress cadence, and
  cancellation.
- A generation contains exactly `dist.json` plus authenticated declared assets and structural
  directories. Signature sidecars, ignored files, temp artifacts, special entries, and empty extra
  directories are rejected by `verifyPinned`.
- Before promotion, failure requests safe stage discard and reports cleanup truth. It never deletes
  or changes a promoted/occupied generation, and it never claims rollback after `committed: true`.
- `published` is committed filesystem truth, not verified-generation success. A final-target
  verification failure returns `failed` with `publication: committed`; an invalid winner returns
  `failed` with `publication: occupied`.
- Cancellation aborts HTTP work, awaits worker quiescence, prevents later writes/promotion, and
  remains distinguishable from policy, verification, cleanup, and host IO failure. Once publication
  or occupation is known, bounded final verification and safe cleanup finish without reusing the
  aborted signal so terminal truth cannot be rewritten.
- R2, deploy providers, production credentials, and external network are not prerequisites.

## Generic proof

Use only a neutral ephemeral loopback HTTP fixture:

- configured local manifest URL plus exact integrity promotes one immutable generation carrying its
  canonical admitted directory and exact owner-produced final-directory `verifyPinned` evidence;
- the same authenticated bytes served from different loopback ports resolve to the same generation;
- a valid existing target returns without network and with freshly produced verification evidence;
- an existing target missing `dist.json` fails without credential evaluation or network work;
- wrong integrity, credential/source redirect escape, stalled/oversized response, excess resources,
  manifest race, path escape/collision, asset tamper, extra entry, partial transfer, cancellation,
  no event observer, unsupported filesystem, and occupied-invalid target fail closed;
- concurrent promotion returns one `promoted` and one independently verified `existing` result;
- every successful result's evidence was produced against that exact returned `dir`, and `existing`
  never claims an unobserved final source;
- input/policy mutation after invocation cannot change snapshotted authority, and no caller-forged
  evidence can authorize success;
- pre-promotion failure leaves prior generations unchanged and reports complete/pending stage
  cleanup, including cancellation cleanup attempted without the aborted signal;
- post-publication cleanup failure preserves verified published/occupied truth rather than claiming
  rollback;
- a post-publication final-target verification failure reports `failed` with committed publication
  truth and never returns stage evidence as promoted-generation evidence;
- no test imports a serving/launcher layer, deploy provider, product vocabulary, or external
  network.

### Final Server readiness closure

The final TMIND adversarial review found one concrete result-truth blocker and supporting hardening
latches. This plan now closes them by requiring final-directory verification for every success,
explicit committed/occupied publication truth on failed settlement, an initial-presence observation
that disambiguates `verifyPinned: missing`, complete synchronous authority snapshotting, direct
cross-policy preflight, quiescent Pull completion, and cancellation-independent cleanup/settlement
after a visible outcome.

No unresolved Server design decision or prerequisite remains. Explicit implementation authorization
produced the implementation landed as
`14eb4f400 feat(server): compose immutable verified Dist materialization`.

#### Landed Server proof

- `@sys/server/dist` exports runtime owner `Dist` and canonical type owner `ServerDist`; no factory,
  client/verifier injection, weaker alias, parsed-manifest input, or reusable verified token exists.
- Focused leak-traced proof passes 9 suites and 38 steps across API, immutable promotion,
  final-directory evidence, existing/concurrent generations, source resolution and encoding,
  credentials, policy mutation, bounds, malformed manifests, tamper, cancellation, cleanup, and
  prior-generation preservation.
- Full `@sys/server` passes 29 suites and 109 steps; package check and JSR publish dry-run pass.
- Focused formatting, lint, `git diff --check`, and residue scans pass. Semantic review confirms
  Rooted-only mutation, owned bounded transport, Pull quiescence, final-directory verification for
  every success, committed/occupied failure truth, sanitized evidence, and no post-verification
  mutation.

The Server item is landed and closed; its materialization contract is now an implementation
prerequisite for the Tools migration.

## `feat(tools)!: require pinned Dist materialization`

Migrate the sole production legacy HttpPull consumer only after the Server materializer lands.
Remove `kind: http`; it has no alias or automatic migration because no honest process can invent its
missing authority. The replacement is explicit:

```yaml
- kind: dist
  manifest: https://cdn.example.com/app/dist.json
  integrity: sha256-<exact-publisher-manifest-byte-hash>
  store: ./.dist-store
  project:
    dir: ./view/.pulled/app
    mode: replace
```

`manifest`, canonical `integrity`, and immutable `store` are required. `project` is an optional,
explicitly mutable convenience with a required mutation mode when present. CLI add/help requires the
publisher-provided integrity and explains that a checksum derived from the same download proves
nothing. Remove every `pull latest`, URL-only, synthesized-pin, migration, fallback, and hidden
default path from schema, arguments, help, tests, Cell DSL, samples, and scripts.

The CLI calls `Dist.materialize` with one reviewed finite owner policy. Only `existing` or
`promoted` may feed projection. The Dist bundle result discriminates generation truth from
projection truth: verification evidence and integrity belong only to the immutable generation;
projection results carry no evidence or claim that copied/rewritten bytes remain verified. Clear,
copy, merge, or HTML base-tag rewriting never touches the generation, re-enters acquisition, or
becomes a pin.

The CLI does not fetch/parse a second manifest, derive remote targets from URLs, call legacy
HttpPull, inject transport, reconstruct the generation path, or duplicate Server orchestration.
Generic GitHub config/results remain on the distinct `GithubPull` contract and never flow through
this branch.

Focused proof covers exact required config, actionable rejection of `kind: http`, no TOFU
affordance, stable materialization failures, no projection before verified success, immutable source
bytes, existing/promoted parity, type-level result separation, explicit rewrite isolation,
cancellation, and cleanup. Full `@sys/tools` Pull tests/check and Cell guidance/sample scans pass
with no legacy HttpPull call site.

## `refactor(http)!: remove legacy pull materialization`

After the Tools migration, subtract the remaining URL-array/raw-directory API. Final HttpPull is:

```text
HttpPull.start({ Resource[] + Rooted + finite ResourcePolicy })
  → batch admission → owned bounded transport → checksum match → no-clobber publication
```

Delete legacy `toDir`, `stream`, `HttpPull.Map`, retry/options contracts, injected-client ownership,
URL-derived target logic, force-write path, executor branch, helpers, tests, documentation, and
temporary scripts. Do not move behavior to `HttpMirror`, an adapter, deprecated alias, generic
mirror helper, or private consumer copy. `start().done` is the sole terminal projection;
`start().events()` is observation only.

Remove `HttpPull` from the universal `@sys/http` runtime export and remove `Http.Pull` from
`t.Http.Lib`; retain the checksum-pinned named export only through `@sys/http/server`. Type exports
remain only where required to describe that public server surface. Rename legacy `ToDir.Result` to
the canonical `HttpPull.Result` during subtraction with no alias.

Narrow public records to admitted root-relative targets and checksum-pinned evidence. Simplify the
executor to one snapshotted resource batch, one Rooted destination, one policy, one owned Fetch
transport, and one terminal/quiescence model. Repository-wide residue scans prove there are no URL
arrays, raw Pull directories, mapping options, injected clients, legacy result assumptions,
universal runtime exports, generated compatibility names, or mirror-equivalent implementations.
Focused/full HttpPull tests, package check, publish dry-run, and final affected-owner suites pass.

Verification is owner-scoped per commit; do not rerun completed filesystem-foundation suites unless
a landed contract is actually changed. The required sequence is:

```text
Architecture gate    affected owners       independent MAX → adjudicate Claude → reconcile plan
Dist authority       std/fs/consumers      focused Pkg tests → affected checks/residue proof
GitHub authority     code/sys.tools        public fixture tests → full pull tests/check
Pinned Pull          code/sys/http         focused leak-traced HttpPull tests → check/publish
Server composition   code/sys/server       focused leak-traced m.server.dist tests → check/publish
Tools migration      tools/cell            focused pull tests → full tests/check/guidance scan
Pull subtraction     code/sys/http         focused/full HttpPull tests → check/publish/residue proof
Final closure        affected packages     final Opus adjudication → accepted delta proof
```

Every commit first proves its new red test, then focused green, owner check, full semantic diff
review, and relevant residue checks before requesting explicit staging/commit authorization. This is
ordinary commit acceptance, not a separate MAX gate. Final closure records the completed internal
audit, independent external review, adjudication, and proof affected by accepted findings. Plans
remain visible and unstaged until final closure.

## Final negative closure

Final closure must prove complete absence—not deprecation—of:

- local/self-consistency behavior under `Pkg.Dist.verify`, public unpinned `Pkg.Dist.fetch`, or a
  renamed unpinned Dist-fetch convenience;
- GitHub Pull manifest generation, shared optional `dist`/`dists` result metadata, unbounded public
  download entry points, downloader/client injection, or generic output carrying verified evidence;
- `kind: http`, URL-only Dist config, checksum synthesis from downloaded bytes, automatic pin
  migration, unpinned CLI flags/help, or mutable projection results carrying generation authority;
- checksum-pinned overloads on legacy names, URL-array/raw-directory HttpPull, `HttpPull.Map`,
  legacy retry/mapping options, injected clients, force-write branches, async iteration, universal
  `HttpPull`/`Http.Pull` runtime exports, aliases, adapters, or private copies;
- production consumers, config migrations, tests, scripts, Cell guidance, samples, help, or comments
  teaching any removed route or describing checksum equality as provenance.

Deliberate generic Fetch, filesystem, static serving, and the explicitly typed bounded GitHub API
remain valid non-authoritative capabilities. Their existence does not satisfy or weaken a verified
Dist result.

## Downstream ordering

`local-dist-host.plan.md` is unblocked by the completed materialization arc and independently calls
`Pkg.Dist.verifyPinned` before opening a listener. `start-ui.design.md` remains blocked on both
materialization and local hosting. Neither downstream plan may import lower primitives into Driver
Pi, change this public contract, or begin its scaffold/runtime work early.

## Non-goals

- Product UI or startup integration.
- Consumer, launcher, or operator-adapter work beyond the required `@sys/tools` convergence item.
- Automatic browser opening.
- Mutable aliases, rollback pointers, or garbage collection.
- Persistent provenance receipts.
- Detached-signature/key-rotation policy.
- Deploy-provider or R2 implementation.

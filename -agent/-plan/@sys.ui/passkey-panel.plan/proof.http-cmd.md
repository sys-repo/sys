# Bounded HttpCmd execution receipt

Scope: `feat(http)!: bound unary HttpCmd transport` in
[passkey-panel.plan.md](../passkey-panel.plan.md).

## Landing reconciliation and evidence

The human landed `aba8774fff0ddb9dd160cc712fc79e68c8ceee64`,
`feat(http)!: bound unary HttpCmd transport`. Read-only Git inspection confirmed the exact
**46-path** boundary below: 27 modified files and 19 additions, with no unrelated paths included.
The landed progress-rejection, overflow-precedence, inline EOF, and signal-ownership corrections
were inspected directly. The transport worktree matches HEAD, the index is empty, and the commit's
whitespace check passed. The governing plan now records the landing hash.

Post-landing BMIND verification reran the scoped shared/Cmd/Fetch command below: **20 suites / 148
steps**, and the Files consumer process test: **1 suite / 1 step**, both with leak tracing. No
landing discrepancy was found. Full-module/check/dry results below remain pre-landing evidence; this
was not an independent review or isolated-checkout run. Browser/deployment acceptance remains
unproved. The next arc item is the reference account service; no implementation was started here.

Pre-landing verification baseline: `e608035ffc4552882e0ac0c42093eb6954c3583f` plus the attributable
46-path worktree delta. The governing plan and its proof/history records remain a separate
uncommitted documentation checkpoint. Unrelated template, generated-bundle, planning, and concurrent
UI-dev changes are excluded and were not edited here. No Git mutation was performed by this agent.

Pre-landing correction-pass results, not inherited review results:

- Focused shared-reader, Fetch body/operation, and Cmd wire tests: **4 suites / 37 steps**.
- Scoped shared/Cmd/Fetch tests: **20 suites / 148 steps**, with leak tracing.
- Full HTTP unit tests: **67 suites / 522 steps**, with leak tracing.
- Files Cmd sample: **1 suite / 1 step**, with leak tracing and actual process startup.
- Full server unit tests: **43 suites / 364 steps**.
- HTTP file-bytes denied-authority entry proof and server Dist process proof passed; the latter
  reports **4 suites / 10 steps**.
- Both owning-module checks and publication dry-runs passed.
- Exact-file format checks passed for all **46 source paths**; lint passed for their **44 TypeScript
  files**. Transport-scoped `git diff --check` passed. This receipt is checked separately.

The eight additional HTTP steps are four terminal-plus-rejected-progress cases and four server
precedence cases. They close combined-cause gaps that the earlier passing suites did not cover. No
dependency, lockfile, package version, public export, Cmd-kernel, service/runtime, or owning module
task/config change was introduced. Existing Deno warnings were not suppressed.

### Reproduction commands

Cwd `/Users/phil/code/org.sys/sys/code/sys/http`:

```sh
deno task test:unit --trace-leaks ./src/u/-test/-body.test.ts ./src/http.client/m.HttpFetch/-test/-body.test.ts ./src/http.client/m.HttpFetch/-test/-operation.test.ts ./src/http.cmd/-test/-wire.test.ts
deno task test:unit --trace-leaks --reporter=dot ./src/u/-test/ ./src/http.cmd/ ./src/http.client/m.HttpFetch/
deno task test:unit --trace-leaks --reporter=dot
deno task test:file-bytes:entry
deno task check
deno task dry
```

Cwd `/Users/phil/code/org.sys/sys/code/sys/server`:

```sh
deno task test:unit --trace-leaks --reporter=dot ./-sample/files.http.cmd/
deno task test:unit --reporter=dot
deno task test:dist:process
deno task check
deno task dry
```

Cwd `/Users/phil/code/org.sys/sys`:

```sh
git diff --check -- code/sys/http code/sys/server/-sample/files.http.cmd
```

### Complete source boundary

The prior independently reviewed boundary was 44 paths. This correction adds the package README
entry and shared test clock; HttpCmd `mod.ts` and the account contract are unchanged.

```text
code/sys/http/README.md
code/sys/http/src/common/libs.ts
code/sys/http/src/u/t.ts
code/sys/http/src/u/u.operation.ts
code/sys/http/src/u/u.body.ts
code/sys/http/src/u/-test/-body.test.ts
code/sys/http/src/u/-test/u.fixture.clock.ts
code/sys/http/src/http.client/m.HttpFetch/u/t.ts
code/sys/http/src/http.client/m.HttpFetch/u/u.operation.ts
code/sys/http/src/http.client/m.HttpFetch/u/u.body.ts
code/sys/http/src/http.client/m.HttpFetch/u/u.failure.ts
code/sys/http/src/http.client/m.HttpFetch/u/u.input.ts
code/sys/http/src/http.client/m.HttpFetch/u/u.invoke.ts
code/sys/http/src/http.client/m.HttpFetch/u/u.make.ts
code/sys/http/src/http.client/m.HttpFetch/u/u.checksum.ts
code/sys/http/src/http.client/m.HttpFetch/u/u.signal.ts
code/sys/http/src/http.client/m.HttpFetch/-test/-body.test.ts
code/sys/http/src/http.client/m.HttpFetch/-test/-operation.test.ts
code/sys/http/src/http.client/m.HttpFetch/-test/-signal.test.ts
code/sys/http/src/http.client/m.HttpFetch/-test/t.ts
code/sys/http/src/http.client/m.HttpFetch/-test/u.fixture.body.ts
code/sys/http/src/http.cmd/README.md
code/sys/http/src/http.cmd/common.ts
code/sys/http/src/http.cmd/t.ts
code/sys/http/src/http.cmd/m/m.client.ts
code/sys/http/src/http.cmd/m/m.handle.ts
code/sys/http/src/http.cmd/m/m.handler.ts
code/sys/http/src/http.cmd/u/t.ts
code/sys/http/src/http.cmd/u/u.ts
code/sys/http/src/http.cmd/u/u.input.ts
code/sys/http/src/http.cmd/u/u.http.ts
code/sys/http/src/http.cmd/u/u.response.ts
code/sys/http/src/http.cmd/u/u.wire.ts
code/sys/http/src/http.cmd/-test/t.ts
code/sys/http/src/http.cmd/-test/u.fixture.ts
code/sys/http/src/http.cmd/-test/-authority.test.ts
code/sys/http/src/http.cmd/-test/-consumer.test.ts
code/sys/http/src/http.cmd/-test/-m.client.test.ts
code/sys/http/src/http.cmd/-test/-m.handle.test.ts
code/sys/http/src/http.cmd/-test/-settlement.test.ts
code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts
code/sys/http/src/http.cmd/-test/-wire.test.ts
code/sys/server/-sample/files.http.cmd/common.ts
code/sys/server/-sample/files.http.cmd/t.ts
code/sys/server/-sample/files.http.cmd/-start.ts
code/sys/server/-sample/files.http.cmd/-.test.ts
```

## Settlement review, adjudication, and correction

The human supplied a fresh independent review of the 44-path worktree at the same HEAD, with no
staged changes. Its verdict was **Landing: NO-GO / S-tier finish: NO**. It source-traced two
settlement defects despite passing scoped HTTP **20 / 140**, full HTTP **67 / 514**, Files sample
**1 / 1**, both module checks, and scoped diff checks. It did not execute new counterexamples.
Read-only adjudication accepted both findings and verified their attribution before authorization
for this correction pass. That review is distinct from the earlier EOF review below.

### P1 — progress rejection observation bypass: accepted, corrected

Owner: `code/sys/http/src/http.client/m.HttpFetch/u/u.body.ts`, `emitProgress`. A callback could
abort or cross the deadline, then return a rejected promise. The immediate terminal throw skipped
its rejection observer. The primary cancellation/timeout was correct, but the rejection was
unhandled. This ordering existed at HEAD: retained correctness residue, not an extraction
regression. Promise-returning functions are assignable to a void callback position.

The correction observes elapsed time without exiting, attaches rejection observation, and only then
propagates the selected terminal cause. Synchronous callback execution, throwing-then
classification, first-terminal identity, and the inline EOF continuation are preserved. Async
progress remains forbidden; it is observed, not awaited or admitted as a new API.

Four regressions cover abort/deadline followed by a rejected return at both chunk and completion.
They assert terminal identity/classification and unlocked readers, then cross a host turn so Deno
can expose an unhandled rejection. No test-side catch observes the callback's returned promise.
Before the production edit, the Fetch run emitted unhandled callback rejections and terminated; not
every case independently completed red. Initial cancellation assertions using `Try.run` were
corrected because it normalizes symbol rejections; native catch preserves the cancellation identity.
Those assertion corrections are not claimed as production-red evidence. All four cases now pass,
alongside the existing EOF and throwing-then tests.

### P2 — overflow replaced during cleanup: accepted, corrected

Owner: `code/sys/http/src/http.cmd/m/m.handle.ts`, `handleRequest`. Recording status 413 alone did
not select an operation cause. Reader cancellation could synchronously abort the request or cross
the deadline, replacing overflow with 408 or 504. Native Request/stream objects suffice; no forged
platform methods are required. This was introduced with bounded server consumption.

The Cmd server now checks earlier stop/deadline state and latches `request-too-large` before
cleanup, mapping that cause to 413. Classification stays with the server, not the shared reader.
Overflow-first regressions failed before the edit: cleanup abort returned 408 and cleanup expiry
returned 504 instead of 413. Inverse-order cases already passed and remain green: earlier abort or
deadline retains 408 or 504. All four assert empty bodies, zero handler calls, one source
cancellation, and released locks.

The existing monotonic-clock helper moved to the shared test area for Fetch and Cmd use. It restores
the exact descriptor, keeps native timers real, and adds no scheduling/scenario engine. The body
fixture still returns the production promise directly; operations dispose before the clock is
restored. No shared-reader production change or extra EOF suspension was needed.

### Retained documentation findings: corrected

- Narrowed the cleanup promise: owned timers/native listeners stop, while body cancellation and
  reader release are best effort and do not delay settlement. Late response cleanup happens when the
  response arrives; uncooperative readers may retain a lock.
- Added one package README entry linking the Cmd guide, plus import → construct → send → dispose
  usage. Host-selected values are explicit, not defaults. No additional module-doc wrapper was
  needed for navigation.
- Reorganized this receipt around the current verdict, boundary, and verification, retaining the
  historical red/green and review provenance below rather than repeated path inventories.
- Removed private-helper organization and account-specific sign-out instructions from the library
  guide. Shared-helper rationale is retained below. The existing account README already owns
  lost-revocation/recovery policy; the generic guide keeps transport uncertainty, not domain advice.

Published JSR score/docs and the exact published `@sys/http@0.0.335` Cmd type source were inspected
read-only. The published contract has optional client `timeout` and no bounded policy; it is not
this worktree API. The guide names that distinction. These edits and publication dry-runs do not
establish a new published release, rendered JSR improvement, or changed score.

## Supported contract and deliberate boundaries

- Explicit finite whole-envelope policy, positive numeric admission, immutable construction and
  per-call snapshots, preserved two-argument calls and typed unary assignability.
- Own callable handlers; fixed request authority; credential omission, manual redirect refusal,
  no-store responses, isolated request headers and cancellation.
- Byte/time limits through false/missing Content-Length, empty chunks, exact UTF-8 caps, malformed
  UTF-8/JSON, ignored aborts, hanging cancellation, delayed work, disposal, and listener cleanup.
  Late handler results do not invoke serialization hooks.
- Non-reflective fixed diagnostics across own Error properties, spoofed errors, `Cmd.Error.expose`,
  and wire failures; correlated non-2xx results and error/payload precedence.
- Prevented fetch invocation remains distinct from possible dispatch and modeled response loss after
  commit. No retry or rollback inference. Effects may occur after local timeout.
- Canonical repeated-reference serialization remains; actual encoding exceptions fail before
  dispatch. Files access policy and unary metadata behavior remain intact.

Private `HttpOperation<TCause>` owns one deadline, terminal latch, abort bridge, and body leases;
Fetch and Cmd retain their own classifications. Shared body mechanics avoid duplicated resource
ownership without becoming a universal transport. HttpFetch GET/HEAD, redirects, progress, checksum,
decoding, and failures remain separate contracts. Racing external work is necessary: forwarding
abort alone cannot bound waiting on uncooperative work or cancellation promises.

Policy is `maxBytes: { request, response }` with sibling `timeout`; both levels are validated,
copied, and frozen. No flat alias exists. Files selects **1 MiB / 8 MiB / 30 seconds** as host
policy, not account/library defaults. Byte accounting does not bound total heap: serialization
allocates before admission; concatenation allocates after streamed-byte accounting.

## Historical proof and consequential decisions

The following are earlier implementing-session results, except where a supplied independent review
is explicitly identified. They are preserved for provenance, not substituted for the fresh results
above. Initial implementation/refinement/EOF verification used HEAD
`c7e4d66861b659280e480d90a98ec044a17c7cd9` plus its attributable worktree. Later passes used
`e608035ffc4552882e0ac0c42093eb6954c3583f`; the intervening commit was UI-dev retirement work.

### Initial implementation and refinement

- Inherited-handler red: `constructor` returned **200**, required **404**, before production edits.
  Temporary `-bounded.test.ts` was consolidated into `-authority.test.ts`, preserving the
  inheritance/non-callable/missing-entry matrix. Other initial tests were not individually shown
  red; test-authoring type errors are not runtime defect evidence.
- Initial 27-path implementation: scoped HTTP **16 / 117**, full HTTP **63 / 491**, Files **1 / 1**,
  server **43 / 364**, Dist process **4 / 10**, entry proof, both checks/dry-runs, and exact-file
  format/lint checks passed.
- Nested-policy refinement added shared-reader owner coverage, reaching 28 paths. Its consumer
  contract was type-red before migration: nested `maxBytes` was rejected and the flat-shape negative
  assertion was unused. Scoped HTTP **17 / 121** and full HTTP **64 / 495** passed;
  server/sample/process/check/dry proofs also passed.
- That refinement's async `collectChunks` extraction was incorrectly described as behavior
  preserving. Existing tests missed its extra scheduling boundary; the next review disproved it.

### Independent EOF review and correction

The first human-supplied independent review accepted the private operation boundary and nested
policy but demonstrated P2: awaiting `collectChunks` inserted a continuation between EOF admission
and completion, changing callback order and the winning failure. Passing scoped tests did not
invalidate that reproduction. Its full-module/dry-run coverage was not independently rerun.

Before changing the reader, durable native-stream regressions failed in three ways: shared
completion followed abort while still locked; Fetch completion followed abort; a queued deadline
selected `response-timeout` instead of `progress-failure`. The correction restores terminal check →
EOF notification → callback-failure classification in one continuation. Pure concatenation,
cancellation, and guarded reader release remain. Merely suppressing callbacks after abort would not
have restored precedence.

Focused proof became **2 / 7** green. Additional phases cover cancellation/deadline before EOF and
deadline crossing inside throwing/returning completion callbacks. Clock control replaces sleeps.
Named nominal-failure/operation contracts moved to Fetch's private type plane; runtime WeakSet
failure authentication stayed unchanged. Scope reached 31 paths; scoped HTTP **18 / 125**, full HTTP
**65 / 499**, and server/sample/process/check/dry proofs passed.

### Private-policy, canonical helpers, and fixtures

- Moving `ValidatedPolicy` and its consumers to the private type plane reached 33 paths. It changed
  no runtime behavior; the same test counts passed at the later HEAD. No new behavioral red was
  claimed and no public type leaked.
- Canonical adoption reached 39 paths: callback-form `Schedule.micro`, `Time.Delay.MAX`,
  `Num.clamp`, named timer/Fetch/lifecycle/process types, `Promise.withResolvers`,
  `Bytes.utf8ByteLength`, `Obj.deepFreeze` for plain policy, and canonical predicates. Native wire
  byte-count test oracles remain independent. Error descriptors, monotonic time, concatenation, and
  stream leases retain native/domain semantics; checksum loading stays lazy.
- After scheduler migration, temporarily inserting `await Promise.resolve()` before completion
  failed the same three EOF regressions. Removing it restored **2 / 7**. This is mutation
  sensitivity evidence, not a retained mutation or new production defect.
- Body-fixture extraction reached 41 paths. Ownership/setup and nominal failure assertions moved
  into private helpers; stream closure, abort/expiry, callback throws, two callback jobs, ordering,
  and lock assertions remain visible. Four deadline phases became named tests. Exact clock
  restoration and operation-before-clock disposal are preserved.
- Repeating the EOF mutation again failed the intended three assertions; removal restored **2 /
  10**. The three added steps were case splits, not new behaviors. Scoped HTTP **18 / 128**, full
  HTTP **65 / 502**, entry/check/dry, and exact-file checks passed. Server proofs were not rerun for
  that test-only extraction.

### TMIND clarity and signal ownership

- Separated nonthrowing `checkDeadline` from terminal propagation rather than throwing/catching just
  to observe elapsed time. Direct operation tests cover both abort/deadline orders.
- Consolidated progress/thenable policy, caller-signal admission, and absolute-URL validation. Named
  best-effort cleanup leaves and canonical disposable ownership clarify the boundaries. These
  cleanup catches own real external failure paths; they were not mechanically removed.
- Fixed an actual signal-listener ownership defect: record ownership before foreign registration,
  roll back attempted subscriptions on failure, drain ownership before individually guarded
  removals. Both tests were red before the fix: attach-then-throw leaked subscriptions;
  remove-then-throw prevented other cleanup. They passed afterward, preserving the original
  registration error and idempotent disposal.
- Split branching test oracles into explicit cases. The twelve extra HTTP steps were six case
  splits, four boundary checks, and two signal regressions, not twelve new behaviors.
- Scope reached 44 paths. Scoped HTTP **20 / 140**, full HTTP **67 / 514**, Files **1 / 1**, server
  **43 / 364**, Dist **4 / 10**, entry/check/dry, and checks for all 15 changed TypeScript files
  passed. EOF mutation sensitivity was reconfirmed and the mutation removed.
- Transport-scoped diff checks passed. A wider check found an unrelated UI-dev trailing blank line;
  it was not edited. A later formatter check unexpectedly scanned the workspace but wrote nothing.
  This pass was implementing-session review, not independent certification. The later settlement
  review above found the two retained gaps despite these green results.

Historical combined captures sometimes exceeded output limits; successful exits and terminal
summaries were observed, and no missing portion establishes extra claims. Earlier formatter writes
were confined to seven exact test files with recoverable backups and post-write inspection. Later
corrections used surgical edits; no broad formatter write or Git mutation occurred.

## Evidence limits

Native Deno tests and source inspection do not establish browser cookie/CORS/referrer behavior,
workerd/deployment portability, RP/origin/verifier policy, authentication, atomic account commits,
BFCache behavior, runtime secret ownership, or the reference service's executable-line feasibility.
Synchronous CPU is not preempted; cancellation cannot force cooperation or undo effects. Injected
fetch and configured handlers remain trusted code, not arbitrary-code sandboxes. The unused generic
`undefined` cause/sentinel restriction remains deferred; current consumers supply concrete causes.

The independent reports, read-only adjudication, implementing-session corrections, source landing,
documentation checkpoint, publication, and browser acceptance remain distinct. No automatic broad
repeat-review gate is added: another pass needs a named unresolved risk or different evidence
surface. The landing and verification provenance are recorded above; the opening plan arc remains
the landing ledger.

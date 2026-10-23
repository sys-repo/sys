# FS and Server authority boundaries — round 03

## Verdict

**changes required** — three source-grounded findings below. Executed existing focused tests passed:
8 top-level suites, 118 steps. These passes do not exercise the proposed counterexamples completely.
No source/test changes or new reproducer files were authorized or made. This is not migration,
release, or landing clearance.

Independent review of attributable live worktree behavior for
`feat(dist)!: unify build pins and verification on canonical content identity`.
No implementing transcript, previous reviews, sibling reports, adjudications, or recovery snapshots
were opened. Initial broad Git status exposed their filenames, not their contents or conclusions.
The charter's model recommendation is not an attestation of the active runtime model.

## Authority, attribution, and stability

Repository: `/Users/phil/code/org.sys/sys`.
HEAD at entry and later inspection: `8d97fe4088bed6764e804424b767b089ffb13cf3`.
The opening arc reconciles without editing: `e6316e80b` and `872b5a34d` are reachable and their subjects
match exactly; no reachable subject matches the unchecked breaking Dist item. The review concerns
unlanded source deltas, not an implementation inferred from that subject.

Read the governing plan's opening five lines and only its requested normative sections: Proposed
identity contract; Verification model and the changed parsing boundary; workstreams B and D;
Required adversarial proof matrix; Completion boundary. Canon traversal completed; scoped AGENTS
path discovery found none under `-agent`, the four scoped packages, or the inspected code ancestors.

### Inspected implementation

Paths below are repository-relative; directory headings qualify each listed filename.

- `code/sys/server/src/m.server.dist/u.generation/`:
  `u.input.ts`, `u.is.ts`, `u.open.ts`, `u.result.ts`, `u.owner.ts`, `u.retention.ts`, `common.ts`.
- `code/sys/server/src/m.server.dist/u.materialize/`:
  `u.input.ts`, `u.run.ts`, `u.failure.ts`, `u.manifest.ts`, `u.seal.ts`, `common.ts`, `t.internal.ts`.
- `code/sys/fs/src/m.Pkg.Dist/u.verify/`:
  `u.manifest.ts`, `u.verify.ts`, `u.input.ts`, `u.admitManifest.input.ts`, `u.admitManifest.ts`,
  `u.limit.ts`.
- Contract/type dependencies: `code/sys/server/src/m.server.dist/t.ts`,
  `code/sys/server/src/common/t.ts`, `code/sys/server/src/types.ts`,
  `code/sys/fs/src/m.Pkg/t.ts` (Verify contracts),
  `code/sys/fs/src/m.Pkg.Dist/t.internal.ts`.
- Direct semantic dependencies: `code/sys/std/src/m.Pkg/m/m.Dist.Content.ts` and `m.Is.ts`
  (encoder and pin guard), `code/sys/std/src/m.Is/m.Is.ts` (lifecycle predicates),
  `code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.target.ts` (single portable path owner).
- All six charter primary proof files. Additionally inspected publication-settlement tests in
  `code/sys/server/src/m.server.dist/-test/-materialize.test.ts`; that additional file was not run.
- Fixture/execution dependencies: `code/sys/server/src/-test/u.fixture.dist.ts`,
  `code/sys/fs/src/m.Pkg.Dist/-test/-u.pinned.fixture.ts`, `-u.dist.fixture.ts`, the two packages'
  `src/-test.ts` and `src/-test/mod.ts`,
  `code/sys/testing/src/m.server/m.Testing/m.Testing.ts`, and
  `code/sys/std/src/m.Testing.Server/m.HttpServer.ts` and `m.Server.ts`.

Tracked/untracked and staged/unstaged status was recorded. Scoped tracked deltas were unstaged;
scoped staged inspection was empty. The primary untracked inputs were the two content test files and
materialization `t.internal.ts`. Other dirty work was not attributed merely by directory proximity.
Git source diffs establish the pin migration, descriptor-only reconstruction, revised tests, and
new document fences; HEAD source establishes the retained portions identified below.

Material exit comparison used actual content, not status alone:

- Reopened and compared complete live contents of FS `u.manifest.ts`/`u.verify.ts`, Server
  materialization `u.input.ts`/`u.failure.ts`/`u.manifest.ts`/`common.ts`/`t.internal.ts`, Generation
  `u.is.ts`/`u.result.ts`, both untracked content tests, materialization authority tests, Pkg.Dist
  tests, and the Server and pinned-FS fixture files. No differences observed.
- Repeated tracked diffs agree with the earlier source evidence, including Generation input/open
  changes. Worktree blob identities from diff headers remained `19d6505cd` for Generation authority
  tests, `790163345` for pinned-manifest tests, `79193bb6c` for materialization input, `43bd18fea`
  for Generation admission, and `eac76429d` for materialization orchestration.
- Root `deno.json`, `deno.lock`, `deps.yaml`, `imports.json`, and both owning `deno.json` files remained
  equal to HEAD. Owning tasks/presets and dependency declarations/import map were opened. The lock
  was checked for change, not exhaustively audited.
- Clean direct dependencies `u.owner.ts`, `u.retention.ts`, `u.seal.ts`, Rooted `u.target.ts`, and
  Testing `m.Server.ts` remained equal to HEAD. Scoped exit status showed no additional source edits.

This is a bounded, non-atomic comparison. Other transitive source/cache bytes, the copied static
sample-file contents, and filesystem mutations between observations were not independently
snapshotted. I do not attest to complete dependency-cache identity or all unrelated concurrent work.

## Findings

### R1 — P2: origin-array execution precedes complete direct-materializer authority capture

**Owner/location:** `code/sys/server/src/m.server.dist/u.materialize/u.input.ts`,
`snapshotPolicy` (150–155), `snapshotResponsePolicy` (166–173), `snapshotOrigins` (191–218).

`exactRecord` excludes record accessors/proxies, but `snapshotOrigins` accepts an array and invokes
its iterator/index reads. The enclosing policy captures verification limits only after both
response policies. A getter on `policy.manifest.sourceOrigins[0]` can therefore widen
`policy.verification.entries` before its snapshot. The pin has already been copied; the remaining
policy has not.

Concrete reproduction to add to the existing authority suite, using its ordinary fixture:

1. Set a mutable verification object to `entries: 1`.
2. Use a normal one-element `sourceOrigins` array whose enumerable index-0 getter increments a
   counter, sets that verification object's `entries` to `100`, and returns the fixture origin.
3. Pass otherwise ordinary policy records, the independent fixture pin, and no lifecycle input.
4. `snapshotInput` reads that getter and returns an admitted snapshot with `entries === 100`.
   The public `Dist.materialize` path consumes that widened snapshot; the same fixture with an inert
   array and `entries: 1` refuses at manifest admission.

This is a **source deduction/proposed reproduction**, not a newly executed regression. The existing
lifecycle-mutation tests execute later than this hole and pass correctly. Array proxies, custom
iterators, and revoked nested arrays also need explicit treatment; the outer catch does not make
prior executed hooks inert. A revoked array can currently throw into the `invalid-input` catch rather
than ordinary policy rejection.

**Invariant:** capture caller limits before executable input can alter them; reject malformed policy
without premature callbacks/IO, preserving input-versus-policy precedence.

**Attribution/reachability:** retained flaw: HEAD's `snapshotOrigins` already used the same iterable
walk before verification capture. The current change strengthens exact-record admission and moves
policy before lifecycle inspection but leaves this nested gap. This is reachable through the public
direct materializer. It is **not** a demonstrated Generation bypass: Generation's separate safe-data
preflight rejects array accessors/proxies before delegating.

**Smallest correction:** at the materialization input owner, capture exact dense own-data origin
arrays without invoking iterators/getters or proxy traps; settle invalid nested policy locally.
Preserve the existing later lifecycle observation and input-error precedence. Do not introduce a
second Dist interpretation or a generic object-snapshot framework.

**Closing proof:** inert-array positive control; accessor/custom-iterator/proxy/revoked-array
negatives with zero hook, credential, filesystem, and network calls; original tight budgets cannot
be widened; invalid lifecycle plus invalid policy still reports the intended input precedence.

### R2 — P2: inner lease-release failure erases a document-continuity failure

**Owner/location:** `code/sys/server/src/m.server.dist/u.materialize/u.run.ts`,
`promoteVerifiedStage` (362–371 and 397–406); analogous replacement in `settleInitialGeneration`
(279–291). `t.ts::Dist.Failed` has only one stage/reason pair.

Concrete failure sequence:

1. Use the existing ambiguous post-publication test's real publication followed by metadata-only
   document replacement and injected committed promotion error.
2. `settleVisible` returns `final-verification / verification-failure`, with cleanup and occupied
   publication truth.
3. Make the promotion lease's `release()` reject with an ordinary Error. For a contained test,
   release the real lease first and then reject; do not strand fixture ownership.
4. The return branch replaces the prior settlement with `promotion / execution-failure`. Cleanup
   and publication survive, but the independently established document-continuity failure vanishes.

**Invariant:** operation failure, publication, cleanup, and release failure remain independently
truthful. Generation preserves a lower failure alongside outer ownership state, but cannot recover
the original failure already discarded inside materialization.

**Evidence/attribution:** source-deduced, not executed as a combined injection. This overwrite branch
is retained from HEAD; the new continuity refusal now feeds it. No claim is made that Rooted loses
its internal lease bookkeeping or that a failed release actually succeeded.

**Smallest correction:** preserve the primary materialization settlement and represent sanitized
inner release failure separately at this owner, updating its exact Generation admission contract as
needed. Keep raw errors private; no new general fault framework or changed winner inference.

**Closing proof:** the sequence above must expose both final-verification refusal and release
failure, preserving `cleanup` and `publication`; normal release remains unchanged. Pair with an
initial-existing fence refusal plus release failure. Assert one release attempt and drained test
work, not merely a final `failed` tag.

### R3 — P2: Generation expands the evidence graph before checking the caller's entry budget

**Owner/location:** `code/sys/server/src/m.server.dist/u.generation/u.is.ts`,
`isVerification` (79, 89–124) and `isDeepFrozenJson` (243–283).

Supply genuine frozen FS/materializer success produced with many permitted flat payload entries,
then admit it through the existing `openWith` seam under the same pin and sufficient manifest-byte
budget but `verification.entries: 1`. Before reading/checking `assets.files`, `isVerification` calls
`isDeepFrozenJson`: it allocates `Reflect.ownKeys(parts)`, schedules every part value, and traverses
that whole inventory. Only afterwards does it reject the entry count.

**Invariant:** charge consequential inventory traversal/collection expansion against the current
caller policy before doing that work. A manifest-byte node budget is a different, looser limit.
The newly added structural/path loop correctly charges prefixes before slicing, but runs too late
to bound this earlier whole-graph expansion.

**Evidence/reachability:** source-deduced ordering; existing genuine-lower/tighter-policy tests
execute the rejection branch but do not measure pre-rejection work. This is not a success-admission
bypass or a production remote exploit: the ordinary materializer runs FS under the tighter policy
and refuses earlier. It is the explicitly reviewed lower-evidence seam. The deep-walk ordering is
retained from HEAD; the replacement adds caller structural/path checks after it.

**Smallest correction:** reject impossible scalar summaries before graph expansion, and admit the
known flat content/parts shape with caller-bounded descriptor work rather than traversing arbitrary
JSON first. Keep portable path semantics at FS/Rooted and the encoder at std.

**Closing proof:** genuine large lower evidence under a tight entry policy must reject before
whole-inventory scheduling; add a deterministic work/branch observation rather than a timing-only
assertion. Preserve exact-limit success, malformed nested-value refusal, and one outer release (or
truthful retained pending ownership on release failure).

## Budget/capture/settlement-to-assertion map

| Invariant | Independent expectation, actual branch, and result |
|---|---|
| Exact content, not self-report | Executed FS content tests fix a literal compact preimage and digest; altered path/hash/size with a separately recomputed digest refuses the retained pin and succeeds under its own pin. This avoids relying solely on builder/verifier agreement. |
| Lossless keys and interpretation | Executed literal duplicate/escaped-member, BOM, Unicode and `__proto__` cases; own key survives reconstructed inventory. Pkg.Dist real-file compute/save/load tests retain membership and show generic digest differs from content identity. |
| Manifest + files + distinct directories | Executed Generation root-payload oracle needs 2 entries; shared-assets oracle needs 5, not 4. Manifest admission, FS tree verify, ordinary materialize, and injected genuine lower success agree. Tight lower-evidence rejection releases exactly once; release rejection increases retained ownership. |
| Path/prefix work | Executed FS `a/b/c/d`: 7 path units, 9 prefix units; pathTotal 8 refuses, 9 with entries 5 admits. Generation astral/deep-path tests cover pathLength, pathTotal and prefix work against genuine lower evidence. Positive cases use generous defaults; they do not prove every exact Generation path ceiling. R3 covers earlier graph work. |
| Byte and arithmetic budgets | Executed manifest/file/total/unsafe-sum refusals; Server tight manifest limit fails during manifest fetch with no asset request. Source uses the stricter transport/caller manifest ceiling. Native JSON parsing remains byte-bounded, not interruptible or depth-deadline proof. |
| Synchronous authority capture | Executed post-invocation mutations and both directions of lifecycle pin mutation; matching original succeeds and wrong original refuses. Generation input accessor/proxy cases assert zero effects/IO. Direct materializer lifecycle entries 1/100 controls preserve original limits. R1 identifies the earlier origin-array branch not covered by those tests. |
| Existing/owned/ambiguous document fence | Executed initial-existing mutation during seal refuses. Ambiguous unchanged publication settles conservatively as existing with no totals; metadata-only changed document refuses while fresh independent FS verification still succeeds. Thus refusal is document continuity, not changed content. |
| Separate winner | Executed real separate-directory winner with equal content/different document; returned checksum belongs to winner. Source requires coexisting distinct dev/ino, verification and target recheck before promotion. No atomic replacement/ABA guarantee follows. |
| Settlement and lifetime | Executed cancellation, credential rejection draining, pending stage cleanup, exact lower failure preservation, terminal/reentrant outer release and retention counters. Exact native Promise transport is required; opaque transport is retained, not assimilated or falsely released. R2 concerns a distinct inner-release combination not tested. |
| Evidence and type containment | Source: FS constructs frozen content/parts and derived totals, not a frozen arbitrary metadata graph. `Object.fromEntries` preserves special own keys. Materialization `t.internal.ts` is type-only, scoped through local common, absent from public `types.ts`; no added runtime behavior or compatibility export. |
| Hosting assurance | Executed pinned `/dist.json` 404, expected payload bytes, local-unpinned retained document and replacement refusal. This is byte-response evidence, not browser-execution assurance. |

### Assertion replacement audit and remaining proof

Generation's inspected diff preserves ordered-call/signal assertions, no-trap counters, identity of
admitted lower failures, release counts, retention increments, and reentrant terminal identity.
Whole-`dist` hostile graphs were replaced by hostile `content.parts` graphs, not removed. Retired
byte-pin mismatch evidence is now explicitly rejected rather than treated as content authority.

FS pinned-manifest tests retain invalid UTF-8/JSON, canonical sizes/digests, path/structural refusal,
limits and overflow assertions. Old ignore/signature/root-label authority assertions are deliberately
replaced by inert-observation acceptance; the deep-extension assertion now proves exclusion instead
of frozen metadata authority. These are required subject changes, not weakened v1 assertions.
Server forged-digest and structural-limit failures move earlier, before staging/assets, with typed
failure and no-asset assertions. Truncated/enlarged resource checksum controls remain.

Not established by these executions: maximum-size parser CPU/allocation behavior across supported
runtimes; exact Generation pathTotal boundary for every repeated-prefix shape; staged-document
replacement before stage verification; missing/unavailable winner-identity evidence; combined inner
operation/cleanup/release failures; complete assertion-by-assertion equivalence of the entire old
Pkg.Dist suite. Those are explicit limits, not inferred passes from test totals.

## Executed commands and effects

Runtime probe: `deno --version` → Deno 2.9.7, V8 15.0.245.2-rusty, TypeScript 6.0.3,
aarch64-apple-darwin. No alternate runtime or dependency regeneration.

From repository root, executed exactly:

```sh
cd code/sys/fs && deno task test:unit --frozen --cached-only --no-prompt --trace-leaks ./src/m.Pkg.Dist/-test/-pinned.verify.manifest.test.ts ./src/m.Pkg.Dist/-test/-content.admission.test.ts
```

Passed: 2 suites / 20 steps / 0 failures.

```sh
cd code/sys/server && deno task test:unit --frozen --cached-only --no-prompt --trace-leaks ./src/m.server.dist/-test/-generation.authority.test.ts ./src/m.server.dist/-test/-materialize.authority.test.ts ./src/m.server.dist/-test/-content.identity.test.ts
```

Passed: 5 suites / 79 steps / 0 failures.

```sh
cd code/sys/fs && deno task test:unit --frozen --cached-only --no-prompt --trace-leaks --filter '/public surfaces|selected own filenames/' ./src/m.Pkg.Dist/-test/-Pkg.Dist.test.ts
```

No proof: 0 passed, 1 top-level suite filtered out. The nested-name filter did not select the BDD
suite. After inspecting its disjoint effects, executed the exact file without that filter:

```sh
cd code/sys/fs && deno task test:unit --frozen --cached-only --no-prompt --trace-leaks ./src/m.Pkg.Dist/-test/-Pkg.Dist.test.ts
```

Passed: 1 suite / 19 steps / 0 failures.

Both tasks expand to `deno test -P=test`. FS preset grants read/write/env; Server grants
read/write/env/net/run. Selected tests use isolated temporary files/stores and ephemeral loopback
listeners, not child processes or builds. Server source/parent-store teardown and pinned-FS teardown
settled without reported failures; Deno leak checks passed. Pkg.Dist's `Sample.init` tests do not
explicitly remove every temporary directory, so no complete filesystem-residue cleanup claim is made.
No manual cleanup or shared-output mutation was attempted.

No build/browser/shared-output slot was needed or acquired. No process suites, provider access,
Cloudflare sample build, release rebind, or real credentials were used. Frozen/cached execution
succeeded with the experimental-permissions warning only; cache contents were not independently
attested.

Read-only evidence included `git status --short`, scoped `git diff` and `git diff --cached`,
`git show HEAD:code/sys/server/src/m.server.dist/u.materialize/u.input.ts`, exact-subject `git log`,
`git show -s --format='%H %s' e6316e80b 872b5a34d`, and both corresponding
`git merge-base --is-ancestor` checks (successful). `git diff --check -- code/sys/fs/src/m.Pkg.Dist code/sys/server/src/m.server.dist`
reported no whitespace errors. That is not a formatter-stability proof. Discovery had a corrected
leading-hyphen `find` invocation and missing optional `.prettierrc`/candidate-path lookups; these were
not access denials or test failures.

## Canon concerns and design restraint

Concrete minor canon mismatch: the changed materialization `u.input.ts` and `u.failure.ts` import
server `Is` directly instead of through their local common lane. A local `common.ts` server-Is
re-export, as already used by Generation, keeps the intentional server predicate owner visible
without bypassing the canonical call-site convention. This is separate from R1's runtime flaw.
No formatter writes were performed; no general style sweep is proposed.

The strongest case for retaining the design is supported by execution: content identity, document
continuity and ownership already have separate owners; FS shares one admission kernel; Rooted alone
owns portable paths; std owns the encoder without a crypto cycle; Generation conservatively retains
unobservable authority. The same-content/different-document tests meaningfully distinguish independent
winner reuse from owned-candidate mutation. The internal materialization type pool is contained and
runtime-neutral. Keep those boundaries. Fix the specific capture, work-order and settlement losses
rather than introduce a new abstraction, compatibility lane, fault framework, or review matrix.

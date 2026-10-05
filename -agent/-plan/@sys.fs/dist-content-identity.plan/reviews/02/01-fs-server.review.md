# FS and Server authority settlement — blind review 02/01

## Scoped verdict: changes required

The current Generation settlement check does not enforce the same structural entry budget as FS.
There is also a pre-existing direct-materialization capture-order defect: executable lifecycle
validation precedes policy capture. Both findings below are source-supported; their exact failure
sequences were **not executed**. The existing tests passed, including genuine lower-success path
budget controls, but do not cover these sequences. This is not a complete falsification receipt or a
whole-system/landing verdict.

Independent content-pin capture, the checked path-work budgets, and the exercised exact-document
fences support leaving their present owners intact. No broad architecture replacement is warranted.

Target: `/Users/phil/code/org.sys/sys`, live worktree for
`feat(dist)!: unify build pins and verification on canonical content identity`, governed by
`-agent/-plan/@sys.fs/dist-content-identity.plan.md` and this assignment's charter/README. The requested
`gpt-6-astra • xhigh` is the charter configuration, not an independently verified runtime attestation;
I did not launch or switch to another model.

## Findings

### 1. P2 — Generation counts payload files rather than all structural entries

**Owner/location:**
`code/sys/server/src/m.server.dist/u.generation/u.is.ts`, `isVerification`, especially line 90 and
lines 97–134. Compare
`code/sys/fs/src/m.Pkg.Dist/u.verify/u.manifest.ts`, `assertEntryLimit`, lines 139–155, and
`code/sys/fs/src/m.Pkg/t.ts`, `Dist.Verify.Limits.entries`.

The public limit counts payload files, distinct implied directories, and `dist.json`. FS starts at
`1 + files.length` and charges each distinct directory. Generation only compares `assets.files`
with the caller's `entries`; its prefix loop bounds string work but never counts directories or the
manifest. Encoding only bounds payload count, so it does not repair this mismatch.

**Concrete sequence to execute:**

1. Use the existing neutral Server fixture and prepare a genuine successful materialization at the
   selected store/target with its normal `entries: 100` policy. It contains three payload files,
   one `assets` directory, and `dist.json`: five entries.
2. Retain that unchanged lower result. Open the same generation through `openWith` using the existing
   `fakeRooted` test seam, but give the outer caller `verification.entries: 4`. Have the trusted
   `materialize` callable return `Promise.resolve(lower)`.
3. All other evidence remains genuine and bound to the selected URL, pin, directory, seal, and
   transfer totals. `isVerification` sees three files, accepts `3 <= 4`, recomputes the matching
   content digest, and reaches successful owner construction.
4. In contrast, FS verification of those bytes under `entries: 4` must refuse; direct
   materialization under that policy must refuse too. With `entries: 5`, both should succeed.

**Evidence distinction:** the existing executed materialization authority test already proves the
fixture's `entries: 4` refusal before asset transport. Executed Generation tests establish the
real-lower-result replay seam for path budgets. The entry-budget replay and its positive control
above are a source prediction, not an observed failed test. The default production materializer
still enforces FS admission: this is an independent lower-evidence settlement defect, not a claim
that an ordinary download currently bypasses FS.

**Invariant:** a genuine lower success obtained under broader authority cannot authorize an outer
caller with narrower verification limits. Inadmissible settlement must return no owner and attempt
exactly one failed-open release; release failure must remain `pending`.

**Smallest correction:** in Generation's existing evidence admission owner, account for
`dist.json`, payloads, and distinct implied directories using the effective FS entry ceiling.
Preserve the separately accumulated repeated-prefix work bound before allocating directory strings.
Do not add another filesystem verification pass or treat a frozen success as sufficient authority.
The new accounting must be based on admitted inventory, not merely the lower `assets.files` claim.

**Closing proof:** extend the existing genuine-success budget matrix with the five-entry fixture at
four/five entries, a single root payload at one/two entries, and shared directory prefixes counted
once for entries but repeatedly for work. Compare FS admission/verification, real materialization,
and `openWith`; assert no returned owner, exactly one release on refusal, and normal ownership on the
positive control. Include a failing release control. The file-only comparison also exists in HEAD;
this is a retained defect in the rewritten settlement boundary, not a newly introduced comparison.

### 2. P2 — Direct materialization observes lifecycle code before capturing policy

**Owner/location:**
`code/sys/server/src/m.server.dist/u.materialize/u.input.ts`, `snapshotInput`, lines 68–79.
`Is.untilInput` at line 77 precedes `snapshotPolicy(input.policy)` at line 79.
`code/sys/std/src/m.Is/m.Is.ts`, `untilInput` → `until` → `lifecycleView`, reads borrowed lifecycle
properties such as `disposed` and `dispose$`.

**Concrete sequence to execute:**

1. Construct otherwise valid fixture arguments with a matching independent pin and
   `policy.verification.entries: 1`.
2. Supply an ordinary lifecycle view whose `disposed` getter changes that same caller-owned entry
   limit to `100`, returns `false`, and whose `dispose$` getter returns a live lifecycle observable.
3. Call public `Dist.materialize`. The pin is copied first, but lifecycle validation executes the
   mutation before policy is copied. The returned policy snapshot therefore contains `100`, not the
   original bound `1`; subsequent FS calls receive the widened policy.
4. With a non-mutating lifecycle, the original policy refuses before asset acquisition. Reverse the
   mutation, `100` to `1`, to demonstrate that the original sufficient policy can also be replaced.

**Evidence distinction:** source establishes the capture order and executable getter route. The
full public materialization sequence above was not run. The passing post-invocation policy-mutation
case is not a control for synchronous mutation inside admission. Generation's separate lifecycle
ordering test also cannot cover this: its snapshotter calls the materialization snapshotter without
`until`, captures policy, and only then observes its own borrowed lifecycle.

**Invariant:** non-lifecycle caller authority must be owned before borrowed executable lifecycle
behavior runs. The independent pin itself is correctly captured here; this finding concerns policy,
including the new path bounds, not pin retargeting.

**Smallest correction:** finish capturing policy with the other non-lifecycle inputs before calling
`Is.untilInput`. Retain the existing input/policy failure distinctions and do not introduce a general
snapshot framework.

**Closing proof:** add both mutation directions at the direct materialization boundary, checking the
actual captured policy and resulting acquisition/refusal. Include the unchanged-policy controls and
prove that an initially wrong pin cannot become matching through the same getter. This ordering
already exists in HEAD; it is a scoped pre-existing issue, not attributed as a newly introduced
content-identity regression.

## Capture and settlement map

| Boundary | Ownership order and proof | Assessment |
| --- | --- | --- |
| FS `verifyPinnedWithIo` | `snapshotExactDataObject` → owned pin → absolute root and owned limits → lifecycle-container copy/leaf validation → `Rx.abortable` → first await → manifest read/admission → tree and payload. | Both wrong-to-matching and matching-to-wrong nested-pin mutations executed. Wrong original pin yielded `pin-mismatch`, zero `readDir`, and only the manifest opened. Matching original pin verified. |
| FS `Pinned.admitManifest` | Exact input → owned pin/limits → native byte copy → lifecycle observation → asynchronous admission. | Getter-driven mutation of bytes/pin/limits and post-invocation mutation executed; original bytes and checksum retained. Shared/detached buffers refused; resizable view copied. |
| Generation `snapshotInput` / `openWith` | Exact top/store fields → policy/credential graph preflight → materialization snapshot without lifecycle → owned lifecycle containers → lifecycle validation/bridge → first `Schedule.micro()` await → store/lease/lower operation. | Source supports pin capture before executable lifecycle leaves. Executed lifecycle test mutates manifest policy, not nested pin; both nested-pin directions at this outer boundary remain unexecuted. |
| Direct materialization | Exact input → pin/credential capture → lifecycle validation → policy capture → first Rooted await. | Pin retained; policy order is finding 2. Post-call nested-pin mutation passed, but does not close the synchronous getter case. |
| Generation lower settlement | Exact native Promise admission → exact frozen result/source/pin/seal/totals/evidence → `createOwner`; rejected evidence uses `releaseFailedOpen`. | Existing malformed, accessor, Proxy, cancellation, decorated/opaque transport, release-once, and pending-retention cases passed. Finding 1 leaves one real budget mismatch. |

The FS failure results inspected remain frozen, bounded categories without raw host paths or causes.
Generation rejects invalid evidence before owner construction and preserves independent ownership
settlement. Its existing release owner is the appropriate place to retain this behavior; it need not
be redesigned to fix the budget check.

## Budget map and ordering

| Budget | FS admission | Generation settlement | Executed coverage / limit |
| --- | --- | --- | --- |
| Manifest bytes | Captures/clamps to 16 MiB; checks before decoding/copy where applicable. | Compares reported safe positive byte count to captured caller policy; graph node traversal is bounded by that count. It does not independently apply FS's 16 MiB clamp. | Caller manifest ceiling and streamed refusal passed. Forged evidence above the fixed FS ceiling was not exercised. No genuine FS success can supply it. |
| Per-path units | JS string `.length`, clamped to 4096; rejects before parsing/normalization. | JS `.length`, same path ceiling, before content encoding. | Genuine lower result with `🦊` path: one-unit-tight refusal and sufficient-policy success passed against FS, materialization, and Generation. |
| Aggregate path units | Accumulates full path code units with safe bounded addition, independently of prefix work. | Accumulates full path code units before encoding, bounded to the Content ceiling. | Tight aggregate case and sufficient control passed. |
| Repeated-prefix work | Every prefix is charged before slicing, even if its directory already exists. Separate 4 Mi-unit ceiling. | Every slash offset is charged before encoding; separate from full path sum. | Deep astral path plus shared `assets` prefixes: genuine lower result refuses with full-path budget still sufficient; control opens and releases normally. |
| Structural entries | `1 + payloads + distinct implied directories`, capped at 65,536. | Payload count only; encoder also only counts payloads. | Actual materialization refusal executed; exact outer replay missing. Finding 1. |
| File/aggregate bytes | Canonical required sizes; per-file bound and safe checked addition before encoding. Verification rechecks actual bytes. | Lower aggregate must be safe/in bounds; parts are parsed and summed after encoding, then checked for safe exact totals and package bytes. Nonnegative sizes mean an overflow cannot later return to a safe total. | FS low file/total bounds and unsafe arithmetic passed; lower forged transfer-total rejection passed. Genuine tighter file/total replay at Generation and its release outcome remain unexecuted. |

Ordering is not identical across owners. Generation first calls `isDeepFrozenJson`, which allocates
own-key arrays and traverses under the reported manifest-byte node budget, before its caller path
checks. Those path checks do precede canonical encoding and the later `Object.entries(parts)`.
Therefore the executed path tests prove settlement refusal, not that all earlier validation work is
bounded by a tiny caller path/entry limit. I did not measure allocation or claim such a proof.

## Assertion preservation and hostile-input audit

Compared the live rewritten producer/manifest/authority tests with their reachable HEAD versions.
The preservation question is behavioral, not a comparison of test counts.

| Prior load-bearing obligation | Current proof or explicit disposition |
| --- | --- |
| Selected own keys survive generic collection, Dist computation, saving, loading, and later byte mutation. | `-Pkg.Dist.test.ts` preserves exact parts, own `__proto__`/`constructor`/`toString` membership, independent generic preimage, selected filtering, exact saved JSON/checksum, and changed-key pin sensitivity. `-content.production.test.ts` adds strict actual-byte verification and old-pin refusal. All executed. |
| Independent identity oracle rather than producer/verifier agreeing on the same mistake. | `-content.admission.test.ts` fixes the one-file literal preimage/digest and a separate Unicode/numeric/prototype-sensitive vector. Production must emit the same fixed one-file digest. These executed; I did not independently regenerate the claimed WebCrypto provenance. |
| Producer selection, progress, ignored metadata/signature bytes, repeated saves, and child/sibling selection. | Current `-Pkg.Dist.test.ts` retains progress counts/order, selection, descriptive metadata, saved-byte newline/checksum, signature exclusion, sibling-prefix retention, and child idempotence. `-content.production.test.ts` checks direct/reused selection equality and space-sensitive spellings. |
| Failure must not return usable document/pin authority. | Missing/non-directory, empty, filtered-empty, unsafe path, and unsupported child cases now explicitly check absence of pin/document/publication. Old empty fallback document and invalid-child hashing fallback are intentionally retired by the clean break. |
| Old generic digest equivalence, legacy load conversion, and `checkSelfReported` API. | Explicitly retired. Tests now assert distinct generic/Dist digests, invalid legacy observations, no Compat/checkSelfReported surface, and local consistency through `Local.verify`. Restoring the old acceptance would violate the plan. |
| UTF-8/JSON rejection, mandatory canonical sizes, self-digest verification, closed inventory, and unsafe paths. | Manifest/content admission suites retain these; tree tests retain extra file/sidecar/temp/empty-directory/special-entry refusal, wrong kinds, missing/tampered/truncated/enlarged payloads, and symlinks. Executed. |
| Authenticated root build/ignore/signature metadata and deep-frozen extensions. | Intentionally retired as authority. Replacement tests admit inert malformed descriptive metadata, never execute ignore rules, and exclude deeply nested extensions from evidence. Actual bytes and admitted inventory remain checked; descriptive ignore rules do not excuse extra files. |
| Declared-entry early refusal and safe arithmetic. | Rewritten manifest tests retain malformed-within-budget versus limit-before-excess-value behavior, all numeric limits, and unsafe aggregate arithmetic. Structural admission now occurs earlier than staging, so old staging/cleanup assertions move to admission/no-stage outcomes rather than disappear. |
| IO transitions, cancellation, and primary-versus-cleanup error distinctions. | IO/tree suites retain initial versus changed classification, manifest continuity, unavailable identity, final-boundary cancellation, short reads, and primary change surviving close failure. Materialization authority retains in-flight cancellation, checksum failure cleanup, and pending cleanup after authority disappears. Projection retains primary/cleanup combinations and completed-output truth. Executed. |
| HTTP checksum diagnostic authority versus an ordinary HTTP error. | Old manifest byte-pin success/mismatch variants are retired. Current tests require checksum absence, reject old/mixed/contradictory supplied evidence, treat ordinary 412 as resource failure, and distinguish content pin mismatch from payload checksum mismatch without inventing expected/received manifest-pin evidence. |

Instrumentation details:

- FS checked-input tests instrument `get`, `getOwnPropertyDescriptor`, `getPrototypeOf`, and `ownKeys`
  and include revoked top-level/limits/prototype cases. These correspond to the inspected snapshot
  reflection operations; zero counters and zero IO are asserted. Typed-array tests separately guard
  byte-length/buffer/constructor/iterator hooks.
- Generation exact-input tests use all thirteen Proxy traps and assert zero effects per candidate.
  Lower-settlement tests instrument four reflective traps and intentionally permit the native
  Promise resolver's `then` lookup. That is not a promise that native Promise resolution itself is
  hook-free. Callable Proxy tests generally count `apply`, not every possible reflective trap.
- Rewritten manifest-response tests use all thirteen traps for ordinary top-level responses, nested
  errors, and a Blob Proxy. Both success/failure top-level revoked proxies and property/tag accessors
  are covered. Missing required properties, bad status, custom/null prototypes, and sanitized own
  result keys are asserted.
- The retired-checksum Proxy test now instruments only `get`, `getPrototypeOf`, and `ownKeys`; HEAD
  used an all-trap handler for checksum evidence. In particular, descriptor inspection is no longer
  counted there. Current production code rejects a present checksum without traversing it, which is
  correct. This is a concrete instrumentation reduction, not an observed hook execution. Reusing the
  all-trap handler would preserve that negative assertion economically. Nested revoked error/Blob
  coverage is not complete.
- Std's pure encoder explicitly disclaims a hook-free boundary for programmatic proxies. I did not
  impose Server native-Proxy detection on it.

No other material loss was established in the mapped producer/manifest obligations. This statement
is limited to the inspected tests, not every historical test in FS or Server.

## Exact-document and publication fences

Source and executed controls support keeping the current distinction:

- FS holds original manifest bytes/metadata and requires the final exact bytes/checksum to match;
  content-equal metadata replacement during verification yields `changed`. A fresh operation can
  independently verify the replacement under the same content pin.
- Projection checks source and stage document fences. Content-equal source replacement after
  selection/publication refuses with completed outputs truthfully retained; stage replacement
  refuses instead of authorizing publication. The full projection file executed successfully.
- Materialization retains the downloaded checksum through stage/final verification. An initially
  existing candidate gets its own first checksum, which is not reset after sealing.
- `separateWinnerChecksum` requires a distinct coexisting private stage and candidate before the
  candidate can establish its own document baseline. Neither an occupied result nor a committed
  error alone establishes a separate winner. Executed changed/unchanged ambiguous-publication
  controls, separate equal-content winner, and replacement-during-sealing cases passed.
- The selected hosting test passed: pinned hosting is asset-only; local hosting retains its exact
  document and refuses replacement. This is not a browser-execution or filesystem-race guarantee.

## Executed proof

Commands below ran from `/Users/phil/code/org.sys/sys`. These are selected owning-module tasks, not
workspace-wide or process/build/browser runs. The fixtures create isolated temporary trees and
loopback servers. The FS `Sample` helper copies the retained sample into a temporary directory; it
does not regenerate the sample. No serialized build lane was requested or used.

```sh
cd code/sys/fs && deno task test:unit --frozen --cached-only --trace-leaks ./src/m.Pkg.Dist/-test/-input.admission.test.ts ./src/m.Pkg.Dist/-test/-content.admission.test.ts ./src/m.Pkg.Dist/-test/-content.production.test.ts ./src/m.Pkg.Dist/-test/-Pkg.Dist.test.ts ./src/m.Pkg.Dist/-test/-pinned.verify.manifest.test.ts ./src/m.Pkg.Dist/-test/-pinned.verify.io.test.ts ./src/m.Pkg.Dist/-test/-pinned.verify.tree.test.ts ./src/m.Pkg.Dist/-test/-pinned.admitManifest.input.test.ts
```

Result: **8 passed, 83 steps, 0 failed**.

```sh
cd code/sys/fs && deno task test:unit --frozen --cached-only --trace-leaks ./src/m.Pkg.Dist/-test/-project.test.ts
```

Result: **2 passed, 19 steps, 0 failed**. Both host alias steps ran, rather than being ignored.
An earlier projection selection using `--filter 'content-equal'` selected zero tests
(`0 passed, 0 failed, 2 filtered out`); that attempt supplies no proof. The full-file run above closes
that selection error.

```sh
cd code/sys/server && deno task test:unit --frozen --cached-only --trace-leaks ./src/m.server.dist/-test/-generation.authority.test.ts ./src/m.server.dist/-test/-materialize.authority.test.ts && deno task test:unit --frozen --cached-only --trace-leaks ./src/m.server.dist/-test/-content.identity.test.ts --filter 'Server canonical content identity'
```

Results: **4 passed, 59 steps, 0 failed**, then **1 passed, 8 steps, 0 failed**.
Earlier individual selected runs also passed; the explicit runs above are the receipts relied upon
here, without double-counting reruns. No custom reproducer was authored or executed because the
assignment permits only the report as authored output and prohibits source/test edits.

Runtime probes `deno --version` and `uname -sm` returned Deno 2.9.7,
V8 15.0.245.2-rusty, TypeScript 6.0.3, Darwin arm64. Both owning `test:unit` tasks expand to
`deno test -P=test`. FS's preset grants read/write/env; Server additionally grants net/run. No
permission was broadened. Configured-permission experimental warnings were emitted; no permission
or provenance denial occurred.

## Source state, attribution, and inspected inputs

HEAD at entry and final observation:
`8d97fe4088bed6764e804424b767b089ffb13cf3`.

Read-only reachability checks confirmed both prerequisite commits are ancestors:

- `e6316e80b8cd74b0982f25c8f635ba4a28f3b219` —
  `fix(driver-signer): preserve own keys in canonical Dist documents`
- `872b5a34d55ecee83d8bede21446c76ebd13965d` —
  `fix(crypto): preserve every selected key in composite hash builders`

The integrated breaking item remains unchecked in the permitted opening arc. Commit subjects are
scope/history evidence only. Round 01, sibling reports, corrections/adjudications, preparation copies,
and implementer history were not consulted.

The reviewed source is extensively **unstaged dirty work**, not HEAD. Scoped staged-diff checks were
empty. Relevant untracked files were explicitly read:

- `code/sys/std/src/m.Pkg/m/m.Dist.Content.ts`
- `code/sys/std/src/m.Pkg/-test/-m.Dist.Content.test.ts`
- `code/sys/fs/src/m.Pkg.Dist/-test/-content.admission.test.ts`
- `code/sys/fs/src/m.Pkg.Dist/-test/-content.production.test.ts`
- `code/sys/server/src/m.server.dist/-test/-content.identity.test.ts`

Content comparison, not just status: repeated live reads and tracked diffs showed no change in the
revisited capture, settlement, manifest, fixture, and new content-test inputs. Full-index final
worktree diff identities for the two finding owners were:

| Path | Observed worktree blob identity in `git diff --full-index` |
| --- | --- |
| `code/sys/server/src/m.server.dist/u.generation/u.is.ts` | `51b8a061690acfd13f28c0930b15c1b89bd2c9cc` |
| `code/sys/server/src/m.server.dist/u.materialize/u.input.ts` | `ca7b95be106145a33678cab06cd4c4936f03bfcc` |
| `code/sys/fs/src/m.Pkg.Dist/u.verify/u.manifest.ts` | `ebe2f227a07b14dfebd3c2087e618003378ad6e3` |
| `code/sys/fs/src/m.Pkg.Dist/u.verify/u.verify.ts` | `c58a734695a25fc4dbac27c676f365001d0267ad` |

These identify observed tracked content; they are not claims that new objects were written or that
an immutable review snapshot exists. Reopened untracked encoder/FS content tests/Server identity
tests matched their earlier displayed contents. I did not establish byte stability of the complete
transitive runtime import closure or independently attest the dependency cache. This remains an
explicit source-state limit, not a clean reproducible-build receipt.

Relevant actual Git observations included:

```sh
git rev-parse HEAD
git merge-base --is-ancestor e6316e80b HEAD
git merge-base --is-ancestor 872b5a34d HEAD
git log -1 --format='%H %s' e6316e80b
git log -1 --format='%H %s' 872b5a34d
git diff --cached --name-status -- code/sys/fs code/sys/server code/sys/std code/sys/types
git diff --exit-code HEAD -- deno.json deno.lock deps.yaml imports.json code/sys/fs/deno.json code/sys/server/deno.json code/sys/fs/src/-test/-sample-5 code/sys/server/src/m.server.dist/u.generation/u.owner.ts code/sys/std/src/m.Is/m.Is.ts
git ls-tree HEAD -- deno.json deno.lock deps.yaml imports.json code/sys/fs/deno.json code/sys/server/deno.json
git diff -- code/sys/fs/src/m.Pkg.Dist/-test/-pinned.verify.manifest.test.ts
git diff -- code/sys/server/src/m.server.dist/u.generation/u.is.ts code/sys/server/src/m.server.dist/u.materialize/u.input.ts code/sys/server/src/m.server.dist/-test/-generation.authority.test.ts
```

The `--exit-code` content comparisons were empty at both observations, including tasks, dependency
control files, retained FS sample, and the unchanged Generation owner. `deno.lock`'s HEAD blob was
`9804db48f8ef3665d62432ce0598d27284c4df79`. This comparison does not attest all cache bytes.
Additional scoped status/stat/full-index and source/test diffs supplied the maps above. A combined
large test diff was truncated; the principal producer/manifest diffs and live contents were inspected
separately rather than treating omitted output as reviewed.

Path discovery found no scoped `AGENTS.md` under FS, Server, or `./-agent`; no root `.prettierrc` was
present. One initial `find` spelling used bare `-agent` and failed as command syntax; repeating with
`./-agent` succeeded. It was not an access denial.

### Principal inspected files

The following directory-plus-leaf lists denote exact repository paths, not additional claimed test
executions:

- `code/sys/types/src/t/`: `t.Pkg.dist.ts`.
- `code/sys/std/src/m.Pkg/m/`: `m.Dist.Content.ts`, `m.Is.ts`;
  `code/sys/std/src/m.Pkg/-test/`: `-m.Dist.Content.test.ts`;
  `code/sys/std/src/m.Is/`: `m.Is.ts`.
- `code/sys/fs/src/m.Pkg/`: `t.ts`;
  `code/sys/fs/src/m.Dir.Hash/`: `u.compute.ts`.
- `code/sys/fs/src/m.Pkg.Dist/u.verify/`: `u.input.ts`, `u.verify.ts`, `u.manifest.ts`,
  `u.admitManifest.input.ts`, `u.admitManifest.ts`, `u.limit.ts`, `u.io.ts`, `u.tree.ts`, `common.ts`.
- `code/sys/fs/src/m.Pkg.Dist/u/`: `u.compute.ts`, `u.hash.ts`, `u.load.ts`, `u.project.ts`;
  `code/sys/fs/src/m.Pkg.Dist/`: `common.ts`.
- `code/sys/fs/src/m.Pkg.Dist/-test/`: all nine files in the FS execution commands;
  `-u.dist.fixture.ts`, `-u.manifest.fixture.ts`, `-u.pinned.fixture.ts`, `-u.project.fixture.ts`.
- `code/sys/server/src/m.server.dist/u.generation/`: `u.input.ts`, `u.is.ts`, `u.open.ts`,
  `u.result.ts`, `u.owner.ts`, `common.ts`.
- `code/sys/server/src/m.server.dist/u.materialize/`: `u.input.ts`, `u.run.ts`, `u.failure.ts`,
  `u.manifest.ts`, `common.ts`; `code/sys/server/src/m.server.dist/`: `t.ts`.
- `code/sys/server/src/m.server.dist/-test/`: `-generation.authority.test.ts`,
  `-materialize.authority.test.ts`, `-content.identity.test.ts`, `-materialize.test.ts`.
- `code/sys/server/src/-test/`: `u.fixture.dist.ts`, `common.ts`, `mod.ts`.
- Task/dependency authority: root `deno.json`, `deps.yaml`, `imports.json`,
  `code/sys/fs/deno.json`, `code/sys/server/deno.json`; lockfile equality observed through Git.
- Workspace/canonical AGENTS and the canonical protocol set; round-02 README, assigned charter, and
  only the governing plan's permitted opening/requirements sections.

Public nonlocal imports used by the Server proof are `@sys/fs` / `@sys/fs/pkg`, `@sys/crypto/hash`, and
Std helpers, including the server-native predicate surface. The neutral fixture belongs to Server.
I did not import downstream-private fixtures or borrow another package's permission preset.

## Remaining evidence and economy

Required remainder is concrete: execute the genuine entry-budget replay and release controls in
finding 1; execute the direct lifecycle policy controls in finding 2; execute both nested-pin
lifecycle directions through Server boundaries; and execute genuine tighter file/aggregate-byte
settlement controls, including no-owner/release assertions. Allocation ordering beyond the inspected
source and complete transitive-input stability are not proved. No cross-process lease, browser,
provider, or release lane was run or inferred from these unit results.

Keep the Std encoder pure, FS as content/path admission owner, materialization as acquisition and
operation-document owner, and Generation as independent settlement/lease owner. The observed
problems need narrow capture/accounting corrections and discriminating tests, not another API,
compatibility layer, whole-tree pass, or broad test consolidation. Preserve the successful
wrong-pin, document-replacement, cleanup, and publication-provenance controls.

Report-only validation:
`deno fmt --check ./-agent/-plan/@sys.fs/dist-content-identity.plan.reviews/02/01-fs-server.review.md`
returned exit 1 for Markdown wrapping and table alignment. No formatter write was performed; this
report is not claimed formatter-clean.

Only this report was authored. No production/test edits, formatter writes, dependency regeneration,
Git mutations, sample regeneration, or concurrent App/UI changes were made.

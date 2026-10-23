# Review 3: real build and serving composition

## Verdict

**changes required** — one source-established failure-reporting defect in the new pipeline test.
Required runtime composition proof remains **incomplete**. No build, test, check, lint, browser,
provider operation, or evidence rebinding was executed in this session. This is not landing clearance.

The human initially authorized source inspection only, withholding the composition slot, then
explicitly authorized this report despite incomplete runtime proof. That later instruction did not
supply a build slot or authorize source changes.

## Scope, independence, and attribution

Repository: `/Users/phil/code/org.sys/sys`.

Governing artifact: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`.
Target: `feat(dist)!: unify build pins and verification on canonical content identity`.

Read round 03's README and charter 3, the plan's opening five lines, Proposed identity contract,
Verification model and the changed parsing boundary, workstreams C/G/H, Required adversarial proof
matrix, and Completion boundary. Loaded canonical instructions and searched the applicable agent
and source subtrees for scoped AGENTS files; none were found there. No sibling reports, other review
rounds, adjudications, implementing conversation, or recovery/preparation snapshots were read.

Reachable exact-subject history supports the first two checked arc items:

- `e6316e80b8cd74b0982f25c8f635ba4a28f3b219` —
  `fix(driver-signer): preserve own keys in canonical Dist documents`.
- `872b5a34d55ecee83d8bede21446c76ebd13965d` —
  `fix(crypto): preserve every selected key in composite hash builders`.
- No matching reachable commit was returned for the unchecked target subject.

Observed HEAD remained `8d97fe4088bed6764e804424b767b089ffb13cf3`. No arc was edited.
This review concerns inspected live changes, not just that commit.

### Inspected implementation and proof surfaces

Paths below are repository-relative. A directory prefix applies only to its listed files, not an
assertion that the entire directory was reviewed.

- `code/sys.driver/driver-vite/deno.json`.
- Under `code/sys.driver/driver-vite/src/m.vite/`:
  - `u/u.build.ts`, `u/u.wrangle.ts`, `u/u.bootstrap.ts`.
  - `t.ts` through its tracked diff.
  - `-test/-build.test.ts`, `-test/-build.workspace-composition.test.ts`,
    `-test/u.bridge.fixture.ts`.
  - `-test.external/-dist.pipeline.ts`, `-test.external/u.html-integrity.project.ts`.
- `code/sys.driver/driver-pi/deno.json`.
- Under `code/sys.driver/driver-pi/-scripts/`:
  - `-test.external/-task.start.gui.preview.real.ts`.
  - `m.start.gui.preview.build/u.runtime.ts`, `m.start.gui.preview.build/u.deno.ts`,
    `m.start.gui.preview.build/-entry.build.ts`,
    `m.start.gui.preview.build/-test/-.test.ts`.
- Under `code/sys.driver/driver-pi/src/m.cli/m.profiles/`:
  - `u.start/u.gui/u.pkg.ts`, `u.start/u.gui/u.service.ts`,
    `u.start/u.gui/u.session.ts`, `u.start/u.gui/u.service.evidence.ts`.
  - `-test/-u.start.gui.pkg.test.ts`.
  - `-test/-u.start.gui.test.ts`: the cancellation/host-termination package-read tests at
    lines 240–306; other test names were located, not treated as inspected bodies.
- Under `code/sys/fs/src/m.Pkg.Dist/`:
  - `u/u.compute.ts`, `u/u.project.ts`, `m.Pins.ts`, `u.verify/u.part.ts`.
  - `-test/-project.test.ts`: source-mutation and metadata-replacement tests at lines 77–140.
- Under `code/sys/server/src/m.server.dist/`:
  - `u.materialize/u.run.ts`, `u.materialize/u.manifest.ts`.
  - `u.server/u.read.ts`, `u.server.start.verified/u.request.handler.ts`.
- Dependency/task authority: root `deno.json`, `deps.yaml`, `imports.json`, `package.json`.
  Lockfile path/state was observed, but its complete contents and installed cache were not audited.

Direct dependencies were followed to establish who computes projection identities, captures pins,
fences document changes, acquires resource bytes, and checks served/package bytes. This was not a
second broad FS/Server, Signer/Crypto, UI, or release review.

## Finding F1 — P2: pipeline cleanup can erase the primary failure

**Path/symbol:**
`code/sys.driver/driver-vite/src/m.vite/-test.external/-dist.pipeline.ts:253–265`,
the main test's `finally` block.

**Attribution:** introduced in the untracked pipeline test. This is a test-proof/reporting defect,
not evidence that production content-pin admission is incorrect.

**Source-established failure sequence:**

1. A build/projection/materialization/served-byte assertion rejects with error A after a host has
   been registered in `hosts`.
2. During cleanup, that host's `close()` rejects with error B.
3. `Promise.allSettled` retains B, but the final loop throws B from `finally`.
4. JavaScript replaces the pending rejection A with B. A is no longer reported.

A second branch loses additional cleanup evidence: if `source.dispose()`, `restore()`, or store/root
cleanup rejects, execution never reaches the loop that reports rejected host closes. A rejection
from `restore()` also prevents subsequent store/root cleanup attempts. The implementation does await
host closes; the defect is not a missing `await` or a false successful return after rejection.

**Violated invariant:** charter dimension 6 requires preserving the primary failure and truthful
rejected-close/cleanup reporting. The pipeline's proof failure must not be silently replaced by
cleanup failure.

**Smallest coherent correction/owner:** the Vite pipeline-test owner should retain the main-operation
outcome and independently settle eligible cleanup steps, then report the primary failure together
with cleanup failures outside `finally`. Preserve the deliberate prohibition on ordinary recursive
removal after capability store cleanup refuses. Do not alter production scheduling or introduce a
general cleanup framework merely to repair this test.

**Closing proof:** a narrow deterministic test should combine a body assertion failure with a
rejected host close and assert exact cause identities survive. Also combine source-disposal failure
with host-close failure, and cover successful-body/failed-cleanup and all-success controls. Verify
that capability-removal refusal still prevents the recursive fallback. These are proposed proofs,
not tests executed here.

## Execution blockers and limitations

### B1 — composition slot not granted

All three required real lanes remain unexecuted. The review cannot establish repeated-build equality,
cold/warm acquisition, served bytes, real preview isolation, leak freedom, or successful cleanup from
source inspection alone. Tools-slot release and absence of its children were not independently
observed. No composition slot was acquired or released by this reviewer.

### B2 — outer frozen/cached flags do not establish child containment

The inspected candidate lanes launch additional Deno processes:

- `code/sys.driver/driver-vite/src/m.vite/u/u.wrangle.ts::wrangle.args` includes `--no-prompt`,
  but neither `--frozen` nor `--cached-only` in the Vite child argv.
- `code/sys.driver/driver-vite/src/m.vite/-test/u.bridge.fixture.ts::reachablePackageSpecifiers`
  launches `deno info --json <entry>` without frozen/cached flags. Its cwd is the workspace root.
- `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/u.runtime.ts::buildPreviewGeneration`
  launches the build child with `--frozen` and `--no-prompt`, but not `--cached-only`.
  That child subsequently invokes the Vite build path above.

These omissions are retained execution surfaces: the two Vite files were unchanged against the
index, and the inspected Pi runtime diff changes only the handoff from document integrity to
`build.pin`. Their age is not proof that the present review execution contract is satisfied.

The source does not establish a fully frozen/cache-only child chain. Parent CLI flags are not child
argv. No fetch, cache regeneration, lockfile mutation, or permission failure was actually observed,
because the commands were not run. This is a preflight blocker, not a claim that a forbidden effect
already occurred or that the Dist identity implementation caused it.

**Resolution:** the execution/toolchain owners must provide or demonstrate a compliant frozen,
cache-only lane across the actual child graph, with no dependency regeneration or authority expansion.
Then re-inspect material inputs and child effects and obtain the exclusive composition slot. A slot
alone changes scheduling, not these constraints. This reviewer made no source/profile changes.

### Required commands, not executed

From `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite`:

```sh
deno task test:unit --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-build.workspace-composition.test.ts
deno task test:dist:pipeline --frozen --cached-only --no-prompt --reporter=dot
```

Then, serially, from `/Users/phil/code/org.sys/sys/code/sys.driver/driver-pi`:

```sh
deno task test:preview:real --frozen --cached-only --reporter=dot
```

Vite's pipeline task supplies leak tracing through `test:unit`; Pi's real-preview task supplies
`--no-prompt`, leak tracing, the `preview-test` preset, and workspace write denial. Vite uses its
`test` preset. These task declarations were inspected, not executed or treated as proof of child
containment. No alternative runtime or broader permission invocation was attempted.

Expected effects from source include Vite's owned fixture copies, the fixed workspace-composition
fixture directory, bootstrap/fixture import files, unique pipeline stores/listeners, and Pi's unique
generation/exchange directories. Pi explicitly grants its build child writes to package/workspace
`node_modules/.vite` cache paths. No assertion of successful cleanup or untouched shared outputs is
made without execution. The sample App/HTML/CSS/image inputs and transitive installed toolchain were
not exhaustively snapshotted.

## Invariant-to-proof map

Every row below is source-derived and unexecuted in this session.

| Boundary | Inspected mechanism and meaningful control | Proof limit |
|---|---|---|
| Normal build authority | `buildWith` requires child success, successful package write when supplied, nonempty output, and computed Dist before returning `ok: true` with pin/document checksum. The failed-write test leaves stale readable package bytes, proves child success, then expects no Dist/pin/checksum or manifest. | The injected write-result failure branch is explicit; no runtime rejection/cause or cleanup behavior was measured. |
| Repeated builds | The pipeline invokes real `Vite.build` twice against one generated project, expects equal inventories/pins but different build times/document checksums. The Pi real-preview test likewise replaces old document-inequality expectations with equal content pins and unequal document checksums. | No real child ran here. Equality uses producer results, not an independent literal encoding vector; lower encoder-vector correctness is outside this pass's proof. |
| Projection and independent pin | `project` selects from authenticated content, computes each output, verifies copied parts, and rechecks the original source document checksum. The pipeline records local producer pins to files and captures them before HTTP acquisition; three inventory digests must differ. | Recording is test-local, not the real Cloudflare/sample publication workflow. Source metadata-mutation tests inspect exact `changed` refusal with already published outputs retained. |
| Public cold/warm materialization | The pipeline supplies recorded pins to public `Dist.materialize`, expects cold promotion, then reuses the first store with responses removed and no additional source requests. Production retains document checksums across stage/final checks. | The HTTP source is an in-memory fixture serving real build bytes. Warm proof is no-request reuse, not provider availability. Concurrent-winner branches were inspected but not adversarially executed here. |
| Serving and stale expectation | Public `DistServer.start` serves admitted resources through per-read checksums and lengths. Pipeline expects pinned `/dist.json` refusal, all inventoried bytes to match, post-start corruption refusal, new pins after edits/rename, and stale remote manifest refusal before resource acquisition. | No HTTP response was observed here. SRI assertions compare hosted bytes; they do not execute a browser or authenticate the whole browser graph. |
| Covered package authority | Pi checks own inventory membership, canonical part size at most 16 KiB, checksum-verified reads, fatal UTF-8, and strict own name/version fields against separate `expectedPkg`. Root labels never enter the check. | Generic Dist/project need not include the package file. Pi policy, not root metadata, owns that requirement. |
| Independent package negative control | Real-preview `startHost` admits the supplied expectation, then changes only expected package name against the same host/directory/pin and expects refusal. Package tests also cover absent/conflicting labels, different covered packages, malformed/missing/unlisted/inherited/oversized declarations, and stale bytes. | The real-preview control is post-listener admission, not a pre-bind package guarantee. Its callback uses real host/package owners, not the full production GUI presentation session. |
| Async package lifetime | `u.session.ts::admitPackage` races reads with control/status/presentation/application termination, aborts and drains before generation settlement. Inspected unit cases hold reads pending and assert no readiness or premature release. | These are injected lifecycle controls. Their timing and exact runtime outcomes were not executed. |
| Preview ownership | `mainWith` passes one unique generation to the GUI, disposes after resolved outcomes, and deliberately retains it on GUI rejection without proven host settlement. Real-preview test keeps host one alive while building/closing host two and compares shared Dist tree snapshots. | Retention on ambiguous GUI rejection is intentional and tested, not automatically a leak defect. Shared release evidence/cache stability and OS behavior remain unproved. |
| Legacy evidence | Checked-in `u.service.evidence.ts` still has `integrity`; `snapshotAuthority` explicitly refuses an own legacy integrity member. | No release rebinding, fallback startup, or public release acceptance was attempted. |
| Cleanup | Pi build exchange uses settled operation/cleanup results; package-proof helper aggregates admission and close errors. Pipeline waits for closes but has F1. | No leak tracing, rejected-close injection, or cleanup success was observed. |

The retained build tests still assert module/service-worker output, bundling behavior, path snapshot
immutability, and failure display behavior. Added narrowing removes authority fields from failed
build responses rather than keeping an invalid success-shaped object. Inspected Pi preview changes
preserve separate-directory and first-host-liveness assertions while replacing the old identity
comparison. No claim is made that every assertion elsewhere in the migration was audited.

## Material evidence and stability

Entry observations recorded scoped tracked/untracked state, unstaged diffs and staged-state checks.
The Vite pipeline and Pi package helper/test were untracked; primary Vite/Pi and FS/Server migration
files had unstaged changes. Scoped cached-diff checks returned no staged changes.

Content comparisons actually performed:

- Repeated full tracked diffs for Vite `u/u.build.ts` and `t.ts`, Pi preview `u.runtime.ts`, and
  Pi GUI `u.session.ts` matched the earlier diff content in this session.
- The full untracked pipeline test was read twice with matching content; its finding-bearing cleanup
  section was reopened once more immediately before report authoring and matched.
- Child argv sections in Vite `u/u.wrangle.ts`, `-test/u.bridge.fixture.ts`, and Pi preview
  `u.runtime.ts` were reopened immediately before report authoring and matched the earlier reads.
- A read-only `git diff --exit-code` check returned no differences for root `deno.json`, `deps.yaml`,
  `imports.json`, `package.json`, `deno.lock`, Pi `deno.json`, and the two Vite child-command files.

This is not an atomic snapshot. Other inspected dirty/untracked files were not all reread at report
exit; their entry observations support bounded source deductions, not a complete exit-byte stability
attestation. No material drift was observed in the compared surfaces. Full fixture/transitive-cache
content stability remains unknown and requires re-baselining before any runtime proof. HEAD/status
agreement alone was not used to assert dirty-byte stability.

### Executed observations and outcomes

All executable commands were read-only Git observation or path/line discovery. No Deno command ran.
Relevant exact Git observations included:

```sh
git rev-parse HEAD
git log HEAD --format='%H %s' --fixed-strings --grep='fix(driver-signer): preserve own keys in canonical Dist documents' --grep='fix(crypto): preserve every selected key in composite hash builders' --grep='feat(dist)!: unify build pins and verification on canonical content identity'
git diff -- code/sys.driver/driver-vite/src/m.vite/u/u.build.ts code/sys.driver/driver-vite/src/m.vite/t.ts code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/u.runtime.ts code/sys.driver/driver-pi/src/m.cli/m.profiles/u.start/u.gui/u.session.ts
git diff -- code/sys.driver/driver-pi/-scripts/-test.external/-task.start.gui.preview.real.ts
git diff --cached --stat -- code/sys.driver/driver-vite code/sys.driver/driver-pi code/sys/fs/src/m.Pkg.Dist code/sys/server
git diff --exit-code -- deno.json deps.yaml imports.json package.json deno.lock code/sys.driver/driver-pi/deno.json code/sys.driver/driver-vite/src/m.vite/u/u.wrangle.ts code/sys.driver/driver-vite/src/m.vite/-test/u.bridge.fixture.ts
```

History/diff outcomes are recorded above. `ls` established that the assigned report did not exist
before this write. File contents were opened through `read`; narrow `rg` searches only located
headings and candidate test/argv lines. Initial hyphen-prefixed discovery commands failed option
parsing and were corrected with `./` paths; this had no source/runtime effect. No permission or
provenance denial occurred. No other session's command results are adopted as this session's proof.

## Canon, design, and remaining claims

**Concrete mismatch:** F1 violates the explicit proof failure/cleanup contract. No formatter or lint
was run; therefore this report supplies no observed lint diagnostic or formatter-stability verdict.
Do not turn a later lint fix into an unreviewed change in scheduling or failure precedence.

**Optional simplifications:** none required. No additional abstraction or test matrix is proposed
beyond the narrow failure-preservation regression for F1.

**Strongest case for leaving owners unchanged:** the inspected architecture already keeps the
semantic responsibilities separate: FS owns inventory production, projection and byte verification;
Server owns bounded acquisition and authenticated serving; Pi owns its independent package policy;
Vite composes production without inventing another identity. Content pins, document checksums,
resource hashes and SRI have distinct uses. Neither F1 nor B2 justifies changing that ownership split.

Browser execution, live publication, provider acceptance, cross-OS safety, immutable transitive
provenance, real Pi release binding, complete dirty-input stability, and the three required local
runtime lanes remain unproved. Adjudicate the source finding and execution blockers on that basis;
this report does not close the integrated replacement.

# Tools document ownership and failure settlement

## Verdict

**changes required** — two source-derived ownership/continuity failures remain. All five charter
execution lanes passed; an additional bounded Pull argument lane also passed. Neither failure below
was exercised by those existing tests. Proposed reproductions are explicitly not execution receipts.
This is scoped review, not whole-system or landing clearance.

Blind Go 2 review. No implementing conversation, sibling report, other review round, adjudication or
preparation snapshot was read. The charter's model recommendation is not a runtime attestation.

## Authority, attribution and material stability

Repository: `/Users/phil/code/org.sys/sys`. Governing plan:
`-agent/-plan/@sys.fs/dist-content-identity.plan.md`. Target:
`feat(dist)!: unify build pins and verification on canonical content identity`.

The opening five lines and only the five charter-named normative sections were read. Reachable
history uniquely matched `e6316e80b` and `872b5a34d` to the two checked prerequisite subjects; no
exact target subject was found. HEAD remained `8d97fe4088bed6764e804424b767b089ffb13cf3`. No arc
edit was made. Applicable loaded workspace/canonical instructions and every canonical file were
traversed. Scoped AGENTS discovery found no applicable additional Tools instructions.

Entry and exit inspection distinguished unstaged, staged and untracked state. The reviewed tracked
Tools deltas were unstaged; the scoped staged diff was empty. The new
`code/sys.tools/src/cli.deploy/u.staging/-test/-manifest.failure.test.ts` was untracked. Attribution
came from live reads and actual Git diffs, not proximity to unrelated dirty files.

Material comparison:

- Full entry/exit diffs matched for `code/sys.tools/deno.json`, staging `u.copyInto.ts`,
  `u.manifest.ts`, `u.finalizeDistTree.ts`, `u.generateHtml.ts`, staging `-test/-u.execute.test.ts`,
  R2 `-test/-u.push.test.ts`, Pull `u.add.ts` and `-test/-u.add.test.ts`. These are content
  comparisons, not merely equal status lists.
- The full untracked failure-test file was reopened and matched its initial read.
- Inspected unchanged staging `u.identity.ts`, `u.execute.ts`, `u.verifyStagedDist.ts`,
  `u.stageMappings.ts`, `u.lease.ts`, `u.execBuildCopy.ts`, `u.buildLease.ts`, `mod.ts`, and
  `-test/-u.copyInto.test.ts` remained equal to HEAD. The same held for Deploy `u.stage.ts`,
  `-test/u.fixture.ts`, `-test/-u.stage.lifecycle.test.ts`, `-test/-u.stage.concurrent.process.ts`,
  R2 `u.push.ts` and `-test/u.fixture.ts`, Tools test/common barrels, and FS `m.Fs/u/u.copy.file.ts`
  and `u/u.write.ts`.
- Root `deno.json`, `deps.yaml`, `imports.json` and `deno.lock` had no staged/unstaged delta. Tasks,
  selected `test` permissions, dependency authority and import map were read. The lock was checked
  through tracked identity/diff evidence, not fully audited.
- Direct dependencies followed later were FS `code/sys/fs/src/m.Pkg.Dist/u.verify/u.verify.ts`, to
  establish local verification's document baseline, and Pull `u.add.run.ts`, `u.args.ts`,
  `m.cli.ts`, `mod.ts`, and `-test/-u.args.test.ts`, to resolve command-constraint propagation.
  Their inspected deltas/read content were compared subsequently; this is not a claim that their
  full bytes were baselined before the first five runs. Deploy `mod.ts` was checked to confirm the
  fault seams are not public options.

No material drift was observed in these comparisons. No atomic snapshot, continuous writer
exclusion, complete transitive source/cache attestation or unrelated-worktree stability is claimed.
The broad owner tasks load more modules than the selected test bodies; their entire initialization
graph was not independently audited. Existing cached dependencies were used; none were regenerated.

## Prioritized findings

### F1 — High: a refused copy can confer deletion rights over a foreign regular manifest

Evidence:

- `code/sys.tools/src/cli.deploy/u.staging/u.copyInto.ts:99`, `copyFile`.
- `code/sys.tools/src/cli.deploy/u.staging/u.copyInto.ts:134`, `rethrowCopyFailure`.
- `code/sys/fs/src/m.Fs/u/u.copy.file.ts:49`, destination-exists refusal before `Deno.copyFile`.
- `code/sys.tools/src/cli.deploy/u.staging/u.manifest.ts`, `retractStagingManifests`.

Source-derived sequence:

1. `copyFile` observes an absent destination `dist.json` in the retained directory.
2. A different writer creates a regular manifest there while the default copy performs its awaited
   source/parent checks. The directory itself is unchanged.
3. `Fs.copyFile(..., { force: false, throw: true })` observes the collision and throws without
   copying.
4. `rethrowCopyFailure` hashes the now-present file and records it as this operation's manifest.
5. Leased rollback validates those newly adopted bytes and deletes them.

The ordinary pre-existing collision test does not cover this ordering: it fails at the earlier
`copyInto` collision check. The new failure tests label bytes written by their injected copy as
owned; they do not model a copy that positively refused to touch a foreign destination.

Invariant: observed presence plus exact checksum is not creation provenance. Preserving the original
copy error does not authorize deleting the file that caused that error. This is not a demand for
universal no-follow/CAS protection: the lower copy explicitly observes and refuses the collision.

Attribution: **retained defect**. The HEAD-side diff already retained any present failed-copy
manifest. The current delta correctly moves initial `lstat` inside the error-preserving catch, but
retains this ownership inference.

Smallest coherent correction: Tools must retain failed-copy residue only with evidence that the copy
owned/produced it; positively untouched collisions must not enter the ledger. If the current generic
copy result cannot distinguish those cases, obtain narrowly scoped creation/touch evidence at the
existing FS copy owner or use an owned candidate. Do not classify by error-message text or discard
all legitimate partial-write cleanup.

Closing proof, proposed and not run: extend the existing injected-copy test by creating a foreign
regular `to` file, then delegating to the real `Fs.copyFile(from, to, options)` with the captured
options. Assert collision failure, empty ledger and unchanged foreign bytes after retraction. Pair
it with the existing owned partial-byte throw/return controls and verify original error
identity/cause. This uses the real refusal branch without global patching or a timed race.

### F2 — High: successful cleanup drops the enclosing root-document fence

Evidence:

- `code/sys.tools/src/cli.deploy/u.staging/u.finalizeDistTree.ts:86–120`, successful-body
  settlement.
- `code/sys.tools/src/cli.deploy/u.staging/u.stageMappings.ts:159–175`, ignored finalization record
  followed by new local verification.
- `code/sys.tools/src/cli.deploy/u.staging/u.verifyStagedDist.ts`, fresh `Pkg.Dist.Local.verify`
  call.
- `code/sys/fs/src/m.Pkg.Dist/u.verify/u.verify.ts`, `verifyWithIo` captures its own first manifest.

Source-derived sequence:

1. Finalization writes and validates root document M, then stores successful `body.value`.
2. While awaited temporary-child cleanup runs, another writer replaces the root with supported,
   equal-content M′. Child removal succeeds normally.
3. The success branch returns `body.value` without revalidating the root after cleanup.
4. `stageMappings` discards that record. Its following local verification establishes a fresh M′
   baseline and never compares `verification.manifestChecksum` to the retained root checksum.
5. With M′ otherwise valid and stable, staging can return success for a different document from the
   one it finalized. Directory checks do not detect a same-directory document rewrite.

The existing successful-body tests force child cleanup to fail, which reaches root retraction and
its checksum check. They do not cover **successful child cleanup plus changed root**. The
synchronous `afterManifest` mutation tests occur before the body's root validation and therefore
cannot close this later interval.

Invariant: content equality must not reset the enclosing operation's retained document baseline. The
local verifier correctly protects its own interval; it cannot establish continuity with an
expectation the caller never supplies or compares.

Attribution: **retained composition gap**, not a claim that the new I/O seam created it. The
HEAD-side finalizer already returned after successful cleanup, and HEAD `stageMappings` likewise
ignored the finalization result. The new v2 contract expressly requires document continuity separate
from content identity; the new tests leave this success interval uncovered.

Smallest coherent correction: keep the existing root record authoritative through successful
temporary cleanup and the final verification handoff. Recheck the retained document/directory after
cleanup, and compare final verification's document checksum with the original record before
returning staging success. Keep rollback under the lease and preserve changed foreign bytes on
refusal. No new public pin or alternate identity is needed.

Closing proof, proposed and not run: in the existing finalizer `remove` seam, mutate only root
metadata while removing the unchanged child through real `removeStagingManifest`. Require refusal,
retention of M′, and unchanged original ledger identity; pair with unchanged-root success. Add a
bounded handoff test that changes the document between finalization and local verification and
requires no `StageResult` success. Check combined rollback/release errors remain ordered. This is
snapshot/recheck protection, not an atomic filesystem guarantee.

## Copy/write/observation/cleanup-to-assertion map

1. **Copy failure → retain only manifest residue, preserve the original failure.** Executed
   `-manifest.failure.test.ts`: thrown and returned failures with invalid-JSON regular bytes
   preserve exact error object, checksum, record identity, source/outside bytes, and successful
   retraction. Ordinary payload residue produces no manifest ledger entry. Absent manifest residue
   preserves the original failure. These are real filesystem checks around an injected copy, not
   claims that the OS produced that particular partial write. F1 is the missing foreign-regular
   case.

2. **Initial residue observation failure → ordered combined errors.** Executed both throw/return
   modes after replacing the directory pathname with a regular sentinel. The first residue `lstat`
   reaches `NotADirectory`; assertions require `[copyError, observationError]`, original `cause`,
   empty ledger, preserved displaced bytes and replacement sentinel. This genuinely exercises the
   initial observation, not just a later checksum call.

3. **Unsafe residue → no deletion authority.** Executed symlink residue controls reject at the
   checksum helper's file-kind check and preserve the target/outside bytes. The encompassing catch
   also covers read/hash/ledger exceptions by source inspection. A regular-file read failure after
   successful `lstat` and a ledger-retention exception were not independently fault-executed; no
   complete phase-fault matrix is claimed.

4. **Returned write failure → rollback or paired retention failure.** Executed regular/unsafe
   residue tests assert exact write path, `{ force: true }`, produced Dist shape, original error
   identity, immutable ledger record and actual removal behavior. Unsafe bytes remain untouched and
   error ordering is exact. Native default `Fs.write` catches filesystem errors into its returned
   result. A rejecting injected writer is not covered by these tests; the current finalizer only
   performs residue retention for returned `written.error`.

5. **Hashing await → recheck original document or original absence before writing.** Executed
   retained/absent × changed/unchanged cases assert hashing actually ran, exact replacement bytes
   survive, the original ledger record is not renewed, and unchanged controls succeed. Independent
   pinned verification of the replacement demonstrates that refusal concerns document ownership
   rather than invalid content. This proves the added pre-write fence, not CAS.

6. **Failed body + failed cleanup → preserve both failures.** Executed malformed and supported
   equal-content child/root replacement cases reach body refusal followed by cleanup refusal. Tests
   assert the combined diagnostic, replacement preservation, no false root output, and, in the
   hashing cases, ordered error messages and cause identity. Source settlement uses
   `[body.error, cleanup.error]` with the body's error as cause.

7. **Successful body + failed temporary cleanup → retract root or report both failures.** Executed
   unchanged-root and changed-root controls record removal order `[child, root]`, ledger membership,
   exact surviving bytes, original cleanup error identity, and `[cleanupError, retractionError]`
   with cleanup as cause. This is distinct from item 6. Neither case establishes continuity when
   temporary cleanup succeeds; see F2.

8. **Failure/cancellation → drain workers, rollback while leased, then release.** `u.execute.ts`
   awaits `Promise.allSettled` and retains a separate first-error flag, including nullish failures.
   Executed root tests cover bounded mapping concurrency, nullish errors, cancellation,
   rollback-before-release, release-error order and waiting ownership. Public lifecycle tests
   exercise real child builds, cross-cwd build-source contention and child-lock release before
   retry. These establish local cooperative lifecycle behavior, not hostile same-user isolation.

9. **R2 optimization → exact-path assets and exact-document manifest publication.** Executed all
   selected R2 push steps through fake Files handles or real local Files/R2 adapters over an
   in-memory bucket. Renamed-path assertion was correctly changed from equal to unequal content
   digest; exact stored asset/manifest bytes, keys, pruning and manifest-last assertions remain.
   Changed remote parts now use supported v2 descriptors, so tests still reach incremental
   publication rather than passing only through invalid-metadata fallback. The intentionally
   inconsistent same-root/different-size control remains. Metadata/layout/BOM controls require
   manifest rewrite; exact inline/ref controls skip it. Method-shorthand/list-page refactoring
   preserves page state and independent expectations. No remote provider operation or browser
   integrity was established.

10. **Pull operator constraints → no downloaded pin or silent override.** Executed add tests persist
    the literal external PIN, reject the named invalid-pin collection and mixed `integrity`, and
    assert no config creation on refusal/dry-run. Projection mode and store isolation controls
    remain. Followed argument parsing because the concrete question was whether CLI pin flags could
    be discarded before configuration acquisition; the additional executed argument lane rejects
    add-only flags outside `add`, including explicit false dry-run, and rejects old/mixed flags.
    `m.cli.ts` parses before loading configuration. No full Pull execution occurred.

## Executed commands and effects

Runtime: Deno 2.9.7, V8 15.0.245.2-rusty, TypeScript 6.0.3, aarch64-apple-darwin. Each test command
below ran from `/Users/phil/code/org.sys/sys/code/sys.tools` through the declared owner task. Each
expands to `deno test -P=test --trace-leaks` with the task's source directory and appended flags.
The selected owner preset grants read/write/env/net/run; no permissions were widened.

```sh
deno task test:deploy:staging --filter='/^Staging: (manifest failure settlement|copyInto)$/' --frozen --cached-only --no-prompt --reporter=dot
deno task test:deploy:staging --filter='/^Staging: owned exact root Dist$/' --frozen --cached-only --no-prompt --reporter=dot
deno task test:deploy --filter='/^@sys\/tools\/deploy public staging lifecycle$/' --frozen --cached-only --no-prompt --reporter=dot
deno task test:deploy --filter='/^R2 Provider: push$/' --frozen --cached-only --no-prompt --reporter=dot
deno task test:pull --filter='/^@sys\/tools\/pull add$/' --frozen --cached-only --no-prompt --reporter=dot
deno task test:pull --filter='/^@sys\/tools\/pull u.args$/' --frozen --cached-only --no-prompt --reporter=dot
```

Outcomes, in that order:

- 2 passed, 19 steps, 0 failed, 5 filtered; about 1 second.
- 1 passed, 45 steps, 0 failed, 6 filtered; about 24 seconds.
- 1 passed, 2 steps, 0 failed, 40 filtered; about 15 seconds.
- 1 passed, 51 steps, 0 failed, 40 filtered; about 14 seconds.
- 1 passed, 8 steps, 0 failed, 22 filtered; about 8 seconds.
- 1 passed, 6 steps, 0 failed, 22 filtered; about 8 seconds.

No zero-selection result was counted. No new test or reproduction file was authored.

Tools slot: explicitly granted by the human, used serially, then released after the first five runs.
The sixth run was a non-build argument test. The runtime probe
`pgrep -fl 'sys.tools.deploy.|staging-root-replacement|deploy-shared-builder|deploy-cancellable-builder|-u.stage.concurrent.process.ts|deno.*test:deploy|deno.*-build.ts|deno.*child.pid'`
returned no match (exit 1). This is a bounded process probe, not universal descendant attestation.
No required slot remains blocked.

Deploy fixtures own canonical OS temporary directories and remove them in `withTmpDir` finally
blocks. Builds execute generated local `test`/`build` tasks, including Deno eval/run children,
controlled lock/watch/cancellation fixtures and bounded verbose output. Child commands do not all
repeat parent frozen/cached/no-prompt flags; inspected generated scripts have no external imports.
The public concurrent-stage child imports the workspace using the existing cache; no complete child
cache attestation is claimed. Staging state and build-source locks are inside fixture roots. No
shared sample build, real release rebinding, provider push or GUI reset ran.

Cleanup limitation: Pull add's existing `tempRoot()` creates eight `sys.tools.pull.add.*` OS
temporary roots without a finally cleanup. The suite passing does not prove their removal; no
cleanup outside the report-only boundary was performed. This retained fixture issue is separate from
production ownership. Exact generated root names were not emitted by the tests.

## Canon and design assessment

Concrete changed-code mismatch: the new metadata-replacement block in
`code/sys.tools/src/cli.deploy/u.staging/-test/-u.execute.test.ts` directly calls
`Deno.readTextFileSync` and `Deno.writeTextFileSync`. Canon's FS-owner rule has no general test
exception. The synchronous hook explains the timing choice but does not establish an exception.
Prefer an awaited internal observation hook with canonical Fs operations, or obtain an explicit
narrow exception; preserve the between-phases assertion. Existing unrelated direct platform fixture
operations were not expanded into a style sweep.

Optional simplification: reuse a cleanup-owning temporary-root helper in Pull add tests. This is not
an argument for a new test framework. No additional abstraction or matrix is recommended by quota.

Strongest case for leaving the owners/design unchanged: a private exact-document ledger, independent
content evidence, existing directory identity checks, and ordered lease settlement are the correct
separation. The new initial-observation catch and last pre-write fence are substantive improvements.
Fault seams default to existing Fs/removal owners, capture real arguments, and leave real ledger and
filesystem checks active; Deploy's public API does not expose them. R2 correctly separates content
optimization from exact manifest-byte publication, and Pull keeps independent pins explicit. Fix F1
and F2 at these existing ownership boundaries rather than replacing the architecture.

No browser/provider/cross-OS/release acceptance, complete cache provenance, or whole-plan completion
is established by this report.

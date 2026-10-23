# Tools command and failure authority

## Scoped verdict: changes required

One P2 error-preservation defect remains in failed-copy settlement. It is inherited from HEAD, not
introduced by the content-identity migration, but directly violates this charter's fault-settlement
obligation. The new command guards, document recheck and injected copy/write/removal proofs otherwise
support retaining the design. Runtime coverage is partial: 42 steps passed across seven suites;
hashing-fence and build/lease lifecycle assertions were inspected, not executed in this pass.
This report provides no independent landing clearance.

## Target, authority and source state

- Repository: `/Users/phil/code/org.sys/sys`.
- Target: attributable live worktree behavior for
  `feat(dist)!: unify build pins and verification on canonical content identity`.
- Governing plan: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`.
- Assignment: `02/02-tools.review.plan.md`, under this round's README.
- Requested configuration: `gpt-6-astra • high`; this is not a runtime-model attestation.
- Blindness: no sibling reports, round 01, correction records, preparation copies or implementing
  conversation were opened. Plan reading was restricted to the opening five lines and the charter's
  named requirement sections. Heading-only discovery was used to locate those sections.
- Entry and exit HEAD: `8d97fe4088bed6764e804424b767b089ffb13cf3`.
- Opening arc reconciles without edits: `e6316e80b` and `872b5a34d` have the exact recorded subjects
  and are reachable from HEAD. No reachable exact-subject match was found for the breaking target;
  it remains the current unlanded arc item.
- Scoped cached diffs were empty. The worktree contained tracked changes plus the untracked
  `code/sys.tools/src/cli.deploy/u.staging/-test/-manifest.failure.test.ts`. Other concurrent work
  was neither adopted into this review nor edited.

### Actual inspected inputs

All paths below are repository-relative. Directory prefixes apply to each listed filename.

**Primary production and direct ownership dependencies**

- `code/sys.tools/src/cli.pull/`: `u.args.ts`, `m.cli.ts`, `u.resolve.nonInteractive.ts`,
  `u.add.run.ts`, `u.add.ts`, `u.run.ts`, `common.ts`, `t.namespace.ts`,
  `u.yaml/u.schema.ts`, `u.bundle/u.pull/u.pull.dist.ts`, `u.github/u.client.ts`.
- `code/sys.tools/src/cli.deploy/u.staging/`: `u.copyInto.ts`, `u.finalizeDistTree.ts`,
  `u.manifest.ts`, `u.identity.ts`, `u.execute.ts`, `u.stageMappings.ts`,
  `u.verifyStagedDist.ts`, `u.lease.ts`, `u.buildLease.ts`, `u.execCopy.ts`,
  `u.execBuildCopy.ts`, `u.generateHtml.ts`, `mod.ts`.
- `code/sys.tools/src/cli.deploy/common.ts`; `code/sys.tools/src/cli.deploy/t.namespace.ts`
  through the public staging contracts.
- `code/sys/fs/src/m.Fs/u/`: `u.lstat.ts`, `u.write.ts`, `u.copy.file.ts`.
- `code/sys/fs/src/m.Pkg.Dist/u/`: `u.compute.ts`, `u.hash.ts`.
- `code/sys/fs/src/m.Dir.Hash/u.compute.ts`.

**Tests and fixtures**

- `code/sys.tools/src/cli.pull/-test/`: `-u.args.test.ts`, `-u.add.run.test.ts`,
  `-u.add.test.ts`, `-u.run.test.ts`, `-u.resolve.nonInteractive.test.ts`.
- `code/sys.tools/src/cli.pull/u.bundle/-test/`: `-u.pull.dist.test.ts`, `u.dist.fixture.ts`.
- `code/sys.tools/src/cli.pull/u.github/-test/u.pull.fixture.ts`.
- `code/sys.tools/src/cli.deploy/u.staging/-test/`: `-manifest.failure.test.ts`,
  `-u.copyInto.test.ts`, `-u.execute.test.ts`; `-u.buildLease.test.ts` lines 1–140 for
  initialization and restricted-process effects, not a full review of that suite.
- `code/sys.tools/src/cli.deploy/-test/`: `u.fixture.ts`, `-u.stage.lifecycle.test.ts`.

**Execution/dependency authority and initialization**

- `deno.json`, `deps.yaml`, `imports.json`, `code/sys.tools/deno.json`.
- `code/sys.tools/src/`: `-test.ts`, `-test/mod.ts`, `common.ts`, `common/mod.ts`,
  `common/libs.ts`.
- `code/sys/testing/src/m.server/common.ts`;
  `code/sys/std/src/m.Testing/{m.Bdd.ts,common.ts,libs.ts}`.
- `code/sys/types/src/-test/m.Bdd.ts`, registration/execution sections: suites register top-level
  Deno tests and invoke leaves as steps. A leaf-name filter cannot be assumed to isolate one body.
- `deno.lock` was observed through Git state/blob identity, not opened or audited in full.
  Its HEAD blob was `9804db48f8ef3665d62432ce0598d27284c4df79`, with no worktree/index diff.

### Attribution and exit comparison

Live reads and captured Git diff content, rather than HEAD/status alone, formed the comparison.
Exit staging diffs matched entry diffs, including these worktree-content prefixes emitted by Git:

| File under `code/sys.tools/src/` | Entry/exit content prefix |
| --- | --- |
| `cli.pull/u.args.ts` | `a8e9537d9` |
| `cli.pull/u.add.run.ts` | `6fe01ef50` |
| `cli.deploy/u.staging/u.copyInto.ts` | `4a861ea94` |
| `cli.deploy/u.staging/u.finalizeDistTree.ts` | `4188bc8f0` |
| `cli.deploy/u.staging/u.manifest.ts` | `1211635f6` |
| `cli.deploy/u.staging/-test/-u.execute.test.ts` | `78a7ef4c0` |

The untracked failure suite was reopened in full at exit and matched the entry contents. The owning
`deno.json`, Pull guards and add adapter were also reopened. Exit Pull/test/fixture and selected FS
producer diffs matched the previously inspected contents. The unchanged primary orchestration,
identity, lease and copy-control files remained equal to HEAD through scoped content diffs. Root
configuration, imports, dependency authority and lockfile remained without staged/unstaged changes.
No material change was detected in this bounded comparison.

This is not an immutable snapshot or complete dependency/cache attestation. Transitive Server/FS,
registry caches, installed packages and concurrent workspace dependencies were not exhaustively
captured. No conclusion about unrelated App/UI byte stability is made. The only authored repository
output is this report; tests used their existing temporary-fixture behavior.

## Material finding

### P2 — Initial residue observation can discard the original copy failure

**Owner/evidence:**
`code/sys.tools/src/cli.deploy/u.staging/u.copyInto.ts:134–153`,
`rethrowCopyFailure`; specifically line 141:

```text
if (isManifest && await Fs.lstat(target)) {
  try {
```

The observation is outside the `try` that preserves `[failure, retentionError]` and `cause: failure`.
`code/sys/fs/src/m.Fs/u/u.lstat.ts` catches only `Deno.errors.NotFound`; other filesystem errors
propagate. Both the thrown-copy path at line 104 and returned-error path at line 107 enter this
helper. If the first observation rejects, the original copy failure is lost before retention starts.
The caller cannot recover it from the replacement exception.

**Executable failure sequence, predicted from source; not executed here:**

1. Use the existing failure-suite temporary source/destination setup with `src/dist.json`, captured
   real directory identities and an empty manifest ledger.
2. In the existing injected copy function, write partial bytes to the requested destination.
3. Rename the destination directory to a sibling retained directory, and put a regular sentinel file
   at the original destination-directory path. This is an ordinary filesystem-kind change, not a
   denied-permission injection or global patch.
4. Throw the sentinel copy error, or return `{ error: sentinel }`.
5. `rethrowCopyFailure` calls `Fs.lstat(originalDestination + '/dist.json')`. On a host reporting
   ENOTDIR for traversal through a regular file, that non-NotFound error escapes before the helper's
   aggregate branch. The sentinel copy error is absent from both the thrown value and its cause.

The same control-flow defect applies to any non-NotFound rejection of this observation. The exact
host error classification in the sequence above still needs execution; no runtime reproduction is
claimed. This finding concerns truthful failure settlement, not an atomic-filesystem guarantee or
permission to remove the displaced directory.

**Violated invariant:** retention refusal must preserve the original error identity and the ordered
retention error; inability to observe residue must not manufacture absence or deletion authority.

**Smallest coherent correction:** at the Tools staging owner, include the first `lstat` in the
retention `try`. Treat a missing target as a normal no-retention result, and keep the final
`throw failure` outside that `try`, so the original error is not caught and paired with itself.
Keep ordinary payload failures out of the manifest ledger. No shared fault framework is needed.

**Closing proof:** extend `-manifest.failure.test.ts` through its existing copy seam for thrown and
returned failures. Assert the seam was called once with the production arguments; original sentinel
identity is `aggregate.errors[0]` and `aggregate.cause`; the observation error is second; ledger stays
empty; rollback preserves the replacement sentinel and displaced partial bytes. Retain the existing
absent-manifest, ordinary-payload, regular-residue and symlink controls. Do not simulate this with a
permission denial.

**Historical attribution:** `git show HEAD:code/sys.tools/src/cli.deploy/u.staging/u.copyInto.ts`
contains the same unprotected observation. This is an inherited defect exposed by the explicitly
requested review of failure reachability, not a regression attributed to the new injection seam.

## Command/document/fault-to-assertion map

`Executed` below means this pass ran the named suite. `Inspected` means source-derived evidence only.

| Obligation | Real path and load-bearing assertions | Evidence |
| --- | --- | --- |
| Add-only flags refuse before config acquisition | `m.cli::cli` calls `parseArgs` before cwd/header/menu/resolution. Own-key checks reject manifest, scheme, digest, store, project, mode and dry-run outside add, including explicit false. `-u.args.test.ts` covers interactive/non-interactive prefixes, legacy/mixed integrity and a selected nonexistent config. The actual CLI invocation expects the parser error, not a later load error. | Executed |
| Valid add and config-only controls | `runAdd` validates an independent pin, then `addDistBundle` invokes YAML editing only; it does not materialize. Adapter asserts successful creation, no config on dry-run, and missing-pin refusal. Add tests retain exact-duplicate no-op, changed-pin projection collision, explicit projection mode and store isolation. Non-interactive resolver accepts a config reference without loading it and requires a nonblank config. | Executed |
| No downloaded pin/automatic repin | Add takes scheme/digest from the operator and validates at the existing Pkg owner. Pull forwards configured `bundle.pin` to Server. A mismatched independent pin returns materialization-failed with projection not-run; a warm generation is reused without refetching in the cancellation control. No acquisition-to-config rewrite appears in these paths. | Executed narrow controls plus inspected source |
| Retained document across awaited hashing | `writeManifest` keeps `previous`, validates it before compute and again after directory/child checks immediately before write. Awaited `onHashProgress` can replace M with supported metadata-only M′. The retained-document test asserts progress occurred, exact replacement bytes survive, ledger record identity stays original, and ordered body/cleanup failure messages remain. Its unchanged control succeeds and Pinned.verify still accepts the content pin. | Inspected, not executed |
| Originally absent document across hashing | Same test loop starts with no saved manifest and no ledger record. The final `lstat` refuses a new M′ instead of replacing it; no new ledger record authorizes deletion. Exact bytes survive. The unchanged absence control succeeds. | Inspected, not executed |
| Post-production document replacement | `afterManifest` metadata mutation tests cover both root and nested manifests. They require the combined failed-body/cleanup error, preservation of replacement text and separate successful content-pin verification. The older malformed-child mutation assertion remains. | Inspected, not executed |
| Copy throws/returns with regular partial residue | New failure suite reaches real source walking, identity checks, parent capture and target-absence checks before injected copy. It captures exact source/target/options, writes `[255,0,1]`, then throws/returns a sentinel. Real retention hashes observed bytes, preserves sentinel identity, freezes the record and binds the captured directory. Real validation/retraction removes only the retained bytes and clears the ledger. | Executed, both modes |
| Copy retention refusal | Injection leaves a symlink to foreign bytes. Real `stagingManifestChecksum` rejects the kind; aggregate preserves original identity first and retention failure second, with original cause. Empty-ledger rollback preserves symlink and foreign bytes. The initial-observation rejection branch is missing: finding above. | Executed symlink controls; finding source-derived |
| No invented deletion authority | Failed copy leaving no manifest retains no record; ordinary `asset.txt` partial residue also retains no record and survives ledger rollback. Source/foreign bytes remain unchanged. | Executed |
| Returned failed manifest write leaves regular bytes | `finalizeDistTree` performs real directory collection, index production, compute, checksum validation and final fence before injection. `writes === 1`, exact target/options and valid computed Dist JSON prove this is the write-error branch, not an earlier failure. Injected bytes differ from intended JSON. Removal observer sees checksum of those exact bytes and delegates to real `removeStagingManifest`; original write error survives, residue and ledger entry are removed. | Executed |
| Returned failed write with unretainable residue | Injection leaves a symlink and returns the sentinel write error. Real retention refuses; aggregate retains both errors and original cause. No removal call occurs, ledger stays empty and symlink/foreign bytes survive. | Executed |
| Successful body, temporary cleanup fails, root retraction fails | Real writes complete both child/root manifests. Only the removal callback replaces metadata, so `body.kind === 'value'` precedes the fault. Removal order is `[child, root]`; real checksum validation rejects both. Assert exact dedicated cleanup/retraction message, ordered exception identities and cause, exact foreign text, and both original ledger record identities retained. This is not the failed-body cleanup branch. | Executed |
| Successful body, temporary cleanup fails, root retraction succeeds | Same test changes child only. Real root removal succeeds; root disappears and its ledger entry clears; child replacement and original child record survive; thrown error is the original child-cleanup failure, not an invented aggregate. | Executed |
| Unchanged no-clobber/kind controls | `-u.copyInto.test.ts` proves normal tree copy, existing destination preservation, ignored metadata, reserved aliases, reserved directory and symlink refusal. Its title mentions special entries, but its fixture exercises a symlink, not every special-file kind. | Executed |
| Strict final tree and source-copied authority | `-u.execute.test.ts` retains exact inventory/root evidence, temporary-only removal, source-copied manifest rollback on progress failure, no leaked verification and retry success. It now compares `manifestChecksum` separately from content digest. | Inspected, not executed |
| Cancellation and draining | `runPhase` sets first failure, aborts peers and awaits `Promise.allSettled` before returning to leased rollback. `execBuildCopy` awaits bounded `Process.capture` before proceeding; public lifecycle test proves child lock is available after cancellation and retry succeeds. Finalizer tests cancel during hashing, after child creation and after root creation; they require manifest removal. | Inspected; child/drain runtime proof not run |
| Lease retained through rollback; error combinations | `settleStagingLease` runs onError before release. Tests assert rollback/release order, operation and release error identities/cause, queued lease remains blocked during rollback, nested release order, and no rollback after successful-body release failure. `stageMappings` passes the run-owned manifest ledger to onError. | Inspected, not executed |
| Mutable projection never inherits verification | Pull's public types separate generation evidence and mutable projection status. Narrow settlement suite preserves sealed generation truth while refusing occupied projections, preserves a concurrent winner's bytes/modes, refuses projection after cancellation and rejects stale pin before projection. `-u.run.test.ts` separately retains mutation-isolation assertions. | Settlement suite executed; programmatic suite inspected |

### Snapshot/recheck limit

The manifest fence compares a retained directory identity and exact-document checksum/absence at
observable points. The awaited hash callback is genuinely awaited by `Dir.Hash.compute`, through
Pkg.Dist's hash collector. It cannot silently outrun the final document check.

These checks are not atomic CAS, descriptor-relative no-follow writes, inode identity for each
manifest, or universal same-user filesystem isolation. There remains a pathname interval between
recheck and write/removal. Same-byte replacement and transient writes restored before observation
are not distinguishable by a checksum. Content equality alone is never substituted for document
continuity in the reviewed ledger path. No broader race guarantee is inferred.

### Seams and retained assertions

- `copyInto` defaults to `Fs.copyFile`; injected calls receive unchanged
  `{ ensureParent: false, force: false, throw: true }`. The seam replaces the copy operation, not
  directory admission, retention or rollback.
- Finalization defaults to `{ write: Fs.write, remove: removeStagingManifest }`. The write seam is
  threaded to manifest writes only, not the earlier generated-index write. Its removal seam receives
  retained records after real identity matching; the tests delegate to real checksum validation and
  deletion instead of faking cleanup success.
- Public `DeployTool.StageArgs` exposes no I/O override; production `stageMappings` supplies none.
  These are bounded internal seams, not YAML authority or a general fault framework. No global
  copy/write/removal monkey-patch or borrowed downstream-private fixture is used.
- The older malformed-child test was preserved, not replaced by the metadata case. Exact-tree,
  source-copied rollback, cancellation, release and no-clobber assertions remain in source.
- Retiring the old `verification.dist.pkg` assertion is justified: root package metadata is no longer
  authenticated by a content pin. Its replacement checks generation pin and authenticated inventory.
  Old successful integrity-input syntax becomes explicit refusal; old exact-document diagnostic
  expectations move to content-pin admission, without deleting no-projection assertions.
- The new failure tests use invalid-JSON partial bytes deliberately. Requiring an admissible Dist
  before recording those bytes would conflate content validity with rollback ownership.

## Commands and observed outcomes

All test commands below were actually run, serially, from the repository root using the owning task.
No task was retried with broader permissions, and no permission/provenance denial occurred.

```sh
cd code/sys.tools && deno task test:pull --cached-only --frozen --no-prompt --filter='/@sys\/tools\/pull (u.args|add run adapter)/'
```

Passed: 2 suites, 10 steps, 0 failures, 21 filtered out.

```sh
cd code/sys.tools && deno task test:deploy:staging --cached-only --frozen --no-prompt --filter='/Staging: (manifest failure settlement|copyInto)/'
```

Passed: 2 suites, 17 steps, 0 failures, 5 filtered out.

```sh
cd code/sys.tools && deno task test:pull --cached-only --frozen --no-prompt --filter='/^@sys\/tools\/pull (add$|non-interactive resolution$)|^cli.pull\/u.bundle → pinned Dist settlement$/'
```

Passed: 3 suites, 15 steps, 0 failures, 20 filtered out. Dist fixture servers used ephemeral ports
52039, 52041, 52043 and 52045, requested through loopback, then shut down. The fixture actually binds
Deno's default `0.0.0.0`, despite its loopback description; no external provider was contacted.
Its stores are removed through owned Rooted lease/tree lifecycle. Add/resolver fixtures create OS
scratch directories without teardown; these pre-existing fixture effects were not manually cleaned
up or changed in this report-only pass.

Runtime probe:

```sh
deno --version
```

Deno 2.9.7, aarch64-apple-darwin; V8 15.0.245.2-rusty; TypeScript 6.0.3.
The tasks reported the experimental-config-permissions warning. The selected owner preset grants
read/write/env/net/run; only the inspected filtered bodies were executed. Test sanitizers remained
enabled. `--cached-only --frozen` constrained dependency resolution, not a full cache attestation.

Key history/content checks actually run:

```sh
git rev-parse HEAD
git show -s --format='%H %s' e6316e80b 872b5a34d
git merge-base --is-ancestor e6316e80b HEAD
git merge-base --is-ancestor 872b5a34d HEAD
git log HEAD --format='%H %s' --fixed-strings --grep='feat(dist)!: unify build pins and verification on canonical content identity'
git show HEAD:code/sys.tools/src/cli.deploy/u.staging/u.copyInto.ts
git diff --cached -- code/sys.tools
git diff -- code/sys.tools/src/cli.deploy/u.staging
git diff -- deps.yaml imports.json deno.json deno.lock
git ls-tree HEAD deno.lock deps.yaml imports.json deno.json
git diff --check -- code/sys.tools/src/cli.pull/u.args.ts code/sys.tools/src/cli.pull/u.add.run.ts code/sys.tools/src/cli.deploy/u.staging
```

Reachability checks succeeded; target-subject search was empty; scoped diff check emitted no errors.
Additional path-scoped `git diff`, `git status`, file reads and candidate-location searches supplied
the input inventory and comparison above. Initial path discovery mistakenly used `find -agent`,
which failed option parsing; subsequent discovery used `./-agent`. No content mutation resulted.

## Remaining execution scope and evidence limits

1. **No serialized build slot was granted.** The `Staging: owned exact root Dist` suite contains the
   hashing-fence and lease assertions alongside child-build bodies. I did not run the whole suite
   or assume that a leaf-name filter safely skipped those bodies. Its missing runtime evidence is
   explicit, not supplied by a prior receipt. The coordinator can authorize this exact bounded slot:

   ```sh
   cd /Users/phil/code/org.sys/sys/code/sys.tools && deno task test:deploy:staging --cached-only --frozen --no-prompt --filter='/^Staging: owned exact root Dist$/'
   ```

   Owner: `code/sys.tools/deno.json`, `test:deploy:staging`, preset `test`. Effects include isolated
   `sys.tools.deploy.*` OS temporary trees, generated fixture deno/build scripts, child processes,
   copied/generated manifests and Rooted lock state under those temporary trees; `withTmpDir`
   removes the fixture root afterward. No real sample output should be rebuilt. This command was
   not launched and remains contingent on the serialized slot.
2. Public child-build lifecycle coverage was inspected to identify the drain/lease assertion; it
   was not executed. Restricted-authority tests were not used as fault injection.
3. `-u.run.test.ts` was inspected but not run as a suite: it includes GitHub dispatch through
   `loadGithubToken`, which searches upward and can consume ambient credentials. No credential
   isolation was established, so this pass used the credential-free Dist settlement suite instead.
   Consequently the programmatic config-only execution and mutable-rewrite isolation assertions
   remain source evidence here, not new runtime receipts.
4. The P2 reproduction needs a narrow regression at the existing seam. No source/test edits were
   authorized, so no new probe or monkey-patched runtime was created. Passing existing tests does
   not close the untested initial-observation branch.
5. The Server materializer, full FS hostile-input admission, providers, signing, publication and
   App/UI are outside this bounded review. Direct public imports were used in proofs; no
   downstream-private fixture or permission preset was borrowed. Source-origin/credential policy in
   Pull remains explicit, but this is not a fresh provider/credential-confinement audit.

## Strongest case for leaving the design unchanged

Keep the separation between content pins and document/deletion evidence. The final pre-write
recheck uses the original ledger record rather than adopting content-equal foreign metadata. The
failure seams exercise real filesystem-kind checks, checksums and ledger settlement at the smallest
useful I/O boundaries. The successful-body cleanup tests are materially distinct from body-failure
tests and should not be merged merely to reduce test count.

No new abstraction or ownership merger is warranted. The correction is a local error-boundary move
plus a targeted assertion, while the remainder of the design and explanatory tests should stay.
Optional test organization could separate isolated finalizer/lease tests from child-build tests to
make bounded execution possible without a build slot; that is not a required production redesign.

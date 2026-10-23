# Review 04 — Tools selection and deletion authority

## Verdict

**Incomplete assessment — request changes / adjudication on two findings, not whole-slice clearance.**

The replacement preserves the central separation between content pins and exact-document cleanup/publication authority. Focused executed tests passed. Two source-traced gaps remain: execution silently ignores the new pin flags outside `pull add`, and finalization can overwrite a replacement document installed during hashing. The latter is inherited behavior, not a regression attributed to v2. Both counterexamples below are unexecuted and need targeted regression proof and coordinator disposition.

This pass did not complete an exhaustive transitive-import/permission audit or every failure-injection obligation. Exact remaining work is listed below; passing suites are not a substitute.

- Assignment: blind, independent orthogonal falsification, slice 04 only.
- Repository: `/Users/phil/code/org.sys/sys`.
- Baseline: Dist review R1; entry and exit HEAD `8d97fe4088bed6764e804424b767b089ffb13cf3`.
- Target: attributable worktree replacement for `feat(dist)!: unify build pins and verification on canonical content identity`.
- Charter recommendation: `gpt-6-astra` at `high`; this records the charter, not runtime model attestation.
- No sibling reports or implementing handoffs read. Governing plan requirements were inspected; its recorded greens and research verdict were not used as proof.
- No source/configuration edits, Git mutations, real publication, credentials, real sample builds, or evidence rebinding. Only this report was written.

## Prioritized findings

### F1 — P2: Refuse pin flags on execution instead of silently discarding them

**Evidence:** `code/sys.tools/src/cli.pull/u.args.ts::parseArgs` registers `scheme` and `digest` for every command but validates only the presence of obsolete `integrity`. `code/sys.tools/src/cli.pull/m.cli.ts::runNonInteractive` passes only `{ cwd, config }` to `run`; `u.resolve.nonInteractive.ts::resolveNonInteractive` returns only the config path. Pin validation in `u.add.run.ts::runAdd` is reached only for `add`.

**Executable misuse sequence (source-derived, not run):**

1. Use a valid Pull config selecting generation A with an optional `replace` projection.
2. Invoke the Pull CLI with argv `['--non-interactive', '--config', './-config/@sys.tools.pull/view.yaml', '--scheme', 'unsupported', '--digest', 'not-a-digest']`.
3. Parsing accepts the flags; normal execution ignores them and materializes/projects A. A well-formed but different digest B is equally ignored.
4. An operator trying to constrain this execution to B receives successful execution of A instead of a refusal. YAML's valid independent pin still protects A; this is not an unpinned-materialization bypass.

**Invariant:** caller-supplied authority must be honored or rejected, not silently dropped. The charter explicitly includes ignored invalid inputs. Help correctly documents that execution uses config; rejection should enforce that boundary.

**Smallest correction / owner:** Tools Pull parser or command admission should reject add-only flags when `command !== 'add'`, at least `scheme`/`digest`, preferably the complete existing add-only set. Do not implement implicit overrides or automatic repinning. Keep ordinary config execution and `pull add` as separate operations.

**Closing proof:** parser tests for missing/unsupported/malformed and valid-but-different pin flags on normal execution; an adapter/process test must prove refusal before config acquisition/network/projection writes. Retain valid `add` and valid config-only execution controls. Also reject unsupported execution `--dry-run` rather than letting it imply no writes; that broader flag issue predates this replacement.

**Attribution:** the new scheme/digest fields inherit a pre-existing command-boundary gap. `git show HEAD:code/sys.tools/src/cli.pull/u.args.ts` and `m.cli.ts` show the former integrity flag also lacked command-specific admission. The replacement adds an explicit old-flag refusal but does not close the equivalent new-input case.

### F2 — P2: Recheck the current manifest before overwriting it after hashing

**Evidence:** `code/sys.tools/src/cli.deploy/u.staging/u.finalizeDistTree.ts::writeManifest` checks `previous` or manifest absence at lines 219–222, then awaits `Pkg.Dist.compute`. Afterward it checks directory identity and child manifests, but not the current directory's manifest, before `Fs.write(manifestPath, json, { force: true })` at line 249. It then replaces the ledger record with the checksum of its newly written document.

`code/sys/fs/src/m.Pkg.Dist/u/u.hash.ts::includeHashPart` excludes `dist.json` from payload hashing. `u/u.compute.ts` does not fence the current directory's existing document. Thus successful computation cannot detect this replacement.

**Executable failure sequence (source-derived, not run):**

1. In a temporary canonical root, write a custom marker-free `index.html` and `a.txt`; produce supported manifest M using `Pkg.Dist.compute({ dir: root, save: true })`.
2. Capture the root directory identity. Create a staging ledger and retain M using `retainStagingManifest({ ledger, directoryIdentity, manifestChecksum: computed.manifestChecksum })`. This models a copied manifest already owned by the operation.
3. Call `finalizeDistTree` with that identity and ledger. In its existing synchronous `hooks.onHashProgress`, once only, synchronously replace `root/dist.json` with M′ whose only changes are root package/build metadata. Leave directory identity and payload bytes unchanged; do not use an unawaited asynchronous write.
4. The initial checksum check has already passed. Hashing ignores `dist.json`; the finalizer's subsequent child check does not check its own document. The force-write overwrites M′ and renews the ledger to the new computed bytes.
5. Finalization can return success with M′ lost. The new `afterManifest` regression exercises a later phase and cannot catch this sequence.

The empty-slot variant is also relevant: create a document during hashing after the original absence check. A directory identity proves neither continued document absence nor ownership of newly appeared bytes.

**Invariant:** exact-document ownership must survive the enclosing finalization operation. Equal content and an unchanged directory do not authorize replacement of a document the ledger no longer owns.

**Smallest correction / owner:** Tools staging should revalidate the retained current-manifest record, or recheck absence if there was none, after computation and immediately before its destructive write. Keep the original record on refusal so cleanup refuses and preserves M′. Do not obtain a new checksum baseline from M′ merely because verification succeeds.

This is an observation/recheck correction, not an atomic compare-and-swap or hostile same-user isolation claim; the remaining pathname race must not be described as eliminated.

**Closing proof:** add a regression at the existing hashing hook for both retained-M and initially-absent cases. Assert unchanged content pin, preserved replacement bytes, refusal before overwrite, and truthful combined body/cleanup failure for retained M. Pair with unchanged-owned-document replacement success. Keep the existing post-write root/child metadata-replacement tests separately.

**Attribution:** the pre-compute-only ownership check and force-write are inherited. The observed worktree diff changes the checksum vocabulary and compute-result narrowing, not that ordering. This is an in-slice ownership finding for coordinator adjudication, not a claim that v2 introduced it or authority to reopen an unrelated landed arc.

## Staging ownership and failure map

Paths in this table are under `code/sys.tools/src/cli.deploy/u.staging/`.

| Phase | Authority and outcome traced | Proof / limit |
|---|---|---|
| Copy success | `u.copyInto.ts::copyFile` hashes copied manifest bytes, retains parent directory identity, then validates the record. No content pin grants deletion. | Copy-root/collision controls inspected; copy-only suite not separately executed. |
| Failed copy with resulting file | `rethrowCopyFailure` retains observed resulting bytes before rethrowing; retention failure is aggregated with copy failure. | Source inspection only; no injected partial-copy/retention-failure run. |
| Finalization compute | `writeManifest` uses `save:false`, narrows `kind`, checks serialized bytes against `computed.manifestChecksum`. Refused compute is not saved. | Executed staging cancellation and hash producer-refusal controls. F2 identifies the pre-write gap. |
| Failed manifest write | Retains checksum of resulting regular-file bytes, then throws the write error; failed retention preserves both causes. | Source inspection only; failed-write and retained-bytes mutation branches need dedicated injected proof. |
| Validate/remove | `u.manifest.ts::validateStagingManifest` checks directory identity then exact checksum; `removeStagingManifest` deletes only afterward. | Post-write metadata replacement root and child cases passed; replacement remains independently content-verifiable. No atomic no-follow guarantee asserted. |
| Successful finalization | Temporary records removed deepest-first; root retained. Ledger entries are removed only if still the same record object. | Executed exact-root inventory/custom-index/schedule-independence controls. |
| Body failure + cleanup failure | `finalizeDistTree` preserves both causes in `AggregateError`. M′ remains rather than being deleted by content equality. | Executed malformed child and supported equal-content root/child replacement regressions. |
| Cleanup failure after successful body | `retractFinalizedDistTree` attempts only identity/checksum-bound root removal; retraction failure joins cleanup failure. | Source inspection only for this precise two-failure branch. |
| Outer rollback | `u.stageMappings.ts` keeps ledger through final strict Local verification; `u.lease.ts::settleStagingLease` retracts on body failure before releasing ownership. | Executed copied-root progress failure, strict verification limit failure, queued-lease ordering and operation/release failures. |
| Cancellation/draining | `u.execute.ts::runPhase` drains workers with `allSettled`; cleanup/release outlives cancellation. | Executed build-child cancellation, hash cancellation, post-child and post-root cancellation. Synthetic temporary builders only. |
| Directory replacement | Canonical path, dev/inode and nonsymlink checks remain in `u.identity.ts`; unchanged bytes alone cannot satisfy a changed directory identity. | Executed source/destination/root replacement controls. Direct ledger removal after directory replacement remains an unexecuted closing control. |

## Input, publication and presentation conclusions

- YAML uses `additionalProperties:false`, with `Pkg.Is.distPin` owning exact two-field canonical pin semantics. Old-only and mixed fields, unknown schemes, uppercase digests and extra pin members refuse in executed schema tests. `PullFs.loadLocation` validates before `Pull.run` iterates bundles. There is no observed download-derived expected pin.
- `runAdd` and `addDistBundle` reject old/mixed inputs and require an independent pin before configuration mutation. Interactive addition requests a content digest explicitly and uses the sole local scheme. F1 concerns the separate execution branch.
- Pull delegates acquisition to public `@sys/server/dist`. Its fixed finite policy confines sources to the manifest origin and sets `credentialOrigins: []`; it rejects URL userinfo. The inspected Server `snapshotInput` closes keys, snapshots the pin and limits, and takes the stricter manifest byte ceiling. This pass did not re-audit the complete HTTP redirect engine.
- Wrong-pin refusal moved appropriately from byte-fetch checksum failure to `manifest-admission/pin-mismatch`. Executed settlement proof returns no projection. The public-run test's phase assertion was inspected but not run in this pass.
- Pull's projection is explicitly mutable. The copy/rewrite does not inherit generation verification; generation evidence and projection failure remain distinct. Occupied target and concurrent-winner bytes/modes, cancellation, and promoted-generation retention passed.
- R2's existing `u.push.ts` is unchanged by this worktree replacement. It compares each exact path and complete part value, not aggregate digest, for asset skipping. It retains local manifest bytes, requires exact document checksum equality to skip the manifest, writes assets before `dist.json`, and prunes only afterward. The size-mismatch/forged-aggregate regression remains; changing the renamed-path test to expect distinct v2 digests does not remove that independent shortcut falsification.
- Remote malformed/unsupported metadata is an optimization miss, not an accepted old Dist verification lane. Acquisition/permission/provider failure remains a hard publication refusal; the synthetic tests distinguish these from explicit absence. Successful remote metadata is trusted for skip optimization, not byte verification of every remote object.
- R2 has no newly added cancellation API. Its bounded writer stops queued work on failure and drains active tasks before disposing; this is not an atomic or cancellable remote transaction. No provider acceptance or concurrent hostile-writer guarantee was established.
- Hash output now has one full scheme/digest pin row, not a competing manifest-integrity identity. Saved-output tests still check document checksum separately against actual bytes. Empty computation neither creates nor replaces a document.
- Deploy preview uses public `DistServer.Local`, preserving unpinned local verification rather than silently inventing an independent expectation. Preview evidence uses content and derived asset totals. Removal of authenticated stage age is coherent: build time is descriptive.
- Ordinary `cli.serve` is a different static-serving path: `u.status.dist.ts` loads optional observations; `u.start.ts` starts a generic static server. Its package/time/size display is not independent payload verification. The reviewed status code does not label it verified. Its shortened digest is presentation only, not a copyable pin.

## Prior assertion → current proof map

| Prior load-bearing signal | Retained/replaced proof and disposition |
|---|---|
| Publisher-provided exact-byte integrity required | `cli.pull/-test/-u.args.test.ts`, `-u.add.test.ts`, `-u.add.run.test.ts`, and `u.yaml/-test/-u.schema.test.ts` replace this with exact content pins and old/mixed refusal. Schema/args executed; add paths inspected. Independent expectation remains required. |
| Wrong manifest checksum prevents projection | `cli.pull/-test/-u.run.test.ts` now asserts admission/pin mismatch; `u.bundle/-test/-u.pull.dist.test.ts` executed no-projection and preserved-generation outcomes. Old pre-parse authentication phase is obsolete, not silently retained. |
| Verified whole Dist/package metadata in Pull result | Replaced with `generation.pin` and `verification.content` assertions. Root package labels cannot be authenticated evidence. Mutable rewrite and mode-isolation assertions remain in `-u.run.test.ts`. |
| Immutable full manifest evidence | `cli.deploy/u.staging/-test/-u.execute.test.ts` now freezes content/parts and distinguishes manifestChecksum from digest. Exact-tree inventory assertion remains and passed. |
| Temporary manifest mutation refuses cleanup | Original malformed-document case remains; new supported equal-content root/child case passed. F2 needs the earlier hashing-phase vector, not replacement of these tests. |
| Copied-root rollback, verification failure and lease settlement | Retained in `-u.execute.test.ts`; passed. Separate phases justify separate tests. |
| Equal generic digest with renamed paths must not skip wrong bytes | Renamed-path test now expects different v2 identity while retaining exact object-byte, prune and ordering assertions. The unchanged inconsistent-remote-size case still proves aggregate equality cannot skip a changed part. Both passed. |
| Exact publication including BOM/formatting/metadata | `provider.r2/-test/-u.push.test.ts` keeps inline/ref and metadata/layout/BOM controls; all passed. |
| Provider/ref/body/listing failures cause no publication | `-u.push.failure.test.ts` and `-u.push.acquisition.test.ts` retain original errors, zero forbidden effects and single disposal; passed. These are not redundant with schema/absence cases. |
| Hash output contains manifest integrity | Intentionally removed; `cmd.hash/-test/-u.fmt.test.ts` asserts one full content pin and no published-document claim for unsaved output. `-u.hash.test.ts` retains explicit saved-byte checksum proof; passed. |
| Preview age from verification | `u.menu/-test/-menu.endpoint.preview.test.ts` now requires absent stageAge; content digest, derived size and mutation invalidation remain. Source-inspected, not executed. |
| Serve fixture digest constant and legacy part spellings | Replaced with supported content tuples; fixture feeds status/lifecycle/discovery tests. These are observational tests, not independent encoder vectors. Diff-inspected; Serve suite not run. |

## Test economy, imports and concepts

Keep the present owner boundaries. The smallest design is still: shared Pkg pin validation, Server materialization, a private staging document ledger, and an exact-document publisher. Removing the ledger because content pins are stable would lose deletion authority; consolidating publication and verification would conflate provenance and byte selection.

Added production responsibilities in this slice are bounded: pin transport/validation replaces byte-pin transport; a schema diagnostic locates shared-validator refusal; producer result narrowing propagates refusal. The ledger is renamed, not a new identity subsystem. The new scoped tasks introduce no new permission presets. No compatibility framework or downstream-owned fixture import was found in the inspected target tests.

Import trace (paths relative to `code/sys.tools/src/`):

| Test import lane | Actual owner/surface, direction and purpose | Runtime authority observed/required |
|---|---|---|
| `-test.ts` → `-test/mod.ts` | Public `@sys/testing/server`, `@sys/cli/testing`, `@sys/testing/web`; Tools → test owners. BDD, assertions, fake spinner and fetch mock. | Tests run with Tools `test` preset, not the dependencies' presets. Temporary filesystem, environment and relevant listener/process effects remain caller authority. |
| `-test/mod.ts` → `common.ts` → `common/mod.ts` → `common/libs.ts` | Public system owners, including FS/Pkg, Crypto/Hash, Std primitives, CLI, HTTP, Process, Yaml, plus registry/template/driver-deno support statically re-exported by the common barrel. Tools → supporting owners; no foreign private test fixtures on this lane. | Broad barrel means selected symbols alone do not prove a narrow initialization closure. Full transitive initialization audit is incomplete. |
| Pull `common.ts` and `u.bundle/u.pull/common.ts` | Public `@sys/server/dist`, `@sys/fs/env`, `@sys/schema`, `@sys/yaml/cli`, plus parent common lane. Production acquisition and configuration semantics, not borrowed Server tests. | Pull proof used temporary read/write and local HTTP; fixture actually binds Deno's default `0.0.0.0`, despite its loopback comment and returned `127.0.0.1` URL. No real download. |
| `cli.pull/u.bundle/-test/u.dist.fixture.ts` | Tools-owned fixture; public FS compute/Rooted. Producer pin and lease-owned removal of sealed test stores. | Temporary tree creation/removal, mode restoration through Rooted, HTTP listener; no downstream build authority. |
| Deploy `u.providers/common.ts` → `cli.deploy/common.ts` | Public `@sys/driver-cloudflare/r2`, `@sys/model/files`, FS, Crypto, CLI, Schema, Std, Process, Yaml. Tools → provider/model owners. Confirmed exported subpaths in owner deno.json files. | R2 tests use Tools-owned `u.fixture.ts`: in-memory Bucket or a mocked fetch termination for SDK calls. Synthetic credentials only; no live credential or provider use. |
| `cli.deploy/-test/-u.preview.parity.test.ts` | Direct public `@sys/server/dist/server`; Tools → Server hosting owner. Tools owns source tree and YAML fixture. | Temporary staging plus loopback listen/fetch. Source-inspected, not executed. |
| Deploy `-test/u.fixture.ts`, `u.preview.fixture.ts`, staging helper imports | All Tools-private, within the same package. Temporary roots, captureInfo and verified preview fixture. No reverse import from a sample/application. | Filesystem; synthetic child processes for staging cancellation/build tests. Imported file naming does not grant process authority. |
| Serve `m.server/-test/-u.openTargets.test.ts` → `../../-test/u.ts` → `u.fixture.ts` | Same Tools owner, not another package's fixture. Reuses supported observational Dist construction. Serve common uses public HTTP server, FS, Crypto, Std, CLI, Schema, Process, Yaml. | Serve suite not executed; it needs temporary filesystem/listener lifecycle authority, not publication/build authority. |
| Hash tests → crypto common/Tools test barrel | FS producer/verifier and Crypto/Std public helpers. Removes a local type-namespace alias; does not import downstream build fixtures. | Executed under Tools preset using disposable filesystem; no network/build operation was performed. |

Owner export checks: `code/sys/fs/deno.json`, `code/sys/server/deno.json`, `code/sys.driver/driver-cloudflare/deno.json`, and `code/sys.model/model/deno.json` were opened. Importing their public APIs does not activate their permission presets.

Optional reductions, not blockers:

- Keep failure phases separate; do not collapse failed copy/write, post-write cleanup, lease release and content mismatch into one generic failure test.
- The two changed/missing asset tests could share a tiny local remote-content fixture, but retain their separate listing/existence and part-difference assertions. Existing duplication is cheaper than a generic fixture framework.
- Keep the same-owner Serve fixture reuse. Mark its deliberately descriptive 2.1 MB total explicitly so readers do not mistake it for payload verification.
- Tighten `usingDistServer` to specify `hostname: '127.0.0.1'`; its current comment overstates listener confinement.
- The new root/child metadata-replacement loop could expose per-case test-step names for better failure attribution; keep both vectors.

## Executed commands and effects

All test commands ran from `/Users/phil/code/org.sys/sys/code/sys.tools`, after opening its deno.json. Existing task presets were used; frozen/cache-only flags narrowed dependency effects. No task failed or required broader permissions.

```sh
deno task test:crypto:hash --cached-only --frozen
deno task test:deploy:staging --cached-only --frozen --filter 'Staging: owned exact root Dist'
deno task test:pull --cached-only --frozen --filter '/(PullYamlSchema|pull u.args|pinned Dist settlement)/'
deno task test:deploy --cached-only --frozen --filter 'R2 Provider:'
```

Each of those four commands was subsequently rerun with `--reporter=dot` appended to obtain untruncated final totals. The table records those confirmed results.

| Command | Observed result | Effects |
|---|---|---|
| Hash | 4 tests / 18 steps passed | Disposable files and local hashing/verification. |
| Staging filter | 1 test / 43 steps passed; 5 filtered | Disposable staging roots and synthetic temporary builders; includes child cancellation and 8,192-file limit fixture. No real sample build. |
| Pull filter | 3 tests / 16 steps passed; 20 filtered | Schema/parser plus disposable materialization stores and local HTTP listeners. |
| R2 filter | 4 tests / 68 steps passed; 36 filtered | In-memory Files/Bucket and mocked SDK fetch; includes schema suite. No live PUT/DELETE. |

The staging filter selected the whole top-level suite, not only the newly added metadata step. Its source was inspected before execution. These broad-permission unit runs are not the restricted-authority proof.

Read-only Git commands included `git status --short`, scoped `git diff`, `git diff --cached`, `git diff --stat`, `git diff --raw`, `git ls-files --others --exclude-standard`, `git show HEAD:<path>` for Pull parser/CLI, `git log -1 --format='%h %s'` and `git merge-base --is-ancestor` for the three history anchors, and exact-subject `git log --fixed-strings --grep` for the replacement. Scoped `git diff --check -- code/sys.tools` passed. Path discovery and narrow rg searches only located candidates; live source reads supplied the inspection evidence.

## Arc and drift

The plan identity header matches its live path. The two checked subjects match reachable commits `e6316e80b` and `872b5a34d`; the unchecked replacement subject had no reachable match. The independent R2 repair `482e42505` is reachable. No plan correction was needed or made.

At entry the Tools package had 48 tracked changed files and one untracked CRDT snapshot test outside this slice. There were no staged Tools changes. The four primary source subtrees had no untracked source at entry or exit. The CRDT test was not adopted as Tools slice-04 proof.

At exit HEAD was unchanged; scoped staged diff remained empty. Repeated scoped content-diff inspection showed the same apparent replacement, including the two finding locations. Relevant unchanged orchestration/publisher files still had empty diffs against the same HEAD. Tools status and `deno.lock`/`imports.json` status showed no new task-attributed changes. This was manual diff inspection, not an automated byte-for-byte snapshot comparison; status alone is not treated as a content-stability proof. This report is the only authored output.

Limit: this is a procedural, scoped drift check, not an immutable snapshot or complete byte-stability attestation for every transitive workspace dependency. No target drift was observed; the full dependency freeze remains the coordinator's launch responsibility.

## Inspection inventory and exact remainder

In addition to the governing README, charter, complete plan and canonical instructions, the following implementation evidence was inspected. Braced groups enumerate exact file names under the stated directory, not an assertion that every subtree file was read.

**Live source opened:**

- `code/sys.tools/deno.json`.
- `code/sys.tools/src/{-test.ts,common.ts}`, `src/-test/mod.ts`, `src/common/{mod.ts,libs.ts}`.
- Under `code/sys.tools/src/cli.pull/`: `common.ts`, `m.cli.ts`, `u.args.ts`, `u.add.ts`, `u.run.ts`, `u.resolve.nonInteractive.ts`, `u.fmt.ts`, `u.yaml/{u.schema.ts,u.validate.ts,u.fs.ts}`, `u.bundle/u.bundle.ts`, `u.bundle/u.pull/{mod.ts,common.ts,u.pull.dist.ts}`.
- Under `code/sys.tools/src/cli.deploy/`: `common.ts`, `m.cli.ts`, `u.resolve.nonInteractive.ts`, `u.endpointAction.ts`, `u.push/{u.push.ts,u.endpoint.ts}`, `u.providers/common.ts`, `u.providers/provider.r2/u.push.ts`, `u.menu/{menu.endpoint.ts,run.stagingWithSpinner.ts}`, `u.staging/{u.manifest.ts,u.finalizeDistTree.ts,u.copyInto.ts,u.identity.ts,u.execute.ts,u.stageMappings.ts,u.lease.ts,u.verifyStagedDist.ts,u.generateHtml.ts,u.generateHtml.tmpl.ts}`.
- Under `code/sys.tools/src/cli.crypto/cmd.hash/`: `cmd.hash.ts`, `u.hash.ts`, `u.row.dist.ts`, `u.fmt.ts`.
- Under `code/sys.tools/src/cli.serve/`: `common.ts`, `u.status.dist.ts`, `u.start.ts`, `m.server/u.startServer.ts`, `-test/u.ts`.
- `code/sys/std/src/m.Pkg/m/m.Is.ts`; `code/sys/fs/src/m.Pkg.Dist/u/{u.compute.ts,u.hash.ts,u.load.ts}`; `code/sys/server/src/m.server.dist/u.materialize/u.input.ts`; the four owner deno.json files listed above.

**Live tests/fixtures opened:**

- Pull: `-test/{-u.args.test.ts,-u.add.run.test.ts,-u.run.test.ts}`, `u.yaml/-test/-u.schema.test.ts`, `u.bundle/-test/{-u.pull.dist.test.ts,u.dist.fixture.ts,-pull.summary.test.ts}`.
- Deploy: `-test/{u.fixture.ts,u.preview.fixture.ts,-u.preview.parity.test.ts,-u.stage.authority.ts}`, `u.staging/-test/{-u.execute.test.ts,-u.copyInto.test.ts}`, `u.providers/provider.r2/-test/{-u.push.test.ts,-u.push.failure.test.ts,-u.push.acquisition.test.ts,u.fixture.ts}`, `u.menu/-test/-menu.endpoint.preview.test.ts`.
- Hash: `-test/{-u.hash.test.ts,-u.preflight.test.ts}`.

**Additional changed content inspected through Git diffs:** all changed files in the four primary subtrees, including Pull types/module docs/add adapter/help/add/resolve/config/menu/isolation/dispatch tests, hash types/format/row tests, and Serve fixture/start/lifecycle/discovery tests. Diff inspection is not a claim to have opened the complete files. Unchanged surrounding source was followed where needed for the findings above.

**Remaining before any whole-slice clearance:**

1. Execute dedicated counterexamples/closing controls for F1 and F2 under authorized test edits; this review was report-only.
2. Inject failed manifest write/copy with resulting bytes, failed retention, and cleanup-failure followed by root-retraction failure. Confirm each causal error and retained-byte outcome rather than inferring them from generic cancellation tests.
3. Complete the recursive runtime initialization/import audit behind common barrels, especially the restricted Deploy entry. The declared `test:deploy:authority` was read but not executed; broad unit greens do not prove its denied-env/net/run contract.
4. Run the remaining relevant Pull add/public-run/formatting, Deploy preview and Serve status/lifecycle proofs if fresh runtime coverage is required. Their changed assertions were source/diff-inspected, not all executed.
5. Revalidate the coordinator's transitive dependency freeze before further parallel evidence. No live provider, browser execution, release evidence, or hostile OS race guarantee is supplied by this report.

No implementation change or extra review gate is authorized by these findings.

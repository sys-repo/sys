gpt-6-astra • high
# Review for `dist-content-identity.plan.md`: Tools command and failure authority

```text
Mode: Blind, independent review; orthogonal falsification of command authority, document fences and
fault settlement. Evaluate actual failure-path reachability rather than accepting a green suite.
Read this round's README.md first; its dispatch, blindness, state and execution rules apply.

Target: /Users/phil/code/org.sys/sys. Review attributable live worktree behavior, including untracked
files, for feat(dist)!: unify build pins and verification on canonical content identity.
Governing artifact: -agent/-plan/@sys.fs/dist-content-identity.plan.md.
Read its opening five lines, Proposed identity contract, Operation snapshots are not another
distribution identity, workstream F, Required adversarial proof matrix and Completion boundary.
Skip historical/implementation verdicts and receipts. This is a bounded Pull/Deploy review, not a
new review of every Tools command or provider.

Authority: Traverse applicable AGENTS/canon, reconcile the opening arc through read-only history,
and derive conclusions from live source, public contracts, tests, relevant historical source and
your own bounded executions. Plans and commit subjects are not proof. Do not read round 01,
correction/adjudication records, preparation/recovery copies, sibling reports or the implementer's
conversation. Apply STIER/TMIND, including economical seams and explanatory tests.

Question: Can operator input silently advance authority, can asynchronous staging overwrite a
foreign document, or can failure handling lose errors or acquire deletion rights it never owned?
Primary repository-relative sources:
code/sys.tools/src/cli.pull/u.args.ts
code/sys.tools/src/cli.pull/m.cli.ts
code/sys.tools/src/cli.pull/u.resolve.nonInteractive.ts
code/sys.tools/src/cli.pull/u.add.run.ts
code/sys.tools/src/cli.deploy/u.staging/u.copyInto.ts
code/sys.tools/src/cli.deploy/u.staging/u.finalizeDistTree.ts
code/sys.tools/src/cli.deploy/u.staging/u.manifest.ts
code/sys.tools/src/cli.deploy/u.staging/u.identity.ts
code/sys.tools/src/cli.deploy/u.staging/u.execute.ts
code/sys.tools/src/cli.deploy/u.staging/u.stageMappings.ts
code/sys.tools/src/cli.deploy/u.staging/u.verifyStagedDist.ts
Follow direct dependencies only where needed to establish command ordering or retained ownership.

Required falsification dimensions:
1. Add-only flags, including explicit false dry-run, must refuse outside add before selected config
   acquisition/execution. Contrast unsupported legacy integrity, valid add and config-only flows.
   No silent override, materialization despite dry-run, download-derived pin or automatic repin.
2. Trace original document/absence authority through awaited hashing and the last pre-write fence.
   Exercise retained and originally absent manifests with equal-content/different-document
   replacement, preserving the exact foreign bytes and original ledger. Check unchanged controls.
   State the actual snapshot/recheck limit; do not claim atomic CAS or universal filesystem safety.
3. Failed copy leaving bytes: both thrown and returned failures, successful retention of partial
   regular-file bytes, and retention refusal. Demand exact observed-byte checksums, unchanged
   original error identity, ordered aggregate/cause when retention fails, and no invented authority
   for absent manifest or ordinary payload residue. Unsafe/foreign targets must survive cleanup.
4. Returned failed manifest write leaving bytes: distinguish retained residue plus safe rollback
   from retention failure preserving both errors and unowned bytes. Prove the intended branch is
   reached rather than an earlier directory, computation or validation failure.
5. Successful finalization body followed by temporary cleanup failure and root retraction failure:
   require the ordered combined error and preservation of replaced documents/retained records.
   Contrast successful root retraction. A body-plus-cleanup failure is not this branch.
6. Inspect injected copy/write/removal functions as production changes. Defaults, argument capture,
   real directory/document checks and ledger settlement must remain faithful; no public config
   escape hatch, global monkey-patch, borrowed authority or bypass in the proofs. Assess whether
   these are the smallest coherent seams rather than a general fault framework.
7. Preserve cancellation, draining, lease retention until rollback, operation-plus-release failures,
   successful-body release failure, no-clobber and source-copied manifest ownership. Map retained
   assertions to behavior, not raw test counts. Separate document checksum from content identity.

Primary tests:
code/sys.tools/src/cli.pull/-test/-u.args.test.ts
code/sys.tools/src/cli.pull/-test/-u.run.test.ts
code/sys.tools/src/cli.pull/-test/-u.add.run.test.ts
code/sys.tools/src/cli.deploy/u.staging/-test/-manifest.failure.test.ts
code/sys.tools/src/cli.deploy/u.staging/-test/-u.copyInto.test.ts
code/sys.tools/src/cli.deploy/u.staging/-test/-u.execute.test.ts
Follow lifecycle/restricted-authority tests only for an identified missing obligation. Restricted
permissions are not fault injection. Use the owning test:pull and test:deploy:staging tasks with
narrow filters after inspecting their task, initialization and fixture effects. Any child build or
shared-output test requires a serialized slot; do not silently run the whole package.

Make the strongest evidence-based case for leaving the design unchanged. Do not invent additional
failure matrices without a concrete unsupported branch or invariant, and do not merge owners or
remove assertions merely to reduce code. A clean result is valid.

Boundaries: Review only under README rules. Preserve concurrent App/UI and unrelated work. No source
or test edits, formatter writes, Git/remote mutations, permission/profile changes, dependency
regeneration, publication, provider pushes, release-evidence rebinding or shared sample rebuilding.
Record actual scoped inputs and compare content at exit, not just HEAD/status. Stop on denied
permissions/provenance; an unavailable slot or unproved branch must remain explicit.

Output: Write only
-agent/-plan/@sys.fs/dist-content-identity.plan.reviews/02/02-tools.review.md.
Use the README report contract. Include a command/document/fault-to-assertion map, identifying
successful-body versus failed-body cleanup paths and the real code each injection reaches. Findings
need exact path/symbol, executable sequence, violated invariant, minimal owner correction and closing
proof. Separate inspected/predicted/executed behavior, optional simplification and incomplete scope.
Return a scoped verdict, never independent landing clearance.
```

gpt-6-astra • high
# Review for `dist-content-identity.plan.md`: Tools command and failure authority

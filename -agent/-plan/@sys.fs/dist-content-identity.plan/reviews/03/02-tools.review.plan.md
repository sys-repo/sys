gpt-6-astra • high
# Review for `dist-content-identity.plan.md`: Tools document ownership and failure settlement

```text
Mode: Blind, independent review; independent replication of document ownership and orthogonal
falsification of failure settlement. Read this round's README.md first; its blindness, material-input,
serialized-slot and report rules apply.

Target: /Users/phil/code/org.sys/sys. Review attributable live worktree behavior, including untracked
files, for feat(dist)!: unify build pins and verification on canonical content identity.
Governing artifact: -agent/-plan/@sys.fs/dist-content-identity.plan.md.
Read the opening five lines, Proposed identity contract, Operation snapshots are not another
distribution identity, workstream F, Required adversarial proof matrix and Completion boundary.
Skip historical checkpoints, prior reports, adjudications, correction receipts and conversation.

Authority: Traverse applicable AGENTS/canon and reconcile the opening arc through reachable read-only
history. Use live contracts, source, tests and your own bounded executions. Plans and commit subjects
are evidence, not proof. Do not consume sibling reports or historical preparation snapshots.

Question: Can staging lose an original failure, acquire deletion rights over foreign bytes, or publish
success without satisfying its exact-document and command-authority obligations?
Primary sources:
code/sys.tools/src/cli.deploy/u.staging/u.copyInto.ts
code/sys.tools/src/cli.deploy/u.staging/u.manifest.ts
code/sys.tools/src/cli.deploy/u.staging/u.finalizeDistTree.ts
code/sys.tools/src/cli.deploy/u.staging/u.identity.ts
code/sys.tools/src/cli.deploy/u.staging/u.execute.ts
code/sys.tools/src/cli.deploy/u.staging/u.verifyStagedDist.ts
code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts
code/sys.tools/src/cli.pull/u.add.ts
Follow direct dependencies where needed to establish ownership, error propagation or publication.

Falsification dimensions:
1. Trace both returned and thrown copy failures through initial residue observation, hashing and
   ledger retention. Fail each consequential retention phase, not only the final checksum read.
   Require original error identity/cause and ordered combined failures; do not replace the original
   failure with a retention exception. Distinguish absent, regular, unsafe and foreign residue.
2. Contrast manifest residue with ordinary payload residue. An ordinary failed payload copy does not
   mint manifest deletion authority. Exact bytes and directory identity, not content equality, govern
   retention/removal. Exercise unchanged owned bytes and foreign bytes as positive/negative controls.
3. Trace original document/absence authority across awaits and the last pre-write fence. Supported
   equal-content/different-document replacement must remain intact. State snapshot/recheck limits;
   do not claim atomic compare-and-swap or universal no-follow protection.
4. Inspect failed writes, body failure plus cleanup failure, and successful body followed by temporary
   cleanup plus root retraction failure as distinct branches. Preserve exact error ordering, causes,
   publication truth, foreign bytes, ledger state, draining and lease lifetime.
5. Assess injected copy/write/removal functions as production code: default behavior, argument
   capture and real filesystem/ledger checks remain intact. No global patch, public escape hatch,
   weakened expectation or new framework is justified merely to make tests pass.
6. At the changed provider/Pull fixtures, verify that method shorthand, named invalid-pin collections
   and canonical Fs operations preserve reachability and independent assertions. No downloaded pin,
   legacy acceptance, silent command override or content-equality claim of exact-document upload.
   Follow command parsing only if a concrete propagation question requires it.

Primary proof files:
code/sys.tools/src/cli.deploy/u.staging/-test/-manifest.failure.test.ts
code/sys.tools/src/cli.deploy/u.staging/-test/-u.copyInto.test.ts
code/sys.tools/src/cli.deploy/u.staging/-test/-u.execute.test.ts
code/sys.tools/src/cli.deploy/-test/-u.stage.lifecycle.test.ts
code/sys.tools/src/cli.deploy/u.providers/provider.r2/-test/-u.push.test.ts
code/sys.tools/src/cli.pull/-test/-u.add.test.ts
Inspect owning deno.json, presets, initialization and fixture effects before selecting commands.
Candidate bounded task/filter pairs, run from code/sys.tools:
- test:deploy:staging with --filter='/^Staging: (manifest failure settlement|copyInto)$/'
- test:deploy:staging with --filter='/^Staging: owned exact root Dist$/'
- test:deploy with --filter='/^@sys\/tools\/deploy public staging lifecycle$/'
- test:deploy with --filter='/^R2 Provider: push$/'
- test:pull with --filter='/^@sys\/tools\/pull add$/'
Use --frozen --cached-only --no-prompt --reporter=dot; preserve task-provided leak tracing.
Confirm filters match real tests; zero selected tests are not a pass. No full Pull suite or real
provider operation. Build-bearing staging/lifecycle work waits for the explicit Tools slot.
Make the strongest supported case for leaving the current design unchanged; add no matrix by quota.

Boundaries: Review only under README rules. Author only the report; no source/test/formatter writes,
Git/remote mutations, dependency or permission changes, publication, shared sample builds or release
rebinding. Preserve concurrent work. Stop on denied authority, material drift or unavailable slot;
record the actual remaining proof gap rather than borrowing implementer results.

Output: Write only
-agent/-plan/@sys.fs/dist-content-identity.plan.reviews/03/02-tools.review.md.
Use the README verdict/finding contract. Include a copy/write/observation/cleanup-to-assertion map,
explicitly distinguishing successful-body and failed-body settlement. Each material finding needs
exact path/symbol, executable sequence, invariant, smallest owner correction and closing proof.
Separate executed outcomes, source deductions, optional simplifications and missing evidence.
A clean scoped review is valid; it is not landing clearance.
```

gpt-6-astra • high
# Review for `dist-content-identity.plan.md`: Tools document ownership and failure settlement

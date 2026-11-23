@sys.tmpl
template-dependency-parity.plan.md
- [x] 31d493c54 chore(tmpl): sync Rollup and Vite pins and refresh embedded bundle

## Purpose and authority

The original goal was to restore template dependency parity after the root dependency upgrade. This
was an artifact refresh, not a synchronization redesign. Phil requested DMIND/TMIND review and
planning and deferred prep. This plan grants no prep execution, cleanup, implementation, Git
mutation, publication, or permission expansion.

The original item, `chore(tmpl): refresh generated template surfaces and embedded bundle`, maps to
the commit in the opening arc. Its diff updates repo-template `-deps.yaml` and `-package.json` to
Rollup `4.67.2` and Vite `8.3.5`, updates the `vite` entry in `imports.json` to `npm:vite@8.3.5`,
and changes all three corresponding entries in the embedded bundle. This shows what landed, not
which generator commands ran or whether the plan's verification passed.

## Original baseline and review

- `9dbd44c77` updated root `deps.yaml`, `imports.json`, and `package.json`, but not template
  projections. At that baseline, root selected Rollup `4.67.2` and Vite `8.3.5`; repo-template
  `-deps.yaml` and `-package.json` still selected `4.64.12` and `8.3.4`. Template `imports.json`
  still selected `npm:vite@8.3.4` while root selected `npm:vite@8.3.5`.
- The pre-refresh run of `code/-tmpl/-scripts/-test/-prep.test.ts` produced 24 passing steps and one
  failing parity step at line 605. Its YAML assertion ran before the import-map and package
  assertions, so that failure masked the other known drift.
- `-scripts/task.prep.ts` already owns template refresh explicitly. It invokes the template script
  with `--version-source=published`, validates published export availability, and regenerates the
  template projections and bundles. No missing orchestration has been established.
- Package-local `deno task prep` is not equivalent: `code/-tmpl/deno.json` runs cleanup first and
  leaves version selection at the script's workspace default. `prep:bundle` alone does not sync
  dependencies. Do not substitute either for root policy.
- Root prep first writes dependency projections, package metadata, and submodule outputs; later it
  normalizes the workspace, writes the graph, and generates CI artifacts. It also derives the CI
  Deno pin from the executing runtime. A later failure does not roll back earlier writes.
- `code/-tmpl/src/m.tmpl/-test/-u.makeBundle.test.ts` calls `makeBundle()` against the live module
  even after changing cwd to a temporary directory. The full suite is not a read-only check and can
  conceal an omitted bundle refresh. Capture the prepared candidate before running it.
- Generated-repo integration tests localize dependency authorities before some checks. Their green
  result is local-consumer evidence, not standalone proof of the published consumer graph.

DMIND conclusion: preserve the existing authority-to-generator flow; a new API or duplicate updater
would add machinery without solving a demonstrated gap. TMIND consequence: verify every derived
surface, preserve published-version policy, and distinguish generator success from test repair. This
was a source-based review in the existing thread, not an independent blind review.

## Invariants and boundaries

1. Root `deps.yaml` remains dependency authority. Do not hand-patch generated imports, package
   manifests, or embedded JSON to satisfy the test; do not weaken the parity assertion.
2. Preserve the root published-JSR selection and export checks, including its existing unpublished
   fallback. Registry failure or missing exports is a stop, not permission to use workspace mode.
3. Preserve unrelated tracked and untracked work, especially plans and the already-dirty lockfile. A
   dirty tree alone is not a blocker; uncertain ownership or concurrent writes to outputs are.
4. Refresh the source projections and embedded product together. Do not claim success from changing
   only the first failing comparison, or from tests that regenerate missing output themselves.
5. No dependency-selection changes, runtime/API edits, new tests, automatic-upgrade integration,
   cache deletion, broad formatting, or publication are required by the observed failure. A new
   behavioral defect requires a separately agreed scope and focused regression proof.

The adjacent `../@sys.workspace/dependency-upgrade-completion.plan.md` concerns upgrade finalization
and installation proof. It is not a prerequisite and is not modified or duplicated here.

## Original prep procedure

This procedure records the intended execution at the original baseline. It is not a record that prep
ran or an instruction to rerun it. Root `deno task prep` was the intended entry point; non-template
outputs require separate attribution. Revalidate source, worktree state, and task scope before any
separately authorized run.

1. Reopen the owning root/template configs and scripts; inspect the current submodule task chain,
   permissions, and exact output paths before authorizing the broad root run. This review traced
   representative generators, not every transitive write. Stop if that footprint remains unclear.
2. Pause overlapping writers. Record HEAD, runtime version, staged/unstaged diffs and untracked path
   state. Preserve recoverable current bytes for dirty or untracked outputs that may be overwritten.
   Never infer a backup from a status list or restore open work from HEAD. No automatic stash.
3. Run the narrow parity test below to establish current red, unless another authorized refresh has
   already resolved it. If it is green, inspect the candidate instead of creating redundant work.
4. After explicit approval, run root `deno task prep` once. Capture phase output and exit status. On
   failure, preserve partial output and report the failing phase; do not automatically retry, clean,
   change version policy, or bypass any security/provenance gate. Root's template lane skips package
   cleanup; forbidden template artifacts must be resolved explicitly, not silently deleted.
5. Inspect all resulting deltas against the preserved baseline. Account for non-template generator
   changes separately. If the actual footprint exceeds the agreed one, stop further writes and
   preserve evidence. Verify that unrelated open work survived.
6. Review the template candidate before any bundle-writing test. The expected owning surfaces are:
   - `code/-tmpl/-templates/tmpl.repo/-deps.yaml`
   - `code/-tmpl/-templates/tmpl.repo/imports.json`
   - `code/-tmpl/-templates/tmpl.repo/-package.json`
   - `code/-tmpl/src/m.tmpl/-bundle.json`
   - `code/-tmpl/src/m.help/-bundle/-bundle.json` only if its generator produces a real change.

   These are inspection targets, not a promise that every file changes or a staging recipe.
   Published JSR refreshes may change more than the two npm pins; inspect actual resolved versions.

## Proof and completion

The refresh is landed, but plan closure is not established. The only recorded test outcome is the
pre-refresh failure above. No passing results for the landed refresh are recorded for scoped parity,
type check, or the full template suite. The bundle diff shows that the entries changed; it does not
establish a full source-to-bundle comparison or that the suite left the candidate bundle unchanged.
Later dependency updates do not establish those results for this refresh. No prep or tests ran as
part of plan reconciliation.

The original verification procedure specified these commands from
`/Users/phil/code/org.sys/sys/code/-tmpl`:

```sh
deno task test --trace-leaks ./-scripts/-test/-prep.test.ts
deno task check
deno task test
```

- Require all three parity comparisons to pass: dependency YAML, import map, and package manifest.
- Preserve the post-prep bundle bytes, then compare them after the full suite. Any byte change is a
  discrepancy to explain, not proof that the original candidate was complete. Revalidate the final
  candidate if a test changed it; do not silently accept test-driven repair.
- Inspect embedded repo manifest content against the generated source manifests. Existing scoped
  parity alone does not inspect the embedded product. Use the standard read surface; never an ad hoc
  filesystem-reading runtime to decode or compare live files.
- Record command outcomes and evidence limits. Full module tests cover local generated-repo use; do
  not claim independent published-consumer or whole-workspace acceptance from them.
- A separate root maintenance run requires its own workspace verification; this template refresh
  does not establish acceptance for other owners.

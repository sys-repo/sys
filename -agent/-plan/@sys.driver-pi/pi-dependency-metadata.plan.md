pi-dependency-metadata.plan.md
- [x] 7d4c4332e fix(esm): propagate dependency file write failures
- [x] bb8e2bb51 fix(driver-pi): refresh host metadata after dependency updates

## Completion

This plan is complete. It is retained as the final implementation and verification record;
retirement is a separate later action. The opening arc records the verified implementation commits.
The completed scope is dependency-write rejection and Pi metadata freshness, not host compatibility.

## Purpose

Keep the published Pi launcher fallback derived from root `deps.yaml`, without turning the root
upgrade task into a workflow framework.

`d2d6f905e` updated Pi `0.85.0 → 0.85.1` in the dependency authority and import map while the
launcher fallback remained `0.85.0`. The generator already existed; the upgrade path did not call
it. This is dependency maintenance needed independently of ZIP extraction or tools self-upgrade.

Planning grants no implementation, Git mutation, publication, or host-startup authority. Preserve
unrelated worktree changes.

## 1. Dependency writes must reject failure

`@sys/fs` writes return an error result by default. Before this correction, `Deps.applyYaml`,
`Deps.applyDeno`, and `Deps.applyPackage` discarded those results and returned success-shaped
projection results. Consequently, `WorkspaceCli` could report `kind: 'apply'` after a failed write.
A wrapper test that injects a rejecting `run` does not prove the real writer rejects.

- All five write calls use the existing `{ throw: true }` option in
  `code/sys/esm/src/m.deps/u.applyYaml.ts`, `u.apply.ts`, and `u.applyPackage.ts`.
- Preserve public result shapes, projection behavior, optional package output, and write order.
  `applyFiles` must stop at the first rejection; its caller then cannot report an applied result.
- The `t.ts` and `u.applyFiles.ts` contracts document rejection and sequential, non-transactional
  application. Earlier writes, and partial bytes from a failed write, may remain. Do not add
  rollback, staging, retries, read-back verification, or a new filesystem abstraction.
- Real-filesystem regressions in `-u.applyYaml.test.ts`, `-u.apply.test.ts`, and
  `-u.applyPackage.test.ts` use fixture directories where output files are expected. The import-map
  case uses a valid Deno config pointing to that directory. They neither manipulate permissions nor
  depend on platform-specific error messages.
- The `-u.applyFiles.test.ts` capstone proves an early write failure rejects and leaves later
  projection targets unchanged. Existing inline/import-map, JSONC, subpath, policy, and
  optional-package success coverage remains.

These are `@sys/esm` corrections, not extra checks inside `task.upgrade.ts`. `@sys/fs` already owns
and tests throwing write semantics; no Fs or Workspace runtime change is required.

## 2. One generator, one small upgrade adapter

The generator extraction, its callers, documentation, and tests form one maintenance outcome.
Keeping them together avoids documenting behavior before the upgrade hook delivers it.

```text
root upgrade apply resolves → refresh Pi fallback from the written deps.yaml → task resolves
```

### Ownership and behavior

- Root `-scripts/task.upgrade.ts` only forwards `['upgrade', ...argv]`, awaits the CLI result, and
  awaits the generator for `kind: 'apply'` against this repository's root manifest. Use the CLI's
  resolved manifest identity; do not reparse flags, search ancestors, or broaden path matching.
- Help, planned/dry-run results, other manifests, and rejected upgrades cause no Pi metadata
  refresh. A root apply with no selected version changes may repair existing fallback drift.
- The two-function injection seam is package-neutral: `run` returns the bounded workspace result;
  `refresh(root: t.StringDir): Promise<void>` owns refresh completion. The local
  `refreshDependencyMetadata` function composes the Pi-owned writer and its path construction.
  Concrete package imports remain static; no registry, subprocess, or additional module is needed.
- The upstream namespace comes through the local type pool. The non-apply discriminant is
  `Exclude<t.WorkspaceCli.Result['kind'], 'apply'>`; apply retains the required `options.deps`. Do
  not fabricate complete workspace result fixtures or introduce a public result API.
- `code/sys.driver/driver-pi/-scripts/-prep.u.ts` owns the single read/validate/patch/write path.
  Keep the existing generated version seam in `src/m.cli/u/u.resolve.pkg.ts`. Exact-version
  validation uses `Semver`; the patcher refuses missing anchors or a non-unique version seam and
  preserves unrelated bytes, including LF/CRLF form. This is a patch to controlled repository
  source, not a general TypeScript parser. No second version pin, metadata format, or generator
  framework.
- Write only on change, with throwing IO. Check mode never writes. Bad authority, source shape, or
  reads reject before the write. A write failure rejects without promising atomic replacement.
- Package `task.prep.ts`, `prep:deps`, and `check:deps` use that same owner. Use canonical
  `Args.parse` for the metadata task while preserving its exact accepted inputs: no arguments or one
  `--check`. Reject everything else before IO. Metadata-only tasks must not build extensions or
  launch Pi.
- Preserve launcher selection precedence: explicit override, discoverable dependency authority, then
  generated release fallback. Metadata equality does not establish host ABI compatibility.

### Failure and recovery

Workspace's applied summary describes its completed dependency phase and may print before metadata
refresh. Keep that ordering; a failed refresh must reject the task. The root failure test proves
rejection with the original error, not terminal success-output behavior. Do not wrap or suppress the
original error.

A failed upgrade or refresh is not a transaction rollback. For manual dependency edits, root
`deno task prep` remains the full preparation route. Package `prep:deps` repairs only the fallback
when dependency projections are already current; it does not regenerate imports or reconcile locks.
Keep the README precise about this distinction and about check-only versus three-way unit proof.

### Surfaces and proof

Root surfaces: `-scripts/task.upgrade.ts`, `-scripts/-test/-task.upgrade.test.ts`, `-scripts/t.ts`,
and `deno.json`. Driver Pi surfaces: `-scripts/-prep.u.ts`, `-scripts/-test/-prep.test.ts`,
`-scripts/task.prep.ts`, `-scripts/task.prep.deps.ts`, `-scripts/common.ts`,
`src/m.cli/u/u.resolve.pkg.ts`, `deno.json`, and README `Upstream`. Type-pool and common changes are
limited to required upstream type/helper re-exports.

- Retain one real-generator fixture at the root seam: the injected upgrade writes a dependency
  before resolving; the generator reads those new bytes; `main` waits for refresh completion. Other
  cases need only small result fixtures, not filesystem setup.
- Owner tests prove exact pin validation, source preservation, drift refusal without rewriting,
  idempotence, and agreement between root authority, import map, and the loaded fallback.
- Keep fixture versions independent of the selected release. The fixture's `resolvePkg` call with a
  present `deps.yaml` tests authority lookup, not reloading regenerated module code. Preserve
  existing no-deps launcher coverage; do not add dynamic-import/cache machinery to overclaim it.
- The fallback agrees with the existing `0.85.1` authority; the owner reported it current. Future
  version changes belong in the manifest, not hand edits to the fallback. No dependency bump is part
  of this item.
- Keep host-loader/queue proofs, their permission setup, `-host.queue.ts`, ZIP bundles, and GUI work
  outside this commit. The README needs the metadata/compatibility distinction, not a future host
  test prescription. ZIP owns its compatibility proof independently.

## Verification

Scoped reproduction commands, from the repository root:

```sh
deno task --cwd code/sys/esm test --trace-leaks ./src/m.deps
deno task --cwd code/sys/esm check
deno task test:upgrade
deno task --cwd code/sys.driver/driver-pi test:deps
deno task --cwd code/sys.driver/driver-pi check:deps
deno task upgrade --help
```

Driver Pi `check` and `test:unit` provide package-wide verification. The human owns full workspace
CI; do not rerun root `check`, `test`, or `ci` without a new request. Keep agent verification scoped
and report environmental or unrelated failures separately. Do not widen permissions or run a real
registry upgrade, host integration, or publication as a proof shortcut.

The root `test:upgrade` suite is explicit: the package-matrix runner does not discover root script
tests. Run it independently; this plan does not redesign CI or claim new automatic CI coverage.

### Observed proof

- The four ESM directory-target regressions were executed red → green during implementation. The
  dependency suite passed 52 steps, and ESM `check` passed.
- Root `test:upgrade` passed 3 steps; Driver Pi `test:deps` passed 14 steps. Both were rerun after
  the package-neutral root factoring. They cover the real-generator fixture, refresh ordering,
  unchanged CLI-result identity, skipped refreshes, error propagation, and metadata consistency.
- Driver Pi `prep:deps` and `check:deps` reported the fallback current at `0.85.1`. Package `check`
  passed, and `test:unit` passed 436 steps before the final root-only factoring and README polish.
  The real root `upgrade --help` also passed after factoring.
- Formatting, scoped lint, and whitespace checks passed for the implementation deltas. The final
  README-only refinement passed formatting and whitespace checks; it changed no runtime behavior.
- The human reported full CI green before the final README-only refinement. This is human-reported
  evidence; the CI log was not independently inspected. The agent's earlier workspace check passed
  54 packages; its subsequent monorepo test attempt was aborted and supplies no full-suite result.
- A blind STIER review reported no correctness blockers or optional taste changes across the 12
  target surfaces. It independently ran the root upgrade and metadata suites plus freshness checks;
  it inspected, but did not rerun, ESM regressions or establish their historical red-first
  execution. That review preceded the final root factoring and README polish; subsequent scoped
  checks are recorded above, not attributed to the blind reviewer.

These proofs establish dependency-write rejection and metadata freshness, not upstream host
compatibility. Host-loader/queue work remains outside this plan's implementation commits.

## ZIP relationship

`../@sys.archive.zip/zip.plan.md` consumes this plan as a prerequisite before its Driver Pi
extraction item. This plan owns dependency-write truth and metadata freshness only. It neither
establishes host compatibility nor authorizes extraction. Keep the prerequisite reference after
retirement; do not duplicate this commit arc in the ZIP plan.

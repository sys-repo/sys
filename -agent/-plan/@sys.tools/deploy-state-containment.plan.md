@sys.tools
deploy-state-containment.plan.md
- [x] 9537de5ee fix(tools): contain build coordination in source-owned dev state
- [ ] chore(deploy): isolate the fs.db.team development workflow

## Boundary

Resolution for Deploy-created `.sys.rooted` metadata in library namespace parents. The human
subsequently authorized item 1 and its verification follow-up. This plan grants no Git mutation,
process termination, remote action, or cleanup authority.

Desired invariant: library namespace directories are not implicit runtime-state owners. Test
fixtures, development workflows, build coordination, and disposable output each have an explicit,
self-contained owner. Existing cross-process build exclusion must survive the correction.

## Item 1 implementation and verification

- Initial containment implementation landed in `9537de5ee`. Its restricted test failed during
  unrelated CLI/Chalk initialization before reaching the intended write refusal.
- The verification follow-up in `8ee43d151` isolates identity/build-lease runtime imports from the
  CLI graph and moves the restricted regression to the build-lease owner. The child retains
  fixture-only read authority,
  denied writes, and no environment grant. No profile or task permission grants changed.
- `code/sys.tools/README.md` now documents state ownership, persistent lock inodes, publication
  exclusion, and quiescent cutover. Old/new lock namespaces must not overlap operationally.
- `deno task test:deploy` from `code/sys.tools`: 37 passed, 309 steps, zero failures. This includes
  14 containment checks, the public cross-process/cancellation capstone, and package selection.
- `deno task test:deploy:authority`: 4 passed, 40 steps, plus `Deploy.stage authority proof passed.`
- Final `test:deploy --reporter=dot` rerun also passed 37 suites / 309 steps, including
  type-checking the restricted child. Formatting, lint, and `git diff --check` passed for the
  implementation slice.
- The publication regression runs real `deno publish --dry-run` against a disposable package while
  holding its build lock, using the current workspace ignore policy. The normal package files are
  selected and coordination files are absent. Clearing only the fixture's policy selects that same
  lock as a positive control. Nothing is uploaded and the real ignore policy is unchanged.
- The existing public build fixture verifies exact staged manifest membership, excluding dev state.
  No temporary rollback to the obsolete producer was performed for a separate placement red run.
- The recorded test results are implementation-thread verification, not an independent review.
  They describe that verification pass, not a fresh run against the current repository.
- No operational configs or existing metadata were moved/deleted; no real workflow build or remote
  deployment ran. Workflow verification and cleanup remain separate from this item.

## Observed cause (at diagnosis)

- `code/sys.tools/.tmp/-config/@sys.tools.deploy/tdb.fs.yaml` selects `../../../code` as its source
  root and build+copy mappings for `sys.ui/ui-components`, `sys.driver/driver-automerge`,
  `sys.driver/driver-monaco`, `sys.driver/driver-stripe`, and `sys.dev`. It also copies
  `sys.tools/.tmp/releases`. This is a matching local operational configuration, not a test fixture.
- `code/sys.tools/src/cli.deploy/u.staging/u.prepare.ts` canonicalizes the source directories.
- Before the correction, `code/sys.tools/src/cli.deploy/u.staging/u.buildLease.ts` grouped build
  sources by `Path.dirname(source)`, created Rooted at that parent, and leased
  `Path.basename(source)`.
- `code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.lock.ts` creates persistent lock files beneath the
  selected root's `.sys.rooted/locks`. The filename hashes the normalized relative target. Release
  unlocks and closes the descriptor; it deliberately does not unlink the file.
- The three observed driver lock hashes exactly match `driver-automerge`, `driver-monaco`, and
  `driver-stripe`. The matching configuration also explains the placement under `code/sys.ui` and
  `code`. No historical command log was inspected; do not claim the exact originating invocation or
  operator is known.
- The parent-root selection was introduced by reachable commit `7f0b346f9` and replaced by
  `9537de5ee`. Moving the endpoint config alone would not have corrected source-parent metadata.
- Separately, `u.stageMappings.ts` roots staging ownership at the caller's canonical cwd. Running an
  endpoint with a library package as cwd can therefore create package-root metadata even for
  copy-only staging. Moving the operational cwd into a dev/deploy workspace addresses this caller
  boundary; build-source containment still requires the first item.
- Current Deploy test fixtures use `Fs.makeTempDir()` and remove their own complete temporary
  workspace. The public lifecycle test constructs its builder inside that workspace. The inspected
  tests do not explain the three real driver-package lock names.

## Proposed ownership

### 1. Build-source coordination: source-owned development state

Use the canonical build source's `-dev/deploy/` directory as the stable coordination owner, with
Rooted metadata beneath it. For example:

`code/sys.driver/driver-automerge/-dev/deploy/.sys.rooted/locks/`

Derive this location from the canonical source, never the endpoint cwd, configuration filename,
process ID, random temporary directory, or source parent. Every cooperating Deploy operation on that
source must converge on this same location even when its endpoint cwd differs.

Keep the correction in Deploy. Reuse the existing Rooted lease primitive in this named coordination
area; a private, fixed build-coordination target represents ownership of that source's build. Return
only the release handle already exposed by `StagingBuildLease`. Do not expose a proxy target as an
actual source-tree removal/publication capability. Preserve source-identity checks separately. No
new generic lock framework or global Rooted metadata-location option is proposed.

Requirements:

- Establish and revalidate the coordination directory beneath the retained canonical source with
  existing Fs/path/identity helpers. Refuse symlinks, wrong-kind entries, replacement, unsupported
  identities, or unavailable permissions; do not fall back to a parent or another state home.
- Preserve deterministic multi-source ordering, partial-acquisition release, fail-fast busy results,
  cancellation, and child settlement before releasing build ownership.
- Keep source-independent staging/tree ownership unchanged. This is a build-coordination change, not
  a general redesign of Rooted or Deploy's staging-root contract.
- Do not put live persistent locks in disposable output. The affected packages'
  `-scripts/task.clean.ts` files currently remove their whole `.tmp` directory; some also remove
  `dist`. A scratch cleanup must not unlink a live coordination inode.
- Keep generated coordination state out of publication artifacts and package source distributions.
  Inspect actual publication/build selection rather than assuming a hidden name alone excludes it.
- Document this state home and its quiescent-retirement rule at the Deploy owner.

This deliberately leaves small, named dev state at each mutable build source. A caller-local
registry would be visually more centralized but would split ownership when two different endpoint
workspaces build the same source. If source-local dev state is rejected, resolve that shared-owner
contract explicitly before implementation; do not substitute a per-caller lock silently.

### 2. Operational workflow: a dedicated deployment workspace

Proposed home: `deploy/fs.db.team/`.

- Move the matching local endpoint configuration out of
  `code/sys.tools/.tmp/-config/@sys.tools.deploy/tdb.fs.yaml` into an explicitly owned development
  workflow. Keep any credentials/local-only data out of tracked samples.
- Resolve its source root from the new workspace (`../../code`) and put staging output beneath
  `deploy/fs.db.team/.tmp/staging/`.
- Run the workflow with `deploy/fs.db.team` as its actual cwd, so staging coordination belongs to
  that workspace rather than a library package. Persistent staging metadata can remain at this
  explicit workflow owner; disposable output belongs in `.tmp`.
- Preserve all source/output mappings deliberately, including the existing releases input. This
  investigation does not establish ownership or migration authority for that input's producer.
- Add a narrow declared local stage task; do not invoke remote push as part of verification.
- If this requires a new package/module boundary, use the current template and human-led scaffold
  review before implementation. Do not invent a second deployment framework.
- Do not migrate unrelated local endpoint configs such as `slc.yaml` in this item. Inspect them
  before any later migration; they may require their own deployment owners.

## Proof

Baseline executed during diagnosis:

`cd code/sys.tools && deno task test:deploy --filter 'public staging lifecycle'`

Result: 1 suite passed, 2 steps, 0 failures. It proves current cross-cwd build exclusion and
cancellation/child settlement. It does not prove correct metadata placement.

Implementation must add red → green coverage for:

1. A fake library namespace parent gains no files/directories when building its child package. The
   current parent-root implementation must fail this assertion.
2. Expected coordination writes occur only inside that source's declared dev-state boundary; source
   parent and unrelated siblings remain unchanged on success, busy, cancellation, and error.
3. Distinct endpoint cwd roots selecting the same canonical source still exclude each other.
   Different canonical sources retain independent build ownership. Alias paths converge.
4. Cleaning source `.tmp` and disposable `dist` does not permit a contending Deploy build while the
   first lease remains held. Tests use disposable fixtures, never real package cleanup tasks.
5. Symlinked/wrong-kind dev-state ancestors, identity replacement, and permission refusal fail
   closed without outside metadata creation or fallback writes.
6. Partial acquisition, failed builds, and cancellation release all retained leases after the child
   settles. A subsequent operation can acquire normally. Persistent lock files survive release.
7. The dedicated workflow and existing Cell copy-only sample keep their state under their own
   workflow roots. Build/state files do not enter the staged Dist or published package file set.

Use scoped Deploy tests during iteration, then the Deploy suite and declared authority proof. Do not
broaden permission grants to obtain a pass. Finish with a local-only staging run from the approved
dev workspace and a before/after path inventory. No remote publication is necessary.

## Quiescent cutover and cleanup

Ignored runtime artifacts are not commit items. Cleanup is an operational follow-up, not an invented
source-code commit or a reason to rewrite history.

1. Preserve/rehome the operational endpoint before deleting any scratch area that contains it.
2. Complete and verify the producer correction before retiring old metadata.
3. Stop all old and new cooperating Deploy builds for the affected sources through the human's
   normal process lifecycle. Old and new lock namespaces must not operate concurrently during
   cutover. File age, zero byte length, or one momentary process check is not sufficient proof.
4. Inventory exact paths and contents again. The observed misplaced candidates are:
   - `code/.sys.rooted`
   - `code/sys.driver/.sys.rooted`
   - `code/sys.ui/.sys.rooted`
   - `code/sys.tools/.sys.rooted` The first three align with the matching build-source
     configuration; the tools package has additional staging metadata whose individual
     targets/origin still require attribution before deletion. Do not infer that every `.sys.rooted`
     directory in the repository is junk.
5. Preserve `code/sys/cell/-sample/cell.deploy/.sys.rooted`: it is already under a named sample
   owner. This inventory pruned `.tmp`, `.pi`, and dependency trees; it is not an exhaustive audit
   of valid stores or runtime metadata elsewhere.
6. After explicit cleanup approval and confirmed quiescence, use the wrapper `remove` tool on only
   the inspected, approved obsolete paths. No `git clean`, shell deletion, blanket glob, or
   automatic lock unlinking on release. Stop on a tool/permission denial rather than routing around
   it.
7. Handle the previously diagnosed 28 `code/sys/fs/.tmp-fs-rooted-*` leftovers separately: enumerate
   exact paths and confirm fixture-only contents before approved removal. Their producer was fixed
   by `30a14c530`; they are not part of the Deploy-lock migration. Sealed-tree deletion may require
   a human-owned cleanup path if the wrapper refuses it.
8. Rerun local staging and inventory namespace/package roots. The old parent metadata must not
   return. Confirm author-owned configs and unrelated work remain intact.

## Non-goals

- No explorer exclusion presented as a containment fix.
- No deletion of active locks, removal of build exclusion, or weakening of provenance/permissions.
- No new global state registry, ambient home dependency, or arbitrary Rooted metadata redirection.
- No wholesale library/demo reorganization, remote deployment, or unrelated plan changes.

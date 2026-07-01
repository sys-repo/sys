# Workspace delta plan

## Commit arc

- [x] `100859f85` types(workspace): define bump delta surface
- [x] `9049fb3a6` feat(workspace): add bump delta planner
- [x] `ffc3eeeb2` refactor(workspace): polish bump delta path handling
- [x] `30895be85` refactor(workspace): promote delta root surface
- [x] `740814fd4` feat(workspace): add git name-status delta adapter
- [x] `77900d992` feat(workspace): wire bump since planning
- [x] `82a3a290d` feat(workspace): add package help resource surface
- [x] `65ec2697d` feat(workspace): add delta DSL help

## Current state

We have a pure first implementation promoted to the root workspace surface:

```txt
code/sys/workspace/src/m.delta/
```

It maps changed workspace-relative files to bump candidates and derives the dependent bump closure.
`Workspace.Bump` no longer owns `Delta`; bump planning consumes the shared closure helper. The
`fromChangedFiles` orchestration is split from reusable file-normalization and owner-resolution helpers.
`Workspace.Delta.Git.fromNameStatus(...)` adapts raw or structured git name-status records into that
same pure changed-file path, and `Workspace.Delta.Git.fromRef(...)` now answers:

> What changed since the publish baseline, and what still needs a version bump?

The deterministic bump-since behavior is feature-locked. The package help surface and
`delta`/`bump --since` DSL guidance have landed; this plan is complete and ready to retire.

## Placement decision: promote Delta to root workspace surface

`Delta` should no longer remain a sub-namespace of `Workspace.Bump`.

Reason: the earned concept is larger than bump application. It owns package-level change facts for a
workspace baseline:

- changed files
- owning workspace packages
- skipped non-package files
- baseline/current version comparison
- already-bumped vs still-needs-bump classification
- bump-root and bump-closure projection
- later CLI/DSL explanation

`Bump` should consume `Delta`; it should not own the entire baseline-delta concept.

Target root surface:

```ts
Workspace.Delta
WorkspaceDelta
```

Current root layout:

```txt
code/sys/workspace/src/m.delta/
  mod.ts
  t.ts
  m.fromChangedFiles.ts
  -test/-.test.ts
  -test/-m.fromChangedFiles.test.ts
  u/u.closure.ts
  u/u.files.ts
  u/u.owners.ts
```

Future earned helpers may add:

```txt
code/sys/workspace/src/m.delta/u/u.git.ts
code/sys/workspace/src/m.delta/u/u.versions.ts
```

The concept has crossed the threshold where keeping it as `m.bump/m.Delta.ts` would blur ownership.

Wire root exports through:

```txt
code/sys/workspace/src/mod.Workspace.ts
code/sys/workspace/src/t.namespace.ts
code/sys/workspace/src/types.ts
```

Remove or replace the `Workspace.Bump.Delta` surface unless compatibility pressure appears before
publish. This is still pre-publish for the new API, so prefer the clean root shape.

## Full target API

The root Delta surface should have a pure core and explicit runtime bridges:

```ts
Workspace.Delta.fromChangedFiles(...)
Workspace.Delta.Git.fromNameStatus(...)
Workspace.Delta.Git.fromRef(...)
```

### `fromChangedFiles(...)`

Pure deterministic core. No git, no FS mutation, no publish semantics.

Input:

```ts
{
  collect: WorkspaceBump.CollectResult;
  changedFiles: readonly t.StringPath[];
}
```

Output includes changed package paths, skipped files, bump roots, and bump closure.

### `Git.fromNameStatus(...)`

Pure bridge from git name-status records into changed file paths.

Must handle:

- added / modified / deleted paths
- renames by considering both old and new paths
- copied files by considering the new copied path only
- deduplication before ownership mapping

No subprocess here. This function accepts parsed git change records or raw name-status lines and then
calls `fromChangedFiles(...)`.

### `Git.fromRef(...)`

Runtime orchestration bridge. This is the first place allowed to touch git and the persisted graph.

Inputs:

```ts
{
  cwd?: t.StringDir;
  ref: string;                    // CLI --since value, e.g. "jsr-publish"
  head?: string;                  // default: "HEAD"
  graphPath?: t.StringPath;       // default: ./deno.graph.json
  release?: t.SemverReleaseType;  // default: "patch"
  policy?: WorkspaceBump.Policy;
}
```

Use `ref` on the API because this is a git adapter. The CLI flag remains `--since`; the script edge
maps `--since=<ref>` to `Workspace.Delta.Git.fromRef({ ref })`.

Responsibilities:

1. Read `deno.graph.json` via `Workspace.Graph.Snapshot`.
2. Feed `snapshot.graph.orderedPaths` and `snapshot.graph.edges` into `Workspace.Bump.collect(...)`.
3. Get changed files from git for `ref..head`.
4. Compare baseline and current package versions for changed package candidates.
5. Return already-bumped and still-needs-bump classifications.
6. Return bump roots suitable for source-agnostic `Workspace.Bump.run({ collect, from })`.

## Definition: needs bump

For changed bump-candidate packages:

- `alreadyBumpedPkgPaths`: current package version differs from the package version at `ref`.
- `needsBumpPkgPaths`: current package version equals the package version at `ref`.
- `newPkgPaths`: package manifest does not exist at `ref`; report separately.
- `bumpRootPkgPaths`: packages that still need a bump. New package behavior must be explicit before
  wiring to mutation.
- `bumpClosurePkgPaths`: dependent closure from `bumpRootPkgPaths` using existing bump planning
  semantics.

Do not silently drop already-bumped packages. They must be visible so a human can trust why no bump was
selected.

## CLI / task integration

The `deno task bump` surface should earn:

```sh
deno task bump -- --help
deno task bump -- -h
deno task bump -- --since=jsr-publish --dry-run
```

`--` is required because the workspace-root `bump` task forwards arguments to `task.bump.ts`.
Do not document `deno task bump --help` as the canonical invocation.

Rules:

- `--help` / `-h` documents `--since`, the `--since`/`--from` conflict, and the deterministic
  changed package → needs bump → closure workflow.
- `--since` conflicts with `--from`.
- `--since` is owned by the script/CLI edge and maps to `Workspace.Delta.Git.fromRef({ ref })`.
- zero `needsBumpPkgPaths` is a clean no-op, not an error.
- dry-run prints the delta summary and the bump plan without writing.
- non-dry-run continues through existing bump confirmation/apply flow.
- all mutation still goes through existing `Workspace.Bump.run(...)` / apply path.
- `Workspace.Bump.run(...)` must remain source-agnostic; do not add `since` to `RunArgs`.

`feat(workspace): wire bump since planning` owns the first runnable CLI path:

- extend only `Workspace.Bump.Args` parsed/resolved script-edge shapes with `since?: string`;
- do not add `since` to `Workspace.Bump.RunArgs`;
- fail clearly when `--since` and `--from` are both supplied;
- implement/use `Workspace.Delta.Git.fromRef(...)` enough to derive `bumpRootPkgPaths` from a git
  ref/tag baseline;
- add source-agnostic `Workspace.Bump.run({ collect, from })` support so CLI-derived delta roots can
  reuse the existing bump planning/apply path without making Bump know about git;
- route since-derived roots into the existing bump planning/apply path;
- update bump help before closing the commit.

## DSL/help integration

`@sys/workspace` currently has CLI help but no package help resource surface comparable to
`@sys/cell` / `@sys/server`. Use the standard YAML + bundled resource pattern from the `pkg.help`
template before adding delta prose. Do not hard-code long-lived DSL guidance into bump or delta modules.

### BMIND check

- **Beautiful:** authored help lives as YAML chapters under `src/m.help/yaml/`, with deterministic
  human and skill projections through `@sys/cli` chapter formatting.
- **Minimal:** split mechanism from content. The base mechanism proves loading/bundling; the content
  commit adds only the earned delta/bump-since narrative.
- **Integrated:** `WorkspaceHelp` owns resources/loading. `Workspace.Delta` and `Workspace.Bump` stay
  behavior-only.
- **Necessary:** CLI `deno task bump -- --help` remains operational help. DSL help becomes the durable
  agent/human reading surface for the deterministic workflow.
- **Disciplined tests:** assert resource routing, chapter IDs, section labels, and skill metadata. Do
  not snapshot prose.

### Commit: `feat(workspace): add package help resource surface`

Scope:

- materialize `src/m.help/` using the `pkg.help` pattern:
  - `mod.ts`, `t.ts`, `common.ts`
  - `u/u.load.ts`, `u/u.paths.ts`, `u/u.yaml.ts`
  - `yaml/root.yaml` and a minimal root `yaml/dsl.yaml`
  - `-bundle/mod.ts`, `-bundle/-bundle.ts`, generated `-bundle/-bundle.json`
- add package tasks:
  - `help:bundle`: `deno run -RWE ./src/m.help/-bundle/mod.ts`
  - `prep`: include `deno task help:bundle` without dropping existing prep behavior if present
- export help types from `src/types.ts`; expose `@sys/workspace/help` only if the package surface needs
  direct consumers.
- add narrow tests proving root/DSL resources load and fail clearly for unknown chapters.

Non-goals:

- no delta/bump-since prose beyond minimal fixture text.
- no bump/delta behavior changes.
- no duplicate rendering logic outside the package help surface.

Verification:

```sh
cd ./code/sys/workspace && deno task help:bundle
cd ./code/sys/workspace && deno test -P=test src/m.help
cd ./code/sys/workspace && deno task check
```

### Commit: `feat(workspace): add delta DSL help`

Scope:

- add the real DSL chapter content:

```txt
workspace delta
workspace bump --since
changed package → needs bump → closure
```

- add any CLI formatter/route required to render:
  - human format for terminal use
  - skill format for agent ingestion
- root DSL index links to the delta/bump-since chapter.
- tests assert routing/projection/contract, not prose copies.

Non-goals:

- no new bump planning, graph logic, git logic, or mutation behavior.
- no replacement for `deno task bump -- --help`; CLI help remains the fast operational reference.

## STIER / TMIND assessment

### S — Simple

Root `Workspace.Delta` owns package delta truth. `Workspace.Bump` owns version mutation. Keep these
separate.

### T — Tight

Reuse existing truth:

- `Workspace.Graph.Snapshot` for `deno.graph.json`.
- `Workspace.Bump.collect(...)` for bump candidates/current versions.
- existing `dependentClosure(...)` semantics for bump closure.
- existing bump apply/run path for mutation.

Do not introduce a second graph builder or second bump planner.

### I — Isolated

Keep layers explicit:

- pure changed-file mapping
- pure git-change parsing
- runtime git/snapshot bridge
- bump CLI integration
- DSL/help explanation

Do not mix git subprocesses into pure functions.

### E — Explicit

Return structured classifications and skips. No hidden inference. No silent drops.

Minimum skip/classification families:

```ts
outside-workspace-package
outside-bump-candidates
already-bumped
needs-bump
new-package
```

### R — Reversible

Promotion to `Workspace.Delta` should happen before adding more behavior. That keeps the ownership
clean and avoids later API churn.

## DMIND review: failure modes to design against

- A package was changed and already manually bumped: report it, do not re-bump by default.
- A dependent package needs a transitive bump because a dependency still needs bumping: include it in
  closure.
- A changed file is outside all workspace packages: report a skip.
- A changed path belongs to a private/excluded package: report a skip/classification, do not silently
  mutate.
- A package is newly added since the baseline: classify separately before deciding whether bumping is
  meaningful.
- A package was removed since the baseline: classify separately; there may be no current package to
  bump.
- A rename crosses package boundaries: both old and new package owners must be considered.
- The graph snapshot is stale or missing: fail clearly before mutation.
- `--since` and `--from` are both supplied: fail clearly.

## BMIND elegance bar

Target usage:

```ts
const delta = await Workspace.Delta.Git.fromRef({ cwd, ref: 'jsr-publish', policy });
await Workspace.Bump.run({
  cwd,
  collect: delta.collect,
  from: delta.bumpRootPkgPaths,
  policy,
});
```

Target CLI:

```sh
deno task bump -- --help
deno task bump -- -h
deno task bump -- --since=jsr-publish --dry-run
```

No LLM path inspection. No manual dependency reasoning. No ambient mutation.

## Acceptance checks

- [x] Pure changed-file mapping maps files to owning bump candidates.
- [x] Paths outside bump candidates are reported as structured skips.
- [x] Multiple changed files in one package produce one bump root.
- [x] Multi-package changes preserve stable workspace graph order.
- [x] Bump closure uses existing dependent-closure behavior.
- [x] Tests cover overlapping package-prefix edge cases.
- [x] Delta is promoted to root `Workspace.Delta` / `WorkspaceDelta` surface.
- [x] `Git.fromNameStatus(...)` handles add/modify/delete/rename records.
- [x] `Git.fromRef(...)` reads `deno.graph.json` and git baseline data.
- [x] `Workspace.Bump.run({ collect, from })` supports source-agnostic precomputed collection.
- [x] changed packages are classified as already-bumped / needs-bump / new-package.
- [x] `deno task bump -- --help` documents `--since` and the deterministic bump workflow.
- [x] `deno task bump -- --since=<ref> --dry-run` renders a deterministic bump plan.
- [x] `--since` and `--from` conflict clearly.
- [x] zero needed bumps is a clean no-op.
- [x] workspace DSL/help covers the delta workflow.

## Final recorded reality

This plan landed in the commit arc above. The durable result is:

- `Workspace.Delta` owns changed-file and git-baseline delta truth;
- `Workspace.Bump` remains source-agnostic and consumes precomputed delta roots through `from`;
- `deno task bump -- --since=<ref>` derives deterministic bump roots from the git baseline;
- already-bumped, needs-bump, new-package, and skipped file/package cases are visible;
- `--since` and `--from` conflict clearly;
- package help resources and the delta DSL chapter document the operator/agent workflow.

Retirement note: this file is now historical plan material, not live repo doctrine.

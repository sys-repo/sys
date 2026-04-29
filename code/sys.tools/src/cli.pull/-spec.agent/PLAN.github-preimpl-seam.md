# Plan: pre-implementation GitHub pull seam refactor

## Status

Implementation checklist and review note. The seam refactor has been implemented; keep this document
as the acceptance checklist for residue review before adding `github:repo` or any public
`github:resource` bundle kind.

## Purpose

Refactor the existing `github:release` pull path into the architecture required by future GitHub
repo/resource work, without adding new YAML kinds or changing the public config surface.

The purpose is not cosmetic cleanup. The purpose is to prove the durable GitHub materialization seam
on one existing source shape before adding a second source shape.

## Desired end state

After this pass, current `github:release` behavior should be implemented as:

```text
github:release bundle adapter
  -> release API + release/asset selection
  -> descriptor pull plan
  -> shared GitHub materialization executor
  -> release-only dist/result shaping
```

The future `github:repo` path should be able to land by adding a repo resolver that emits the same
descriptor entries, not by cloning release download/write code.

## Scope line

This pass does:

- keep `github:release` as the only public GitHub bundle kind
- split release pulling into:
  - source adapter
  - descriptor plan builder
  - shared GitHub materialization executor
- move download/write/ops assembly out of release-specific code
- ensure plan entries use relative output paths only
- add path containment proof before writes
- keep spinner/UI concerns outside the executor
- add tests for the new seam

This pass does not:

- add `github:repo`
- add `github:resource`
- change YAML schema
- change public `Pull` API
- change config migrations
- add `private` config
- implement repo tree/blob calls
- intentionally change token/public-private semantics
- intentionally change non-interactive CLI failure behavior

Token-optional release behavior and non-interactive graceful access failures are important, but they
are separate behavior changes. Do not hide them inside this seam refactor unless the human
explicitly expands the scope.

## Current problem

Current `u.bundle/u.pull/u.pull.github.ts` owns too many concerns:

- token presence decision
- release API calls
- release/asset selection
- target directory naming
- target filename naming
- target clearing
- download fallback behavior
- filesystem writes
- op collection
- failure summarization
- dist computation
- CLI spinner messages

Adding `github:repo` on top of this would invite parallel code and future drift.

## Main invariant

The source adapter decides **what** should be materialized.

The shared executor decides **how** materialization is safely performed.

No file should blur that line.

## Dependency direction

Correct direction:

```text
u.pull.github.release.ts
  imports release resolver
  imports plan builder
  imports executor

u.github.plan.ts
  imports internal descriptor types
  imports no network/filesystem/spinner dependencies

u.github.execute.ts
  imports descriptor types
  imports filesystem helpers
  imports no release resolver
  imports no CLI spinner/color helpers
```

Incorrect direction:

```text
executor -> release resolver
executor -> GithubReleaseBundle
executor -> Cli.spinner
plan builder -> Fs.write/fetch
release adapter -> per-entry Fs.write loop
```

## Type-plane decision

The descriptor types cross the plan builder, executor, release adapter, and tests. They should not
leak into the public `cli.pull/t.ts` surface.

Preferred local type placement:

```text
src/cli.pull/u.bundle/u.pull/
  common.ts                # scoped import lane, exports local type pool as `t`
  t.ts                     # internal-only descriptor/executor type spine
  t.internal.ts            # scoped type-pool aggregator
  u.github.plan.ts          # pure plan builder + helpers
  u.github.execute.ts       # shared executor
  u.pull.github.release.ts  # release adapter
```

`t.ts` is internal to `u.bundle/u.pull`. `t.internal.ts` aggregates parent `common.t.ts` plus local
`t.ts`, and `common.ts` exports that merged pool as `t`. The local `t` lane is used by
implementation files; direct type imports from `./t.ts` are not acceptable.

`t.ts` must not be re-exported from:

- `src/cli.pull/t.ts`
- `src/cli.pull/types.ts` if such a surface is later introduced
- `src/cli.pull/u.bundle/t.ts`

This is a containment choice: the seam is real enough to have a type spine, but not public enough to
pollute the package/module contract.

The scoped `common.ts` type pool is deliberately local to `u.bundle/u.pull`. Do not turn it into a
broad common-chain refactor in this packet.

## Proposed file layout

Preferred end state for this pass:

```text
src/cli.pull/u.bundle/u.pull/
  common.ts
  mod.ts
  t.ts
  t.internal.ts
  u.github.execute.ts
  u.github.plan.ts
  u.pull.github.release.ts
```

Existing `u.pull.github.ts` should either be removed or left as a temporary internal re-export.
Prefer removal if all imports are updated. If left, it must be a thin compatibility shim only:

```ts
export * from './u.pull.github.release.ts';
```

It must not contain implementation logic.

## File roles

### `t.ts`

Internal-only type spine for the GitHub pull seam:

- descriptor plan types
- request descriptor types
- executor input/result types
- event callback types

No runtime logic. No public re-export.

### `u.github.plan.ts`

Pure plan builder and source-shape helpers:

- builds a release descriptor plan from a resolved release/assets result
- owns safe release tag directory naming
- owns safe asset target filename naming
- owns duplicate filename suffixing
- no network calls
- no filesystem writes
- no spinner

### `u.github.execute.ts`

Shared materialization executor:

- preflights all output paths before clearing or writing
- proves `targetRoot` is inside `baseDir`
- owns target path construction
- owns per-file target containment checks
- optionally clears target
- downloads through an injected downloader
- writes bytes
- returns ops and failure summary
- imports no release resolver
- imports no CLI spinner/color helpers

### `u.pull.github.release.ts`

Release-specific adapter:

- keeps public function name `pullGithubReleaseBundle`
- loads token as current code does
- preserves current no-token behavior for this refactor
- lists releases
- calls `resolveGithubReleaseBundle`
- creates a release pull plan
- creates/provides release downloader
- passes spinner event callbacks to executor
- computes release dist after successful execution
- shapes `summary: { kind: 'github:release', ... }`

### `common.ts`

Keep generic pull helpers such as:

- `done`
- `fail`
- `clearTargetDir`
- `errorMessage`

Do not add source-shape logic here.

GitHub auth mapping currently lives here. It may stay for this behavior-preserving pass. If moved,
move it to a GitHub-specific helper without changing text/semantics.

## Internal descriptor contract

Start narrow. Include only the request kind used today.

`u.bundle/u.pull/t.ts` defines a namespace spine:

```ts
import { type t } from '../../common.ts';

export declare namespace GithubPull {
  export type Plan = {
    readonly kind: 'github:release';
    readonly targetRoot: t.StringDir;
    readonly entries: readonly Entry[];
  };

  export type Entry = {
    readonly source: t.StringUrl;
    readonly relativePath: t.StringRelativePath;
    readonly request: DownloadRequest;
  };

  export type DownloadRequest = ReleaseAssetRequest;

  export type ReleaseAssetRequest = {
    readonly kind: 'release-asset';
    readonly repo: string;
    readonly assetId: number;
    readonly fallbackUrl: t.StringUrl;
  };
}
```

`t.internal.ts` provides the scoped type pool:

```ts
export type * from '../../common.t.ts';
export type * from './t.ts';
```

`common.ts` exposes the canonical local lane:

```ts
export * from '../../common.ts';
export type * as t from './t.internal.ts';
```

Future widening should be local and obvious:

```ts
export type GithubDownloadRequest =
  | GithubReleaseAssetRequest
  | GithubRepoBlobRequest;
```

Do not add `GithubRepoBlobRequest` before a repo resolver exists.

## Plan construction contract

Release plan construction is deterministic and side-effect free.

Suggested function:

```ts
export function createGithubReleasePullPlan(args: {
  baseDir: t.StringDir;
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle;
  resolved: t.PullTool.GithubReleaseResolved;
}): GithubReleasePullPlanResult;
```

Result shape:

```ts
type GithubReleasePullPlanResult =
  | {
    readonly ok: true;
    readonly plan: GithubPullPlan;
    readonly releaseDir: string;
  }
  | { readonly ok: false; readonly error: string };
```

`releaseDir` is the safe tag directory used for display and release dist context.

Plan construction owns:

- `targetRoot = Fs.join(baseDir, bundle.local.dir, releaseDir)`
- safe release tag directory naming
- asset target filename naming
- duplicate filename suffixing
- request descriptor construction

Plan construction does not own:

- token loading
- GitHub API calls
- downloads
- filesystem writes
- clear target behavior
- dist computation
- spinner output

## Executor contract

Suggested executor shape:

```ts
export async function executeGithubPullPlan(args: {
  baseDir: t.StringDir;
  plan: GithubPullPlan;
  clear?: boolean;
  download: GithubPullDownloader;
  events?: GithubPullExecuteEvents;
}): Promise<GithubPullExecuteResult>;
```

Downloader:

```ts
export type GithubPullDownloader = (
  request: GithubDownloadRequest,
) => Promise<Uint8Array>;
```

Events:

```ts
export type GithubPullExecuteEvents = {
  readonly clearing?: (targetRoot: t.StringDir) => void;
  readonly entry?: (e: {
    readonly entry: GithubPullEntry;
    readonly current: number;
    readonly total: number;
  }) => void;
};
```

Result:

```ts
export type GithubPullExecuteResult =
  | {
    readonly ok: true;
    readonly ops: readonly t.PullToolBundleResult['ops'][number][];
  }
  | {
    readonly ok: false;
    readonly ops: readonly t.PullToolBundleResult['ops'][number][];
    readonly error: string;
  };
```

## Executor behavior

Executor behavior must be ordered for safety:

1. Preflight `plan.targetRoot`:
   - resolve `baseDir`
   - resolve `targetRoot`
   - require `targetRoot` to be inside `baseDir`
   - reject `targetRoot === baseDir`
2. Preflight every entry before clearing or writing:
   - validate `relativePath`
   - compute final absolute target path
   - prove final target remains inside `targetRoot`
3. If preflight fails, return `{ ok: false, ops: [], error }` and do not clear/write anything.
4. If `clear === true`, clear `targetRoot` using existing `clearTargetDir`.
5. Ensure `targetRoot` exists.
6. For each preflighted entry:
   - emit entry event
   - call downloader
   - ensure parent directory
   - write bytes
   - append success op
   - on download/write failure, append failure op and continue
7. If any entry failures occurred, return `{ ok: false, ops, error }` with a concise summary.
8. If all entries succeeded, return `{ ok: true, ops }`.

Continue-on-entry-failure preserves current release behavior: attempt all selected assets and
summarize failures afterward.

Preflight-before-clear is non-negotiable. A malformed plan must not delete a target directory before
proving writes are safe.

## Path safety rules

Executor-owned validation should be added in this pre-pass because it is the core future-proof seam.

A valid `relativePath`:

- is not empty after trim
- is not absolute
- has no `.` segment as a complete path segment
- has no `..` segment
- has no Windows drive prefix such as `C:`
- has no NUL/control characters
- after join/resolve, remains under `targetRoot`

Release entries will normally be simple filenames, so this should not change successful user
behavior.

Future repo/resource resolvers must not each reinvent this validation.

## Download fallback ownership

Current behavior:

1. Try Octokit `getReleaseAsset` by asset id.
2. If that fails, fetch `browser_download_url` directly.

Keep that behavior.

Move it behind a request downloader:

```ts
function createGithubDownloader(token: string): GithubPullDownloader {
  return async (request) => {
    if (request.kind === 'release-asset') {
      return await downloadGithubAssetWithFallback({
        repo: request.repo,
        assetId: request.assetId,
        url: request.fallbackUrl,
        token,
      });
    }

    const _never: never = request;
    throw new Error(`Unsupported GitHub download request: ${String(_never)}`);
  };
}
```

For this pre-pass, keep `token: string` if preserving current release token-required behavior. Later
token-optional work can widen this to `token?: string`.

Where this factory lives:

- acceptable for this pass: local to `u.pull.github.release.ts`
- also acceptable: a small `u.github.download.ts` only if it remains source-shape neutral
- not acceptable: inside the executor if it makes the executor release-aware

## Dist ownership

Do not put dist computation in the shared executor.

Current release behavior computes and saves `dist.json` in the release output directory. Preserve it
in the release adapter after the executor succeeds:

```text
execute plan succeeds
then compute release dist for plan.targetRoot
then return release result with dist
```

This prevents future `github:repo` and `github:resource` from inheriting release-specific dist
writing.

`computeReleaseDist` should move to `u.pull.github.release.ts` or a release-specific helper. It
should not live in the shared executor.

## Spinner ownership

Do not put `Cli.spinner()` inside the shared executor.

The release adapter can keep the spinner and pass event callbacks:

- before resolving release: `resolving github release...`
- when clearing: `clearing local target...`
- for each entry: `downloading 1/2 asset-name...`
- on success: existing success message
- on error: existing failure behavior

The executor reports events; it does not decide presentation.

## Release adapter flow after refactor

Target flow:

```text
pullGithubReleaseBundle(baseDir, bundle)
  load token
  if no token, preserve current failure message
  start spinner
  list releases
  resolve release/assets
  create release pull plan
  execute plan with release downloader and spinner events
  if execute failed, return fail(summary)
  compute release dist
  spinner succeed
  return done({ ok: true, ops, dist, summary })
```

Current auth behavior is preserved in this pre-pass unless the human explicitly chooses to combine
token-optional release behavior with this refactor.

## Tests to add before implementation

Use red then green where practical.

### 1. Release plan construction

New test candidate:

```text
src/cli.pull/u.bundle/-test/-u.github.plan.test.ts
```

Cases:

- creates release plan with target root under `baseDir/local.dir/safe-tag`
- sanitizes release tag directory
- maps each asset to one relative filename
- duplicate asset names get stable suffixes
- blank asset names fall back to `asset-<n>`
- slash/backslash in asset names cannot create nested/escaped paths
- plan entries contain `release-asset` requests with repo, asset id, and fallback URL

### 2. Shared executor writes entries safely

New test candidate:

```text
src/cli.pull/u.bundle/-test/-u.github.execute.test.ts
```

Cases:

- writes planned bytes under target root
- records source, target, and byte count ops
- creates parent directories for nested relative paths
- honors clear target through existing `clearTargetDir`
- preflight failure happens before clear
- continues after a failed entry and returns useful failure summary
- rejects `../evil.txt`
- rejects `/absolute.txt`
- rejects `C:/evil.txt` or `C:\evil.txt`
- rejects empty relative paths
- rejects `./file.txt` or any complete `.` segment
- rejects target roots outside `baseDir`
- rejects `targetRoot === baseDir`
- does not write outside target root

### 3. Release adapter regression

Existing tests should still pass. Add a focused injected-path test only if the refactor introduces
injectable deps.

Regression expectations:

- release asset download fallback remains semantically intact
- duplicate asset names still write distinct files
- release result summary remains `{ kind: 'github:release', repo, release }`
- `computeReleaseDist` still saves `dist.json` for release output
- current missing-token message is preserved in this packet

### 4. Static residue checks

After implementation, inspect for these smells:

- release adapter contains per-entry `Fs.write` calls
- release adapter manually builds absolute asset target paths inside the download loop
- shared executor imports `Cli` or color helpers
- shared executor imports `resolveGithubReleaseBundle`
- shared executor takes `GithubReleaseBundle`
- shared executor computes dist
- plan entries carry absolute target paths
- internal descriptor types are exported from public `cli.pull/t.ts`

Useful grep commands from `code/sys.tools`:

```sh
rg -n "Fs\.write|downloadGithubAsset" ./src/cli.pull/u.bundle/u.pull/u.pull.github.release.ts
rg -n "Cli|spinner|c\." ./src/cli.pull/u.bundle/u.pull/u.github.execute.ts
rg -n "resolveGithubReleaseBundle|GithubReleaseBundle|computeReleaseDist" ./src/cli.pull/u.bundle/u.pull/u.github.execute.ts
rg -n "target:" ./src/cli.pull/u.bundle/u.pull/t.ts ./src/cli.pull/u.bundle/u.pull/u.github.plan.ts ./src/cli.pull/u.bundle/u.pull/u.github.execute.ts
```

The first command may show intentional dist-related code depending on final split. Inspect, do not
blindly fail.

## Verification commands

From `/Users/phil/code/org.sys/sys/code/sys.tools`:

```sh
deno task test --trace-leaks ./src/cli.pull/u.bundle/-test/-u.github.plan.test.ts
```

```sh
deno task test --trace-leaks ./src/cli.pull/u.bundle/-test/-u.github.execute.test.ts
```

```sh
deno task test --trace-leaks ./src/cli.pull/u.github ./src/cli.pull/u.bundle ./src/cli.pull/-test
```

Then, before closing the refactor:

```sh
deno task test --trace-leaks ./src/cli.pull
```

Run broader package tests only if the touched surface or failures indicate broader risk.

## Implementation sequence

### Step 1: add seam tests

Add failing tests for:

- release plan construction
- shared executor writes/path safety

Keep tests narrow and local.

### Step 2: add internal type spine

Add `u.bundle/u.pull/t.ts` with:

- `GithubPullPlan`
- `GithubPullEntry`
- `GithubDownloadRequest`
- `GithubReleaseAssetRequest`
- `GithubPullDownloader`
- `GithubPullExecuteEvents`
- `GithubPullExecuteResult`

Do not export this file from public type surfaces.

### Step 3: introduce descriptor plan module

Add `u.github.plan.ts` with:

- `createGithubReleasePullPlan`
- safe release tag directory helper
- safe asset filename helper
- duplicate suffix helper

Move existing helper logic from `u.pull.github.ts` rather than rewriting behavior differently.

### Step 4: introduce shared executor

Add `u.github.execute.ts` with:

- `executeGithubPullPlan`
- plan preflight
- relative path validation
- target containment proof
- injected downloader contract
- failure summary helper

Reuse existing `clearTargetDir` and `errorMessage` from `common.ts`.

### Step 5: rename/reduce release adapter

Create `u.pull.github.release.ts` and move `pullGithubReleaseBundle` there.

The adapter should:

- keep current token-required branch
- keep current release API calls
- call release resolver
- call plan builder
- create release downloader
- call shared executor
- compute release dist on success
- keep current summary shape

Update `u.pull/mod.ts` imports.

Update tests that import `computeReleaseDist` if the helper moves.

### Step 6: remove duplicate release internals

Remove or empty old implementation in `u.pull.github.ts`.

If kept as a shim, it should only re-export from `u.pull.github.release.ts` and have no logic.

### Step 7: run targeted tests and inspect residue

Run the verification commands above.

Perform the static residue checks.

## Acceptance criteria

- No new public bundle kind exists.
- No YAML schema change exists.
- Existing `github:release` user behavior is preserved.
- Current missing-token behavior is not accidentally changed.
- `github:release` now builds a descriptor plan before downloading assets.
- Shared executor performs downloads and writes through descriptor entries.
- Shared executor preflights all paths before clear/write.
- Shared executor uses relative paths only and proves target containment.
- Release adapter does not own per-entry file writes.
- Shared executor does not know release-selection details.
- Dist computation remains release-specific.
- Spinner/UI concerns remain outside the executor.
- Internal descriptor types do not leak into public type surfaces.
- Tests cover plan construction, executor path safety, executor writes, preflight-before-clear, and
  existing release behavior.

## Non-acceptance signals

Stop and rethink if any of these happen:

- adding `github:repo` feels necessary to finish the refactor
- plan entries contain absolute target paths
- executor takes a `GithubReleaseBundle`
- executor imports `resolveGithubReleaseBundle`
- executor computes dist
- executor imports `Cli`, `spinner`, or color helpers
- release adapter still loops over assets and writes files directly
- invalid plan paths can clear a target before failing
- auth/error text becomes more duplicated than before
- descriptor types are promoted into public `cli.pull/t.ts`
- the refactor changes token/public-private semantics accidentally

## Follow-up after this pass

After this seam lands cleanly, the next packet can add `github:repo` by implementing only:

- repo schema/type
- repo client/ref/tree/blob calls
- repo resolver that emits the same descriptor entries
- dispatch/menu/summary handling

The executor and GitHub materialization substrate should not need to be reinvented.

Suggested commit message for this pre-pass:

```text
refactor(sys.tools): split github release pulls into materialization seam
```

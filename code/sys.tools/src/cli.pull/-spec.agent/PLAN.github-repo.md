# Plan: GitHub repo/resource pull bundles

## Status

Implementation landed for `github:repo`.

`github:resource` remains a future/adjacent target only. The implemented repo work keeps the same
source-shape-resolver → descriptor-plan → shared-executor seam so resource support can be added
later without a second GitHub implementation world.

## Goal

Add a GitHub repo-backed pull source to `@sys/tools/pull` without creating a second GitHub
implementation world.

The design must treat public and private repositories as the same source shape. Privacy is an access
condition discovered at runtime, not YAML config.

The durable design target is:

```text
GitHub access + client + error substrate
  -> GitHub source-shape resolver
  -> shared materialization executor
  -> common pull result
  -> CLI summary
```

`github:release`, `github:repo`, and any future `github:resource` differ only in how they resolve
GitHub data into a materialization plan. They must not duplicate auth, token loading, request
execution, path safety, writes, result shaping, or CLI error handling.

## Current facts from `src/cli.pull`

- Supported bundle kinds today:
  - `http`
  - `github:release`
  - `github:repo`
- Existing GitHub seams:
  - `u.github/u.client.ts`
    - repo parsing
    - token loading from `GH_TOKEN` / `GITHUB_TOKEN`
    - Octokit creation
    - release listing
    - release asset download
    - repository metadata/commit/tree/blob operations
  - `u.github/u.errors.ts`
    - source-neutral GitHub access/rate-limit/not-found messages
  - `u.github/u.release.resolve.ts`
    - pure release/asset selection
  - `u.github/u.repo.resolve.ts`
    - pure repo tree/path resolution and unsupported-entry checks
  - `u.bundle/u.pull/common.ts`
    - scoped import/type lane for the pull executor area
  - `u.bundle/u.pull/t.ts` + `u.bundle/u.pull/t.internal.ts`
    - internal GitHub materialization descriptor types exposed through local `type t`
  - `u.bundle/u.pull/u.github.plan.ts`
    - release and repo descriptor plan construction
  - `u.bundle/u.pull/u.github.execute.ts`
    - shared descriptor executor with relative-path preflight and target containment
  - `u.bundle/u.pull/u.pull.github.release.ts`
    - release resolution
    - token-optional release downloader binding
    - release-only local dist computation
  - `u.bundle/u.pull/u.pull.github.repo.ts`
    - repo default-ref/commit/tree resolution
    - repo blob downloader binding
    - repo summary/result shaping without generated `dist.json`
  - `u.bundle/u.pull/u.clearTargetDir.ts`
    - target clearing safety
- Current YAML schema accepts `github:release` and `github:repo`.
- There is no implemented `github:resource` bundle kind in `cli.pull` today.
- Current non-interactive execution returns a graceful non-zero CLI failure for bundle pull
  failures.

## Non-negotiable design invariants

1. No `private` field.
   - Public/private is not source identity.
   - A private repo and a public repo are the same config shape.
   - Auth is runtime access state.

2. One GitHub substrate.
   - Token loading, client creation, repo parsing, error mapping, download execution, and target
     writes are shared.
   - Source variants only own source-shape resolution.

3. Resolver output is data, not IO.
   - No function-valued `bytes()` on plan items.
   - Resolvers return descriptors.
   - The executor performs downloads and writes.

4. Resolver output uses relative paths only.
   - No absolute target paths in plans.
   - The executor joins paths against one target root and proves containment once.

5. Expected access failures are user-facing results.
   - 401/403/404/rate-limit should produce useful messages and non-zero exit status.
   - Normal denied/missing-token paths should not emit stack traces.

6. Repo/resource pulls must not silently mutate source snapshots.
   - Do not auto-write generated `dist.json` into pulled repo/resource output by default.
   - Summaries must work without `dist`.

7. Truthful API only.
   - Do not claim symlink, submodule, LFS, sparse checkout, or archive fidelity unless implemented.
   - Fail clearly when a GitHub object shape is unsupported.

## Naming decision

Public repo pull kind:

```yaml
kind: github:repo
```

Meaning: materialize repository contents from a GitHub repository at a ref/path into a local
directory.

Future or adjacent single-resource pull kind, if needed:

```yaml
kind: github:resource
```

Meaning: materialize one GitHub-backed file/blob resource. This is not required for the first
implementation, but the internal design must make it a source-shape resolver over the same GitHub
substrate, not a new implementation stack.

Avoid:

```yaml
private: true
```

Reason: `private` becomes stale metadata and creates false semantics. The tool should try the GitHub
source, use a token when present, and fail helpfully when GitHub requires credentials.

## Proposed user config

Minimal whole-repo pull:

```yaml
bundles:
  - kind: github:repo
    repo: owner/name
    ref: main
    local:
      dir: .pulled/name
      clear: true
```

Subdirectory pull:

```yaml
bundles:
  - kind: github:repo
    repo: owner/name
    ref: main
    path: packages/tooling
    local:
      dir: .pulled/tooling
      clear: true
```

Potential future single-resource pull:

```yaml
bundles:
  - kind: github:resource
    repo: owner/name
    ref: main
    path: packages/tooling/README.md
    local:
      dir: .pulled/readme
```

For `github:resource`, if implemented, the first default target name should be the source basename.
A custom target filename should not be added until there is a real use case.

## Public type shape

Use a shared GitHub bundle base in the type spine:

```ts
type GithubBundleBase = {
  readonly repo: string;
  readonly local: BundleLocal;
  readonly lastUsedAt?: t.UnixTimestamp;
};

type GithubReleaseBundle = GithubBundleBase & {
  readonly kind: 'github:release';
  readonly tag?: string;
  readonly asset?: string | string[];
};

type GithubRepoBundle = GithubBundleBase & {
  readonly kind: 'github:repo';
  readonly ref?: string;
  readonly path?: string;
};

type GithubResourceBundle = GithubBundleBase & {
  readonly kind: 'github:resource';
  readonly ref?: string;
  readonly path: string;
};
```

First implementation may include `GithubResourceBundle` only if `github:resource` is being
implemented. If not, keep it as a plan-level target and do not expose unused public types.

`Bundle` becomes:

```ts
type Bundle = HttpBundle | GithubReleaseBundle | GithubRepoBundle;
```

If `github:resource` is implemented in the same packet:

```ts
type Bundle = HttpBundle | GithubReleaseBundle | GithubRepoBundle | GithubResourceBundle;
```

Defaults:

- `ref` omitted:
  - fetch repository metadata and use the default branch
  - do not guess `main`
  - fail clearly if default branch cannot be resolved
- `path` omitted for `github:repo`:
  - repository root
- `path` required for `github:resource`
- `local.clear`:
  - same default-resolution model as existing bundles
  - no GitHub-specific override

## Internal source descriptor

Normalize YAML bundle variants into a small internal GitHub source descriptor before resolving them.

```ts
type GithubSource =
  | {
    readonly kind: 'release';
    readonly repo: string;
    readonly tag?: string;
    readonly asset?: string | readonly string[];
  }
  | {
    readonly kind: 'repo';
    readonly repo: string;
    readonly ref?: string;
    readonly path?: string;
  }
  | {
    readonly kind: 'resource';
    readonly repo: string;
    readonly ref?: string;
    readonly path: string;
  };
```

This descriptor is the DRY seam. YAML shape and resolver shape are intentionally close, but not the
same thing. YAML remains the public contract; `GithubSource` is the internal resolver input.

## Internal materialization plan

The resolver returns a plan made of descriptors. It does not perform downloads. It does not compute
absolute target paths.

```ts
type GithubPullPlan = {
  readonly source: GithubSource;
  readonly repo: string;
  readonly label: string;
  readonly targetRoot: t.StringDir;
  readonly entries: readonly GithubPullEntry[];
  readonly summary: GithubPullSummary;
};

type GithubPullEntry = {
  readonly source: t.StringUrl;
  readonly relativePath: t.StringRelativePath;
  readonly size?: number;
  readonly request: GithubDownloadRequest;
};

type GithubDownloadRequest =
  | {
    readonly kind: 'release-asset';
    readonly repo: string;
    readonly assetId: number;
    readonly fallbackUrl: t.StringUrl;
  }
  | {
    readonly kind: 'repo-blob';
    readonly repo: string;
    readonly ref: string;
    readonly sha: string;
    readonly path: t.StringPath;
    readonly url: t.StringUrl;
  };
```

If a future resource shape uses the same blob path as repo contents, it should use the same
`repo-blob` request kind. Do not add a new request kind just because the public YAML kind is
different.

The executor owns:

- target path construction
- path containment checks
- optional clear
- download execution
- file writes
- operation result assembly
- common failure shaping
- spinner/progress updates

## GitHub substrate ownership

Shared GitHub substrate should live under `u.github` unless a narrower pull-only helper is clearly
better.

Substrate responsibilities:

- parse `owner/repo`
- load optional token from `GH_TOKEN` or `GITHUB_TOKEN`
- create Octokit/client with optional auth
- call GitHub APIs
- normalize expected GitHub errors
- expose GitHub token help text
- classify 401/403/404/rate-limit/network failures

Do not keep GitHub auth mapping in a release-specific file once repo/resource support exists.

Candidate module split:

```text
u.github/
  t.ts
  u.client.ts
  u.errors.ts
  u.release.resolve.ts
  u.repo.resolve.ts
  u.resource.resolve.ts      # only if public github:resource lands
```

Bundle execution can then compose:

```text
u.bundle/u.pull/
  common.ts                  # generic pull helpers
  u.github.execute.ts         # shared GitHub materialization executor
  u.pull.github.release.ts    # release source adapter
  u.pull.github.repo.ts       # repo source adapter
  u.pull.github.resource.ts   # only if needed
```

Keep names honest. If a file is source-shape specific, say so. If it is shared GitHub execution, do
not hide it under `release`.

## Auth policy

Shared policy for all `github:*` bundles:

1. Load token from `GH_TOKEN` or `GITHUB_TOKEN`.
2. If token exists, use it for all GitHub API/download calls.
3. If no token exists, still try the request unauthenticated.
4. If GitHub denies or hides the resource, fail with a helpful message.
5. If rate-limited, suggest setting a token even for public repos.

This is a change from current `github:release` behavior, which requires a token before trying. The
S-tier endpoint should make release pulls token-optional too, because public release assets should
not require auth config.

Expected message for 401/403:

```text
GitHub access denied.
Set GH_TOKEN or GITHUB_TOKEN with repository read permissions.

Required permissions:
- Fine-grained PAT: repository access + Contents: Read
- Create/manage token: https://github.com/settings/personal-access-tokens
```

Expected message for ambiguous 404:

```text
GitHub repository/path/ref not accessible.
The repository may not exist, the ref/path may be wrong, or GitHub may be hiding a private repository.
Set GH_TOKEN or GITHUB_TOKEN with repository Contents: Read permission and retry.
```

Expected message for rate limit:

```text
GitHub API rate limit reached.
Set GH_TOKEN or GITHUB_TOKEN to use authenticated GitHub API limits.
```

Messages may add source-specific context such as repo, ref, path, tag, or asset. Shared messages
must not say `github:release` when the failing source is `github:repo`.

## CLI failure behavior

Expected GitHub access failures are normal operational failures, not programmer errors.

Interactive mode:

- show the failure message
- return to the menu where appropriate
- do not show a stack trace

Non-interactive mode:

- print the same useful failure message
- stop the run
- return non-zero exit status
- do not throw a raw error for expected access/config/source failures

Current `runNonInteractive` throws when `executeBundlePull` returns `{ ok: false }`. This should be
changed when adding GitHub repo/resource support.

Target behavior:

```text
for each bundle:
  execute
  if expected failure:
    print message
    return done(1)
```

Unexpected programmer errors may still throw, but expected GitHub denial, not-found, invalid-ref,
invalid-path, unsupported-entry, and rate-limit paths should be structured failures.

## GitHub repo pull strategy

Use the GitHub API, not `git clone`.

Reasons:

- avoids a host `git` dependency
- avoids leaking tokens through process args
- keeps Deno-first local execution
- reuses Octokit and existing token seams
- works for public and private repositories through the same code path
- supports precise repo path/resource materialization

Preferred first implementation:

1. Parse `owner/repo`.
2. Resolve `ref`:
   - if provided, resolve it through GitHub as branch/tag/SHA input
   - if omitted, fetch repo metadata and use default branch
3. Resolve commit/tree for the effective ref.
4. Read the recursive tree.
5. Detect tree truncation and fail clearly.
6. Filter entries under optional `path`.
7. Materialize file/blob entries only.
8. Return unsupported entries as clear failures.

Archive extraction is not first choice.

Archive tradeoffs:

- Pros:
  - simple single download
  - faithful snapshot for many normal repos
  - private repo auth supported
- Cons:
  - zip/tar extraction dependency
  - wrapper directory handling
  - path traversal safety during extraction
  - harder subpath extraction
  - less useful item-level progress
  - poorer fit for a future single-resource resolver

Tree/blob tradeoffs:

- Pros:
  - precise subpath support
  - same machinery supports `github:resource`
  - no archive extraction
  - clean relative-path executor
  - easy unit testing with fake tree data
- Cons:
  - more API calls
  - recursive tree API can truncate
  - blob/content size limits may apply
  - symlinks/submodules/LFS need honest handling

Conclusion: use tree/blob first, with explicit limits and no hidden archive fallback. Archive
support can be a later optimization if large-repo use cases earn it.

## Target semantics

For `github:repo`:

- target root: `Fs.join(baseDir, bundle.local.dir)`
- if `path` is omitted, write repository root contents directly under target root
- if `path` is provided, write the contents of that path directly under target root
- do not nest the source path under the target unless a future explicit option earns its place

Example:

```yaml
path: packages/foo
local:
  dir: pulled/foo
```

Writes:

```text
packages/foo/mod.ts      -> pulled/foo/mod.ts
packages/foo/README.md   -> pulled/foo/README.md
```

Does not write:

```text
pulled/foo/packages/foo/mod.ts
```

For future `github:resource`:

- `path` must resolve to one blob/file
- default target relative path is the source basename
- target root remains `local.dir`

Example:

```yaml
kind: github:resource
repo: owner/name
ref: main
path: docs/README.md
local:
  dir: pulled/doc
```

Writes:

```text
docs/README.md -> pulled/doc/README.md
```

Do not add target filename customization until a concrete user need earns it.

## Path safety

Source resolvers produce `relativePath` only.

Rules:

- Normalize GitHub paths as POSIX-style relative paths.
- Strip the selected source prefix for repo subpath pulls.
- Reject empty output paths.
- Reject absolute paths.
- Reject `.` and `..` path segments.
- Reject Windows drive-like prefixes.
- Reject NUL/control characters.
- Join only inside the shared executor.
- After join/resolve, ensure target is inside `targetRoot`.

This safety proof must live in one executor/helper, not in every source resolver.

Existing `clearTargetDir` already proves clear containment relative to `baseDir`; keep that
invariant and add per-file write containment under `targetRoot`.

## Unsupported repository entries

GitHub trees can include:

- blobs/files
- trees/directories
- symlinks
- submodules/commits

First implementation behavior:

- directories are structural only
- regular blobs/files are materialized
- symlinks fail with a clear unsupported message
- submodules fail with a clear unsupported message
- LFS pointer files are pulled as pointer files only; do not claim LFS expansion

Do not silently flatten, dereference, skip, or invent behavior.

Failure examples:

```text
GitHub repo pull cannot materialize symlink entries yet: docs/latest
```

```text
GitHub repo pull cannot materialize submodule entries yet: vendor/tooling
```

## Dist/provenance behavior

Current `github:release` computes and saves `dist.json` in the release output directory.

Do not blindly copy that behavior to `github:repo` or `github:resource`.

For repo/resource pulls:

- materialize the requested GitHub source faithfully
- do not write generated `dist.json` by default
- summary should rely on executed ops, bytes, repo/ref/path metadata, and optional in-memory digest
  if available
- if generated provenance is needed later, add an explicit option with a truthful name

Reason: a repo snapshot may already contain a real `dist.json`; writing another generated one
mutates the pulled source and can overwrite source content.

Existing release behavior may remain during the first packet, but the long-term GitHub executor
should not assume every GitHub plan writes a dist artifact.

## Result and summary model

Current `PullToolBundleResult` can carry optional `dist` and `summary`.

Summary variants should become expressive enough for repo/resource without requiring `dist`:

```ts
type PullToolBundleSummaryMeta =
  | { readonly kind: 'http'; readonly source: t.StringUrl }
  | { readonly kind: 'github:release'; readonly repo: string; readonly release: string }
  | {
    readonly kind: 'github:repo';
    readonly repo: string;
    readonly ref: string;
    readonly path?: string;
  }
  | {
    readonly kind: 'github:resource';
    readonly repo: string;
    readonly ref: string;
    readonly path: string;
  };
```

Only include `github:resource` if the public kind lands.

Formatter requirements:

- No assumption that `dist` exists.
- Show repo/ref/path for repo pulls.
- Show repo/ref/path for resource pulls.
- Keep output rows aligned.
- Continue using ANSI-normalized tests via `Cli.stripAnsi`.

## File/module changes

Expected type changes:

- `src/cli.pull/t.namespace.ts`
  - add `GithubBundleBase`
  - add `GithubRepoBundle`
  - optionally add `GithubResourceBundle` only if implemented
  - change `Bundle` union
- `src/cli.pull/u.bundle/t.ts`
  - add summary variant for `github:repo`
  - optionally add summary variant for `github:resource`
  - do not require `dist` for GitHub summaries

Expected schema changes:

- `src/cli.pull/u.yaml/u.schema.ts`
  - add shared GitHub schema helper for `repo`, `local`, `lastUsedAt`
  - add `github:repo` schema
  - optionally add `github:resource` schema only if implemented
  - keep `repo` owner/name pattern
  - `ref` optional string
  - `path` optional string for repo, required string for resource
  - reject unknown extra fields

Expected GitHub module changes:

- `src/cli.pull/u.github/t.ts`
  - add GitHub source/result/tree/blob/error types that are internal to the pull GitHub area
- `src/cli.pull/u.github/u.client.ts`
  - keep repo parsing and token loading
  - make token optional for public access
  - add repository metadata, ref/tree/blob operations
  - keep binary download operations behind one client/download interface
- new candidate: `src/cli.pull/u.github/u.errors.ts`
  - token help text
  - expected GitHub error classification
  - source-neutral auth/access messages
- new candidate: `src/cli.pull/u.github/u.repo.resolve.ts`
  - resolves tree/path/ref data into descriptor entries
- existing: `src/cli.pull/u.github/u.release.resolve.ts`
  - keep release/asset selection pure
  - adapt selected assets into descriptor entries

Expected bundle pull changes:

- `src/cli.pull/u.bundle/u.pull/mod.ts`
  - dispatch `github:repo`
  - optionally dispatch `github:resource`
- existing: `src/cli.pull/u.bundle/u.pull/u.github.execute.ts`
  - shared GitHub materialization executor
- existing: `src/cli.pull/u.bundle/u.pull/u.pull.github.release.ts`
  - release source adapter
- new candidate: `src/cli.pull/u.bundle/u.pull/u.pull.github.repo.ts`
  - repo source adapter
- optionally: `src/cli.pull/u.bundle/u.pull/u.pull.github.resource.ts`
  - resource source adapter only if implemented
- removed: `src/cli.pull/u.bundle/u.pull/u.pull.github.ts`
  - release behavior now lives in the source-specific release adapter

Expected CLI/formatting changes:

- `src/cli.pull/u.bundle/u.bundle.ts`
  - display `github:repo` labels in the menu
  - label should include ref/path when present
- `src/cli.pull/u.fmt.ts`
  - support repo/resource summaries without `dist`
- `src/cli.pull/m.cli.ts`
  - make non-interactive expected failures graceful and non-zero

## DRY implementation path

Phase 0: lock the invariants.

- Add/adjust tests that prove current `github:release` behavior before refactor.
- Identify current token-required behavior as behavior to improve, not doctrine to preserve.

Phase 1: shared GitHub base types and schema helpers.

- Add shared GitHub bundle base type.
- Add schema helper for shared GitHub fields.
- No behavior change yet.
- Keep tests green.

Phase 2: shared GitHub auth/error substrate.

- Move GitHub token help and expected error mapping out of release-specific pull code.
- Make messages source-neutral.
- Make token optional for public GitHub access.
- Keep release behavior covered by tests.

Phase 3: descriptor-based GitHub materialization executor.

- Introduce `GithubPullPlan`, `GithubPullEntry`, and `GithubDownloadRequest` descriptors.
- Executor owns downloads and writes.
- Plans use relative paths only.
- Refactor `github:release` to use release resolver -> plan -> shared executor.
- This is the key anti-duplication step.

Phase 4: repo resolver/client operations.

- Add repo metadata/ref/tree/blob client methods.
- Add repo resolver from fake tree data to descriptor entries.
- Add path-prefix stripping and path safety tests.
- Add unsupported entry tests.

Phase 5: add `github:repo` public bundle kind.

- Add type union.
- Add YAML schema.
- Add dispatch.
- Add menu/source label.
- Add summary formatting.
- Add non-interactive graceful failure path.

Phase 6: optional `github:resource` public kind.

- Only do this if the human needs it now.
- It should be small because the substrate and repo blob request path already exist.
- It should not add new auth/download/write code.

Phase 7: runtime proof.

- Run targeted tests first.
- Probe a tiny public GitHub repo when feasible.
- Probe private/missing-token behavior only with a concrete human-approved target.
- Do not require live private credentials in automated tests.

## Testing plan

Run from `code/sys.tools` through the module task surface:

```sh
deno task test --trace-leaks ./src/cli.pull
```

Add/extend tests:

1. YAML schema
   - accepts minimal `github:repo`
   - accepts `github:repo` with `ref`
   - accepts `github:repo` with `path`
   - rejects `github:repo` without `repo`
   - rejects malformed `repo`
   - rejects unknown fields
   - if implemented: accepts/rejects `github:resource` with required `path`

2. Defaults
   - `local.clear` default resolution works for `github:repo`
   - existing `github:release` default behavior remains covered

3. Dispatch
   - `github:repo` dispatches to the repo adapter
   - `github:release` dispatch remains unchanged at the public seam
   - if implemented: `github:resource` dispatches to the resource adapter

4. Release regression
   - release resolver still selects latest stable release
   - explicit tag selection works
   - asset string and asset array selection work
   - duplicate asset target names remain safe
   - public-token-optional behavior is covered with an injected client

5. Repo resolver
   - omitted `path` maps root files into target root
   - subpath maps contents into target root
   - nonexistent path fails clearly
   - ref/default-branch resolution is explicit
   - tree truncation fails clearly
   - symlink fails clearly
   - submodule fails clearly
   - LFS pointer is not expanded or promised

6. Path safety
   - absolute source paths rejected
   - `..` segments rejected
   - empty output path rejected
   - Windows drive-like prefixes rejected
   - final joined target cannot escape target root

7. Shared GitHub executor
   - writes all planned entries
   - records ops with source/target/bytes
   - stops on expected download failure with useful file context
   - `local.clear` cannot clear outside base
   - no generated `dist.json` for repo/resource by default

8. Auth/error mapping
   - 401/403 -> token help
   - 404 -> ambiguous private/missing/ref/path message
   - rate limit -> token suggestion
   - messages are source-neutral or correctly source-specific
   - repo failure messages do not mention release

9. CLI non-interactive
   - expected GitHub failure prints useful message
   - exits non-zero
   - no raw stack trace

10. Summary formatting

- `github:repo` summary includes repo, ref, path when present, files, bytes, output
- output row alignment remains stable
- missing `dist` is handled cleanly
- ANSI-normalized assertions use `Cli.stripAnsi`

## Non-goals for first implementation

- No `private: true` config.
- No git CLI clone.
- No include/exclude filters.
- No sparse checkout semantics beyond one optional repo `path` root.
- No LFS expansion.
- No symlink support.
- No submodule support.
- No archive extraction fallback.
- No generated `dist.json` written into repo/resource pulls by default.
- No config recency writes.
- No broad refactor unrelated to GitHub substrate sharing.

## Open decisions before coding

1. Should `github:resource` public YAML land in the same packet?
   - Prefer no unless it is immediately needed.
   - The internal design must still make it cheap and DRY later.

2. Should omitted `ref` be allowed?
   - Yes, if repository metadata is fetched and default branch is used.
   - No guessing `main`.

3. Should release pulls become token-optional in the same packet?
   - Yes if touching the GitHub substrate. This aligns release with repo/resource and public GitHub
     behavior.

4. Should repo pulls compute an in-memory digest for summary?
   - Only if an existing canonical helper makes it cheap and truthful.
   - Do not write generated provenance files by default.

5. Should repo pulls write under `local.dir/<ref>`?
   - No. `local.dir` is the target. Users can encode ref in the target directory when they want that
     layout.

6. Should resource pulls allow custom target filenames?
   - Not in the first design. Basename is enough until a real use case earns an option.

## Acceptance criteria

- `github:repo` config can materialize a public repo root or subpath into `local.dir`.
- The same config shape works for private repos when `GH_TOKEN` or `GITHUB_TOKEN` has Contents: Read
  permission.
- Missing/insufficient token failures are clear, bounded, and non-humiliating.
- No YAML `private` field exists.
- `github:release` behavior remains intact and is moved onto the shared GitHub substrate.
- Release pulls no longer require a token before trying public GitHub access.
- GitHub auth/client/error/download/write logic is shared, not duplicated per variant.
- Source resolvers return descriptor data, not function-valued IO closures.
- Materialization plans contain relative paths only.
- Repo path materialization is path-safe and cannot write outside target root.
- Repo/resource pulls do not write generated `dist.json` by default.
- Non-interactive expected GitHub failures print useful messages and exit non-zero without raw
  stacks.
- Automated tests cover schema, resolver, dispatch, error mapping, path safety, shared executor
  behavior, release regression, and CLI failure behavior without requiring live GitHub credentials.

## Suggested implementation packet name

```text
feat(sys.tools): add github repo pull bundles
```

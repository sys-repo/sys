info-package-scoped-source-stats.plan.md
- [x] f29282aa7 fix(sys): exclude ignored caches from workspace size
- [x] 1655aeaf9 refactor(workspace): extract shared workspace member resolver
- [x] d2269a42b feat(workspace): add package-scoped source statistics
- [x] def5c7278 feat(sys): report workspace size from @sys packages
- [x] 1c2cff197 feat(workspace): link graph summary from workspace info

## Status

The independent Opus MAX `BLOCK` review has been ingested and adjudicated in
[info-package-scoped-source-stats.opus-max-review.md](./info-package-scoped-source-stats.opus-max-review.md).
The reviewed draft has been replaced by this design. The human operator explicitly accepted the
repaired design after adjudication. The complete implementation arc has now landed through
`1c2cff197`; no source change remains pending in this plan.

Live root baseline from `deno task info` before implementation:

- packages: unavailable in the current metric;
- files: 16,618;
- lines: 1,300,001.

Post-cache-fix root output from `deno task info` before package mode landed:

- packages: unavailable in that historical metric;
- files: 6,741;
- lines: 434,561;
- source code: 228,402;
- unit test: 185,822;
- UI harness: 20,337.

Controlled `.pi` exclusion proof:

- before temporary TS source: 6,741 files and 434,561 lines;
- with temporary TS source beneath `code/sys.driver/driver-pi/.pi`: unchanged;
- after removing the temporary source: unchanged;
- proof source removed from the worktree.

Latest package-scoped root output from `deno task info` after the graph-summary formatter landed:

- graph: `#e0a7c`, 396 persisted edges;
- packages: 46 `@sys/*`;
- files: 6,744;
- lines: 436,307 (229,159 source, 186,811 unit-test, 20,337 UI-harness);
- the retained explicit exclusions cover `node_modules`, `_archive`, `.tmp`, `.pi`, `spikes`,
  `compiler`, `compiler.samples`, and `dist` beneath each selected package root.

## Position

Workspace size has two independent concerns:

1. **Exclusion policy fixes today's wrong number.** Runtime caches live inside valid package roots.
   The `/sys` call site must explicitly exclude `node_modules`, `.tmp`, `.pi`, and its existing
   generated/archive trees.
2. **Package selection defines workspace ownership.** Root `deno.json#workspace` supplies
   candidates; package manifest names select the `@sys` scope; those roots produce package count and
   bound future file eligibility.

Under today's layout, package selection removes no files when compared under identical exclusions.
It is still the correct durable ownership model. It must not be credited with removing `.pi`; the
explicit exclusion policy does that.

`deno.json#exclude` is Deno tooling policy, not a reliable declaration of source ownership. This
helper will not consume root or child manifest excludes. That avoids false inheritance, unsupported
negation semantics, and undercounting authored-but-tool-excluded source such as `-spec.agent`.

## Calculation modes

`Workspace.Info.stats` retains raw glob statistics and adds one explicit package mode. Input and
result are discriminated so invalid mixed states are not representable.

Conceptual input contract:

```ts
type StatsArgs = GlobArgs | PackageArgs;

type GlobArgs = {
  cwd?: t.StringDir;
  source: {
    kind: 'glob';
    include: readonly t.StringPath[];
    exclude?: readonly t.StringPath[];
  };
  totals?: Totals;
};

type PackageArgs = {
  cwd?: t.StringDir;
  packages: {
    workspace: t.StringPath;
    scope: string;
  };
  source: {
    kind: 'package';
    include: readonly t.StringPath[];
    exclude?: readonly t.StringPath[];
  };
  totals?: Totals;
};
```

Raw globs remain `cwd`-relative. Package source globs are relative to each selected package root.
Supplying `packages` changes calculation roots; it is never formatter metadata.

Conceptual result contract:

```ts
type StatsResult = GlobResult | PackageResult;

type GlobResult = StatsBase & {
  readonly kind: 'glob';
  readonly source: NormalizedSource;
};

type PackageResult = StatsBase & {
  readonly kind: 'package';
  readonly selection: {
    readonly workspace: t.StringPath;
    readonly scope: string;
  };
  readonly packages: readonly PackageIdentity[];
  readonly source: NormalizedSource;
};

type PackageIdentity = {
  readonly name: t.StringPkgName;
  readonly path: t.StringDir;
};
```

`PackageResult.source` records the package-relative call-site policy applied uniformly to every
selected root. It does not claim to represent manifest exclusions because none are consumed.

Package identities are ordered with `Str.Compare.codeUnit()`. Package count is
`result.packages.length` and includes selected packages with zero matching source files.

## `/sys` call site

Final package-mode call:

```ts
const stats = await Workspace.Info.stats({
  cwd: Deno.cwd(),
  packages: {
    workspace: './deno.json',
    scope: '@sys',
  },
  source: {
    kind: 'package',
    include: ['**/*.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/.tmp/**',
      '**/.pi/**',
      '**/_archive/**',
      '**/spikes/**',
      '**/compiler/**',
      '**/compiler.samples/**',
      '**/dist/**',
    ],
  },
  totals: { lines: true },
});
```

These exclusions are explicit `/sys` ownership policy, not hidden library defaults. The generic
repository template remains in raw mode and retains its explicit exclusions.

## Shared workspace member resolver

Extract the root-workspace loading currently private to `m.bump/u/u.collect.ts` into one private
package-level resolver, provisionally `src/u.workspace.members.ts`.

The resolver:

- reads the configured root workspace manifest;
- requires a non-empty string `workspace` member list;
- resolves every member beneath the workspace root;
- resolves child `deno.json` or `deno.jsonc` consistently;
- returns workspace-relative member paths, absolute roots, manifest paths, and parsed manifest data;
- preserves deterministic workspace order for consumers;
- throws a condition- and path-bearing `Err.std` error rather than returning partial members.

`m.bump` migrates to this resolver in the same refactor and retains its existing behavior and tests.
`m.info` consumes the resolver in the later package-statistics commit.

`m.prep` remains the owner of workspace-list normalization. `m.graph` recursive manifest discovery
is an acknowledged divergent model and a named follow-up; this plan does not silently declare it
canonical or widen scope into graph migration.

## Package selection

Package mode:

1. resolves the configured root workspace manifest from `cwd`;
2. loads members through the shared resolver;
3. validates `scope` as exactly one scoped-name prefix such as `@sys`;
4. requires each selected manifest name to be a valid scoped package name;
5. selects names beginning with `${scope}/` and a non-empty package segment;
6. rejects duplicate names, duplicate canonical roots, nested selected roots, and symlinked roots;
7. returns selected identities in code-unit order;
8. fails when no package matches.

No generic package-scope predicate exists in the inspected standard surfaces. The implementation may
use one private, tested scope predicate with canonical `Is` guards; this is an explicit standard
library gap, not an unreported substitute.

## Source-path and exclusion semantics

Package-mode include and exclude patterns are package-relative policy.

Before filesystem traversal:

- reject absolute patterns;
- reject `..` path segments;
- reject negated `!` patterns because the substrate does not support truthful re-inclusion;
- normalize every exclusion to an absolute pattern rooted beneath the selected package;
- preserve the call-site pattern in the public result;
- assert generated patterns remain beneath the canonical package root.

During traversal:

- use `Fs.glob` and canonical `@sys/fs` path helpers;
- use `Fs.lstat` so final-path symlinks are not followed;
- do not count symlink entries;
- verify every matched path remains beneath its package root;
- deduplicate overlapping includes and roots before aggregate counting;
- sort physical paths deterministically;
- fail with package/path context on metadata or read errors;
- never fall back to raw mode or return partial totals.

The current `Fs.glob` implementation turns include patterns into absolute paths before calling
`expandGlob`. The pinned `@std/fs` source then resolves excludes from `/`. Package mode must
therefore pass absolute package-rooted exclusion patterns, never raw manifest values or unrooted
local patterns.

## Formatter

Formatting is total over the result discriminant.

Raw mode preserves the existing `pattern.code` row. Package mode emits semantic ownership and the
actual normalized package-relative `source.include` policy. Multiple include patterns render on
separate rows. Line-classification rows branch from the `lines` total using
`Cli.Fmt.Tree.branch([index, rows])`:

```text
Workspace    graph:#<suffix>   <count> edges
  packages   46                @sys/*
   include   **/*.{ts,tsx}
     files   <count>
     lines   <count>
             ├─ source code    <count>
             ├─ unit test      <count>
             └─ ui harness     <count>
```

The workspace row links the persisted graph identity to the absolute `deno.graph.json` file URL in
terminal output. Graph identity and edge count use the same dim secondary-detail treatment as scope
and include policy. Width fallback removes complete graph facts in semantic order: edge summary,
hash suffix, then graph label; the workspace title remains.

The tree glyphs and classification rows retain the existing dim treatment. When no line breakdown is
present, no branches render. Do not hand-assemble branch glyphs or spacing outside the canonical
`Cli.Fmt.Tree` helper.

The numeric values are runtime output, not plan constants. Package mode never displays
`**/*.{ts,tsx}` as though it were a repository-wide pattern.

## Failure policy

Once package mode is selected, every failure throws and no raw or partial result is returned.

Fail with precise condition and path/package context when:

- `packages.workspace` is absolute, escapes `cwd`, is missing, or cannot be parsed;
- the root workspace list is missing, empty, or malformed;
- a member path is absolute, escapes the workspace root, is missing, or is not a directory;
- a child manifest is missing or malformed;
- `scope` is empty, unscoped, malformed, or has a trailing slash;
- a selected package name is malformed;
- selected names or canonical roots are duplicated;
- selected roots overlap, are nested, or are symlinks;
- no package matches the scope;
- an include or exclude is absolute, traversing, negated, or cannot be rooted safely;
- matched-path metadata or source reads fail.

## Commit boundaries

### `f29282aa7 fix(sys): exclude ignored caches from workspace size`

- Add `**/.pi/**` to the current root task while retaining `node_modules` and `.tmp`.
- Run `deno task info` before and after.
- Record the corrected file/line baseline in this plan body.
- Do not introduce package selection or change `@sys/workspace`.

### `1655aeaf9 refactor(workspace): extract shared workspace member resolver`

- Extract the private resolver and migrate `m.bump` onto it.
- Preserve bump behavior, JSON/JSONC resolution, and deterministic results.
- Add focused resolver failure tests without changing `Workspace.Info`.

### `d2269a42b feat(workspace): add package-scoped source statistics`

- Land the discriminated input/result contract, package selection, rooted source traversal,
  containment policy, package identities, and formatter branch as one fulfilled public feature.
- Migrate existing raw callers to `kind: 'glob'`, including the repository template.
- Preserve raw-mode behavior byte-for-byte apart from the explicit discriminant.
- Add no manifest-exclusion ownership proxy and no per-package line table.

### `def5c7278 feat(sys): report workspace size from @sys packages`

- Migrate the root info task from raw mode to the explicit `@sys` package selector.
- Preserve the corrected exclusion set.
- Run the root info task and record package/file/line output.
- Prove the migration does not reintroduce cache files.

### `1c2cff197 feat(workspace): link graph summary from workspace info`

- Align labels, aggregate values, ownership details, and line partitions on one stable metric grid.
- Render every normalized package include rather than embedding a TypeScript-specific formatter
  policy.
- Read the persisted workspace graph snapshot and report its linked five-character fingerprint plus
  edge count.
- Keep graph details secondary, terminal-aware, width-bounded, and removable only as complete
  semantic units.
- Retain the public API smoke/type contract in `-.test.ts`; group formatter behavior separately in
  `-u.fmt.test.ts` by source projection, graph summary, and width pressure.

## Proof matrix

### Immediate cache fix

- live before/after `deno task info` output;
- file count decreases materially from the recorded 16,618 baseline;
- `.tmp` and `node_modules` remain excluded;
- `.pi` TS/TSX additions do not change totals.

### Shared resolver

- root `deno.json` and child `deno.json`;
- child `deno.jsonc` fallback;
- malformed/empty workspace list;
- missing or escaping member;
- deterministic member order;
- existing `m.bump` behavior remains green.

### Package calculation

- select listed `@sys/*` members;
- exclude listed members in another scope;
- ignore unlisted nested manifests;
- count a selected zero-source package;
- reject malformed scopes, names, duplicate/nested/symlinked roots, and empty selection;
- apply includes and excludes relative to each package root;
- assert generated rooted exclusion patterns directly;
- prove explicit `.tmp`, `.pi`, `node_modules`, and nested-path exclusions;
- reject absolute, traversal, and negated patterns;
- reject or ignore symlink file escapes without reading their targets;
- deduplicate overlapping include matches;
- preserve physical-line and line-classification arithmetic;
- return the correct discriminated variant and `t.StringPkgName` identities;
- preserve existing raw-mode calculation.

### Formatter

- project raw and package result data without freezing complete output strings;
- render every normalized include and preserve empty-policy truth;
- align labels, aggregate values, line branches, ownership, and graph details on the shared grid;
- retain `pattern.code` only in raw mode and semantic package ownership only in package mode;
- link the complete graph token to the absolute snapshot file URL only in terminal output;
- style graph facts with the same dim treatment as other secondary details;
- preserve width bounds and semantic graph degradation under narrow output;
- keep unusually wide metrics aligned without collapsing the required cell gap;
- emit no line branches when line breakdown is absent.

### Verification order

From `code/sys/workspace`:

```sh
deno task test --trace-leaks ./src/m.info
deno task test --trace-leaks ./src/m.bump
deno task test
deno task check
deno task dry
```

From the workspace root after the final call-site migration:

```sh
deno task check
deno task info
```

Use the narrowest red → green test first. Root-wide tests remain final proof, not iteration surface.

## Acceptance criteria

- Root info reports the selected `@sys` package count.
- Root file and line totals exclude `.pi`, `.tmp`, `node_modules`, and existing generated/archive
  policy.
- Adding TS/TSX beneath an excluded cache tree leaves totals unchanged.
- Adding TS/TSX outside selected package roots leaves package-mode totals unchanged.
- Adding or removing a valid `@sys/*` root workspace member changes package count and eligible
  source.
- Package selection and exclusion policy remain separately named and tested mechanisms.
- Raw mode and the generic repository template remain supported.
- No fourth ad hoc workspace-member resolver is introduced.
- The result type cannot represent mixed raw/package states.
- No source path can escape a selected package root through patterns or symlinks.
- Final before/after runtime output is recorded with no inferred arithmetic.
- Root info links the persisted graph fingerprint only in terminal output and reports the persisted
  edge count as secondary detail.
- Width pressure removes edge count, hash, and graph label in that order without clipping semantic
  graph tokens or losing the workspace title.

## Non-goals

- Do not define workspace size from Git history or tracked files only.
- Do not use recursive manifest discovery as Info package authority.
- Do not treat `deno.json#exclude` as source ownership.
- Do not add hidden automatic exclusions to generic raw mode.
- Do not migrate `m.graph` in this arc.
- Do not support multiple package scopes in one call.
- Do not add per-package line tables.
- Do not begin implementation from plan acceptance or readiness alone; explicit implementation
  instruction remains required.

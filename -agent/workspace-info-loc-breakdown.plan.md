# PLAN — Workspace info LOC breakdown

## Status

Implementation is complete and committed. This plan file itself is currently
untracked planning documentation.

Related commits:

```text
5d4c578ce refactor(workspace): tidy info stats internals
ba208ed0b feat(workspace): report info line breakdown
d66f39062 feat(workspace)!: partition info lines by test category
e1a8578a8 chore(info): show spinner during workspace scan
```

Current root task:

- `/Users/phil/code/org.sys/sys/deno.json` →
  `info: deno run -P=dev ./-scripts/task.info.ts`.
- `/-scripts/task.info.ts` wraps `Workspace.Info.stats(...)` with a root-task
  spinner, then prints `Workspace.Info.fmt(...)`.
- metric implementation lives in `code/sys/workspace/src/m.info/`.

## Current output contract

Root `deno task info` shows a liveness spinner while scanning, then reports
physical TS/TSX line totals for the matched workspace source glob:

```text
- scanning workspace...
✔ scanned 11,044 files in 2s
  Workspace
  pattern.code   code/**/*.{ts,tsx}
         files   11,044
         lines   829,848
                 637,178 source
                 173,495 unit tests
                  19,175 ui spec/tests
```

The nested `source`, `unit tests`, and `ui spec/tests` rows are dim subrows of
`lines`. They are not peer top-level metrics. `lines` remains the authoritative
total.

The child rows are mutually exclusive and exhaustive under `lines`. Do not print
both an aggregate `tests` row and child test rows unless a later visual grouping
design explicitly calls for it.

## Terminology contract

This task reports **physical line counts**, not semantic SLOC.

- `lines`: all physical lines in matched `code/**/*.{ts,tsx}` files, using the
  current exact counting semantics.
- `unit tests`: physical lines in matched files classified as conventional test
  files/folders by the default workspace info policy.
- `ui spec/tests`: physical lines in matched files classified as UI/dev-harness
  spec files/folders by the default workspace info policy.
- `source`: physical lines in matched files not classified as either test
  category. This label means **non-test-owned matched TS/TSX lines**, not proof
  of production semantics.

Invariant when line totals are requested:

```ts
lines === lineBreakdown.source + lineBreakdown.unitTests + lineBreakdown.uiSpecTests;
```

## Resolved classification gap

The UI module template establishes an additional test/spec convention:

```text
code/-tmpl/-templates/tmpl.m.mod.ui/-spec/*
```

Files under `-spec/` are dev-harness/spec surface, not production source. The
previous implementation classified only basename test entries and known test
folders (`-test`, `-test.*`, `__tests__`), so `-spec/` files were counted as
`source`.

The implementation fixes this by factoring classification into a stable default
policy rather than adding another ad-hoc branch inside `u.stats.ts`.

## Design objective — classifier factoring

Make test-path classification a small, explicit, reusable policy surface owned
by `Workspace.Info`, then consume that policy from stats.

The design should allow future discovered conventions to be added as deliberate
policy entries, with tests, without touching the line-count reducer.

## STIER design principles

1. **One matched file set**
   - Glob once.
   - De-dupe once.
   - Classify/count the exact same matched file set.
   - This preserves the partition invariant.

2. **Declarative default policy**
   - Classification rules live in one default rule-set.
   - `u.stats.ts` should not know regexes or folder names.
   - A later convention should be a rule-set update plus tests, not scattered
     conditional logic.

3. **Path-structure matching only**
   - Match basename and directory segments.
   - Do not match arbitrary full-path substrings.
   - Do not infer tests from words like `testing`, `specific`, or `m.Spec`.

4. **No behavioral drift in line counting**
   - Keep current physical line semantics:
     - `''` → `1`
     - `'a'` → `1`
     - `'a\n'` → `2`
     - `'a\nb\n'` → `3`

5. **Narrow public surface**
   - Expose default policy for discoverability and reuse.
   - Do not add CLI flags or user config yet.
   - The repo needs one canonical answer first.

6. **Auditability over cleverness**
   - Prefer a small typed rule object and pure classifier helpers.
   - Tests document inclusion and exclusion cases.
   - Avoid opaque glob re-scans or hidden side effects.

## Final model

The implementation adds a typed default rule-set to the `WorkspaceInfo`
namespace and exposes it on the library surface.

```ts
export type Lib = {
  readonly DEFAULTS: Defaults;
  stats(args: StatsArgs): Promise<StatsResult>;
  fmt(stats: StatsResult): string;
};

export type LineKind = 'source' | 'unit-test' | 'ui-spec-test';

export type TestPathRule = {
  readonly kind: Exclude<LineKind, 'source'>;
  readonly basenamePatterns?: readonly RegExp[];
  readonly directorySegments?: {
    readonly exact?: readonly string[];
    readonly prefixes?: readonly string[];
  };
};

export type Defaults = {
  readonly testPathRules: readonly TestPathRule[];
};

export type LineBreakdown = {
  /** Matched physical lines not classified as test-owned. */
  readonly source: number;
  /** Matched physical lines classified as conventional tests. */
  readonly unitTests: number;
  /** Matched physical lines classified as UI/dev-harness specs. */
  readonly uiSpecTests: number;
};
```

Default rules:

```ts
export const DEFAULTS: t.WorkspaceInfo.Defaults = {
  testPathRules: [
    {
      kind: 'ui-spec-test',
      directorySegments: {
        exact: ['-spec'],
        prefixes: ['-spec.'],
      },
    },
    {
      kind: 'unit-test',
      basenamePatterns: [/(^|[._-])test\.tsx?$/],
      directorySegments: {
        exact: ['-test', '__tests__'],
        prefixes: ['-test.'],
      },
    },
  ],
};
```

The rule-set means:

- `ui-spec-test` classifies explicit UI/dev-harness spec folders;
- `unit-test` classifies Deno/repo test entries and test folders;
- rules are evaluated in order and return the first matching kind;
- exact directory segments match whole path segments only;
- prefix directory segments include the dot delimiter, so `-spectator`,
  `-specific`, and `-testing` do not match.

## Final module layout

Added:

```text
code/sys/workspace/src/m.info/u.defaults.ts
code/sys/workspace/src/m.info/u.classify.ts
code/sys/workspace/src/m.info/-test/-u.classify.test.ts
```

Updated:

```text
-scripts/task.info.ts
code/sys/workspace/src/m.info/t.ts
code/sys/workspace/src/m.info/mod.Info.ts
code/sys/workspace/src/m.info/u.stats.ts
code/sys/workspace/src/m.info/u.fmt.ts
code/sys/workspace/src/m.info/-test/-.test.ts
code/sys/workspace/src/m.info/-test/-u.stats.test.ts
```

### `u.defaults.ts`

Own the default policy values only:

```ts
export const DEFAULTS: t.WorkspaceInfo.Defaults = {
  testPathRules: [
    {
      kind: 'ui-spec-test',
      directorySegments: { exact: ['-spec'], prefixes: ['-spec.'] },
    },
    {
      kind: 'unit-test',
      basenamePatterns: [/(^|[._-])test\.tsx?$/],
      directorySegments: { exact: ['-test', '__tests__'], prefixes: ['-test.'] },
    },
  ],
};
```

### `u.classify.ts`

Own the pure path classifier:

```ts
export function classifyPath(
  path: t.StringPath,
  rules: readonly t.WorkspaceInfo.TestPathRule[] = DEFAULTS.testPathRules,
): t.WorkspaceInfo.LineKind;
```

Classifier algorithm:

1. Split path on `/` and `\\`.
2. Read basename from the last segment.
3. Evaluate each rule in order.
4. Test basename against the rule basename patterns.
5. Test each directory segment against the rule exact and prefix segment rules.
6. Return the first matching rule kind; otherwise return `source`.

No filesystem access. No globbing. No full-path substring matching.

### `mod.Info.ts`

Expose default policy on the library object:

```ts
export const WorkspaceInfo: t.WorkspaceInfo.Lib = { DEFAULTS, fmt, stats };
```

This makes the policy visible as `Workspace.Info.DEFAULTS` without adding config
or new command-line behavior.

### `u.stats.ts`

Import and call the classifier only:

```ts
kind: classifyPath(path)
```

No regex or segment list should remain in `u.stats.ts`.

### `-scripts/task.info.ts`

Keep terminal liveness at the root task layer, not inside `Workspace.Info.stats`:

```ts
const spinner = Cli.spinner(Fmt.scanning());
try {
  const stats = await Workspace.Info.stats(...);
  spinner.succeed(Fmt.scanned(stats, startedAt));
  console.info(Workspace.Info.fmt(stats));
} catch (error) {
  spinner.fail(Fmt.failed());
  throw error;
}
```

The spinner text is intentionally short:

```text
scanning workspace...
```

## Correct default test-owned patterns

### Basename patterns

Classify as `unit-test`:

```text
.test.ts
-.test.ts
foo.test.ts
foo-test.ts
foo_test.tsx
```

### Directory segments

Classify as `unit-test`:

```text
src/-test/helper.ts
src/-test.external/fixture.ts
src/__tests__/fixture.tsx
```

Classify as `ui-spec-test`:

```text
src/-spec/-SPEC.tsx
src/-spec/common.ts
src/-spec.debug/fixture.tsx
```

### Explicit non-matches

Must remain `source` unless another rule applies:

```text
code/sys/testing/src/mod.ts
src/m.Spec/runtime.ts
src/specific/mod.ts
src/-specific/mod.ts
src/-spectator/mod.ts
```

These exclusions are as important as inclusions. They prevent broad substring
matching from corrupting the report.

## Tests added/updated

### Classifier test

Added:

```text
code/sys/workspace/src/m.info/-test/-u.classify.test.ts
```

Test cases:

1. Basename forms classify as `unit-test`.
2. Existing test directory forms classify as `unit-test`.
3. `-spec` and `-spec.*` directory forms classify as `ui-spec-test`.
4. `testing`, `m.Spec`, `specific`, `-specific`, and `-spectator` classify as
   `source`.
5. Passing an explicit custom rule-set works for a narrow local case without
   mutating defaults.

### Stats test update

Extended the existing line-breakdown test to include `-spec` lines and expect
them under `uiSpecTests`, while conventional test files/folders remain under
`unitTests`.

The invariant remains mandatory:

```ts
expect(result.lines).to.eql(
  (result.lineBreakdown?.source ?? 0) +
    (result.lineBreakdown?.unitTests ?? 0) +
    (result.lineBreakdown?.uiSpecTests ?? 0),
);
```

### Existing proof tests retained

Retained existing tests that prove:

- line-count semantics;
- de-dupe behavior;
- `lineBreakdown` absent unless `totals.lines` is true;
- formatter omits subrows when no breakdown exists;
- formatter renders `source`, `unit tests`, and `ui spec/tests` subrows dim when breakdown exists.

## Proof

```bash
cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno fmt --check src/m.info/t.ts src/m.info/mod.Info.ts src/m.info/u.defaults.ts src/m.info/u.classify.ts src/m.info/u.stats.ts src/m.info/u.fmt.ts src/m.info/-test/-u.classify.test.ts src/m.info/-test/-u.stats.test.ts src/m.info/-test/-.test.ts
deno task test
deno task check

cd /Users/phil/code/org.sys/sys
deno task info
```

Verified root behavior:

- root task shows `scanning workspace...` while computing stats;
- `lines` remains the authoritative top-level total;
- child line rows are the three-way `source` / `unit tests` / `ui spec/tests` partition;
- `-spec` files move from `source` to `ui spec/tests`;
- conventional tests remain under `unit tests`;
- `source + unit tests + ui spec/tests === lines` before locale formatting.

## Landed commits

```text
5d4c578ce refactor(workspace): tidy info stats internals
ba208ed0b feat(workspace): report info line breakdown
d66f39062 feat(workspace)!: partition info lines by test category
e1a8578a8 chore(info): show spinner during workspace scan
```

The breaking marker on `d66f39062` is intentional: the public
`lineBreakdown.tests` field was replaced by the three-way partition
`source`/`unitTests`/`uiSpecTests`.

## Quality gates

Classifier factoring done criteria:

1. No change to source glob defaults.
2. No line-count semantic drift from `split('\n').length`.
3. No broad substring classifier for `test` or `spec`.
4. No regex/segment policy remains embedded in `u.stats.ts`.
5. `Workspace.Info.DEFAULTS` exposes the canonical policy.
6. Tests prove inclusion and exclusion cases.
7. Root `deno task info` prints dim line subrows and a valid three-way partition.

## Deferred work

- No CLI/configurable classifier rules yet.
- No semantic SLOC counting.
- No generated-code category.
- No package-level overrides until there is a concrete second policy owner.

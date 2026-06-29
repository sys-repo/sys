# npm standdown for workspace upgrade

## Commit arc

- [x] `9eede33ca` feat(registry): expose npm publish timestamps
- [x] `0aa870c0f` feat(workspace): model dependency standdown in upgrade planning
- [x] `9e0fbc1e2` feat(workspace): surface standdown controls and diagnostics

Latest workspace refresh after this arc:

- [x] `8c1a13acb` chore(workspace): refreshed 10 workspace packages (25 jsr:publish modules)

## Current truth

Registry timestamp preservation is implemented.

Confirmed local surfaces:

```text
code/sys/registry/src/m.npm/m.client/m.Fetch/t.ts
code/sys/registry/src/m.npm/m.client/m.Fetch/m.Fetch.Pkg.ts
code/sys/registry/src/m.npm/m.client/m.Fetch/-test/-Pkg.test.ts
code/sys/registry/src/m.npm/m.client/m.Fetch/-test.external/-Pkg.test.ts
```

`Npm.Fetch.Pkg.versions(name)` now maps npm top-level `time[version]` into
`MetaVersion.publishedAt`, preserving deprecation metadata alongside the publish timestamp. Unit tests
cover timestamp mapping and the external probe asserts that the live latest version has a parseable
`publishedAt` timestamp.

Workspace standdown modeling is implemented behind explicit API options. CLI controls and operator-facing
diagnostics are implemented with a surfaced `P2D` default and `0` disable value.

Confirmed model surfaces:

```text
code/sys/workspace/src/m.upgrade/t.ts
code/sys/workspace/src/m.upgrade/u.collect.ts
code/sys/workspace/src/m.upgrade/u.upgrade.ts
code/sys/workspace/src/m.upgrade/u.standdown.ts
code/sys/workspace/src/m.upgrade/-test/-u.collect.test.ts
code/sys/workspace/src/m.upgrade/-test/-u.upgrade.test.ts
code/sys/workspace/src/m.upgrade/-test/-u.apply.test.ts
```

Confirmed CLI/diagnostic surfaces:

```text
code/sys/workspace/src/m.cli/t.ts
code/sys/workspace/src/m.cli/m.run.ts
code/sys/workspace/src/m.cli/u/u.args.ts
code/sys/workspace/src/m.cli/u/u.interactive.ts
code/sys/workspace/src/m.cli/u/u.minimumDependencyAge.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.applied.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.diagnostics.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.help.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.plan.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.selection.ts
code/sys/workspace/src/m.cli/u.fmt/u.fmt.standdown.ts
code/sys/workspace/src/m.cli/-test/-m.run.test.ts
code/sys/workspace/src/m.cli/-test/-u.args.test.ts
code/sys/workspace/src/m.cli/-test/-u.fmt.test.ts
code/sys/workspace/src/m.cli/-test/-u.interactive.test.ts
```

## Completed commit: workspace standdown controls and diagnostics

Commit:

```text
9e0fbc1e2 feat(workspace): surface standdown controls and diagnostics
```

BMIND essence remains:

> Keep too-new npm versions visible, but remove them from the selectable policy input.

The completed model commit remains non-CLI by default. The CLI now supplies the surfaced default:
`minimumDependencyAge` resolves to `P2D` for `deno task upgrade`, while `--minimum-dependency-age 0`
disables standdown explicitly. The CLI parser accepts Deno-compatible minute counts, ISO-8601 durations,
RFC3339 date-only cutoffs, RFC3339 timestamp cutoffs, and rejects local shorthand like `24h`.

Design gates satisfied by the model commit:

- no `@sys/registry` filtering; registry owns facts only;
- no `Esm.Policy` expansion; feed eligible versions into the existing policy algebra;
- CLI flag parsing is implemented at the CLI edge, not in registry/model internals;
- formatter claims are backed by stored candidate facts;
- `NPM standdown` diagnostics use relative durations from stored `evaluatedAt`;
- unknown publish timestamps render under an explicit `Reason` column;
- standdown-only interactive rows are disabled when there is no eligible fallback;
- no per-candidate clocks; capture one `evaluatedAt` in resolved options;
- no apply-time recomputation; apply uses the exact planned selection.

Primary model implementation seams:

```text
code/sys/workspace/src/m.upgrade/t.ts
code/sys/workspace/src/m.upgrade/u.collect.ts
code/sys/workspace/src/m.upgrade/u.upgrade.ts
code/sys/workspace/src/m.upgrade/u.standdown.ts
code/sys/workspace/src/m.upgrade/-test/-u.collect.test.ts
code/sys/workspace/src/m.upgrade/-test/-u.upgrade.test.ts
code/sys/workspace/src/m.upgrade/-test/-u.apply.test.ts
code/sys/workspace/src/m.upgrade/-test/u.fixture.ts
```

`u.standdown.ts` is the pure helper for time eligibility without registry/session machinery.
`u.collect.ts` adapts registry version metadata into candidate facts. `u.upgrade.ts` uses
`candidate.eligible`, not `candidate.available`, as policy input.

## Position

`deno task upgrade` should keep npm releases visible while preventing too-new releases from being selected by default.

This is not a registry fetch failure and not a hidden filter. It is a policy/diagnostic layer over normal candidate collection:

```txt
registry versions → visible candidates → eligibility by standdown → policy selection → apply
```

## Evidence

Local Deno 2.9 help exposes `--minimum-dependency-age <minimum-dependency-age>` on `deno run`, `deno install`, `deno update`, and `deno outdated`.
It accepts minutes, ISO-8601 duration, RFC3339 cutoff date/timestamp, and `0` to disable.
Local probes accepted `P1D`, `P2D`, `1440`, `2880`, and `0`; `24h` / `48h` were rejected as invalid for this Deno flag.
The local help confirms the flag shape and disable value, but does not state a default age.
A Deno `outdated --latest --minimum-dependency-age P2D motion` probe produced no outdated row while npm `motion@12.42.0` was ~43.82h old. That suggests Deno hides too-new versions from its actionable outdated result. The workspace upgrade UX should be more explanatory: visible but ineligible.
Current `deno task upgrade -- --non-interactive --dry-run --policy latest --include motion` produces only aggregate counts, so standdown work also needs an explicit diagnostic/list section.

Raw npm metadata exposes top-level `time` values:

```ts
time: {
  created: string;
  modified: string;
  [version: string]: string;
}
```

Runtime probe examples from `https://registry.npmjs.org/<pkg>`:

```txt
react latest 19.2.7 published 2026-06-01T18:00:48.323Z age ~612.57h
vite latest 8.1.0 published 2026-06-23T11:34:04.988Z age ~91.02h
@vitejs/plugin-react latest 6.0.3 published 2026-06-23T10:11:14.652Z age ~92.40h
@deno/vite-plugin latest 2.0.2 published 2026-03-30T13:47:50.595Z age ~2128.79h
happy-dom latest 20.10.6 published 2026-06-17T23:41:40.697Z age ~222.89h
hono latest 4.12.27 published 2026-06-23T02:48:48.822Z age ~99.77h
motion latest 12.42.0 published 2026-06-25T10:45:39.249Z age ~43.82h
```

The latest stable version can be older than recent canary/experimental publishes. Use `time[version]`, not package `modified`, for release eligibility.

## Target semantics

- Standdown applies to npm candidate versions only in the first implementation.
- JSR behavior remains unchanged unless a JSR timestamp authority is explicitly designed later.
- Versions inside the standdown window remain present in candidate data and CLI diagnostics.
- Standdown blocks selection, not visibility.
- `0` disables standdown.
- For the model commit, default to disabled (`0`) until CLI diagnostics land; do not silently change current operator behavior.
- Unknown or unparsable publish time should fail closed for selecting that version when standdown is enabled, while keeping the version visible with a diagnostic.
- The surfaced workspace CLI default is the repo policy `P2D`; do not claim this is Deno's default unless a source confirms it.
- The current pinned version remains allowed even if its own publish timestamp is inside the window; standdown governs upgrade candidates.
- Evaluate age against one captured `evaluatedAt` timestamp per plan/apply run. Do not call `Date.now()` per candidate or let apply recompute against a later clock than the displayed plan.
- Keep visible, eligible, and selected versions separate in the contract.

## API shape

Registry layer:

```ts
Npm.Fetch.Pkg.versions(name)
```

should preserve publish timestamps on each npm version:

```ts
MetaVersion = {
  deprecated?: string;
  publishedAt?: t.StringTimestamp;
}
```

Workspace upgrade options should capture policy time once:

```ts
Options = {
  readonly policy: Policy;
  readonly prerelease?: boolean;
  readonly registries?: readonly t.EsmRegistry[];
  readonly minimumDependencyAge?: t.Msecs; // 0 disables
  readonly evaluatedAt?: t.UnixTimestamp;
  readonly log?: boolean;
  readonly progress?: ProgressHandler;
};

ResolvedOptions = Options & {
  readonly prerelease: boolean;
  readonly registries: readonly t.EsmRegistry[];
  readonly minimumDependencyAge: t.Msecs;
  readonly evaluatedAt: t.UnixTimestamp;
  readonly log: boolean;
};
```

Workspace upgrade candidate shape should carry version metadata rather than parallel maps:

```ts
Candidate = {
  current: t.StringSemver;
  latest?: t.StringSemver;              // visible latest after existing hard filters
  available: readonly t.StringSemver[]; // visible versions
  eligible: readonly t.StringSemver[];  // selectable versions after standdown
  versions: readonly VersionFact[];
}

VersionFact = {
  version: t.StringSemver;
  publishedAt?: t.StringTimestamp;
  eligibility: VersionEligibility;
}

VersionEligibility =
  | { kind: 'eligible' }
  | { kind: 'standdown'; eligibleAt: t.UnixTimestamp; age: t.Msecs }
  | { kind: 'unknown-published-at' };
```

DMIND decision: `latest` means visible latest, not eligible latest. Existing `available` becomes the
visible version list and remains useful for display. Policy selection must use `candidate.eligible`,
while formatters use `candidate.latest` and `candidate.versions` to explain newer ineligible versions.

Eligibility rules:

- JSR versions are always `eligible` in this first implementation.
- npm versions are `eligible` when standdown is disabled.
- npm current pinned version is always `eligible` if present in visible versions.
- npm versions with parseable `publishedAt` are eligible when `publishedAt + minimumDependencyAge <= evaluatedAt`.
- npm versions inside the window are `standdown` and carry `eligibleAt` plus `age`.
- npm versions with missing, invalid, or future-nonsensical timestamps are `unknown-published-at` and excluded from `eligible` when standdown is enabled, unless they are current.

Use `Time.utc(...)` / `Num.Is.finite(...)` style system primitives for timestamp truth; do not use raw
`Date.parse(...)` scattered through the upgrade path.

## CLI shape

Prefer matching Deno's flag name unless there is a strong reason not to:

```txt
deno task upgrade -- --minimum-dependency-age P1D --dry-run
deno task upgrade -- --minimum-dependency-age 0 --dry-run
```

Potential alias only if desired:

```txt
--npm-standdown <age>
```

But avoid two equal concepts unless UX requires it.

## Interactive implication

Current interactive flow can turn selected blocked dependencies into a `latest` policy retry. Standdown must not become bypassable by ordinary checkbox selection. Either disable standdown-blocked rows with a clear note, or require a separate explicit override flag before selecting too-new versions.

## TMIND / DMIND refinements

- Do not extend global `Esm.Policy` with registry-age semantics unless reuse pressure appears. Feed eligible versions into it and keep standdown diagnostics in `WorkspaceUpgrade`.
- `@sys/std` `Time.Duration.parse(...)` is not Deno-compatible for this flag: it accepts `24h`-style strings and does not parse `P1D`. Either add a standard Deno-compatible duration parser or keep a narrowly named local parser with tests and a documented gap.
- If the flag is named `--minimum-dependency-age`, match Deno input semantics. Do not accept `24h` unless a separate alias explicitly promises that convenience.
- Missing or invalid npm publish timestamps fail closed for new upgrade candidates when standdown is enabled, but remain visible as `unknown-published-at` diagnostics.
- Current npm hard filters remain hard filters: deprecated versions, prereleases when `--prerelease` is absent, and versions beyond the `latest` dist-tag lane are not part of the standdown visibility problem.

## Formatting

Upgrade output should separate facts and prefer relative time over raw timestamps.
Use the captured `upgrade.options.evaluatedAt` as the "now" basis for all standdown display; do not call a live clock while formatting. Render durations through the `Time` helper surface, e.g. `Time.duration(eligibleAt - evaluatedAt).format()` / `Time.duration(age).format()` style helpers, with safe clamping for already-eligible edge cases.

Interactive row note:

```txt
motion                     12.40.0 → 12.41.0  newer in standdown - upgrade in 14h
```

Summary should count standdown separately from generic policy blocks:

```txt
Standdown  1
Blocked    2
Planned    n
```

Diagnostics should show at least:

```txt
NPM standdown       Current    Selected   Visible latest   Age old   Eligible after
motion              12.40.0   12.41.0    12.42.0          36h       14h from now
```

Unknown timestamp diagnostics should remain explicit:

```txt
NPM standdown       Current   Selected   Visible latest   Reason
some-pkg            1.2.0     -          1.3.0            publish timestamp unavailable
```

## Implementation order

1. Registry timestamp preservation. ✅ Done.
   - Extended `@sys/registry` npm metadata types.
   - Mapped raw `time[version]` into `versions[version].publishedAt`.
   - Added unit and external assertions.

2. Workspace standdown model. ✅ Done in `0aa870c0f`.
   - Added `minimumDependencyAge` and `evaluatedAt` to `WorkspaceUpgrade.Options` / resolved options.
   - Defaulted `minimumDependencyAge` to `0` for the model-only commit.
   - Captured `evaluatedAt` once during option resolution and preserved it on collect/upgrade/apply results.
   - Annotated npm version facts with `publishedAt`, `eligibleAt`, `age`, and eligibility kind.
   - Preserved visible versions; derived eligible versions for policy selection.
   - Kept JSR behavior unchanged.

3. Policy/selection bridge. ✅ Done in `0aa870c0f`.
   - Feeds only eligible versions into `Esm.Policy` for selection.
   - Preserves visible facts on `WorkspaceUpgrade.Candidate` for display.
   - Does not add a dedicated `Esm.Policy` blocked reason; standdown diagnostics live on candidate facts and formatter output reads those facts.

4. CLI and help. ✅ Done in `9e0fbc1e2`.
   - Parses `--minimum-dependency-age` using Deno-compatible input forms, not local `24h` shorthand.
   - Accepts date-only cutoffs such as `2026-06-26`, timestamp cutoffs, minutes, ISO-8601 durations, and `0`.
   - Documents `0` as disable.
   - Keeps `--dry-run` showing standdown diagnostics without writes.

5. Tests. ✅ Done across `9eede33ca`, `0aa870c0f`, and `9e0fbc1e2`.
   - Registry maps npm `time` fields.
   - Standdown keeps too-new versions visible but not selectable.
   - An older eligible fallback is selected by policy when the visible latest is too new.
   - Disabling standdown selects latest again.
   - Missing timestamp blocks selection when standdown is enabled.
   - Current pinned version remains allowed even if inside the standdown window.
   - JSR candidates are unchanged by npm standdown.
   - Apply uses the planned `evaluatedAt` and selected versions; it does not recompute against a later clock.
   - CLI help and formatter expose the control and diagnostic.
   - Interactive selection cannot bypass standdown-only disabled rows by ordinary checkbox selection.

## Confidence

High confidence on placement: registry owns npm publish-time facts; workspace upgrade owns standdown eligibility; CLI/formatter owns explanation. This follows existing package boundaries and avoids hiding security-relevant facts.

Default age decision: workspace CLI uses `P2D` as a repo policy. This does not claim Deno's own default, because local help did not state one.

Medium-high confidence on implementation size: registry timestamp preservation is small; the careful part is keeping interactive/apply recomputation from bypassing or changing the displayed standdown plan.

## STIER acceptance bar

For `feat(workspace): model dependency standdown in upgrade planning`:

- Existing `WorkspaceUpgrade.upgrade(...)` behavior is unchanged when `minimumDependencyAge` is absent.
- With an explicit non-zero `minimumDependencyAge`, a too-new npm latest remains in `candidate.available` and `candidate.versions` but is absent from `candidate.eligible`.
- An older eligible fallback can still be selected when policy allows it.
- `minimumDependencyAge: 0` disables standdown and selects the visible latest again.
- Missing or invalid npm publish timestamps produce `unknown-published-at` facts and are not selectable while standdown is enabled.
- The same selected versions are planned and applied using the captured `evaluatedAt`.

For the full follow-up CLI/diagnostic feature:

- A too-new npm latest is visible in dry-run output and not selected by the surfaced default.
- `--minimum-dependency-age 0` disables standdown and selects the visible latest again.
- Standdown diagnostics distinguish too-new, unknown timestamp, ordinary policy block, deprecated, prerelease, and registry-behind-current cases.

## Review risks

- Do not silently hide versions; that recreates the original problem.
- Do not put standdown inside npm fetch as a filter; fetch owns facts, not policy.
- Do not mutate `deps.yaml` differently from the plan output.
- Do not claim the Deno default age without direct authority.
- Do not make every blocked dependency look like generic policy blocking; standdown needs a legible reason.
- Do not let the existing interactive blocked-selection override bypass standdown implicitly.

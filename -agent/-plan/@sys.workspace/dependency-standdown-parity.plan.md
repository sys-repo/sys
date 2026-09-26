@sys.workspace
dependency-standdown-parity.plan.md
- [x] 5449e6822 fix(workspace): unify npm and JSR dependency standdown

## Outcome

After existing registry and prerelease filters, equivalent publication evidence, current-pin state,
and workspace options must produce the same age eligibility for npm and JSR. A recent JSR release
must remain visible without being offered as an eligible upgrade. Keep one workspace eligibility
algorithm and derived facts per planning pass. Bind each selected version to its authorizing
manifest entry through diagnostics and apply.

This plan defines one bounded implementation commit, including the input-validation, entry-identity,
and presentation corrections needed to uphold that contract. It does not authorize implementation,
Git mutation, dependency upgrades, publication, or changes to human-owned recovery state.

## Evidence and ownership

Implementation ownership is `code/sys/workspace`; `src/` and `-scripts/` paths are relative to that
package. Paths starting with `code/` are repository-relative. The observations below describe the
pre-implementation baseline, not the corrected worktree behavior.

- `src/m.upgrade/u.standdown.ts` under that package reads only `publishedAt` and immediately marks
  non-npm versions eligible. The exemption originates in `0aa870c0f`.
- `src/m.cli/u.fmt/u.fmt.standdown.ts` independently excludes non-npm diagnostic rows.
  `u.fmt.diagnostics.ts` labels those rows `npm standdown`.
- `src/m.upgrade/-test/-u.collect.test.ts` explicitly expects JSR exemption. Passing the existing
  suite therefore does not prove the intended contract.
- `code/sys/registry/src/m.jsr/m.client/m.Fetch/t.ts` already exposes `createdAt`; the npm
  counterpart exposes `publishedAt`. Registry clients report facts, not workspace policy.
- `src/m.upgrade/u.upgrade.ts` selects from `candidate.eligible`; `u.apply.ts` plans before writing.
  Preserve that composition rather than adding another apply-time age calculation.
- `code/sys/esm/src/m.deps/u.from.ts` distinguishes entries by registry, name, and alias. Workspace
  apply and formatter decision maps use only registry and name, allowing a successful sibling's
  decision to overwrite or misrepresent a retained or excluded alias.
- `code/sys/std/src/m.Time/u/u.utc.ts` uses `date-fns/parseISO`, whose accepted inputs include local
  timestamps and permissive timezone parsing. A finite result alone is not publication validation.
- `src/m.upgrade/u.collect.ts` accepts finite nonnegative numbers without millisecond precision or
  range constraints; tiny positive ages can disappear when added to epoch-sized timestamps.
- The reported `@std/jsonc` upgrade from `1.0.2` to `1.0.3` was rejected by Deno's minimum-age
  policy. This establishes the reported failure, not the publication ages of every other upgrade.

## Design

```text
npm publishedAt + JSR createdAt
  → registry-aware fact validation and normalization
  → one registry-independent standdown decision per version and entry
  → eligible candidates + version facts
  → semver selection
  → entry-bound diagnostics and apply
```

### Publication evidence

Keep normalization at the existing workspace `Standdown` boundary. Read only npm `publishedAt` or
JSR `createdAt`, according to registry; do not fall back to the other registry's field. The internal
age evaluator receives normalized facts and policy inputs, not registry identity. Reuse the existing
`VersionFact`, eligibility union, and eligible-list derivation; add no public normalization API.

Accept a complete extended calendar timestamp with seconds, an optional decimal-second fraction, and
either `Z` or an explicit `±HH:MM` offset. Require uppercase `T`/`Z`, valid calendar fields, hours
`00–23`, minutes/seconds `00–59`, and offset hours/minutes within those same bounds. Reject
whitespace, trailing data, date-only/local-time forms, and non-string values. Validate syntax and
bounds before canonical `Time.utc` parsing, then require a finite timestamp. This is supported
publication syntax, not a universal provider guarantee or the CLI cutoff grammar. Do not change the
permissive general-purpose Time contract.

Preserve the validated source string in `VersionFact.publishedAt`; evaluate its canonical Time
millisecond value. Native fractional seconds remain accepted, but this is not a sub-millisecond or
Deno-parser equivalence claim. Missing, malformed, or future evidence cannot authorize a new version
under positive age policy.

### Numeric domain

Normalize policy options before collection. Require `minimumDependencyAge` to be a nonnegative safe
integer number of milliseconds, and `evaluatedAt` to be an integer in the native Date range from `0`
through `8_640_000_000_000_000` milliseconds. Reject fractions, negative/nonfinite values, and
unsupported bounds with explicit option errors. Preserve the CLI default of 48 hours and library
default of zero.

CLI duration conversion is defined by the exact base-10 input value, not by floating-point
multiplication followed by an integer check. Multiply decimal components by their integer unit sizes
and sum the total duration exactly before requiring a whole-millisecond result within the
safe-integer range and converting to `number`. Individual components may contain fractional
milliseconds when their total is integral. Keep this local to `MinimumDependencyAge`; add no general
duration framework and use no epsilon, truncation, or rounding to repair conversion residue.

Accept `PT1.001S` as `1001` milliseconds and `PT0.000005M0.0007S` as `1` millisecond. Reject
`PT1.0000000000000001S`: its exact total is not integral milliseconds even though a floating-point
conversion loses that distinction. Reject positive underflow rather than treating it as zero.
Library numeric options retain the strict integer domain; they do not recover decimal source text.

Keep CLI cutoff compatibility separate from publication validation. Preserve date-only cutoffs as
midnight UTC and existing unambiguous timestamp forms, including complete timestamps with `Z`,
`±HH:MM`, or `±HHMM`. Validate calendar/time/offset bounds and reject malformed suffixes before
normalizing a basic numeric offset for `Time.utc`. Do not impose publication-only format
restrictions wholesale or infer lowercase compatibility from the preliminary case-insensitive regex.

Exception order is part of the contract: validate options first; then preserve zero-age and visible
current-pin eligibility; then classify missing, malformed, or future evidence for a new version;
only then evaluate its deadline. Check `P + M` only when required. A computed deadline must be an
exactly representable integer within the native Date range; unsupported arithmetic rejects the
operation before writes. A current-only candidate with `M = Number.MAX_SAFE_INTEGER` must not fail
because an unused deadline would overflow. Do not round or saturate deadlines, classify arithmetic
errors as missing evidence, or silently change policy.

### Entry identity and selection

Use the manifest's existing identity relation—registry, name, and alias—for decision lookup and
projection in `u.apply.ts` and the formatter decision maps. A selected version belongs only to the
entry that authorized it. Preserve target files, aliases, subpaths, exclusions, and unrelated
package overrides. Fix the workspace association; do not change manifest deduplication or add a new
identity framework.

Preservation of generated outputs assumes distinct emitted keys in each target map after existing
target/subpath expansion. Deno imports use alias-or-name keys; package dependencies use package-name
keys. Entry-keyed decisions cannot make colliding output keys representable. Do not claim or add new
projection support for those configurations. Use representable outputs in the alias regression
cases.

Registry fetch caches and dependency graph nodes have package identity, not manifest-entry identity.
Do not make their keys alias-aware as a side effect. Preserve existing graph rejection when multiple
successful aliases cannot be represented by that graph.

Keep selector preflight in the CLI, after normal `Deps.from` deduplication. Use the policy's actual
matching relation: a token matches an entry's package name or non-empty alias. Shared tokens are not
inherently invalid; explicit include/exclude flags retain their existing set-matching semantics.
Refuse when the existing package-name encoding of CLI choices would change their meaning:

- Non-interactive without `--include`: generate no selection exclusions; pass explicit exclusions
  through unchanged. Do not impose a duplicate-name ban. Selector-free same-name cross-registry
  batches remain valid when their graph and output keys are representable.
- Non-interactive with `--include`: derive the intended included-entry set `I` and explicit
  excluded-entry set `X` from the canonical manifest. Generated exclusion tokens `G` are package
  names of entries outside `I`. Refuse if policy matching of `G` also excludes any entry in `I`
  outside `X`; otherwise the encoding preserves the requested selection. Derive this from all
  canonical entries, not only successful registry lookups, so a later metadata recovery cannot admit
  an unincluded dependency.
- Interactive: each prospective package-name checkbox value must match exactly its own canonical
  entry under that same name/alias relation. Refuse duplicate-name or name/alias cross-matches that
  make independent choices unsafe. Shared aliases alone are not checkbox collisions when they do not
  overlap package names; preserve explicit flag matching rather than banning them globally.

Perform required refusals before initial registry collection, planning, prompting, or writes, and
name the conflicting entries and token. One merged entry with multiple targets is not a conflict. Do
not move CLI refusal into collection, policy, or library apply, change public selector semantics, or
build a new picker/graph identity framework.

### Presentation

Remove the formatter's registry exemption. Render both registries under `Dependency standdown`,
using existing facts rather than another age calculation. Distinguish a known hold, unavailable
publication evidence, an eligible fallback, and a retained pin with no visible candidate.

Use `age eligible in` rather than `upgrade in`. Display a positive subsecond remainder as `<1s` and
round other remaining-time units upward; never render `0s` or `now` before the deadline. Apply this
rule to countdowns only, not the shared formatter for elapsed age or configured duration. Unknown
evidence has no countdown. A fallback may be planned while the newest version is held, so standdown
and planned counts may legitimately overlap.

No visible candidate means `pin retained; no visible candidate`, not `Already latest`, and must not
become an enabled upgrade choice. Count an entry as already latest only with matching
visible-version evidence. Keep labels, counts, and disabled states consistent. Update the relevant
internal presentation states/counts without adding another eligibility model.

Update npm-only comments in `src/m.upgrade/t.ts` and `src/m.cli/t.ts`, CLI help, and affected test
names. State both registries, supported input semantics, and the 48-hour default. Remove unverified
`Deno-compatible` claims; do not alter Deno's independent policy.

### Operation lifetime

| Surface              | Clock and metadata lifetime                                                        |
| -------------------- | ---------------------------------------------------------------------------------- |
| Interactive CLI      | One `evaluatedAt` and one metadata session across initial plan, replan, and apply. |
| Non-interactive CLI  | One `evaluatedAt`; separate public calls create separate metadata sessions.        |
| Direct library calls | Each call creates a session; omitted `evaluatedAt` is resolved independently.      |

Apply replans. Session caches hold metadata promises; they are not immutable registry snapshots.
Preserve these lifetimes rather than introducing result-object reuse. For unchanged metadata and
policy inputs, wall-clock advancement alone must not change age decisions or countdowns within one
CLI operation. Changed metadata is a separate input and can legitimately change the next planning
pass. Neither preview/apply identity nor concurrent-manifest-change protection is promised.

## Invariants and compatibility

For each manifest entry, let `A` be versions remaining after registry/prerelease filters, `C` its
current version, `E` the evaluation instant, `M` the validated minimum age, and `P` a validated,
normalized publication instant.

- For `M > 0`, a new version in `A` is age-eligible exactly when `P ≤ E` and `P + M ≤ E` within the
  supported numeric domain. Equality is eligible. Too-young versions remain visible but absent from
  `eligible`; missing, invalid, non-string, or future evidence yields `unknown-published-at`.
- `C` may remain age-eligible when present in `A`, even with unknown or recent publication evidence.
  When absent, do not manufacture a registry version. Without an authorized upgrade, retain that
  manifest entry's existing pin; another alias's decision cannot upgrade or downgrade it.
- `M = 0` bypasses age restrictions only. Semver modes, registry filters, prerelease filtering, and
  exclusions still apply. Invalid options are errors, not zero-age compatibility.
- Preserve `latest`/`available` as visibility facts and `eligible` as selection input. Selection
  must choose a newer eligible version authorized for that entry. CLI include selection, disabled
  prompt responses, and semver overrides must not bypass this restriction.
- Retention does not repair an already-written bad pin. A no-upgrade apply may still perform the
  existing canonical file projection; pin preservation is not a byte-identical no-write guarantee.
- Eligibility and retention prove neither successful resolution/installation, vulnerability
  clearance, nor transitive-age compliance. Deno's independent resolver policy remains
  authoritative.

## Required proof

Use fixed time and native fixture metadata, with one shared npm/JSR policy matrix at the narrowest
practical owner. Keep integration tests as thin capstones; do not duplicate the matrix at every
layer.

1. Extend `versionsJsr`'s fixture type to admit `createdAt` before demonstrating red. Replace the
   exemption assertion with a recent-JSR case that expects `standdown`, its normalized publication
   fact, and absence from `eligible`. Show the intended behavioral failure before production
   changes; fixture/type errors and accidental `unknown-published-at` are not that proof.
2. Cover mature, too-young, exact-cutoff, and one-millisecond-either-side cases; missing, invalid,
   non-string, and future timestamps; equivalent explicit offsets; native fractional seconds;
   date-only/local-time strings; malformed suffixes and offsets; and calendar/time bounds. Include a
   young native field beside a mature wrong-registry field. Assert facts and eligibility kinds, not
   rejection alone.
3. Cover option validation and exact decimal conversion: zero/defaults, `PT1.001S` as `1001`,
   fractional components totaling whole milliseconds, precision-losing non-integral inputs, positive
   underflow, negatives, nonfinite library values, and supported limits. Cross deadline overflow
   with current-pin, zero-age, unknown/future evidence, and ordinary new-version cases to prove
   exception ordering. Distinguish option and arithmetic errors; errors must precede writes. Assert
   equivalent CLI cutoffs using `Z`, `+01:00`, and `+0100`, with appropriate clock values, alongside
   date-only UTC behavior and malformed-offset rejection.
4. Through collection and planning, prove native metadata yields correct `VersionFact` values,
   latest visibility, mature fallback selection, and no-upgrade retention. Cover current versions
   present/absent from registry evidence and recent/unknown current timestamps. Give positive-age
   success fixtures explicit mature timestamps; keep unknown-evidence fixtures explicit.
5. Through temporary-workspace library apply, test two Deno import aliases of the same npm package:
   `older` at `1.0.0` and `retained` at `3.0.0`, with mature `2.0.0` and recent `3.0.0`. Only
   `older` may move to `2.0.0`. Add an excluded-sibling case and reverse entry order to expose map
   overwrites. Assert returned entries, deps YAML, generated imports, and entry-specific formatter
   decisions. Preserve existing duplicate-node refusal when both aliases would be successful graph
   nodes.
6. Through `runInteractiveWith` and `runWith`, prove options survive selection/replanning/apply and
   a disabled prompt response, include filter, or semver override cannot authorize a held version.
   Cover both registries and a mixed-registry apply. Exercise package `a` aliased as `b` beside
   package `b` aliased as `c`: interactive selection and non-interactive `--include a` must refuse
   before registry/planner/prompt/apply callbacks rather than silently excluding the chosen entry.
   Cover duplicate checkbox names and shared aliases separately, including explicit multi-match
   flags whose meaning can be preserved. Accept selector-free same-name cross-registry batches with
   distinct Deno output aliases, and one merged entry with multiple targets. Keep library alias
   projection proof separate from CLI selector refusal.
7. Assert rendered text after canonical ANSI stripping: positive subsecond countdowns and unit
   boundaries, unknown evidence without a countdown, eligible fallback plus held latest, and an
   empty visible set with a retained pin. Check label/count/disabled-state agreement. Do not label
   filtered or missing evidence as an established latest version.
8. Prove fixed-`E` behavior across a wall-clock boundary, preserve interactive session-fetch reuse,
   and exercise a non-interactive metadata change between passes. Include an unincluded dependency
   whose registry lookup fails in planning and succeeds during apply; it must remain excluded.
   Assert each pass is correct for its facts and entry selection, not snapshot or object identity.
   Exercise the actual clock read by `Time.now`, which constructs `new Date()`; replacing only
   `Date.now` does not control it. Preserve npm-specific filtering.

Place new non-interactive standdown capstones in `src/m.cli/-test/-u.standdown.run.test.ts`, using
`runWith` and strict injected registry fixtures. This isolates upgrade runtime proof from the
Git-mutating bump fixtures in `-m.run.test.ts`; do not move or repair unrelated tests. The existing
`-scripts/task.cli.fixture.ts` references absent `withVersions`/`withInfo` helpers. Do not use
`test:cli` as required proof or repair that harness.

## Verification execution

Verify the current dependency baseline before implementation. Prior reported passes are contextual
evidence, not fresh proof or full-module coverage. If resolution is blocked, stop and report it
without changing security policy or dependency pins. Read owning tasks and permissions before use.

From `code/sys/workspace`, establish the baseline with these checks and rerun them after changes:

```sh
deno task test --frozen --trace-leaks ./src/m.upgrade
deno task test --frozen --trace-leaks ./src/m.cli/-test/-u.args.test.ts ./src/m.cli/-test/-u.fmt.test.ts ./src/m.cli/-test/-u.interactive.test.ts
deno task check --frozen
```

After adding the isolated non-interactive capstones, run them explicitly and require observed cases,
not an empty test selection:

```sh
deno task test --frozen --trace-leaks ./src/m.cli/-test/-u.standdown.run.test.ts
```

Broader regression commands, after the scoped passes:

```sh
deno task test --frozen --trace-leaks ./src/m.cli
deno task test --frozen
```

Inspect broader fixtures before execution. Git-mutating fixture operations require explicit human
authorization even in disposable repositories; without it, report the coverage gap and leave those
runs to an authorized human. Do not weaken execution controls or count omitted suites as passing.
Record the intended red failure and actual green results during implementation. Report unrelated
pre-existing failures separately.

### Implementation verification

- Fresh baseline: upgrade tests passed 4 suites / 30 steps; scoped CLI args, formatter, and
  interactive tests passed 3 suites / 23 steps; `deno task check --frozen` passed.
- Observed red before production changes: the recent-JSR collection regression expected a hold from
  native `createdAt`, but the existing exemption returned eligibility. The fixture type was extended
  before that run; this was a behavioral failure, not a type failure.
- Final scoped green: 10 suites / 143 steps, including the shared evidence matrix, alias apply, and
  CLI orchestration capstones. From `code/sys/workspace`:

  ```sh
  deno task test --frozen --trace-leaks --reporter=dot ./src/m.upgrade ./src/m.cli/-test/-u.args.test.ts ./src/m.cli/-test/-u.fmt.test.ts ./src/m.cli/-test/-u.interactive.test.ts ./src/m.cli/-test/-u.standdown.run.test.ts
  deno task check --frozen
  ```

- Typecheck passed. Repository-configured `deno fmt --check` and `deno lint` passed across
  `src/m.cli` and `src/m.upgrade` (43 files); `git diff --check` passed.
- Broader CLI/module runtime suites remain unrun because they include Git-mutating fixtures. No
  permission/security policy was weakened, dependency recovery regenerated, or Git mutation
  performed. These results are scoped proof, not resolver, installation, or provider guarantees.
- Blind implementation review identified missing mature native evidence in the legacy
  non-interactive apply/dry-run success fixtures in `src/m.cli/-test/-m.run.test.ts`. Source
  inspection confirmed the finding. Both fixtures now supply `createdAt`; the dry-run additionally
  requires two planned upgrades. Missing-evidence regressions remain separate; production
  eligibility is unchanged.
- The corrected legacy file typechecked and passed formatting/lint checks. An attempted test-name
  filter selected zero tests (the BDD suite is the top-level test), so it supplies no runtime proof.
  Execution of that containing suite still requires authorization for its disposable-repository Git
  mutations. The scoped 10-suite result above does not cover these two legacy cases.

## Decisions and limits

- Registry clients expose facts; workspace owns age policy. Do not add a new package, generic
  registry framework, second policy owner, or default change.
- Supported registry metadata assumes canonical version keys that remain unique under existing
  version normalization. Arbitrary noncanonical-key collision handling is deferred; do not claim
  such payloads are supported. If concrete provider evidence contradicts this assumption, stop and
  revise the bounded contract rather than silently choosing one timestamp.
- The existing version-fact/eligibility model is sufficient; DRY means one algorithm, not identical
  registry payloads, object reuse, or identical registry filtering. Internal presentation states may
  distinguish retained pins from established currency.
- Finish with a residue pass across touched source, fixtures, tests, comments, help, and this plan:
  remove npm-only age guards/labels, exemption expectations, unsupported resolver-equivalence
  claims, premature countdowns, false latest claims, and package-keyed entry-decision lookups.
  Preserve deliberate package-keyed caches/graphs and registry-specific dist-tag/deprecation
  behavior.

Recovery changes to `deps.yaml`, generated imports/package files, the lockfile, and template outputs
are a separate work unit. Preserve them and unrelated edits; do not re-upgrade, restore, regenerate,
stage, or commit them as part of this fix. The human retains ownership of `deno task prep` for
recovery.

Explicit non-goals: full resolver preflight, transactional writes/rollback, transitive age modeling,
JSR yank/advisory policy, independently addressable multi-alias CLI/graph support, new package.json
alias projection or repairs for pre-existing emitted-key collisions, `@sys/tools` self-upgrade
redesign, cache manipulation, package publication, and any weakening of Deno or agent security
policy. Acceptance tests and review remain proof within the single implementation item, not extra
arc items or gates. Release actions remain separately authorized.

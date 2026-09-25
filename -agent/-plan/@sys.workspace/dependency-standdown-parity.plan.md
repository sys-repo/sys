@sys.workspace
dependency-standdown-parity.plan.md
- [ ] fix(workspace): unify npm and JSR dependency standdown

## Outcome

The same publication age and workspace options must produce the same upgrade eligibility for npm and
JSR. A recent JSR release must remain visible without being offered as an eligible upgrade. Keep one
workspace policy, one derived result, and consistent selection, diagnostics, and apply.

This plan defines one bounded implementation commit. It does not authorize implementation, Git
mutation, dependency upgrades, publication, or changes to the human-owned recovery state.

## Evidence and ownership

Implementation ownership is `code/sys/workspace`; `src/` and `-scripts/` paths are relative to that
package. Paths starting with `code/` are repository-relative.

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
- The reported `@std/jsonc` upgrade from `1.0.2` to `1.0.3` was rejected by Deno's minimum-age
  policy. This establishes the reported failure, not the publication ages of every other upgrade.

## Design

```text
npm publishedAt + JSR createdAt
  → registry-aware fact extraction
  → one registry-independent standdown decision
  → eligible candidates + version facts
  → semver selection, picker/diagnostics, and apply
```

1. Keep normalization at the existing workspace `Standdown` boundary. Select the timestamp field by
   registry, validate through canonical helpers, and project the existing `VersionFact` shape. Do
   not guess between fields with an indiscriminate fallback or change published registry APIs.
2. Narrow the internal age evaluator to normalized facts and policy inputs; it must not receive or
   branch on registry identity. Reuse the existing eligibility union and eligible-list derivation.
3. Remove the formatter's registry exemption. Rendering, disabled choices, counts, and countdowns
   consume the derived result; they must not independently decide publication-age eligibility.
4. Use `Dependency standdown` for both registries. Distinguish known waiting time from unavailable
   publication evidence; unknown evidence must not receive an invented countdown.
5. Update npm-only comments in `src/m.upgrade/t.ts` and `src/m.cli/t.ts`, and make CLI help explicit
   about both registries and the 48-hour default. Change only documentation of this contract.
6. Preserve existing session reuse and CLI option propagation. Interactive semver-policy overrides,
   include selection, and non-interactive apply must not turn ineligible versions into candidates.

No new package, generic registry framework, exported normalization API, or second policy owner is
needed. Registry-specific dist-tag/deprecation behavior remains distinct from shared age policy.

## Invariants and compatibility

- With a positive minimum age, a new version is eligible exactly when its valid publication instant
  plus the configured age is at or before the operation's `evaluatedAt` timestamp.
- For new candidates under positive age policy, too-young versions stay visible but are absent from
  `eligible`. Missing, invalid, non-string, or future timestamps produce `unknown-published-at` and
  cannot authorize an upgrade.
- Preserve current-pin retention for both registries, even when its publication time is unknown or
  recent. Retention does not invent a missing registry version, approve a newer pin, or prove Deno
  resolution. This change does not repair an already-written bad pin.
- Preserve the existing CLI default of 48 hours and library default of zero, including explicit-zero
  compatibility in deterministic policy fixtures. Do not change defaults or disable Deno's security
  policy to execute verification or recovery.
- Preserve one `evaluatedAt` across a CLI operation. Use that same instant for decisions and
  display; rendering must not reevaluate age against a later wall clock.
- Preserve `latest`/`available` as visibility facts and `eligible` as selection input. A mature
  fallback can be selected while the newest release remains in standdown. When no eligible upgrade
  exists, retain the current pin.
- Existing semver modes, prerelease filtering, exclusions, and manifest projection remain intact.
- Workspace eligibility is not Deno resolver proof, vulnerability clearance, or a claim about every
  transitive dependency. Deno's independent policy remains authoritative when Deno resolves
  packages.

## Required proof

Use fixed time and fixture metadata, with one shared npm/JSR case matrix at the narrowest practical
owner. Supply native field names per registry; do not fabricate derived eligibility to prove policy.

1. Red before green: replace the JSR-exemption assertion with a recent-JSR rejection test. Show that
   current code incorrectly selects it before changing production behavior.
2. Cover mature, too-young, exact-cutoff, and one-millisecond-either-side cases; missing, invalid,
   non-string, and future timestamps; retained current pins; and existing zero-age compatibility.
   Cover real JSR fractional-second timestamp syntax using canonical Time semantics, without
   claiming sub-millisecond equivalence to Deno. Registry-inappropriate timestamp fields must not
   authorize.
3. Extend the JSR fixture's metadata contract to admit the existing registry `createdAt` field. Give
   success fixtures explicit mature timestamps where standdown is enabled; do not globally invent
   timestamps or disable policy to keep tests green. Keep unknown-evidence fixtures explicit.
4. Through collection and planning, prove native metadata becomes the correct `VersionFact`, the
   latest remains visible, the eligible fallback is selected, and no fallback means no upgrade.
5. Through the existing injected CLI seams, prove both registries get truthful diagnostics and
   disabled rows. A prompt seam returning a disabled name, `--include`, or a semver override must
   not authorize a held-back version. Assert rendered text after canonical ANSI stripping.
6. Through temporary-workspace apply, prove only eligible upgrades reach dependency files. When no
   eligible upgrade exists, existing version pins must be preserved. Exercise interactive and
   non-interactive composition as thin capstones rather than duplicating the entire policy matrix at
   every layer.
7. Preserve npm behavior and session-fetch reuse. Finish with a residue scan for npm-only policy
   guards, labels, contract comments, and tests that still encode the exemption.

The existing `-scripts/task.cli.fixture.ts` references absent `withVersions`/`withInfo` helpers. Do
not use `test:cli` as required proof or silently repair that unrelated harness. Current
`runInteractiveWith`/`runWith` tests provide deterministic CLI runtime coverage without live
registry lookups or touching the repository's dependency files.

## Verification execution

After the human-owned dependency recovery, verify the current baseline; earlier successful tests
were run before the later manual rollback and are not proof of this baseline. If resolution remains
blocked, stop and report it without changing security policy or dependency pins.

From `code/sys/workspace`, use declared tasks, narrow first:

```sh
deno task test --frozen --trace-leaks ./src/m.upgrade
deno task test --frozen --trace-leaks ./src/m.cli
deno task check --frozen
deno task test --frozen
```

Record the intended red failure and green results during implementation. A pre-existing failure is
reported with its scope; it is neither silently repaired nor counted as proof. No tests or runtime
verification are claimed by creation of this plan.

## Review decisions and limits

Inline TMIND review with DMIND and S-tier criteria established these constraints:

- Deleting only the JSR guard is insufficient: timestamp extraction and presentation also need
  parity.
- The existing result model is sufficient; DRY means one decision, not identical registry payloads.
- Fixtures must exercise normalization and downstream behavior, not certify hand-authored outcomes.
- Registry-client policy migration, default changes, and unrelated CLI-harness repairs add risk
  without being necessary to close this defect.
- Human-facing language must communicate a hold or missing evidence, not imply that a selected
  version is installed, Deno-verified, or safe from compromise.

Recovery changes to `deps.yaml`, generated imports/package files, the lockfile, and template outputs
are a separate work unit. Preserve them and unrelated edits; do not re-upgrade, restore, regenerate,
stage, or commit them as part of this fix. The human retains ownership of `deno task prep` for
recovery.

Explicit non-goals: full resolver preflight, transactional writes/rollback, transitive age modeling,
JSR yank/advisory policy, `@sys/tools` self-upgrade redesign, cache manipulation, package
publication, and any weakening of Deno or agent security policy. No prerequisite plan or external
gate is needed for this local parity change; later release decisions remain separately authorized.

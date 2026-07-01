# @sys/tools self-upgrade resolver-policy plan

## Commit list

- [x] `98adc302a fix(workspace): add deno package resolution facts`
- [x] `b6f7112d5 fix(tools): verify self-upgrade resolver state`
- [x] `2be095756 fix(tools): suppress upgrade CTA for pending resolver policy`
- [x] `135d024c1 fix(std): remove ramda runtime from R facade`
- [x] `ec80234b2 fix(workspace): decouple package resolver from graph schema`
- [x] `9bf737084 fix(tools): keep upgrade startup dependency-light`
- [x] `b722cd743 fix(tools): clarify upgrade standdown output`

## Completion status

Done.

The resolver-policy fix is complete. The implementation separates published latest from the version Deno will
currently allow, verifies post-refresh resolver state before claiming success, and prevents root startup from
showing an immediate upgrade CTA for a version that Deno policy does not currently allow.

The follow-up hardening commits are part of the completed fix because local startup exposed broader runtime
coupling: `@sys/tools` root/upgrade paths were importing brittle npm/materialized dependency surfaces while only
trying to render startup/help/advisory state. Those hot paths are now dependency-light, and the user-facing
standdown output no longer leaks internal resolver vocabulary.

## Position

This plan is complete. The original design position was:

The failure is not an alias problem and not a cache-deletion problem. The failure is that
`@sys/tools upgrade` treats **published latest** as **actionable latest**. Deno's resolver can reject
or defer a newer JSR/npm version under active policy, especially minimum dependency age. The upgrade
flow must report the resolver truth, not the registry headline.

The implementation should be small-to-medium and split by boundary:

- shared resolver code asks Deno what is actionable;
- `@sys/tools upgrade` acts on that fact and verifies post-refresh state;
- root advisory only shows immediate upgrade CTAs for actionable upgrades.

Do not weaken, bypass, or special-case Deno safety policy.

## Hard constraints

- Do not change the global `sys` alias.
- Do not disable or bypass minimum dependency age.
- Do not delete Deno cache as an upgrade strategy.
- Do not implement bespoke `deno info --json` parsing inside `@sys/tools`.
- Do not infer standdown duration unless the data is trustworthy.
- Do not rework the whole `@sys/workspace` upgrade planner in this pass.

## Terms

Internal model terms:

- **local**: version of the currently executing `@sys/tools` package.
- **published latest**: newest version reported by JSR registry metadata.
- **Deno-allowed version**: version Deno actually resolves under current config/lock/policy.
- **pending/standdown**: published latest is newer than the Deno-allowed version and newer than local.
- **upgrade available**: Deno-allowed version is newer than local.

User-facing output must not expose internal terms such as `actionable`, `resolver policy`, or `Deno currently
resolves`. Use simple status language: `running`, `latest`, `upgrade`, `held at`, and `standing down`.

Never use “latest” in UI as a synonym for “can upgrade now.”

## Final reality recorded

- Deno resolver policy is the authority for what can be upgraded now.
- JSR registry latest is not necessarily the version Deno will currently allow.
- `@sys/tools upgrade` no longer claims success unless Deno resolves the expected target after refresh.
- `@sys/tools upgrade` stands down when latest is newer than local but Deno is still holding the usable version.
- `running === latest` wins: a local/source run at the latest version is reported as up to date, even if a bare
  remote JSR launch is still held at an older version.
- Root advisory records are V2 and preserve local/published/actionable/status facts internally.
- Root startup only shows the immediate `sys upgrade --latest` CTA for verified upgrade-available records.
- Pending/standdown and resolver-unavailable advisory states fail quiet at startup.
- Old remote-only advisory records fail quiet instead of producing stale CTAs.
- `@sys/std` no longer imports the Ramda runtime for the legacy `R` facade.
- `@sys/workspace/resolve` no longer imports graph schema/typebox to read package-resolution facts.
- `@sys/tools` root/help/advisory paths are dependency-light and do not load resolver/workspace/yaml/schema stacks
  unless an upgrade check is actually running.
- User-facing upgrade output uses simple status language and does not expose internal resolver vocabulary.
- The global `sys` alias was not changed.
- Deno minimum dependency age was not bypassed or disabled.
- Deno cache deletion was not used as an upgrade strategy.

Final user-facing current-state output:

```txt
@sys/tools is up to date

  running  0.0.460
  latest   0.0.460 ✔

No upgrade needed.
```

Final user-facing standdown shape:

```txt
@sys/tools upgrade standing down

  running  0.0.450
  latest   0.0.460
  held at  0.0.450

No upgrade was run.
Deno is not allowing this upgrade yet.
```

Validation performed during the final slices included:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task check

cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno check src/m.resolve/common.ts src/m.resolve/u.package.ts src/m.resolve/mod.ts

cd /Users/phil/code/org.sys/sys/code/sys.tools
deno check src/cli.upgrade/-test/-.test.ts src/cli.upgrade/u.advisory.ts src/cli.upgrade/u.cmd.runUpgrade.ts src/cli.upgrade/u.fmt.ts src/cli.upgrade/u.versionInfo.ts
SYS_TOOLS_NO_UPGRADE_CHECK=1 deno run -A ./src/mod.ts up --help
SYS_TOOLS_NO_UPGRADE_CHECK=1 deno run -A ./src/mod.ts up --latest
```

Known local-environment note: some broader test runs were blocked by local npm materialization faults under
`node_modules/.deno` (for example `entities@7.0.1`). The source fixes above intentionally avoid cache deletion or
policy bypasses and reduce hot-path exposure to those brittle surfaces.

## Original observed failure

From Accounting cwd with no local Deno config/lock found:

- `deno cache --reload jsr:@sys/tools` resolves `@sys/tools` to `0.0.457`.
- `deno cache --reload jsr:@sys/tools@0.0.460` fails because Deno minimum dependency age blocks the
  requested version.
- Therefore, JSR packages are affected by Deno minimum dependency age in this environment.
- Current `@sys/tools upgrade` prints success based on registry latest without verifying Deno's
  resolved version.

The false output is the bug:

```txt
Upgraded @sys/tools to latest 0.0.460 ✔
```

when Deno still resolves:

```txt
@sys/tools@0.0.457
```

## Implementation cut

### Phase 1: shared Deno package-resolution fact

Add or extract one shared helper that invokes Deno and returns normalized package resolution facts.

This can initially live in `@sys/workspace` if that is the nearest owner of Deno CLI graph/probe
logic, but it must be shaped so it can later move lower without changing `@sys/tools` semantics.

Candidate API shape:

```ts
type PackageResolutionRequest = {
  readonly cwd: t.StringDir;
  readonly specifier: string; // e.g. "jsr:@sys/tools"
  readonly reload?: boolean;
};

type PackageResolutionFact = {
  readonly specifier: string;
  readonly package: string;
  readonly registry: 'jsr' | 'npm';
  readonly resolved?: t.StringSemver;
  readonly ok: boolean;
  readonly reason?: PackageResolutionReason;
};

type PackageResolutionReason =
  | { readonly code: 'policy:minimum-dependency-age'; readonly message?: string }
  | { readonly code: 'config-or-lock'; readonly message?: string }
  | { readonly code: 'registry'; readonly message?: string }
  | { readonly code: 'unknown'; readonly message?: string };
```

Important:

- Deno is the authority for `resolved`.
- The helper may inspect Deno diagnostics to classify obvious causes, but classification is secondary.
- If classification is uncertain, return `unknown`; do not invent certainty.
- Keep raw `deno info --json` out of public API.

Acceptance:

- Can ask for `jsr:@sys/tools` from a cwd.
- Can run with reload semantics when upgrade needs a fresh resolver answer.
- Returns the version Deno actually chose, or a typed failure.
- Has tests over representative Deno output/diagnostics.

### Phase 2: `@sys/tools upgrade` uses resolver truth

Replace this assumption:

```txt
deno cache --reload jsr:@sys/tools succeeded => upgraded to published latest
```

with:

```txt
published latest + actionable latest + post-refresh verification => typed outcome
```

Outcome model:

```ts
type SelfUpgradeOutcome =
  | { readonly kind: 'already-current'; readonly local: string; readonly actionable: string }
  | { readonly kind: 'upgraded'; readonly from: string; readonly to: string }
  | {
      readonly kind: 'pending';
      readonly local: string;
      readonly actionable: string;
      readonly published: string;
      readonly reason?: PackageResolutionReason;
    }
  | { readonly kind: 'failed'; readonly message: string };
```

Behavior:

- If `actionable latest > local`, offer/run upgrade to actionable latest.
- After refresh, re-probe Deno resolution.
- Print success only if post-refresh actionable version is the target.
- If `published latest > actionable latest`, report pending; do not offer an immediate upgrade to
  published latest.
- If Deno gives an uncertain older resolution, report blocked/unknown honestly.

Acceptance:

- `sys upgrade --latest` does not offer `upgrade now to 0.0.460` while Deno resolves `0.0.457`.
- It never prints success for `0.0.460` unless Deno actually resolves `0.0.460`.
- Direct command exits with a truthful pending/blocked outcome rather than false success.

### Phase 3: root advisory state and formatting

The current advisory record persists only `remote`. That is under-specified and causes the false CTA.

Replace or version the advisory record so it can distinguish:

- published latest;
- actionable latest;
- status.

Candidate record:

```ts
type UpgradeAdvisoryRecordV2 = {
  readonly schemaVersion: 2;
  readonly ok: true;
  readonly checkedAt: t.UnixTimestamp;
  readonly package: t.StringPkgName;
  readonly local: t.StringSemver;
  readonly published: t.StringSemver;
  readonly actionable: t.StringSemver;
  readonly status: 'none' | 'upgrade-available' | 'pending';
  readonly reason?: PackageResolutionReason;
};
```

Formatting rules:

- `upgrade-available`: may show immediate CTA.
- `pending`: passive notice only, or omit.
- `none`: no notice.
- `failed`: no startup noise unless explicitly debugging.

Allowed pending copy:

```txt
@sys/tools update pending                         0.0.460 blocked by Deno policy
```

Allowed only when actionable:

```txt
Run sys upgrade --latest                          next available 0.0.461
```

Forbidden when pending:

```txt
Run sys upgrade --latest                          next available 0.0.460
```

Acceptance:

- Root menu does not show an immediate upgrade CTA for a non-actionable published version.
- Existing malformed/old advisory records fail quiet or degrade safely.

## Workspace upgrade alignment

There is a wider `@sys/workspace` concern: current standdown logic appears npm-only, while Deno's
minimum dependency age can affect JSR resolution too.

Do not solve the entire workspace upgrade planner in this pass unless the shared helper requires a
small public seam. Capture the follow-up separately:

- workspace upgrade should eventually model published vs actionable for both JSR and npm;
- JSR standdown duration should only be shown when trustworthy publish-time data exists;
- Deno resolver facts should be used where registry metadata is insufficient.

## Testing plan

Minimum tests for this pass:

- shared resolver normalizes resolved `jsr:@sys/tools` version from representative Deno output;
- shared resolver classifies minimum-dependency-age diagnostics when present;
- `@sys/tools upgrade` pending case: published newer, actionable equals local;
- `@sys/tools upgrade` success case: actionable newer and post-refresh verifies target;
- `@sys/tools upgrade` no false success when refresh succeeds but resolution remains old;
- root advisory pending case does not render immediate CTA;
- old advisory records fail quiet/degrade safely.

Run, at minimum:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.tools
deno task check
deno test -P=test --trace-leaks ./src/cli.upgrade ./src/u.root
```

If shared workspace package code changes:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task check
deno test -P=test --trace-leaks ./src/m.graph ./src/m.upgrade
```

Then from repo root if surfaces changed:

```sh
cd /Users/phil/code/org.sys/sys
deno task check
```

## Actual commits

```txt
98adc302a fix(workspace): add deno package resolution facts
b6f7112d5 fix(tools): verify self-upgrade resolver state
2be095756 fix(tools): suppress upgrade CTA for pending resolver policy
```

Interleaved unrelated commit observed in history:

```txt
731eba135 style(workspace): simplify npm standdown table labels
```

## Commit messages

Already-completed cache-discoverable root import fix:

```txt
fix(tools): make root tool imports cache-discoverable
```

Preferred split for this resolver-policy work:

```txt
fix(workspace): add deno package resolution facts
fix(tools): verify self-upgrade resolver state
fix(tools): suppress upgrade CTA for pending resolver policy
```

If this lands as one commit:

```txt
fix(tools): make self-upgrade honor deno resolver policy
```

## Size and sequencing

This is not a tiny one-line fix. It is also not a broad rewrite.

Recommended sequencing:

1. shared resolver fact;
2. `@sys/tools upgrade` outcome behavior;
3. root advisory v2 formatting/state;
4. workspace upgrade planner follow-up, only if still needed.

Stop if the implementation begins to:

- duplicate Deno JSON parsing in more than one package;
- require broad workspace planner rewrites before fixing `@sys/tools` truthfulness;
- introduce alias/config/cache-deletion behavior;
- claim exact standdown durations without reliable data;
- weaken Deno resolver policy.

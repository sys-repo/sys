# @sys/tools self-upgrade resolver policy plan

Final fix commit arc:

- [x] `107684d70` `fix(tools): expire self-upgrade advisory after resolver adoption`
- [x] `8692b719e` `fix(tools): surface self-upgrade resolver policy standdown`

Plan-retire commit message:

```text
plan(retire): self-upgrade resolver policy
```

Final state: complete. The self-upgrade path now treats Deno resolver facts as authoritative,
expires adopted cached upgrade advisories, and surfaces resolver-policy standdown instead of
presenting a false actionable upgrade.

## Context

`sys` currently runs published `@sys/tools@0.0.460` while JSR latest is `0.0.461`. Deno 2.9.1
refuses the explicit latest version under active `--minimum-dependency-age` policy:

```text
Could not find version of '@sys/tools' that matches specified version constraint '0.0.461'

A newer matching version was found, but it was not used because it was newer than the specified minimum dependency date of 2026-07-01 03:37:07.959758 UTC
```

Current local source at `@sys/tools@0.0.461` already contains resolver-fact checks and post-refresh
verification. The observed lie is produced by stale published `0.0.460`, whose upgrade flow equates
`deno cache --reload jsr:@sys/tools` success with actual CLI adoption.

## BMIND: what the hardenings really fixed

Defensible hardenings:

- `fix(workspace): add deno package resolution facts`
  - Real bone: introduced an owned Deno resolver boundary using `deno info --json` so tools can ask
    "what version will Deno actually run?" instead of guessing from registry latest.
  - This is directly related.

- `fix(workspace): decouple package resolver from graph schema`
  - Real bone: kept the resolver smaller and less coupled to broader graph collection.
  - Related structurally, not specifically to the self-upgrade symptom.

- `fix(tools): verify self-upgrade resolver state`
  - Real bone: stopped treating cache refresh as success unless a follow-up resolver check reaches
    the target.
  - This is the core fix for the false-success class.

- `fix(tools): suppress upgrade CTA for pending resolver policy`
  - Real bone: made the root advisory distinguish published latest from Deno-actionable latest.
  - Directly related to the repeated banner/CTA class.

- `fix(tools): clarify upgrade standdown output`
  - Real bone: made operator output say standing down/check unavailable rather than implying a
    usable upgrade.
  - Related to truthfulness and UX, not the mechanism itself.

- `fix(upgrade): report resolver-unavailable verification truthfully`
  - Real bone: tightened failure wording for resolver unavailable states.
  - Helpful, but narrow.

Not solved by those hardenings:

- A user who is still running `0.0.460` cannot benefit from fixes first published in `0.0.461` while
  Deno policy also blocks `0.0.461`.
- The old version cannot retroactively learn the new verification behavior.
- The upgrade command itself depends on the stale code path until the new release is
  Deno-actionable.

## DMIND: principled shape

The correct subject is not "latest published". It is:

> the version Deno will actually resolve and execute under the active local policy.

A principled self-upgrade flow should make three states explicit:

1. `up-to-date`: running version equals Deno-actionable version and published latest is not newer.
2. `standing-down`: published latest is newer, but Deno policy currently resolves the running/held
   version.
3. `upgrade-applied`: after refresh, Deno resolver adoption equals the intended target.

Success copy must only be emitted for state 3.

## TMIND review

Risks in a naive fix:

- Bypassing minimum dependency age would weaken a provenance/supply-chain gate. Do not do this.
- Pinning `jsr:@sys/tools@latest` or explicit `@0.0.461` still fails under policy and worsens UX.
- Clearing global caches is not a fix; it changes substrate state and still respects policy.
- Printing only registry latest recreates the same false-actionable confusion.
- Background advisory must remain fail-quiet, but not fail-false-positive.

The existing `0.0.461` implementation appears directionally correct. The remaining problem is
bootstrapping stale published behavior.

## Plan

1. [x] Treat `0.0.460` as the bad transitional release.
2. [x] Do not bypass Deno minimum-dependency-age policy.
3. [x] Expire stale `upgrade-available` advisories once their actionable version is no longer newer
       than the running package.
4. [x] Probe the explicit published latest version during resolver-policy standdown so the CLI and
       advisory cache can preserve the policy reason.
5. [x] Keep root advisory CTA suppressed for `pending` resolver-policy states.
6. [x] Split upgrade tests by concept: API smoke, resolver facts, command flow, and advisory state.
7. [x] Verify the final state with targeted tests, type-checking, and formatting.

## Acceptance

- No success message is printed unless the active resolver reports the target version.
- Root advisory appears only when cached actionable version is newer than running version.
- Pending latest under Deno policy is presented as standdown, not as an upgrade prompt.

## Implementation notes

- `fix(tools): expire self-upgrade advisory after resolver adoption` now ignores cached
  `upgrade-available` advisory records whose actionable version is no longer greater than the
  running package version.
- `fix(tools): surface self-upgrade resolver policy standdown` now probes the explicit published
  latest version during standdown, preserves resolver-policy reasons in advisory records, and
  surfaces minimum-dependency-age as the standdown reason in upgrade output.
- Proof:
  `cd /Users/phil/code/org.sys/sys/code/sys.tools && deno test -P=test --trace-leaks ./src/cli.upgrade`.
- Proof: `cd /Users/phil/code/org.sys/sys/code/sys.tools && deno task check`.
- Test coverage was split out of the old misc `src/cli.upgrade/-test/-.test.ts` bucket into focused
  resolver and command-flow files.
- Proof:
  `cd /Users/phil/code/org.sys/sys && deno fmt --check ./code/sys.tools/src/cli.upgrade/-test/-u.versionInfo.test.ts ./code/sys.tools/src/cli.upgrade/-test/-u.cmd.runUpgrade.test.ts ./code/sys.tools/src/cli.upgrade/-test/-u.advisory.test.ts ./code/sys.tools/src/cli.upgrade/u.versionInfo.ts ./code/sys.tools/src/cli.upgrade/u.fmt.ts ./code/sys.tools/src/cli.upgrade/u.advisory.ts ./code/sys.tools/src/cli.upgrade/t.namespace.ts ./-agent/-plan/@sys.tools/self-upgrade-resolver-policy.plan.md`.

## Post-write assessment

DMIND: the implementation is clean because it keeps the object of truth at the resolver boundary,
not the registry boundary or cache-command boundary.

TMIND: code closure is reached at `8692b719e`. Operational closure still depends on the user's
active Deno policy admitting the published version, but the CLI no longer treats registry latest or
cache-command success as resolver adoption.

This plan can be retired with:

```text
plan(retire): self-upgrade resolver policy
```

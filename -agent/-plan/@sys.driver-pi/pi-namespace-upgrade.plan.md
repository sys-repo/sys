# Pi upstream namespace upgrade plan

- [x] `4e5ab4934` chore(driver-pi): migrate Pi upstream package namespace
- [x] `ea82af9c6` chore(workspace): refresh prep-generated dependency surfaces
- [x] test(driver-pi): prove Pi upstream launch spec resolution
  - Covered inside `4e5ab4934` by resolver/args/prep tests and by runtime smoke proof recorded
    below; a separate test-only commit would add ceremony rather than new load-bearing proof.
- [x] docs(driver-pi): record Pi namespace provenance
  - Covered by this plan's provenance section and the durable README upstream/dependency-authority
    note committed in `4e5ab4934`.

## Final status

Migration is complete.

`@sys/driver-pi` now launches the official upstream Pi package from:

```text
npm:@earendil-works/pi-coding-agent@0.80.10
```

The migration intentionally did not float to `latest`. The root `deps.yaml` remains the dependency
authority; driver-pi prep copies the pinned version into the fallback used when no `deps.yaml` is
discoverable.

The semantic driver-pi migration and generated workspace refresh were split into two commits:

1. `4e5ab4934` — driver-pi runtime/prep/tests/docs.
2. `ea82af9c6` — generated dependency surfaces and clean regenerated lock.

## Provenance check

Evidence gathered on 2026-07-19:

- `pi.dev` install UI points npm users to `@earendil-works/pi-coding-agent`.
- `pi.dev` footer names `Earendil Inc. & Contributors`, links source to
  `https://github.com/earendil-works/pi/tree/main/packages/coding-agent`, and links npm to
  `@earendil-works/pi-coding-agent`.
- `earendil.com` describes Earendil as a public benefit corporation and says Earendil crafts tools
  to harness AI with Pi and Lefos.
- GitHub org `earendil-works` is named `Earendil Works`, links to `https://earendil.com/`, and hosts
  the Pi repository. The org was not GitHub-verified in the API response inspected.
- NPM `@earendil-works/pi-coding-agent@0.80.10` lists author `Mario Zechner`, maintainers
  `badlogic <mario@badlogicgames.com>`, `mitsuhiko <armin.ronacher@active-4.com>`, and
  `rwachtler <r.wachtler@outlook.com>`.
- NPM package repository is `github.com/earendil-works/pi`, directory `packages/coding-agent`.
- NPM publish metadata uses GitHub Actions trusted publisher and includes SLSA provenance
  attestation metadata.
- Old NPM `@mariozechner/pi-coding-agent@0.73.1` is deprecated with:
  `please use @earendil-works/pi-coding-agent instead going forward`.

Conclusion: the new namespace is the official upstream path for Pi. The evidence strongly ties it to
Mario as package author and maintainer and to Earendil Inc. as the public project/company surface.
Do not overclaim corporate ownership beyond inspected evidence.

## Pre-migration drift

Before this migration, `@sys/driver-pi` resolved and pinned:

- `npm:@mariozechner/pi-coding-agent@0.73.0` in `deps.yaml`.
- `npm:@mariozechner/pi-coding-agent@0.73.0` as fallback in `src/m.core/m.cli/u.resolve.pkg.ts`.
- `npm:@mariozechner/pi-coding-agent` as the lookup base in `u.resolve.pkg.ts` and
  `-scripts/-prep.u.ts`.
- tests that asserted or fixture the old namespace.
- type/docs references to the old `badlogic/pi-mono` source path.

The old package is deprecated and stopped at `0.73.1`; the active package is
`@earendil-works/pi-coding-agent` and the selected pinned target is `0.80.10`.

## Migration shape

- Runtime fallback now has one current package-base authority: `PI_AGENT_IMPORT_BASE` in
  `src/m.core/m.cli/u.resolve.pkg.ts`.
- Prep imports that runtime base, reads the pinned version from `deps.yaml`, updates only
  `PI_AGENT_IMPORT_VERSION`, and fails loudly if the resolver seam drifts.
- Deprecated `@mariozechner` Pi package compatibility froth was removed from prep/tests. Old package
  strings are not runtime/prep compatibility paths.
- Local prep/runtime symbols were renamed from `PI_CODING_AGENT_IMPORT`-style names to
  `PI_AGENT_IMPORT` and `pin/resolvePiAgentImport`; the upstream package name remains
  `pi-coding-agent` where it is the actual npm specifier.
- Generated-extension package-specific negative assertions were replaced with one shared
  standalone-source invariant: generated extension files must not contain bare/external imports.
- Raw launch, args, prep, profile, and extension tests prove new upstream package resolution and
  wrapper-owned standalone extension behavior.
- README/type refs were updated to the current upstream/dependency authority.
- Workspace generated surfaces were refreshed separately in `ea82af9c6`.

## Proof notes

- `cd code/sys.driver/driver-pi && deno task test --trace-leaks ./src/m.core/m.cli ./-scripts` →
  passed: `48 passed (235 steps)`.
- `cd code/sys.driver/driver-pi && deno task test --trace-leaks ./-scripts/-test/-prep.test.ts ./src/m.core/m.cli/-test/-m.run.test.ts ./src/m.core/m.cli/-test/-u.args.test.ts`
  → passed: `48 passed (236 steps)`; proved the DRY fallback and prep version-pin seam.
- After the `PI_AGENT_IMPORT` rename and generated-extension assertion cleanup, targeted driver-pi
  tests passed again with `48 passed (236 steps)`, and driver-pi prep reported
  `unchanged  src/m.core/m.cli/u.resolve.pkg.ts`.
- After strict prep cleanup, `deno task prep` remained idempotent on `u.resolve.pkg.ts`, and
  targeted prep tests passed with `48 passed (238 steps)`.
- `cd code/sys.driver/driver-pi && deno task cli --non-interactive --profile default -- --help` →
  launched upstream Pi `0.80.10` help through the wrapper with scoped permissions.
- `cd code/sys.driver/driver-pi && deno task cli --non-interactive --profile default -- --version` →
  launched upstream Pi through the wrapper and printed `0.80.10`.
- `cd code/sys.driver/driver-pi && deno task cli --non-interactive --profile /Users/phil/code/org.sys/sys/-config/@sys.driver-pi/canon.yaml -- --help`
  → launched upstream Pi through the active profile and materialized wrapper-owned `sandbox.fs` and
  `ocr` extension files without startup failure.
- `cd code/sys.driver/driver-pi && deno task cli --non-interactive --profile default -- --offline --print --no-session "smoke"`
  → reached the upstream agent path and exited successfully. Treat as launch-path proof, not
  semantic model validation.
- `cd code/sys.driver/driver-pi && deno task check` was blocked by unrelated workspace dependency
  aliases for bare `mdast` / `unist` imports in `code/sys/markdown`; driver-pi files checked before
  the external workspace failure.

## Lock / generated-surface notes

- `deno task prep` and ordinary `deno task lock:sync` did not prune stale deprecated Pi agent lock
  entries.
- Deleting `deno.lock` and rerunning `deno task lock:sync` regenerated a clean lock.
- Post-refresh scan was clean for:
  - `mariozechner/pi-coding-agent`
  - `@mariozechner/pi-coding-agent`
  - `npm:@mariozechner/pi-coding-agent`
- Remaining `@mariozechner/clipboard` entries in `deno.lock` are optional transitive dependencies of
  the new official `@earendil-works/pi-coding-agent@0.80.10`, not deprecated Pi coding-agent
  residue.

## Sandbox / trust assessment

Upstream Pi `0.80.10` now has a project trust prompt that can gate loading `.pi` settings/resources,
installing missing project packages, and executing project extensions.

This does **not** obsolete `@sys/driver-pi`.

- Upstream trust is an app-level consent prompt, not a deterministic sandbox boundary.
- `@sys/driver-pi` defines the actual Deno permission envelope: read/write/run/env/sys/ffi scopes.
- `@sys/driver-pi` prevents ambient context discovery with `--no-context-files`.
- `@sys/driver-pi` owns profile policy, generated tools/extensions, active runtime metadata, and
  sandbox reporting.
- `@sys/driver-pi` keeps launch deterministic with pinned package resolution and
  `PI_SKIP_VERSION_CHECK=1`.

Correct framing: upstream Pi trust is a useful inner prompt; `@sys/driver-pi` is the outer
capability boundary and orchestration layer.

This remains a valid foundation for driving Pi processes from a future `sys` UI while reducing or
replacing TUI dependence later.

## Remaining follow-up

The namespace migration is complete. No separate test/docs commit is currently earned.

Useful future work:

- Add wrapper-owned upstream-version visibility while keeping `PI_SKIP_VERSION_CHECK=1` for
  deterministic launches.
- If needed, add a narrow runtime smoke harness for upstream trust-prompt handling; do not duplicate
  existing `u.args` / `m.run` command-construction coverage.
- Keep Pi trust handling deliberate when the future UI layer starts driving these processes.

## Rollback path

- Runtime callers can pass `pkg` explicitly to test or temporarily launch another package spec.
- Repo rollback is a single dependency line in `deps.yaml` plus prep, but only use it if the new
  package fails a concrete Deno launch invariant.

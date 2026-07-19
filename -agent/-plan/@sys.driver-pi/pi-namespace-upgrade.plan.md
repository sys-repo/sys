# Pi upstream namespace upgrade plan

- [ ] chore(driver-pi): migrate Pi upstream package namespace
- [ ] test(driver-pi): prove Pi upstream launch spec resolution
- [ ] docs(driver-pi): record Pi namespace provenance

## Provenance check

Evidence gathered on 2026-07-19:

- `pi.dev` install UI now points npm users to `@earendil-works/pi-coding-agent`.
- `pi.dev` footer names `Earendil Inc. & Contributors`, links source to `https://github.com/earendil-works/pi/tree/main/packages/coding-agent`, and links npm to `@earendil-works/pi-coding-agent`.
- `earendil.com` describes Earendil as a public benefit corporation and says Earendil crafts tools to harness AI with Pi and Lefos.
- GitHub org `earendil-works` is named `Earendil Works`, links to `https://earendil.com/`, and hosts the Pi repository. The org is not GitHub-verified in the API response inspected.
- NPM `@earendil-works/pi-coding-agent@0.80.10` lists author `Mario Zechner`, maintainers `badlogic <mario@badlogicgames.com>`, `mitsuhiko <armin.ronacher@active-4.com>`, and `rwachtler <r.wachtler@outlook.com>`.
- NPM package repository is `github.com/earendil-works/pi`, directory `packages/coding-agent`.
- NPM publish metadata uses GitHub Actions trusted publisher and includes SLSA provenance attestation metadata.
- Old NPM `@mariozechner/pi-coding-agent@0.73.1` is deprecated with: `please use @earendil-works/pi-coding-agent instead going forward`.

Conclusion: the new namespace is the official upstream path for Pi. The evidence strongly ties it to Mario as package author and maintainer and to Earendil Inc. as the public project/company surface. I did not find a registry/API field that proves corporate ownership by Mario personally; treat `official upstream` as established, and `Mario's company` as likely but not proven from the inspected metadata alone.

## Current breakage / drift

`@sys/driver-pi` still resolves and pins:

- `npm:@mariozechner/pi-coding-agent@0.73.0` in `deps.yaml`.
- `npm:@mariozechner/pi-coding-agent@0.73.0` as fallback in `src/m.core/m.cli/u.resolve.pkg.ts`.
- `npm:@mariozechner/pi-coding-agent` as the lookup base in `u.resolve.pkg.ts` and `-scripts/-prep.u.ts`.
- tests that assert or fixture the old namespace.
- type/docs references to the old `badlogic/pi-mono` source path.

This explains missing updates: the old package is deprecated and stopped at `0.73.1`; the active package is `@earendil-works/pi-coding-agent` and is currently at `0.80.10`.

## Upgrade target

Use:

```text
npm:@earendil-works/pi-coding-agent@0.80.10
```

Do not float to unpinned `latest` inside `@sys/driver-pi`; keep the launcher deterministic and update through `deps.yaml` + prep.

## Clean migration plan

1. Dependency authority
   - Change only `deps.yaml` for the upstream Pi dependency: old `npm:@mariozechner/pi-coding-agent@0.73.0` → new `npm:@earendil-works/pi-coding-agent@0.80.10`.
   - Run `deno task prep` from the workspace root so generated dependency surfaces and driver fallback update through the canonical path.

2. Prep script compatibility
   - Update `code/sys.driver/driver-pi/-scripts/-prep.u.ts` to look for `npm:@earendil-works/pi-coding-agent`.
   - Decide whether the pin regex should be migration-tolerant:
     - preferred: accept either old or new namespace in the generated constant and replace with the current specifier;
     - after one successful migration, tests should assert the output is only the new namespace.

3. Runtime resolver
   - Update `PI_CODING_AGENT_IMPORT_BASE` in `u.resolve.pkg.ts` to `npm:@earendil-works/pi-coding-agent`.
   - Regenerate `PI_CODING_AGENT_IMPORT` from `deps.yaml` through prep; do not hand-edit generated fallback unless prep must be fixed first.
   - Preserve explicit `pkg` override behavior so emergency rollback/testing can pass a package spec at runtime.

4. Tests
   - Update old namespace fixture assertions in driver-pi tests.
   - Add at least one resolver/prep regression proving the old namespace is not required for current deps resolution.
   - Add one launch-args test proving the constructed `deno run` command contains `npm:@earendil-works/pi-coding-agent@0.80.10` by default.
   - Keep negative tests that generated extension code does not accidentally import upstream Pi internals; update them to check both old and new namespace if useful.

5. Docs
   - Update README CLI/provenance refs to name the new GitHub source path: `https://github.com/earendil-works/pi/tree/main/packages/coding-agent`.
   - Add a short provenance note: old `@mariozechner` namespace is deprecated; official upstream package is now `@earendil-works/pi-coding-agent`.
   - Keep Mario creator attribution, but do not overclaim ownership beyond inspected evidence.

6. Validation
   - Run `deno task prep` from repo root.
   - Run targeted driver-pi tests from `code/sys.driver/driver-pi`: `deno task test --trace-leaks ./src/m.core/m.cli ./-scripts`.
   - Run `deno task check` from `code/sys.driver/driver-pi`.
   - Smoke launch help without entering Pi interactivity: `deno task cli -- --help`.
   - If dependency generation touches broad workspace outputs, do a final workspace-level prep/check only after targeted proof is green.

## Risks / decisions

- `@earendil-works/pi-coding-agent` requires Node `>=22.19.0`; the old package required `>=20.6.0`. Because `@sys/driver-pi` runs it via Deno npm compatibility, test the actual Deno launch path before publishing.
- New Pi versions may have changed CLI flags. Our launcher currently passes `--no-extensions`, `--no-skills`, `--no-prompt-templates`, and `--no-context-files`; verify these still exist or remain tolerated.
- New package has more dependencies and a shrinkwrap. Preserve the Deno sandbox posture; do not broaden permissions unless a targeted failure proves a truthful need.
- NPM package provenance is better on the new namespace because it includes trusted publisher and SLSA attestation metadata. Keep this as a positive signal, not a substitute for runtime tests.

## Rollback path

- Runtime callers can pass `pkg` explicitly to test or temporarily launch the old package.
- Repo rollback is a single dependency line in `deps.yaml` plus prep, but only use it if the new package fails a concrete Deno launch invariant.

# JSR tmp probe plan

- [x] bc04edf44325e732ce38533c402324c274e0e55d chore(jsr): add stateful tmp publish probe

## Context

Evidence and external cross-references live in:

- `-agent/-issue/jsr-meta-resolution-divergence.md`

This plan is the repo-local implementation path for producing a future live repro if needed.

## Landed reality

- Implementation landed in `bc04edf44325e732ce38533c402324c274e0e55d`:
  `chore(jsr): add stateful tmp publish probe`.
- Support commits landed first:
  - `9d0469729f5abfb52dc519c194df8e0deeee07f5`: `feat(driver-process): add git file-at-ref reader`.
  - `fa507dc98d71f9ef7e0ee0709deebbd98a995b39`: `feat(std): add JSR package name guard`.
- Latest probe-state bump landed in `0c89abe0d7720e051a962e6b45d8b914557234cf`:
  `chore(jsr): advance @sys/tmp probe state 0.0.124 → 0.0.125`.
- Current checked-in probe state is `@sys/tmp@0.0.125`.
- Latest live probe result was `Probe status: OK`: normal metadata had the new version, cache-busted
  metadata agreed, and fresh Deno resolution succeeded.
- The probe now runs `deno info --no-config --no-lock --reload` from an OS temp directory with a
  temp `DENO_DIR`, so live resolver checks do not add `@sys/tmp` cruft to root `deno.lock`.
- External issue update target remains
  `https://github.com/denoland/deno/issues/35116#issuecomment-4700114749`.

## Original plan

1. Add `deno task probe:jsr` backed by `-scripts/task.probe.jsr.ts`, with tested mechanics in
   `-scripts/task.probe.jsr.u.ts`.

2. Have the script generate an isolated `@sys/tmp` publish fixture under an OS temp directory for
   the requested version, then run a guarded probe flow:
   - default: generate plus `deno publish --dry-run`
   - with explicit `--publish`: `deno publish`, then check exact `_meta.json`, normal `/meta.json`,
     cache-busted `/meta.json`, and fresh `deno info --reload`

3. Keep JSR-side `@sys/tmp` unarchive/manual package administration outside the script.

## Guardrails

- `@sys/tmp` is a generated probe artifact, not a workspace package.
- Generate outside the git worktree so `deno publish` provenance/dirty checks are not bypassed.
- Do not add `code/sys/tmp`, root workspace entries, `deps.yaml` entries, bump integration, or JSR
  workflow integration.
- Use `deno publish`, not `deno deploy`.
- Do not wire the probe into normal `deno task test` or CI.
- Require explicit `--publish` for any irreversible JSR publish, because each run creates immutable
  public versions.
- Treat a passing probe as "not reproduced at this time," not proof the platform issue is gone.

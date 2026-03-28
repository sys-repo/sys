# cli.deploy — Deno Provider Plan

## Audit Log

- Goal: add Deno Deploy to `@sys/tools/deploy` as a thin adapter over `@sys/driver-deno`.
- Keep top-level actions:
  - `stage`
  - `push`
- Refactor first:
  - widen provider execution context beyond `push(stagingDir)`
  - keep Orbiter working on the widened seam
- Deno provider shape:
  - `kind: 'deno'`
  - `app`
  - `org?`
  - `tokenEnv?`
  - `verifyPreview?` default `true`
- Deno `probe`:
  - env/config readiness only
  - not PATH/binary probing
- Deno `push`:
  - call `DenoDeploy.pipeline(...)`
  - no app creation in this pass

## Constraints

- no sample fixture logic in `@sys/tools/deploy`
- no duplicate Deno CLI logic in `@sys/tools/deploy`
- no fake Orbiter symmetry when runtime truth differs

## Out of Scope

- app creation
- app deletion
- logs
- `.tmp` proof harness

# Plan: align finite operation endpoints for Cell task args

## Status

STIER sync: **DONE**.

This plan is complete and now serves as a historical design note for the finite-operation endpoint
shape. The implementation landed in:

- `6f658262e` — `feat(tools): support owner config refs for finite endpoints`

## Current reality

`Pull.run(...)`, `Deploy.stage(...)`, and `Deploy.push(...)` now accept owner config refs in the
same programmatic shape Cell task endpoints naturally provide:

```ts
{ cwd, config }
{ cwd, paths: { config } }
```

The shared normalizer is:

```text
code/sys.tools/src/common/u.configRef.ts
```

It provides `ConfigRef.resolve(cwd, args, owner)` with these rules:

1. `config` and `paths.config` are aliases when both resolve to the same absolute path.
2. If both are present and resolve differently, the operation throws a targeted conflict error.
3. If neither is present, the operation throws a targeted missing-config error.
4. Relative refs resolve from caller `cwd`.

The current operation-specific call sites are:

```text
code/sys.tools/src/cli.pull/u.run.ts
code/sys.tools/src/cli.deploy/u.stage.ts
code/sys.tools/src/cli.deploy/u.push/u.endpoint.ts
```

The current type surface is shared through `t.Tools.ConfigRefArgs` and consumed by pull/deploy
operation args.

## Locked behavior

The intended error strings are implemented through the shared normalizer:

- `Pull.run: config or paths.config is required.`
- `Pull.run: config and paths.config resolve to different paths.`
- `Deploy.stage: config or paths.config is required.`
- `Deploy.stage: config and paths.config resolve to different paths.`
- `Deploy.push: config or paths.config is required.`
- `Deploy.push: config and paths.config resolve to different paths.`

Programmatic API coverage for owner refs, equivalent refs, conflicts, and existing operation failures
exists in:

```text
code/sys.tools/src/cli.pull/-test/-u.run.test.ts
code/sys.tools/src/cli.deploy/-test/-u.stage.test.ts
code/sys.tools/src/cli.deploy/-test/-u.push.test.ts
```

## BMIND / evergreen design notes

- These are **finite operations**, not lifecycle services.
- Do not add `until` merely for symmetry with `Serve.start(...)`.
- Cancellation remains a future, concrete audit item only if a real long-running edge needs an abort
  contract.
- Do not add CLI `paths` parsing; `paths.config` is a library/owner API shape, not argv.
- Do not add `Deploy.stagePush(...)`; composition belongs in Cell task graphs.
- Keep owner APIs atomic:
  - pull owner pulls;
  - deploy owner stages;
  - deploy owner pushes;
  - Cell composes.

## Retire condition

No further implementation is required for this plan. If future cancellation work is needed, open a
new plan scoped to the concrete operation and cancellation substrate.

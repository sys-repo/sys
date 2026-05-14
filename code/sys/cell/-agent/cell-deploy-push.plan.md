# Cell deploy sample: prep-only and prep+push plan

## Status

STIER sync: **DONE**.

The deploy-push API and Cell deploy-sample composition work landed in:

- `d38120552` — `plan(create): deploy push API`
- `1d9f7afd5` — `feat(deploy): expose push helper for deploy endpoints`
- `2a576cbda` — `fix(deploy): reject incomplete programmatic push plans - @sys/tools`
- `d1fe592ca` — `feat(cell): compose deploy sample prep and push`
- `6a76a2c18` — `plan(delete): deploy push API`

Related follow-ons now relevant to the current sample shape:

- `6f658262e` — `feat(tools): support owner config refs for finite endpoints`
- `dd2fe5010` — `fix(cell): route deploy sample preview through services`
- `098a7bfa7` — `fix(cell): serve deploy preview from pulled artifact path`

## Current reality

From `code/sys/cell`, there are exactly two operator Deno tasks for this flow:

```sh
deno task sample:deploy:prep
deno task sample:deploy
```

Current task definitions live in:

```text
code/sys/cell/deno.json
```

Current meaning:

- `sample:deploy:prep` runs the Cell task `sample:deploy:prep` in `./-sample/cell.deploy`.
- `sample:deploy` runs the Cell task `sample:deploy` in `./-sample/cell.deploy`.
- There is no public `sample:deploy:push` Deno task.

The Cell task graph lives in:

```text
code/sys/cell/-sample/cell.deploy/-config/@sys.cell/cell.yaml
```

Current task graph:

```yaml
tasks:
  - name: pull:view
    use: PullViewTask
    from: ./-scripts/deploy.ts
    config: ./-config/@sys.tools.pull/view.yaml

  - name: deploy:prep
    use: DeployPrepTask
    from: ./-scripts/deploy.ts
    config: ./-config/@sys.tools.deploy/orbiter.yaml

  - name: deploy:push
    use: DeployPushTask
    from: ./-scripts/deploy.ts
    config: ./-config/@sys.tools.deploy/orbiter.yaml

  - name: sample:deploy:prep
    steps:
      - task: pull:view
      - task: deploy:prep

  - name: sample:deploy
    steps:
      - task: sample:deploy:prep
      - task: deploy:push
```

Current task endpoint module:

```text
code/sys/cell/-sample/cell.deploy/-scripts/deploy.ts
```

Current endpoint shape:

```ts
export const PullViewTask: t.Cell.Task.Endpoint = {
  run: ({ cwd, paths }) => Pull.run({ cwd, config: paths.config! }),
};

export const DeployPrepTask: t.Cell.Task.Endpoint = {
  run: ({ cwd, paths }) => Deploy.stage({ cwd, config: paths.config! }),
};

export const DeployPushTask: t.Cell.Task.Endpoint = {
  run: ({ cwd, paths }) => Deploy.push({ cwd, config: paths.config! }),
};
```

The current code still adapts Cell `paths.config` to direct `config` in this sample module. Since
`6f658262e`, the underlying finite endpoints also accept `paths.config` directly; this sample can be
simplified later if desired, but no behavior depends on that cleanup.

The deploy endpoint authority for both prep and push is:

```text
code/sys/cell/-sample/cell.deploy/-config/@sys.tools.deploy/orbiter.yaml
```

The old deploy-sample `stage.yaml` authority was removed from this flow.

The deploy preview is now a service in the same sample descriptor:

```yaml
services:
  - name: deploy:view
    use: Serve
    from: '@sys/tools/serve'
    config: ./-config/@sys.tools.serve/view.yaml
```

The serve config now serves the sample root with the pulled artifact as the info path:

```yaml
name: deploy:view
dir: .
info:
  path: /view/.pulled/ui.components/
```

## Current deploy owner API reality

`Deploy.push(...)` is public and atomic. The current implementation is in:

```text
code/sys.tools/src/cli.deploy/u.push/u.endpoint.ts
```

It:

1. resolves the owner config ref with `ConfigRef.resolve(cwd, args, 'Deploy.push')`;
2. validates deploy endpoint YAML;
3. rejects providerless endpoints with structured failure details;
4. resolves push targets from already-staged output;
5. rejects incomplete or missing staging output before provider push;
6. delegates actual provider push to the provider push layer;
7. returns the push result or throws a wrapped `Deploy.push: failed to push config` error.

Programmatic push coverage lives in:

```text
code/sys.tools/src/cli.deploy/-test/-u.push.test.ts
```

## BMIND / evergreen design notes

- Cell is the composition layer.
- Deploy owns atomic deploy operations.
- `Deploy.stage(...)` stages.
- `Deploy.push(...)` pushes already-staged endpoint output.
- Do not add `Deploy.stagePush(...)`.
- Do not hide pull → stage → push sequencing inside `@sys/tools/deploy`.
- Do not add a public `sample:deploy:push` operator task unless explicitly requested later.
- Do not import deploy CLI internals into Cell samples.
- Do not add a Cell shell-command primitive for this flow.
- Keep `.env` local/uncommitted; `orbiter.yaml` owns env refs for real target values.

## Verification commands

Safe prep check:

```sh
cd code/sys/cell
deno task sample:deploy:prep
```

Actual publish check:

```sh
cd code/sys/cell
deno task sample:deploy
```

Package checks:

```sh
cd code/sys.tools
deno task check
```

```sh
cd code/sys/cell
deno task check
```

## Retire condition

No further implementation is required for this plan. Any future cleanup should be a small refactor,
such as passing `{ cwd, paths }` directly into finite endpoints now that they support owner config
refs.

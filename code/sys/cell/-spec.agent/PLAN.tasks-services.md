# Plan: Cell tasks and services

## Status

Implemented STIER design record for the public Cell execution vocabulary.

This record supersedes the earlier finite-workflow design and documents the implemented vocabulary:

```text
cell start
Cell.start(cell)
Cell.Services.start(cell)

cell task <name>
Cell.task(cell, '<name>')
Cell.Task.run(cell, '<name>')
```

There are no legacy public aliases. The API, CLI, descriptor, docs, and tests use `Task` and
`Services` consistently. Legacy vocabulary appears only in intentional rejection tests and historical
notes.

## Essence

`@sys/cell` is a boot/composition microkernel.

It owns two active lanes:

- **Services**: long-lived lifecycle endpoints that start, wait, and close.
- **Tasks**: finite named workflows that run, finish, and fail.

Cell owns names, descriptor shape, trust checks, import checks, path safety, ordering, lifecycle
composition, and result collation.

Owner packages own mechanics, schemas, sub-roots, network behavior, filesystem interpretation, and
config semantics.

## Public grammar

The operator grammar and programmatic grammar align:

```text
deno task <name>             project-level Deno task
cell task <name>             Cell-level typed task
Cell.Task.run(cell, '<name>') structured task API
Cell.task(cell, '<name>')    happy-path task API
```

```text
cell start                   start declared Cell services
Cell.Services.start(cell)    structured services API
Cell.start(cell)             happy-path services API
```

The Deno alignment is deliberate but not semantic identity: Cell tasks are not `deno.json` shell
aliases. They are typed Cell-declared workflow endpoints.

## Naming decisions

Use `Task`.

- A Cell task is finite and runnable by name.
- A task may be a leaf endpoint or a composite sequence.
- `task` matches Deno/operator muscle memory without requiring shell-command semantics.
- Do not use a shell command primitive in the Cell descriptor.

Use `Services`.

- A Cell service is a long-lived lifecycle endpoint.
- `Services` names the concrete composition lane: declared services are what Cell starts.
- Root `Cell.start(...)` is the human-facing happy path.

Do not keep old vocabulary as public aliases. A pre-1.0 hard break is cleaner than carrying two
names for the same concept.

## Descriptor shape

Minimal valid Cell:

```yaml
kind: cell
version: 1
```

Services and tasks are optional sibling lanes:

```yaml
kind: cell
version: 1

services:
  - name: app
    from: '@sys/http/server/proxy'
    export: HttpProxy
    config: ./-config/@sys.http/proxy.yaml

tasks:
  - name: pull:view
    from: ./-tasks/pull.view.ts
    export: PullViewTask
    config: ./-config/@sys.tools.pull/view.yaml

  - name: deploy:stage
    from: ./-tasks/deploy.stage.ts
    export: DeployStageTask
    config: ./-config/@sys.tools.deploy/stage.yaml

  - name: sample:deploy
    steps:
      - task: pull:view
      - task: deploy:stage
```

Rules:

- `services` is optional.
- `tasks` is optional.
- Services are leaf lifecycle endpoints only.
- Tasks are XOR:
  - leaf task: `name + from + export + optional config`
  - composite task: `name + steps[]`
- Every root task is runnable by name.
- Composite task steps are ref-only in v1.
- `steps[].task` references another root task by name.
- No inline executable steps.
- No inline owner config.
- No shell command strings.
- No implicit task execution during `Cell.start(...)`.

## Programmatic API

Happy path:

```ts
const cell = await Cell.load('.');

const started = await Cell.start(cell);
await Cell.task(cell, 'sample:deploy');
```

Structured surfaces:

```ts
Cell.Services.verify(cell, options?);
Cell.Services.start(cell, options?);
Cell.Services.wait(started);

Cell.Task.verify(cell, options?);
Cell.Task.run(cell, name, options?);
```

Root methods are aliases only for the primary happy paths:

```ts
Cell.start(cell, options?)  -> Cell.Services.start(cell, options?)
Cell.task(cell, name, options?) -> Cell.Task.run(cell, name, options?)
```

Do not add additional root shorthands until an equally primary operation earns them.

## Endpoint contracts

Service endpoint:

```ts
type CellServiceEndpoint<Handle = unknown> = {
  start(args: CellServiceStartArgs): Handle | Promise<Handle>;
};
```

Task endpoint:

```ts
type CellTaskEndpoint<Result = unknown> = {
  run(args: CellTaskRunArgs): Result | Promise<Result>;
};
```

Endpoint args are structured and Cell-shaped:

```ts
type CellServiceStartArgs = {
  readonly cwd: string;
  readonly paths: {
    readonly config: string;
  };
};

type CellTaskRunArgs = {
  readonly cwd: string;
  readonly paths: {
    readonly config?: string;
  };
};
```

Cell passes config refs as paths, not flattened owner config fields. Owner endpoints or local
adapters read and validate owner config through owner-owned code.

The Cell public contract is config-ref pure: no parsed owner config is exposed through Cell endpoint
args or Cell verification results. There is no public `runArgs`/`startArgs` escape hatch that can
rewrite endpoint transport after Cell verification.

## Result shapes

Services start result:

```ts
type ServicesStarted<Handle = unknown> = {
  readonly services: readonly StartedService<Handle>[];
  close(reason?: unknown): Promise<void>;
};
```

Started service:

```ts
type StartedService<Handle = unknown> = {
  readonly service: ServiceDescriptor;
  readonly paths: { readonly config: string };
  readonly endpoint: CellServiceEndpoint<Handle>;
  readonly handle: Handle;
  readonly metrics: {
    readonly start: {
      readonly startedAt: number;
      readonly resolvedAt: number;
    };
  };
};
```

Task run result:

```ts
type TaskRunResult = {
  readonly task: TaskDescriptor;
  readonly steps: readonly TaskStepResult[];
};

type TaskStepResult = {
  readonly task: TaskLeafDescriptor;
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: unknown;
  readonly metrics: {
    readonly run: {
      readonly startedAt: number;
      readonly resolvedAt: number;
    };
  };
};
```

Semantics:

- A leaf task produces one step result.
- A composite task produces leaf step results in run order.
- Composite nodes orchestrate only; they do not call endpoint code.
- Task execution is sequential in v1.
- Stop on first failure.
- Failure names both the failed task and requested root task.

## Trust and path safety

Default trust:

- package/module imports must match trusted prefixes, defaulting to `['@sys/']`
- Cell-local relative service/task imports are allowed when resolved inside the Cell root
- absolute imports/paths are rejected
- remote URL imports are rejected unless explicit test/dev options widen trust prefixes

Config refs:

- service config paths resolve relative to the Cell root
- task config paths resolve relative to the Cell root when present
- config refs must stay inside the Cell root
- Cell validates path safety; owners validate config meaning

## CLI

```sh
cell start [dir]
cell task <name> [dir]
```

Published Deno entry examples:

```sh
deno run -ERWN jsr:@sys/cell start .
deno run -ERWN jsr:@sys/cell task sample:deploy .
```

CLI maps directly to the public library API:

```ts
const cell = await Cell.load(dir ?? '.');
await Cell.start(cell);
await Cell.task(cell, taskName);
```

CLI non-goals:

- no interactive picker in the first pass
- no shell pass-through
- no `--parallel`
- no ad hoc task arguments beyond task name and optional Cell dir until earned

## Hard TMIND review

Risks and decisions:

- If `task` is treated as a shell string, Cell becomes a worse `deno task`. Reject shell strings.
- If `Task` keeps legacy aliases, the public surface carries avoidable drift. Hard break.
- If `Services` is only a rename but descriptor keeps stale nesting, API and descriptor grammar drift.
  Prefer top-level `services` in the current v1 descriptor.
- If `Cell.task(...)` is added but `Cell.start(...)` is not, root API shape is asymmetrical. The
  implemented shape includes both.
- If root aliases proliferate, `Cell` becomes a convenience junk drawer. Only `start` and `task` earn
  root placement now.
- If task execution is coupled into service start, finite mutation/network work becomes hidden inside
  `cell start`. Keep lanes separate.
- If Cell parses owner config as public contract, Cell becomes a partial owner of owner schemas. Pass
  config refs only; owner endpoints and local adapters own config loading and validation.
- If the first task pass grows DAG/parallel/conditional semantics, the primitive overshoots. v1 is
  sequential composition by ref.

## Implementation record

Implemented as one cohesive Cell commit because vocabulary and purity touched the same public surface:

1. Renamed finite-workflow descriptor/API/CLI from Action to Task.
2. Renamed service composition API from Runtime to Services.
3. Added root happy-path methods:
   - `Cell.start(...)`
   - `Cell.task(...)`
4. Kept descriptor `version: 1` and purified its shape:
   - `runtime.services[]` -> `services[]`
   - `actions[]` -> `tasks[]`
   - `steps[].action` -> `steps[].task`
5. Removed old public vocabulary instead of aliasing it.
6. Kept endpoint args config-ref pure:
   - services receive `{ cwd, paths: { config } }`
   - tasks receive `{ cwd, paths: { config? } }`
7. Removed public endpoint-arg rewrite hooks.
8. Added Cell-root-bounded local adapters for services and tasks.
9. Updated schema, semantic validation, type surfaces, CLI help, DSL help, README, samples, and tests.
10. Hardened task run to import/verify only the requested closure after graph validation.
11. Hardened service startup cleanup to close all already-started handles and preserve cleanup failures.

## Test spine

Descriptor/schema:

- accepts minimal `{ kind: 'cell', version: 1 }`
- accepts `services[]`
- accepts leaf `tasks[]`
- accepts composite `tasks[]` using ref-only `steps[]`
- rejects duplicate service names
- rejects duplicate task names
- rejects invalid service/task IDs
- rejects task entries that mix `steps` with `from/export/config`
- rejects leaf tasks missing `from` or `export`
- rejects composite steps with inline executable fields
- rejects missing task refs
- rejects task cycles
- rejects config refs that escape the Cell root
- rejects unknown descriptor fields

Programmatic:

- `Cell.start` delegates to `Cell.Services.start`
- `Cell.task` delegates to `Cell.Task.run`
- `Cell.Services.verify/start/wait` are exported and stable
- `Cell.Task.verify/run` are exported and stable
- service start records metrics and closes in reverse start order
- task run records metrics and preserves sequential order
- composite task stops on first failing leaf with clear root/failed task message
- trusted package/module task endpoint imports work
- Cell-local relative service/task endpoint imports work when inside Cell root
- untrusted imports fail clearly
- task run verifies/imports only the requested task closure after graph validation
- service startup cleanup closes all previously started services and preserves cleanup failures as cause detail

CLI:

- `cell start [dir]` maps to `Cell.start`
- `cell task <name> [dir]` maps to `Cell.task`
- old command vocabulary is absent

## Non-goals

- no shell command tasks
- no DAG/parallel/conditional tasks
- no scheduler or queue
- no implicit task execution during `Cell.start`
- no inline owner config
- no inline executable task steps
- no mandatory task config
- no flattened owner config args
- no Cell-owned pull/deploy/static/proxy mechanics
- no replacement of Deno tasks generally

## Acceptance

- Public Cell execution vocabulary is `Services` and `Task`.
- Root happy path is `Cell.start(...)` and `Cell.task(...)`.
- CLI shape is `cell start` and `cell task <name>`.
- Descriptor v1 uses optional sibling `services[]` and `tasks[]`.
- Minimal descriptor with only `kind` and `version` is valid.
- Tasks support leaf endpoint execution and sequential composite task refs.
- Services remain long-lived lifecycle endpoints.
- Owner config paths remain refs owned by owner packages.
- No legacy execution vocabulary remains in public docs, API, or CLI.
- Legacy execution vocabulary appears in tests only as intentional rejection fixtures.

## Commit record

Implemented in:

```text
refactor(cell): align execution around pure services and tasks
```

Purpose:

- renames finite workflows to Task and runtime composition to Services
- adds Cell.start and Cell.task happy-path APIs
- purifies descriptor v1 to services[] and tasks[] lanes
- removes legacy execution vocabulary instead of aliasing it
- keeps endpoint args config-ref pure
- adds Cell-root-bounded local service/task adapters
- runs only requested task closures
- hardens service startup cleanup

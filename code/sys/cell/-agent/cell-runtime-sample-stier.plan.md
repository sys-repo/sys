# Cell runtime sample STIER cleanup

Status: `deno task sample` works, but the sample script still contains temporary operator-side derivation logic.

## Design principle

```text
Cell owns topology.
Source owners own source resolution.
Service owners own lifecycle/rendering.
Sample owns only orchestration.
```

The sample should not hand-derive Cell meaning by poking descriptor internals, pull config internals, or HTTP startup metadata.

## Primary concepts at play

1. Cell runtime lifecycle

```ts
Cell.Runtime.verify(cell)
Cell.Runtime.start(cell)
Cell.Runtime.wait(runtime)
```

Cell owns this.

2. Runtime service topology

```yaml
runtime.services[].for.views
```

Cell owns this relation.

3. View source binding

```yaml
views.*.source.local
views.*.source.pull
```

Cell owns the binding shape.

4. Pull materialization

```yaml
bundles[].local.dir
```

`@sys/tools` pull owns this. Cell may compose through an exported resolver, but should not permanently hand-parse pull internals.

5. HTTP startup rendering

```text
url: ...
```

`@sys/http` owns actual bound server URL rendering/formatting. Cell may pass structured `info`; it should not own the table renderer.

## Target sample

The sample script should reduce to orchestration:

```ts
const cell = await Cell.load('./-sample/cell.stripe');
const runtime = await Cell.Runtime.start(cell);
await Cell.Runtime.wait(runtime);
```

No local `viewUrls(...)`, `viewPath(...)`, `pulledViewPath(...)`, or `pullLocalDir(...)` helpers in `-scripts/task.sample.ts`.

## Near-term Cell cleanup

Commit target:

```text
refactor(cell): derive static view startup info
```

Do:

- derive `http-static` service `info` from `runtime.services[].for.views`
- resolve local view source paths from `views.*.source.local`
- temporarily resolve pulled view source paths from pull config until `@sys/tools` exposes an owner-correct resolver
- keep `startArgs` as an operational override after Cell-derived base args
- add `Cell.Runtime.wait(runtime)`
- reduce `-scripts/task.sample.ts` to load/start/wait

Do not:

- duplicate view paths into `@sys.http` config
- make the sample script parse Cell/pull internals
- move HTTP table rendering into Cell
- invent proxy/runtime framework concepts in this slice

## Follow-up owner-correct resolver

Commit target:

```text
feat(tools): expose pull materialization resolver
```

Goal: move ownership of pull config materialization from Cell/sample logic to `@sys/tools`.

Potential shape:

```ts
Pull.resolveLocalDirs(configPath)
```

or:

```ts
Pull.Config.load(path)
Pull.Config.resolve(config, { cwd })
```

Cell should consume the resolver; it should not own `bundles[].local.dir` semantics.

## Later realistic baseline

Commit target:

```text
sample(cell): add proxied Stripe runtime
```

Only after `@sys/http` has a real proxy lifecycle endpoint.

Goal:

```text
single public origin
→ static views
→ proxied runtime APIs
```

## Conceptual commit sequence

1. ```text
   refactor(cell): derive static view startup info
   ```

2. ```text
   feat(tools): expose pull materialization resolver
   ```

3. ```text
   sample(cell): add proxied Stripe runtime
   ```

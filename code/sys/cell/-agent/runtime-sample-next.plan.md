# Cell runtime sample next steps

Status: `sample(cell): run Stripe Cell through runtime API` is landed.

The sample now proves:

```text
deno task sample
→ Cell.load
→ Cell.Runtime.start
→ static Cell views
→ Stripe fixture
```

This is the current working primitive baseline.

## 1. Clarify the sample runtime script

Commit target:

```text
refactor(cell): clarify sample runtime script
```

Keep behavior identical. The script should read like an operator script, not inline mechanics.

Desired top-level shape:

```ts
const cell = await Cell.load(root);
const runtime = await Cell.Runtime.start(cell, {
  args: withStaticViewInfo(cell),
});
await wait(runtime);
```

Local helpers are acceptable for now:

```ts
withStaticViewInfo(cell)
viewInfo(cell, service)
viewPath(cell, view)
pulledViewPath(cell, pullConfigPath)
wait(runtime)
```

Do not create public `Cell.View.resolve(...)` yet unless we are ready to own it.

## 2. Bump/publish lane

Owner note: bump from `@sys/types` and publish to get the changed package graph moving.

Keep this separate from feature/design work:

- run prep/verify/dry as appropriate
- bump from `@sys/types`
- publish incrementally
- future Cell tweaks can then be smaller bumps

## 3. Investigate owner-correct pull materialization resolver

Current caveat: `task.sample.ts` understands enough of `@sys.tools.pull` config to read:

```yaml
bundles[].local.dir
```

That is acceptable only as a temporary sample/operator adapter.

Owner-correct direction: `@sys/tools` pull should expose a resolver for materialized local output paths, so the Cell sample does not parse pull config internals.

Questions:

- Who owns the materialized local output path for a pull config?
- Is there already an internal resolver in `@sys/tools/src/cli.pull` that can be exported?
- Should the API load from path or resolve from already parsed config?

Possible API shapes:

```ts
Pull.Config.load(path)
Pull.Config.resolve(config, { cwd })
```

or:

```ts
Pull.resolveLocalDirs(configPath)
```

Do an inspection/planning pass before implementation.

Potential commit targets:

```text
docs(tools): plan pull materialization resolver
```

or, if trivial and owner-correct:

```text
feat(tools): expose pull materialization resolver
```

## 4. Add an HTTP proxy runtime sample

Goal: realistic baseline with one public origin:

```text
single public origin
→ static views
→ proxied runtime APIs
```

Instead of requiring users to know separate origins:

```text
4040 = view
9090 = Stripe fixture
```

Potential target shape:

```text
http://localhost:4040/view/...
http://localhost:4040/-/stripe/payment-intent
```

or a separate composed app origin:

```text
8080 = composed Cell app
  /view/...
  /-/stripe/...
```

Design question:

- Is proxy a new runtime service?
- Is proxy an HTTP service config capability?
- Is proxy an operator/serve layer over Cell runtime?

Initial instinct: add proxy as another runtime service, not Cell core.

Possible future descriptor shape:

```yaml
- name: app
  kind: http-proxy
  for:
    views: [stripe.dev, hello]
  from: '@sys/http/server/proxy'
  export: HttpProxy
  config: ./-config/@sys.http/proxy.view.yaml
```

Do not invent this until `@sys/http` has a real proxy lifecycle endpoint.

Potential commit sequence:

```text
feat(http): expose proxy lifecycle endpoint
sample(cell): add proxied Stripe runtime
```

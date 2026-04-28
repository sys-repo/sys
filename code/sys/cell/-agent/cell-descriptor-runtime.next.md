# Cell descriptor/runtime next run

Status: immediate implementation note.

## Anchor
1. Cell descriptor becomes real.
2. Runtime service declaration becomes executable.

## Descriptor shape to lock

```yaml
kind: cell
version: 1

dsl:
  root: ./data

views:
  stripe.dev:
    source:
      pull: ./-config/@sys.tools.pull/view.yaml
  hello:
    source:
      local: ./view/hello-world

runtime:
  services:
    - name: view
      kind: http-static
      for:
        views: [stripe.dev, hello]
      from: '@sys/http/server/static'
      export: HttpStatic
      config: ./-config/@sys.http.static/view.yaml

    - name: stripe
      kind: http-server
      from: '@sys/driver-stripe/server/fixture'
      export: StripeFixture
      config: ./-config/@sys.driver-stripe/fixture.yaml
```

## Semantics
- `dsl.root` is stored meaning.
- `views` is a record of Cell-local view IDs.
- View IDs use `^[a-z][a-z0-9.-]*$`.
- A view descriptor has a discriminated `source` binding:
  - `source.pull` references a finite materialization config.
  - `source.local` references an already-local/bundled view root.
  - exactly one of `source.pull` or `source.local` is allowed.
- The Stripe sample intentionally shows both forms in one Cell:
  - `views.stripe.dev.source.pull` for a managed pulled view artifact.
  - `views.hello.source.local` for a local plain `index.html` view.
- `views.*.source.pull` is not runtime lifecycle.
- `runtime.services` is the only lifecycle lane.
- `runtime.services.*.for.views` declares which Cell views a service is for; each referenced view ID must exist.
- `from` + `export` must resolve to a real ESM lifecycle endpoint.
- `config` is a path relative to the Cell root for service-owned config.

## Runtime contract
A runtime service export must satisfy:

```ts
type RuntimeService = {
  start(args: RuntimeStartArgs): Promise<RuntimeStarted>;
};

type RuntimeStartArgs = {
  cwd: string;
  [key: string]: unknown;
};
```

`@sys/cell` fails fast and clearly when:
- `from` is not allowed/trusted
- module import fails
- `export` is missing
- `export.start` is missing or not a function
- config path is missing or invalid

## API split
- `Cell.load(path)` validates and loads the descriptor.
- `Cell.Runtime.check(cell)` verifies executable runtime topology without starting services.
- `Cell.Runtime.start(cell)` performs `check` then starts lifecycle services.

`check` is the dry-run equivalent: it exists so tests and operators can prove declarations are accurate before opening ports or launching services.

## First landing sequence
1. Update Stripe sample descriptor to the locked shape.
2. Add descriptor types/schema.
3. Test that Stripe sample descriptor validates.
4. Add `Cell.load(...)`.
5. Add runtime service contract/assertion.
6. Add `Cell.Runtime.check(...)`.
7. Only then add `Cell.Runtime.start(...)`.

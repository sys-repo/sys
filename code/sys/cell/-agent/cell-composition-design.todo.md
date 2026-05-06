# Cell composition design: completion record

## Status

Completed and superseded by implemented `@sys/cell` DSL/runtime surfaces.

This file records the final design state before retirement. Durable guidance now lives in:

- `code/sys/cell/README.md`
- `code/sys/cell/src/m.help/yaml/dsl.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.pulled-view.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.static-http-service.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.runtime-service.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.proxy-service.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.start-runtime.yaml`
- `code/sys/cell/src/m.help/yaml/start.yaml`

## Completed composition doctrine

The core design is now implemented and documented:

```text
Cell config binds topology; owner configs perform their own jobs.
```

Cell owns:

- Cell folder loading and descriptor validation
- topology references
- view source references
- runtime service envelopes
- operator runtime orchestration

Owner packages own:

- config schema and validation
- create/update/config affordances
- serving behavior and runtime mechanics
- ports, URLs, route internals, and display output
- package-specific examples

Cell should not duplicate pull/static/proxy/runtime grammars in `cell.yaml`.

## Current sample anchor

The Stripe sample became the first concrete proof without making Cell Stripe-shaped:

```text
-sample/cell.stripe/
├─ -config/
│  ├─ @sys.cell/
│  │  └─ cell.yaml
│  ├─ @sys.driver-stripe/
│  │  └─ fixture.yaml
│  ├─ @sys.tools.pull/
│  │  └─ view.yaml
│  └─ @sys.http/
│     ├─ static.view.yaml
│     └─ proxy.yaml
├─ data/
└─ view/
```

Design split:

```text
-config/@sys.cell/cell.yaml             Cell anatomy / binding descriptor
-config/@sys.tools.pull/view.yaml       managed remote view artifact pull config
-config/@sys.http/static.view.yaml      static view-folder runtime config
-config/@sys.http/proxy.yaml            public route composition config
-config/@sys.driver-stripe/fixture.yaml Stripe fixture runtime config
data/                                   DSL / stored meaning / file-carried forms
view/.pulled/                           ignored managed view artifacts
```

Composition proof:

```text
@sys.cell descriptor
→ @sys.tools.pull view artifact
→ @sys/http static ./view
→ @sys/http proxy public paths
→ browser view renders
```

## Runtime service envelope

The durable runtime service envelope is now the generic composition primitive:

```yaml
runtime:
  services:
    - name: <service-name>
      kind: <kind>
      from: '<module>'
      export: <export>
      config: <config>
```

Optional `for.views` relationships may bind services to Cell views when needed.

`from` is the ESM module specifier. `export` is the named lifecycle endpoint export. `config` is a
Cell-root-relative path to service-owned config.

Avoid fields like `driver`; the value is a service-owned config reference, not Cell-owned driver
semantics.

## Runtime start outcome

`@sys/cell start [dir]` is now the public operator affordance for starting a composed Cell runtime.
It loads the Cell descriptor, starts declared runtime services, waits, and closes services.

Future serve-like affordances should be framed relative to runtime services, proxy/static owners,
and the existing start primitive rather than as a separate Cell-owned static server grammar.

Do not turn Cell instance folders into script piles just to start tooling. Package-root sample tasks
may demonstrate operation, but Cell instance folders should remain ordinary/runtime-owned.

## Local file doctrine

Local files are ordinary Cell content; runtime services own how files are served or interpreted.

This avoids a Cell-owned local-file serving grammar. Static HTTP, proxy-backed routes, and custom
lifecycle services are the interpretation/serving layer.

## Completed clean engineering run

Completed:

- renamed sample runtime service config field to `config`
- added `@sys/cell` type/schema surface for `cell.yaml`
- implemented `Cell.load(...)`
- validated `cell.stripe` as the first fixture
- added `Cell.Runtime.start(...)`
- added `Cell.Runtime.wait(...)`
- added `@sys/cell start [dir]`
- added owner-aware DSL chapters for pulled views, static HTTP services, runtime services, proxy
  services, and runtime start

## Resolved or relocated notes

### Second sample pressure

The current implementation is no longer Stripe-shaped. A future `cell.concept-player` or media/data
sample can be explored separately when that work starts.

### Data/canon/skills pull

Future data/canon/skills pull needs can be handled when a concrete skill or data-pack use case
requires it. This is not an active Cell composition blocker.

### `@sys/tools/pull` source config stability

The pull source-config mutation concern has been addressed outside this Cell note. `@sys/tools` now
has proof that successful pull execution does not write recency metadata into the source config:

```text
code/sys.tools/src/cli.pull/u.bundle/-test/-u.bundle.config.test.ts
```

`pull add` configuration writes use the shared owner-config edit helper, while pull execution keeps
source configs stable.

## Final guardrails retained in public doctrine

- Do not turn `@sys.cell/cell.yaml` into a mega-config.
- Do not duplicate owner package grammars in Cell config.
- Keep `data/` as the Cell's stored-meaning compartment.
- Keep pulled artifacts under hidden/ignored managed folders such as `view/.pulled/`.
- Treat `dist.json` as artifact identity/provenance authority.
- Keep runtime service breadth incremental and owner-backed.
- Prefer service-owned static/proxy/custom runtime composition over baking serving mechanics into
  Cell.

## Retirement

This note is complete. Retire after committing this completion record.

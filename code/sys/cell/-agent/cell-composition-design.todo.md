# Cell composition design TODO

Status: active local design/todo note.

This note tracks the emerging implementation field around `@sys/cell` without promoting every idea into API yet.

## Current anchor
The first concrete Cell sample is:

```text
-sample/cell.stripe/
├─ -config/
│  ├─ @sys.cell/
│  │  └─ cell.yaml
│  ├─ @sys.driver-stripe/
│  │  └─ fixture.yaml
│  ├─ @sys.tools.pull/
│  │  └─ view.yaml
│  └─ @sys.tools.serve/
│     └─ view.yaml
├─ data/
└─ view/
```

Current design split:

```text
-config/@sys.cell/cell.yaml             Cell anatomy / binding descriptor
-config/@sys.tools.pull/view.yaml       managed remote view artifact pull config
-config/@sys.tools.serve/view.yaml      static serving config for the pulled view
-config/@sys.driver-stripe/fixture.yaml Stripe fixture runtime config
data/                                   DSL / stored meaning / file-carried forms
view/.pulled/                           ignored managed view artifacts
```

Principle:

> Cell config binds the Cell; tool configs perform their own jobs.

## Confirmed composition signal
`@sys/tools/pull` already supports non-interactive pull configs:

```sh
sys pull --non-interactive --config ./-config/@sys.tools.pull/view.yaml
```

For the Stripe sample this pulled:

```text
https://fs.db.team/driver.stripe/dist.json
→ ./view/.pulled/driver.stripe
```

This argues against cloning pull grammar inside `@sys.cell/cell.yaml`.

## Confirmed serve signal
`@sys/tools/serve` already supports non-interactive static serving configs:

```sh
sys serve --non-interactive --config ./-config/@sys.tools.serve/view.yaml
```

For the Stripe sample, serving the Cell root worked:

```yaml
name: stripe view
dir: .
```

The pulled Stripe view's `index.html` contains:

```html
<base href="/view/.pulled/driver.stripe/">
```

Therefore the server must serve the Cell root, not the pulled view folder.
The working URL is:

```text
http://localhost:4040/view/.pulled/driver.stripe/
```

This rendered the pulled Stripe view in its expected unconfigured/runtime-missing state.
That is a successful first soup-to-nuts composition proof:

```text
@sys.cell descriptor → @sys.tools.pull view artifact → @sys.tools.serve Cell root → browser view renders
```

## Solid design moves from the first proof
- `views` should compose tool configs, not duplicate pull/serve grammars.
- `@sys.cell/cell.yaml` currently points at both view operations:

  ```yaml
  views:
    pull: ./-config/@sys.tools.pull/view.yaml
    serve: ./-config/@sys.tools.serve/view.yaml
  ```

- `@sys.tools.pull/view.yaml` owns remote artifact acquisition.
- `@sys.tools.serve/view.yaml` owns plain static serving shape.
- Operator commands should stay Unix-light through `sys ... --config ...`; do not add `deno.json` tasks to Cell instances just to start tooling.
- Package-root sample tasks may demonstrate operation, but Cell instance folders stay ordinary/runtime-owned.
- Cell folders stay ordinary/runtime-owned; `-config/@sys.*` files are the contract surface.
- Port authority stays with the serving/runtime owner: static view uses the `@sys/tools/serve` default; Stripe runtime fixture uses the `@sys/driver-stripe` fixture default.
- Serving from the Cell root is important because pulled view artifacts may carry absolute/base-relative assumptions.
- `view/.pulled/` is a good managed artifact lane: hidden, ignored, colocated with view concerns.

## Emerging `@sys/cell/serve` direction
`@sys/tools/serve` proves static serving, but `@sys/cell/serve` should likely mean **serve a Cell**, not just serve a directory.

Likely responsibility:

```text
Cell descriptor + pulled views + future data/runtime routes → one coherent local server
```

Possible future shape:

```text
raw artifact:      /view/.pulled/driver.stripe/
logical Cell view: /-/view/stripe/
```

This suggests a light mount/proxy layer over `@sys/http/server` primitives:
- raw pulled bundles remain ordinary files
- Cell server owns logical view/data/runtime routes
- cloud deployment later maps more naturally to the same topology

Do not implement broadly yet; use this as a design pressure for the first real `Cell.serve(...)` slice.

## Runtime service taxonomy
Do not collapse Cell runtime to "HTTP server".

Likely service kinds:
- HTTP static: serve files and pulled bundles. Current default comes from `@sys/tools/serve` (`4040`).
- HTTP proxy/mount: map logical Cell paths onto raw artifacts or upstreams.
- Dynamic HTTP: Deno/Hono-style routes for Cell/data/runtime operations. Stripe fixture default is `9090`.
- WebSocket/Cmd: long-lived command/event channels, like CRDT repo daemon semantics.
- Local process/lifecycle: workers, watchers, indexers, background services.

Design rule:

> Cell runtime owns coherent service lifecycle; HTTP serving is only the first visible slice.

This keeps room for `@sys/std` Cmd semantics over WebSocket and non-HTTP local services without overloading the first static-view proof.

## Current juncture
We now have enough concrete signal to split next work into two tracks:

1. Pin the solid proto `@sys/cell` API/type surface.
   - Cell descriptor loading.
   - Root-relative path resolution.
   - Config composition references.
   - View pull/serve config discovery.

2. Flesh the runtime/server approach.
   - First `Cell.serve(...)` slice.
   - Static + proxy/mount topology.
   - Later dynamic HTTP and WebSocket/Cmd service lifecycle.

## Runtime binding decision
`@sys/driver-stripe/server/fixture` now exposes the fixture as an ESM lifecycle service:

```ts
import { StripeFixture } from '@sys/driver-stripe/server/fixture';
const server = await StripeFixture.start({ cwd, hostname, port });
```

Cell runtime declarations should point at that module API, not shell through `deno task fixture`.

Cell descriptor owns only the service envelope:

```yaml
runtime:
  services:
    - name: stripe
      kind: http-server
      from: '@sys/driver-stripe/server/fixture'
      export: StripeFixture
      driver: ./-config/@sys.driver-stripe/fixture.yaml
```

Field decisions:
- `from` is the ESM import specifier.
- `export` is the named service export.
- `kind: http-server` names the runtime role.
- `driver` is a Cell-root-relative path to service-owner config.

Driver-owned fixture config stays separate:

```yaml
hostname: 127.0.0.1
port: 9090
```

Runtime orchestrator guardrails for later:
- validate the Cell envelope before import
- restrict/allowlist service specifiers before dynamic import
- assert the selected export exposes async `start(...)`
- pass `{ cwd: cell.root, ...driverConfig }` into `start(...)`

Secrets stay in environment, not YAML.

## Open design questions

### 1. Pull APIs on `@sys/cell`
We need a Cell-native operation that composes existing pull config rather than reinventing it.

Candidate shapes:

```ts
Cell.pull(cell)
Cell.pull(cell, 'view')
Cell.View.pull(cell)
Cell.Data.pull(cell)
```

Current leaning:
- avoid committing too early to `Cell.View.*` if pull is a general Cell operation over named tool configs
- view pulls and data pulls may both use `@sys.tools.pull` configs
- perhaps first primitive is something like `Cell.Pull.run(cell, target)` or `Cell.pull(cell, { config: 'view' })`

Keep open until a first implementation slice forces the ergonomics.

### 2. View pull
Current sample declares:

```yaml
views:
  pull: ./-config/@sys.tools.pull/view.yaml
  serve: ./-config/@sys.tools.serve/view.yaml
```

This makes `views` a binding to existing tool configs, not a duplicate artifact or serve grammar.

Future proof target:
- `@sys/cell` can load a Cell descriptor
- find the view pull config
- run/compose the pull operation
- leave pulled artifacts under ignored `view/.pulled/`
- find the view serve config
- serve the Cell root so the pulled view's base paths resolve

### 3. Data pull / canon / skills
If Cells can pull remote view artifacts, they may also pull remote data/canon/skills packs.

This may be more like:

```ts
Cell.Data.pull(...)
```

or a general named pull config:

```yaml
data:
  root: ./data
  pull: ./-config/@sys.tools.pull/data.yaml
```

Potential use cases:
- canon packs
- skill packs
- seed datasets
- private managed file bundles

Do not decide yet whether this becomes `Cell.Data.pull()` or a generic `Cell.pull('data')`.

### 4. GitHub repo/archive pull
Current `@sys/tools/pull` GitHub support is `github:release` only.

Future extension candidate:

```yaml
bundles:
  - kind: github:archive
    repo: sys-repo/sys.canon
    ref: main
    local:
      dir: data/.pulled/sys.canon
```

or:

```yaml
kind: github:repo
```

Important distinction:
- reuse GitHub auth/client seams from `github:release`
- do not overload `github:release`
- whole repo/archive pull is a separate mechanism from release asset pulling

Likely future packet:

```text
feat(sys.tools): support GitHub repo archive pull bundles
```

### 5. Stable pull config files
Observed issue: `@sys/tools/pull` writes `lastUsedAt` into bundle config after pull.

This dirties checked-in source configs such as:

```text
-config/@sys.tools.pull/view.yaml
```

Separate `@sys/tools` packet recommended:

```text
fix(sys.tools): keep pull bundle configs stable after pull
```

Do not mix with Cell sample/API work.

## Guardrails
- Do not turn `@sys.cell/cell.yaml` into a mega-config.
- Do not duplicate `@sys.tools.pull` bundle grammar in Cell config.
- Keep `data/` as the Cell's stored-meaning compartment.
- Keep pulled artifacts under hidden/ignored managed folders such as `view/.pulled/`.
- Treat `dist.json` as artifact identity/provenance authority.
- Keep runtime pending until the sample forces the first honest dynamic/runtime contract.
- Prefer serving the Cell root over serving a pulled view folder directly when the view artifact carries absolute/base-relative paths.

## Next likely steps
1. Keep refining `-sample/cell.stripe` as the concrete design anchor.
2. Decide the smallest `@sys/cell` load shape for reading `@sys.cell/cell.yaml`.
3. Decide whether Cell pull/serve are namespaced by domain (`View`, `Data`) or generic over configured tool surfaces.
4. Decide the smallest `@sys/cell` operation that can compose the existing view pull+serve configs without shelling through CLI as its core API.
5. In a separate thread, remove/relocate `@sys/tools/pull` `lastUsedAt` source-config mutation.
6. In a later separate packet, add GitHub repo/archive pull support if Cell data/canon use cases require it.

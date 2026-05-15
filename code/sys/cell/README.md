# @sys/cell

A **Cell** is a folder-shaped [metamedium](https://en.wikipedia.org/wiki/Metamedia).

---

`@sys/cell` is the boot/composition kernel for that folder boundary.
It loads `cell.yaml`: a small descriptor that names trusted lifecycle services, finite tasks that run
to completion, and the owner config files those endpoints use.

Naming convention: **Cell** names the folder-shaped medium; `cell.yaml` names its descriptor;
`@sys/cell` names the package that loads and starts it.

#### State

Cell does not define the folder's ontology, state model, view model, or config schemas.
Those meanings live in ordinary files and in the endpoint modules that interpret them.
Those modules define their own contracts; Cell composes their endpoints.

Cell is late-bound by design. `cell.yaml` points to endpoint modules and config files; it does not
absorb their meanings. New media, workflows, and services enter through files and modules without
growing the kernel.

A Cell's state and meaning are carried by ordinary files that can function as a
[DSL](https://martinfowler.com/dsl.html) (domain-specific-language): their meaning can be
interpreted, viewed, and validly rewritten within the folder that bounds them.

#### Medium

Concretely, the medium is a folder of ordinary files: [Markdown][commonmark], [YAML][yaml],
[HTML][html], [TypeScript][typescript], [JSON][json], [binary data][octet-stream] (including
file-backed databases), and other file-carried forms.

[commonmark]: https://spec.commonmark.org/current/
[yaml]: https://yaml.org/spec/1.2.2/
[html]: https://html.spec.whatwg.org/
[typescript]: https://www.typescriptlang.org/docs/
[json]: https://www.rfc-editor.org/rfc/rfc8259
[octet-stream]: https://www.iana.org/assignments/media-types/application/octet-stream

**A Cell DSL may be "prose-shaped", semi-formal, or formal.** It can begin as plain text: Markdown
sections, naming conventions, folder layout, and other human-readable agreements that carry stable
meaning. When those meanings need enforcement, they can harden into YAML contracts, JSON schemas, or
TypeScript type surfaces.


```text
@sys/cell             boot/composition kernel
 ↓ dsl         🧬     stored meaning in ordinary files
 ↓ services    🧫     active interpretation by declared services
 ↓ view        👁️     owner-defined projections that make Cell state perceivable
 ```

<p>&nbsp;</p>

### Command Line `--help`

<!-- Sync note: this block mirrors the plain @sys/cell --help body. Refresh via: cd code/sys/cell && deno task cli --help. -->

```text
@sys/cell

A Cell is a folder-shaped metamedium whose ordinary files
carry DSL-shaped meaning that can be interpreted, viewed,
and validly rewritten within the folder that bounds it.
Agents must read `dsl` before changing Cell config, owner configs,
tasks, services, or routes, then read the matching chapter from the DSL chapter index.

Usage      deno run -ER   jsr:@sys/cell --help
           deno run -ER   jsr:@sys/cell dsl [chapter...] [--format human|skill]
           deno run -ERW  jsr:@sys/cell init [dir]
           deno run -ERWN jsr:@sys/cell task <name> [dir]
           deno run -ERWN jsr:@sys/cell start [dir]
           deno run -ERWN jsr:@sys/cell start [dir] --mode <mode>

Commands   dsl     agent must read first — root speech acts, owner rules, mappings, and chapter index
           init    initialize a folder as a Cell
           task    run a named trusted task from tasks[]
           start   start the Cell services

Options    -h, --help   show help
```

<p>&nbsp;</p>


## Prompting `cell dsl`

| Intent                    | [Speech act](https://en.wikipedia.org/wiki/Speech_act) examples:                       |
| ------------------------- | -------------------------------------------------------------------------------------- |
| create: Cell              | Initialize this folder as an `@sys/cell`.                                              |
| create: Cell at path      | Initialize `./foo` as an `@sys/cell`.                                                  |
| add: pulled view          | Add a pulled view from `<dist-url>`.                                                   |
| refresh: pulled views     | Pull latest configured views.                                                          |
| add: static serve service | Add an `@sys/tools/serve` static service for `<dir>`.                                  |
| add: service              | Add a service named `<service-name>` using endpoint `<endpoint>` from module `<module>`. |
| add: proxy service        | Add a proxy service named `<service-name>`.                                            |
| route: proxy root         | Route `/` to `<view/service/upstream>`.                                                |
| route: proxy mount        | Route `<path-prefix>` to `<view/service/upstream>`.                                    |
| run: task                 | Run a task named `<task-name>`.                                                        |
| start: services           | Start the **Cell** services.                                                           |
| start: services in mode   | Start services with complete variant bindings for `<mode>`.                            |

Sample slot values, not DSL grammar:

- `<dist-url>`: `https://fs.db.team/driver.stripe/dist.json`
- `<dist-url>`: `https://fs.db.team/ui.components/dist.json`
- `<service-name>`: `ui:static:views` for the sample static view service
- `<service-name>`: `stripe:dev:fixture` for the Stripe fixture service
- `<service-name>`: `cell:proxy` for the sample public proxy
- `<module>` / `<endpoint>`: `jsr:@sys/driver-stripe/server/fixture` / `StripeFixture`
- `<config>`: `./-config/@sys.driver-stripe/fixture.yaml`
- `<view>`: `stripe.dev`, `hello`

## Usage

### Programmatic

Start declared services:

```ts
import { Cell } from 'jsr:@sys/cell';

const cell = await Cell.load();
const started = await Cell.start(cell);

try {
  await Cell.Services.wait(started);
} finally {
  await started.close();
}
```

Select a declared service mode, such as a live development service binding:

```ts
const cell = await Cell.load();
const started = await Cell.start(cell, { mode: 'dev' });

try {
  await Cell.Services.wait(started);
} finally {
  await started.close();
}
```

Run a named task:

```ts
import { Cell } from 'jsr:@sys/cell';

const cell = await Cell.load('.');
await Cell.task(cell, 'sample:deploy');
```

For one-off task calls, pass a Cell root or omit it to use the current directory:

```ts
await Cell.task('.', 'sample:deploy');
await Cell.task('sample:deploy');
```

### CLI

Use `dsl` as the agent-facing [speech-act](https://en.wikipedia.org/wiki/Speech_act) help surface.

```sh
deno run -ER   jsr:@sys/cell --help
deno run -ERW  jsr:@sys/cell init --help
deno run -ER   jsr:@sys/cell dsl

deno run -ERWN jsr:@sys/cell task <task-name> .
deno run -ERWN jsr:@sys/cell start
deno run -ERWN jsr:@sys/cell start . --mode dev
```

## Service modes

A service may declare complete alternative endpoint bindings under `variants`. At start time,
`--mode <mode>` selects matching variants while preserving one conceptual service identity. Services
without the selected variant keep their base binding.

Mode is a Cell selection key, not an owner-service setting. It is not forwarded. Cell uses it to
choose a complete binding, then starts that endpoint through the same lifecycle contract as every
other service: Cell root, selected owner config ref, quiet output preference, and shutdown signal.
Everything behind the binding stays owned by the endpoint: ports, serving strategy, Vite/HMR
behavior, and config schema.

Live dev is the canonical example: keep a static service as the default `view` binding, and select a
Vite binding only for `mode: dev`:

```yaml
services:
  - name: view
    use: Serve
    from: 'jsr:@sys/tools/serve'
    config: ./-config/@sys.tools.serve/view.yaml
    variants:
      dev:
        use: ViteService
        from: 'jsr:@sys/driver-vite/service'
        config: ./-config/@sys.driver-vite/view.dev.yaml
```

Then start the dev binding:

```sh
deno run -ERWN jsr:@sys/cell start . --mode dev
```

The Vite path passes Cell's service-lifecycle proof: it starts through Cell, renders the selected
mode and module in status output, serves HTML containing Vite's `@vite/client`, serves the Vite client
module, serves the app entry module, and closes through Cell shutdown.

That proof stops at the dev-server boundary. Full browser HMR needs a browser-backed edit/update
proof. The Cell boundary stays the same.

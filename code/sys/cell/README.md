# @sys/cell

A **Cell** is a folder-shaped [metamedium](https://en.wikipedia.org/wiki/Metamedia).

[commonmark]: https://spec.commonmark.org/current/
[yaml]: https://yaml.org/spec/1.2.2/
[html]: https://html.spec.whatwg.org/
[typescript]: https://www.typescriptlang.org/docs/
[json]: https://www.rfc-editor.org/rfc/rfc8259
[octet-stream]: https://www.iana.org/assignments/media-types/application/octet-stream
[dsl]: https://en.wikipedia.org/wiki/Domain-specific_language

---

`@sys/cell` is the boot and composition kernel for a Cell: a folder boundary that gives ordinary
file state a declared runtime. It loads `-config/@sys.cell/cell.yaml` — a lightweight descriptor for
its optional stable `name`, trusted lifecycle `services`, finite `tasks` that run to completion, and
owner config files.

#### Terminology

**“Cell”** names the bounded medium — the folder itself. Its descriptor may declare its stable
identity, services, tasks, and owner configs. Root `version: 1` is the descriptor schema version,
not a Cell or package release version. `@sys/cell` names the package that loads the descriptor and
runs a Cell's lifecycle.

#### State

A Cell does not define the folder's ontology, state model, view model, or config schemas. Those
meanings live in ordinary files and in the endpoint modules that interpret them. The modules define
their own contracts; `@sys/cell` only composes their endpoints.

A Cell is [late-bound](https://en.wikipedia.org/wiki/Late_binding) by design:
`-config/@sys.cell/cell.yaml` points to endpoint modules and config files without absorbing their
meanings. New media, workflows, and services enter through files and modules without growing the
kernel.

A Cell's state and meaning are carried by ordinary files that can function as a [DSL][dsl]
(domain-specific-language): their meaning can be interpreted, viewed, and validly rewritten within
the folder that bounds them.

#### Medium

Concretely, the medium is a folder of ordinary files: [Markdown][commonmark], [YAML][yaml],
[HTML][html], [TypeScript][typescript], [JSON][json], [binary data][octet-stream] (including
file-backed databases), and any other file-carried forms.

A Cell's [DSL][dsl] may be **prose-shaped, semi-formal, or formal.** It can begin as plain text:
Markdown sections, naming conventions, folder layout, and other human-readable agreements that carry
stable meaning. When those meanings need enforcement, they can harden into YAML contracts, JSON
schemas, or TypeScript type surfaces.

```text
@sys/cell             boot/composition kernel
 ↓ dsl         🧬     stored meaning in ordinary files (state)
 ↓ services    🧫     active interpretation by declared services
 ↓ projection  👁️     owner-defined surfaces that make a Cell's state perceivable
```

<p>&nbsp;</p>

### Command Line `--help`

<!-- Sync note: this block mirrors the plain @sys/cell --help body. Refresh via: cd code/sys/cell && deno task cli --help. -->

```text
@sys/cell

A Cell is a folder with an explicit runtime contract.
Its ordinary files carry source material, owner configs, service/task descriptors,
and optional projections inside that folder boundary.
Agents must read `dsl` before changing `-config/@sys.cell/cell.yaml`, owner configs,
tasks, services, or routes, then read the matching DSL chapter.

Usage      deno run -ER   jsr:@sys/cell --help
           deno run -ER   jsr:@sys/cell dsl [chapter...] [--format human|skill]
           deno run -ER   jsr:@sys/cell info [dir]
           deno run -ERW  jsr:@sys/cell init [dir]
           deno run -ERW  jsr:@sys/cell migrate [dir]
           deno run -ERWN jsr:@sys/cell task <name> [dir]
           deno run -ERWN jsr:@sys/cell start [dir]
           deno run -ERWN jsr:@sys/cell start [dir] --mode <mode>
           deno run -ERWN jsr:@sys/cell start [dir] --reporter <auto|screen|raw>
           deno run -ERW --allow-run jsr:@sys/cell kill [dir]
           deno run -ERW --allow-run jsr:@sys/cell kill [dir] --mode <mode>

Commands   dsl       read the Cell editing contract, owner boundaries, mappings, and chapter index
           info      report descriptor facts without imports, probes, scans, or mutation
           init      initialize a folder as a Cell
           migrate   move a legacy descriptor to the canonical `-config/@sys.cell/cell.yaml` path
           task      run a named trusted task from tasks[]
           start     start a Cell's services
           kill      break-glass stop for running services

Options    -h, --help   show help
```

<p>&nbsp;</p>

## Prompting - [DSL][dsl] speech acts

| Intent                    | [Speech act](https://en.wikipedia.org/wiki/Speech_act) examples:                         |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| create: Cell              | Initialize this folder as an `@sys/cell`.                                                |
| create: Cell at path      | Initialize `./foo` as an `@sys/cell`.                                                    |
| add: pulled view          | Add a pulled view from `<manifest-url>` pinned by `<integrity>`.                         |
| refresh: pulled views     | Materialize checksum-pinned configured views.                                            |
| add: static serve service | Add an `@sys/tools/serve` static service for `<dir>`.                                    |
| add: service              | Add a service named `<service-name>` using endpoint `<endpoint>` from module `<module>`. |
| add: proxy service        | Add a proxy service named `<service-name>`.                                              |
| route: proxy root         | Route `/` to `<view/service/upstream>`.                                                  |
| route: proxy mount        | Route `<path-prefix>` to `<view/service/upstream>`.                                      |
| run: task                 | Run a task named `<task-name>`.                                                          |
| start: services           | Start a Cell's services.                                                                 |
| start: services in mode   | Start services with complete variant bindings for `<mode>`.                              |

Sample slot values, not DSL grammar:

- `<manifest-url>`: `https://fs.db.team/driver.stripe/dist.json`
- `<manifest-url>`: `https://fs.db.team/ui.components/dist.json`
- `<integrity>`: publisher-provided `sha256-<exact-manifest-byte-hash>`
- `<service-name>`: `ui:static:views` for the sample static view service
- `<service-name>`: `stripe:dev:fixture` for the Stripe fixture service
- `<service-name>`: `cell:proxy` for the sample public proxy
- `<module>` / `<endpoint>`: `jsr:@sys/driver-stripe/server/fixture` / `StripeFixture`
- `<config>`: `./-config/@sys.driver-stripe/fixture.yaml`
- `<view>`: `stripe.dev`, `hello`

<p>&nbsp;</p>

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

Run a named task. A task may be a single endpoint or a sequence of named tasks.

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
deno run -ER   jsr:@sys/cell info .

deno run -ERWN jsr:@sys/cell task <task-name> .
deno run -ERWN jsr:@sys/cell start --reporter auto
deno run -ERWN jsr:@sys/cell start . --mode dev --reporter auto
```

`--reporter auto` is the default: interactive terminals use the Cell-owned responsive screen, while
non-interactive output remains append-only. Use `--reporter raw` to preserve terminal history or
`--reporter screen` to require the interactive screen explicitly.

# @sys/cell

A **Cell** is a folder-shaped [metamedium](https://en.wikipedia.org/wiki/Metamedia).

---

`@sys/cell` is the Cell's boot/composition microkernel: it does not define the Cell's state model or
ontology; it composes owner services that in turn interpret the Cell state.

A Cell's state is carried by ordinary files that can function as a
[DSL](https://martinfowler.com/dsl.html): their meaning can be interpreted, viewed, and validly
rewritten within the folder that bounds them.

Concretely, the medium is a folder of ordinary files: [Markdown][commonmark], [YAML][yaml],
[TypeScript][typescript], [JSON][json], [binary data][octet-stream], and other file-carried forms.

[commonmark]: https://spec.commonmark.org/current/
[yaml]: https://yaml.org/spec/1.2.2/
[typescript]: https://www.typescriptlang.org/docs/
[json]: https://www.rfc-editor.org/rfc/rfc8259
[octet-stream]: https://www.iana.org/assignments/media-types/application/octet-stream

The DSL may be formal or semi-formal: a JSON schema, a YAML contract, a TypeScript type surface, or
Markdown whose structure, conventions, and "prose schema" carry stable meaning.

`@sys/cell` marks the folder boundary, loads the Cell descriptor, composes trusted services, and
runs finite tasks. Owner packages name and interpret sub-roots such as `./data`, `./view`, or other
service-specific config paths.

```text
@sys/cell               boot/composition kernel
 ↓ dsl      🧬          stored meaning in ordinary files
 ↓ services 🧫          active interpretation by declared services
 ↓ view     👁️          owner-defined projections that make Cell state perceivable
```

### Command Line `--help`

<!-- Sync note: this block mirrors the plain @sys/cell --help body. Refresh via: cd code/sys/cell && deno task cli --help. -->

```text
@sys/cell

A Cell is a folder-shaped metamedium whose ordinary files
carry DSL-shaped meaning that can be interpreted, viewed,
and validly rewritten within the folder that bounds it.
Run `dsl` first before changing Cell config, owner configs,
tasks, services, or routes.

Usage      deno run -ER   jsr:@sys/cell --help
           deno run -ER   jsr:@sys/cell dsl [chapter...] [--format human|skill]
           deno run -ERW  jsr:@sys/cell init [dir]
           deno run -ERWN jsr:@sys/cell task <name> [dir]
           deno run -ERWN jsr:@sys/cell start [dir]

Commands   dsl     run first — maps Cell acts, owner rules, tasks, services, and chapters
           init    initialize a folder as a Cell
           task    run a named trusted task from tasks[]
           start   start the Cell services

Options    -h, --help   show help
```

<p>&nbsp;</p>

## Prompting `cell dsl`

| Intent                   | [Speech act](https://en.wikipedia.org/wiki/Speech_act) examples:    |
| ------------------------ | ------------------------------------------------------------------- |
| create: **Cell**         | Initialize this folder as an `@sys/cell`.                           |
| create: **Cell** at path | Initialize `./foo` as an `@sys/cell`.                               |
| add: pulled view         | Add a pulled view from `<dist-url>`.                                |
| refresh: pulled views    | Pull latest configured views.                                       |
| add: static HTTP service | Add an `@sys/http` static service for `<view>`.                     |
| add: service             | Add a service named `<service-name>` using `<@scope/pkg>/<export>`. |
| add: proxy service       | Add a proxy service named `<service-name>`.                         |
| route: proxy root        | Route `/` to `<view/service/upstream>`.                             |
| route: proxy mount       | Route `<path-prefix>` to `<view/service/upstream>`.                 |
| run: task                | Run a task named `<task-name>`.                                     |
| start: services          | Start the **Cell** services.                                        |

<p>&nbsp;</p>

Sample slot values, not DSL grammar:

- `<dist-url>`: `https://fs.db.team/driver.stripe/dist.json`
- `<dist-url>`: `https://fs.db.team/ui.components/dist.json`
- `<service-name>`: `ui:static:views` for the sample static view service
- `<service-name>`: `stripe:dev:fixture` for the Stripe fixture service
- `<service-name>`: `cell:proxy` for the sample public proxy
- `<@scope/pkg>/<export>`: `@sys/driver-stripe/server/fixture` / `StripeFixture`
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

Run a named task:

```ts
import { Cell } from 'jsr:@sys/cell';

const cell = await Cell.load('.');
await Cell.task(cell, 'sample:deploy');
```

### CLI

Use `dsl` as the agent-facing speech-act help surface.

```sh
deno run -ER   jsr:@sys/cell --help
deno run -ERW  jsr:@sys/cell init --help
deno run -ER   jsr:@sys/cell dsl

deno run -ERWN jsr:@sys/cell task sample:deploy .
deno run -ERWN jsr:@sys/cell start
```

<p>&nbsp;</p>

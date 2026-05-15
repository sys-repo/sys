# @sys/cell

A **Cell** is a folder-shaped [metamedium](https://en.wikipedia.org/wiki/Metamedia).

---

`@sys/cell` is the boot and composition kernel for a Cell: a folder boundary that lets
ordinary files behave as one coherent medium.
It loads `cell.yaml`: a lightweight descriptor that names trusted lifecycle services, finite tasks
that run to completion, and the owner config files those endpoints use.

Terminology: **Cell** names the bounded medium — the folder itself. `cell.yaml` names its
descriptor: the declaration of services, tasks, and owner config refs. `@sys/cell` names the package
that loads the descriptor and runs the Cell lifecycle.

#### State

Cell does not define the folder's ontology, state model, view model, or config schemas.
Those meanings live in ordinary files and in the endpoint modules that interpret them.
The modules define their own contracts; Cell composes their endpoints.

Cell is [late-bound](https://en.wikipedia.org/wiki/Late_binding) by design. `cell.yaml` points to
endpoint modules and config files; it does not absorb their meanings. New media, workflows, and
services enter through files and modules without growing the kernel.

A Cell's state and meaning are carried by ordinary files that can function as a [DSL][dsl]
(domain-specific-language): their meaning can be interpreted, viewed, and validly rewritten within
the folder that bounds them.

#### Medium

Concretely, the medium is a folder of ordinary files: [Markdown][commonmark], [YAML][yaml],
[HTML][html], [TypeScript][typescript], [JSON][json], [binary data][octet-stream] (including
file-backed databases), and any other file-carried forms.

[commonmark]: https://spec.commonmark.org/current/
[yaml]: https://yaml.org/spec/1.2.2/
[html]: https://html.spec.whatwg.org/
[typescript]: https://www.typescriptlang.org/docs/
[json]: https://www.rfc-editor.org/rfc/rfc8259
[octet-stream]: https://www.iana.org/assignments/media-types/application/octet-stream
[dsl]: https://martinfowler.com/dsl.html

**A Cell [DSL][dsl] may be prose-shaped, semi-formal, or formal.** It can begin as plain text:
Markdown sections, naming conventions, folder layout, and other human-readable agreements that carry
stable meaning. When those meanings need enforcement, they can harden into YAML contracts, JSON
schemas, or TypeScript type surfaces.

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

Use `dsl` for Cell edit language: speech acts, mappings, owner boundaries, and operational
examples. The README gives the shape; the DSL help carries the working rules.

```sh
deno run -ER jsr:@sys/cell dsl
deno run -ER jsr:@sys/cell dsl examples
```

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

deno run -ERWN jsr:@sys/cell task <task-name> .
deno run -ERWN jsr:@sys/cell start
deno run -ERWN jsr:@sys/cell start . --mode dev
```

# @sys/cell

A **Cell** is a folder-shaped [metamedium](https://en.wikipedia.org/wiki/Metamedia).

---

Its state is a [DSL](https://martinfowler.com/dsl.html): ordinary files whose meaning can be
interpreted, viewed, and validly rewritten within the folder that bounds it.

Concretely, the medium is a folder of ordinary files: Markdown, YAML, TypeScript, JSON, binary data,
and other file-carried forms.

The DSL may be formal or semi-formal: a JSON schema, a YAML contract, a TypeScript type surface, or
Markdown whose structure, conventions, and "prose schema" carry stable meaning.

```text
@sys/cell
 ↓ dsl      🧬
 ↓ runtime  🧫
 ↓ view     👁️
```

```
DSL      =  stored meaning              ./data
Runtime  =  ƒ(active interpretation)    Cell.Runtime.start(🧫)
View     =  bound perception            ./view
```

<p>&nbsp;</p>

## Prompting `dsl --help`

| Intent                          | Example [speech-acts](https://en.wikipedia.org/wiki/Speech_act)               |
| ------------------------------- | -------------------------------------------------------------------- |
| create: **Cell**                | Initialize this folder as an `@sys/cell`.                            |
| create: **Cell** at path        | Initialize `./foo` as an `@sys/cell`.                                |
| add: pulled view                | Add a pulled view from `<dist-url>`.                                 |
| refresh: pulled views           | Pull latest configured views.                                        |
| add: static HTTP service (view) | Add a static HTTP service for `<view>`.                              |
| add: runtime service            | 🐷                                                                   |
| add: proxy service              | Add a proxy service named `<service-name>`.                          |
| route: proxy root               | Route `/` to `<view/service/upstream>`.                              |
| route: proxy mount              | Route `<path-prefix>` to `<view/service/upstream>`.                  |

Sample slot values, not DSL grammar:

- `<dist-url>`: `https://fs.db.team/driver.stripe/dist.json`
- `<dist-url>`: `https://fs.db.team/ui.components/dist.json`
- `<service-name>`: `stripe` for the Stripe fixture service
- `<service-name>`: `app` for the sample public proxy
- `<view>`: `stripe.dev`, `hello`

<p>&nbsp;</p>

## Programmatic

```ts
import { Cell } from 'jsr:@sys/cell';

const cell = await Cell.load('.');
const runtime = await Cell.Runtime.start(cell);
await runtime.close('done');
```

## CLI

Use `dsl` as the agent-facing speech-act help surface.

```sh
deno run jsr:@sys/cell --help
deno run jsr:@sys/cell init --help
deno run jsr:@sys/cell dsl
```

<p>&nbsp;</p>

---
## Development

```md
  ### DEBUG: simulate published `@sys/cell` usage

  Use `./-sample/foo/` as the working folder and behave as if you are in a virgin user project, not inside the `sys` source repo.
  Do not inspect `code/sys/cell/src/` or any package source code. 
  Treat `@sys/cell` as a published package.

  Use only the public CLI/help surfaces to understand the DSL and owner flows:

      deno run jsr:@sys/cell --help
      deno run jsr:@sys/cell dsl

  When another owner package is needed, discover it through its own --help surface before using it. 
  Do not hand-author owner YAML when an owner CLI/API can writeit.

  Now interpret the next human prompt as a Cell DSL speech-act and operate only from these public help surfaces.
```


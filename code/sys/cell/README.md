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

## Prompting `--dsl`

| Intent                          | [Speech act](https://en.wikipedia.org/wiki/Speech_act) |
| ------------------------------- | ------------------------------------------------------ |
| create: **Cell**                | Initialize this folder as an `@sys/cell`.              |
| create: **Cell** at path        | Initialize `./foo` as an `@sys/cell`.                  |
| add: pulled view                | 🐷                                                      |
| add: local view                 | 🐷                                                      |
| add: static HTTP service (view) | 🐷                                                      |
| add: runtime service            | 🐷                                                      |
| add: proxy service              | 🐷                                                      |

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

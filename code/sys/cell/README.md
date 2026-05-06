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

| Intent                          | [Speech-acts](https://en.wikipedia.org/wiki/Speech_act) examples:     |
| ------------------------------- | -------------------------------------------------------------------- |
| create: **Cell**                | Initialize this folder as an `@sys/cell`.                            |
| create: **Cell** at path        | Initialize `./foo` as an `@sys/cell`.                                |
| add: pulled view                | Add a pulled view from `<dist-url>`.                                 |
| refresh: pulled views           | Pull latest configured views.                                        |
| add: static HTTP service (view) | Add a static HTTP service for `<view>`.                              |
| add: runtime service            | Add a service named `<service-name>` using `<@scope/pkg>/<export>`.  |
| add: proxy service              | Add a proxy service named `<service-name>`.                          |
| route: proxy root               | Route `/` to `<view/service/upstream>`.                              |
| route: proxy mount              | Route `<path-prefix>` to `<view/service/upstream>`.                  |
| start: runtime                  | Start the **Cell** runtime.                                              |

<p>&nbsp;</p>

Sample slot values, not DSL grammar:

- `<dist-url>`: `https://fs.db.team/driver.stripe/dist.json`
- `<dist-url>`: `https://fs.db.team/ui.components/dist.json`
- `<service-name>`: `stripe` for the Stripe fixture service
- `<service-name>`: `app` for the sample public proxy
- `<kind>`: `http-server` for the Stripe fixture service
- `<@scope/pkg>/<export>`: `@sys/driver-stripe/server/fixture` / `StripeFixture`
- `<config>`: `./-config/@sys.driver-stripe/fixture.yaml`
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
deno run -A jsr:@sys/cell start .
```

<p>&nbsp;</p>

---
## Development

**Debug:** simulate published `@sys/cell` usage:

```md

  Use `./-sample/foo/` as the working folder and behave as if you are in a virgin user project, not inside the `sys` source repo.
  Treat `@sys/cell` as a published package.
  Do not inspect local workspace source such as `code/sys/cell/src/` while simulating published-package usage.

  Start from public CLI/help surfaces to understand the DSL and owner flows:

      deno run jsr:@sys/cell --help
      deno run jsr:@sys/cell dsl

  When another owner package is needed, discover it through its own --help surface before using it.
  If a module/export contract is still ambiguous, inspect the published JSR package docs/source for that specifier.
  Use source inspection only to confirm public exports, types, and lifecycle contracts.
  Do not use source inspection to bypass owner CLI/API config affordances.
  Do not hand-author owner YAML when an owner CLI/API can write it.

  Now interpret the next human prompt as a Cell DSL speech-act and operate from public help surfaces first.
```


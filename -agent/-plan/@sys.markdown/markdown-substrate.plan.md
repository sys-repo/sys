# Markdown substrate

- [ ] plan(create): markdown substrate
- [ ] feat(markdown): add canonical markdown core substrate
- [ ] feat(markdown): add safe markdown html and frontmatter surfaces

## Purpose

Add `@sys/markdown` as the system Markdown substrate, parallel in spirit to `@sys/yaml`: a small,
truthful, typed wrapper over best-of-industry parsing/rendering primitives.

This plan is a ready-to-start marker only. Do not treat it as approval to scaffold or implement until
that work is explicitly opened.

## Decision

Create a dedicated package:

```text
@sys/markdown
```

Do not hide Markdown under `@sys/text/markdown`. Markdown is a document language with AST,
rendering, sanitization, frontmatter, source positions, and editor-parser futures. That is a package
boundary, not a string-helper submodule.

## Upstream substrate

Root on the unified syntax-tree stack:

```text
micromark
mdast-util-from-markdown
mdast-util-to-markdown
mdast-util-gfm
micromark-extension-gfm
mdast-util-to-hast
hast-util-to-html
hast-util-sanitize
```

Frontmatter lane:

```text
micromark-extension-frontmatter
mdast-util-frontmatter
@sys/yaml
```

Potential future editor lane:

```text
@lezer/markdown
```

`@lezer/markdown` is promising for Monaco/CodeMirror/editor-adjacent work, but it should not be the
root canonical document parser.

## Research snapshot

Registry probes run during planning, using npm registry/search and downloads APIs.

Last-month download signal:

| Package | Downloads | Read |
|---|---:|---|
| `marked` | ~221M | fast renderer, not canonical AST substrate |
| `mdast-util-from-markdown` | ~182M | Markdown → MDAST |
| `micromark` | ~179M | CommonMark tokenizer/parser substrate |
| `mdast-util-to-markdown` | ~153M | MDAST → Markdown |
| `markdown-it` | ~108M | battle-tested renderer/plugin ecosystem |
| `hast-util-sanitize` | ~31M | safe HTML boundary |
| `mdast-util-frontmatter` | ~24M | frontmatter AST support |
| `micromark-extension-frontmatter` | ~22M | frontmatter parser extension |
| `@lezer/markdown` | ~13M | incremental/editor parser |
| `commonmark` | ~2.8M | spec parser, lower modern ecosystem pull |

Before implementation, refresh package versions and maintenance signals. Do not freeze this snapshot
as dependency authority.

## API seed

Keep the public surface small and direct:

```ts
import { Markdown } from '@sys/markdown';

const ast = Markdown.parse(src);
const text = Markdown.stringify(ast.data);
const html = Markdown.Html.render(src);
const doc = Markdown.Frontmatter.parse(src);
```

Initial conceptual surface:

```ts
Markdown = {
  parse,
  stringify,
  Html,
  Frontmatter,
  Is,
  Diagnostic,
};
```

`parse` should expose MDAST truth rather than invent a parallel `@sys` Markdown AST.
`stringify` should serialize from that AST through the upstream serializer.

## Security posture

Markdown parsing is document parsing. Markdown HTML rendering is a security boundary.

Default HTML rendering must be safe for untrusted input:

```ts
Markdown.Html.render(src); // sanitized default
Markdown.Html.render(src, { trust: 'untrusted' });
Markdown.Html.render(src, { trust: 'trusted' }); // explicit raw/trusted lane
```

Do not silently pass raw HTML through a default renderer.

## Package shape

Expected export shape:

```text
.
./core
./html
./frontmatter
./t
./types
```

Use the normal `@sys` package/module skeleton and dependency authority. Dependency changes belong in
`deps.yaml`, followed by `deno task prep` from the workspace root when implementation begins.

## First implementation slice

Narrow first pass:

1. scaffold `@sys/markdown` deliberately from the package template;
2. add the dependency set through `deps.yaml`;
3. implement core Markdown → MDAST parse;
4. implement MDAST → Markdown stringify;
5. implement Markdown → sanitized HTML render;
6. implement frontmatter split/parse using `@sys/yaml` for YAML semantics;
7. prove browser/server-safe imports.

## Test/proof seed

Initial tests should cover:

- CommonMark headings, lists, code fences, links;
- GFM tables and task-list items if GFM is enabled by default;
- Markdown → AST → Markdown round-trip shape;
- unsafe raw HTML sanitized by default;
- trusted/raw HTML requires explicit option;
- YAML frontmatter parsed via `@sys/yaml`;
- module exports and type surface shape.

## TMIND constraints

- Do not expose unified processor/plugin soup as the root mental model.
- Do not invent a fake Markdown AST.
- Do not use `marked` or `markdown-it` as the canonical core without a concrete reason.
- Do not optimize for raw rendering speed before measuring a real bottleneck.
- If a faster renderer becomes necessary, add it as an adapter or implementation detail, not as the
  source of canonical document truth.
- Keep editor parser work separate until Monaco/CodeMirror needs are concrete.

## Open questions

- Should GFM be default-on for system Markdown, or explicit per parse/render call?
- What exact sanitization schema is the first `@sys` default?
- Should frontmatter be represented as a distinct document envelope type or as a parse option that
  returns `{ frontmatter, markdown, ast }`?

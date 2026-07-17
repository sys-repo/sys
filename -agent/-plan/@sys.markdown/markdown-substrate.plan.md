# Markdown substrate

Status: **retired after final plan commit**.

- [x] 676b6e8cf `chore(tmpl:pkg): scaffold markdown for @sys/markdown`
- [x] 3f64ec39d `feat(markdown): add canonical markdown core substrate`
- [x] f96caf197 `feat(markdown): add safe markdown html rendering`
- [x] c9ea433f4 `feat(markdown): add markdown frontmatter surface`

## Final reality

`@sys/markdown` is now the system Markdown substrate.

The package lives at:

```text
code/sys/markdown
```

Public export shape remains deliberately small:

```text
.
./t
./types
```

The public runtime surface is:

```ts
Markdown.parse(src);
Markdown.stringify(ast);
Markdown.Is.ast(input);
Markdown.Html.render(input);
Markdown.Frontmatter.parse(src);
```

The root package remains free of UI, DOM, browser, filesystem, editor, CLI, PDF, and React coupling.

## Landed surfaces

### Core Markdown

Core landed in `3f64ec39d`.

- Markdown text parses to real MDAST roots.
- MDAST roots stringify back to Markdown.
- Result shape is `{ data } | { error }`.
- Default flavor is GFM.
- Explicit `flavor: 'commonmark'` is supported.
- The package exposes real upstream syntax-tree types; it does not invent a fake Markdown AST.

Core dependency lane:

```text
mdast-util-from-markdown
mdast-util-to-markdown
mdast-util-gfm
micromark-extension-gfm
@types/mdast as mdast
@types/unist as unist
```

### Safe Markdown HTML

Safe HTML rendering landed in `f96caf197`.

- Public API: `Markdown.Html.render(input, options?)`.
- Input may be Markdown source text or an existing MDAST root.
- Rendering is safe-by-default for untrusted Markdown.
- Raw/trusted HTML lanes were intentionally not added.
- Runtime graph proof keeps browser/UI/React/fs substrates out.

HTML dependency lane:

```text
mdast-util-to-hast
hast-util-sanitize
hast-util-to-html
```

### Markdown frontmatter

Frontmatter landed in `c9ea433f4`.

- Public API: `Markdown.Frontmatter.parse<T>(src, options?)`.
- Frontmatter parsing is explicit; root `Markdown.parse` remains the core Markdown parser.
- YAML frontmatter is parsed through `@sys/yaml`.
- The result includes optional parsed frontmatter, stripped Markdown body, and body MDAST.
- Only YAML frontmatter landed; no TOML, stringify, fs, or HTML coupling was added.
- Default body flavor is GFM; explicit CommonMark is supported.

Frontmatter dependency lane:

```text
mdast-util-frontmatter
micromark-extension-frontmatter
@sys/yaml
```

## Final proof status

Final package validation passed from `code/sys/markdown`:

```text
deno task check
deno task test
deno task dry
```

Test/proof coverage includes:

- public surface composition and type shape;
- CommonMark parsing;
- default GFM parsing;
- Markdown stringify shape;
- parse/stringify error normalization;
- safe HTML rendering;
- unsafe raw HTML sanitization;
- unsafe `javascript:` link sanitization;
- HTML rendering from source and from existing MDAST;
- YAML frontmatter parsing via `@sys/yaml`;
- stripped Markdown body output;
- body MDAST parsing;
- no-frontmatter success;
- invalid YAML normalized errors;
- unclosed frontmatter normalized errors;
- runtime graph boundaries excluding fs, UI, browser, React, and accidental HTML/frontmatter coupling.

## Decisions retained

- `@sys/markdown` is the right package boundary; Markdown is a document language, not a text helper.
- MDAST is the canonical AST substrate.
- Root `Markdown.parse` is not a frontmatter parser.
- `Markdown.Frontmatter.parse` owns frontmatter as explicit document metadata behavior.
- `Markdown.Html.render` is the only HTML rendering primitive and is safe-by-default.
- No unified processor/plugin soup is exposed as the root API.
- No framework, DOM, UI, filesystem, editor, CLI, PDF, or React coupling belongs in the core substrate.

## Follow-up candidates outside this plan

These are not blockers and should become separate plans only if/when concrete work is requested:

- migrate `model-slug` frontmatter helpers to `Markdown.Frontmatter`;
- migrate future `Prose.Markdown` rendering to `Markdown.Html.render`;
- consider Markdown frontmatter stringify only if a real producer surface needs it;
- consider a Lezer/editor adapter only when Monaco/CodeMirror parsing needs are concrete;
- keep PDF generation, Markdown MIME recognition, and Markdown authoring templates outside this package unless a real owner surface emerges.

## Retirement

The substrate arc is complete.

Recommended plan-retirement commit message:

```text
docs(plan): retire markdown substrate plan
```

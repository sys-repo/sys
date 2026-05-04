# @sys/cli code block formatting plan

## Goal

Add a small, stable code-block formatting primitive to `@sys/cli` so terminal help can render structured snippets such as YAML descriptors cleanly.

This fixes cases where a multi-line code block is currently forced through a two-column table, producing awkward output such as:

```text
Descriptor   ```yaml
               kind: cell
               version: 1
             ```
```

Target shape:

```text
Descriptor
  kind: cell
  version: 1

  dsl:
    root: ./data

  views: {}

  runtime:
    services: []
```

## Design

Add a primitive under `@sys/cli/fmt`:

```ts
Fmt.Code.block(text, {
  lang: 'yaml',
  indent: 2,
  fence: false,
});
```

Initial implementation should be dependency-free:

- no syntax highlighting yet
- normalize edge newlines
- preserve internal blank lines
- indent each rendered line
- optionally include a fenced code marker
- optionally color the whole block with existing ANSI helpers, but do not tokenize

Suggested type shape:

```ts
type CliFormatCodeBlockOptions = {
  readonly lang?: string;
  readonly indent?: number;
  readonly fence?: boolean;
  readonly tone?: 'default' | 'muted';
};
```

Suggested API:

```ts
Fmt.Code.block(text: string, options?: CliFormatCodeBlockOptions): string
```

## Non-goal for first pass

Do not add syntax-highlighting dependencies in the first pass.

The immediate value is layout correctness and a shared primitive. Syntax highlighting is a separate enhancement.

## Future syntax highlighting

For canonical, world-class, long-lived terminal code highlighting, prefer Shiki.

Possible future API:

```ts
await Fmt.Code.highlight(text, {
  lang: 'yaml',
  theme: 'github-dark',
  indent: 2,
  fence: false,
});
```

Why Shiki:

- VS Code grammar/theme lineage
- strong language coverage including YAML and TypeScript
- widely used and maintained
- higher-quality highlighting than ad-hoc regex or basic terminal highlighters

Potential costs:

- async setup
- heavier dependency
- theme/grammar loading complexity
- should not be pulled into simple CLI help paths unless intentionally chosen

## STIER guidance

Do not import Shiki directly into leaf packages such as `@sys/cell`.

Instead:

1. Add `Fmt.Code.block` to `@sys/cli` now.
2. Use it from `@sys/cell` descriptor rendering.
3. Add Shiki-backed highlighting later behind the same `Fmt.Code` seam if needed.

This keeps leaf CLI code simple and makes terminal code rendering a shared CLI-library responsibility.

## Suggested commit split

### Commit 1

```text
feat(cli): add code block formatter

- add Fmt.Code.block for terminal code snippets
- support indentation and optional fences
- keep implementation dependency-free
- add tests for blank lines and indentation
```

### Commit 2

```text
refactor(cell): use cli code formatter for descriptor help

- render init agent descriptor as a code block outside table rows
- preserve descriptor YAML layout in terminal help
- remove inline fence/table formatting from Cell help formatter
```

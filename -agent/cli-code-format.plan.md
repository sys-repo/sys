# @sys/cli code block formatting plan

## Status

Completed. The shipped scope is a dependency-free `Fmt.Code.block(...)` layout primitive behind `@sys/cli/fmt/code`, plus `@sys/cell` descriptor-help adoption. No syntax highlighter and no `Fmt.Code.highlight(...)` helper were implemented.

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

Add one named formatting noun through the isolated `@sys/cli/fmt/code` leaf:

```ts
Fmt.Code.block(text, {
  lang: 'yaml',
  indent: 2,
  fence: false,
});
```

Do not grow the base `@sys/cli/fmt` surface as a flat bag of code-related helpers. Keep base `/fmt` clean; the isolated `@sys/cli/fmt/code` leaf owns the extended `Fmt.Code` surface, and code-formatting growth happens below that noun.

Also expose an isolated leaf import:

```ts
import { Code, Fmt } from '@sys/cli/fmt/code';

Code.block(yaml, { indent: 2 });
Fmt.Code.block(yaml, { indent: 2 });
```

This leaf should pull in the clean base formatting surface and extend it:

```ts
import { Fmt as Base } from '../m.Fmt/mod.ts';
import { Code } from './m.Code.ts';

export const Fmt: t.CliFormatCode.Fmt.Lib = {
  ...Base,
  Code,
};
```

Avoid cycles by keeping `@sys/cli/fmt` free of `Code`; the `/fmt/code` leaf imports and extends the base formatter.

Suggested file shape:

```text
src/m.core/
  m.Fmt/
    m.Fmt.ts           ← clean base formatter, no Code
    t.ts               ← CliFormat namespace

  m.Fmt.Code/
    mod.ts             ← leaf exports: extended Fmt, Code, types
    m.Code.ts          ← Code implementation
    t.ts               ← CliFormatCode namespace
    -test/-.test.ts
```

Add the package subpath:

```json
"./fmt/code": "./src/m.core/m.Fmt.Code/mod.ts"
```

Initial implementation should be dependency-free:

- no syntax highlighting yet
- use existing string primitives such as `Str.trimEdgeNewlines`
- preserve internal blank lines
- indent non-empty rendered lines
- keep blank lines truly blank by default
- optionally include indented fenced code markers
- optionally color the whole block with existing ANSI helpers, but do not tokenize

Type shape should follow namespace contracts:

```ts
export declare namespace CliFormatCode {
  export type Lib = {
    block(text: string, options?: BlockOptions): string;
  };

  export type BlockOptions = {
    readonly lang?: string;
    readonly indent?: number;
    readonly fence?: boolean;
    readonly tone?: Tone;
  };

  export type Tone = 'default' | 'muted';
}
```

`CliFormat` should expose the existing formatter surface as a namespaced `Lib` and stay free of `Code`:

```ts
export declare namespace CliFormat {
  export type Lib = {
    // existing formatter surface only: no Code
  };
}
```

Do not introduce `CliFormat.BaseLib`. Do not keep `CliFormatLib` as immediate scar-tissue compatibility. Update current call sites to `CliFormat.Lib`.

The code leaf owns the extension type:

```ts
export declare namespace CliFormatCode {
  export type Lib = {
    block(text: string, options?: BlockOptions): string;
  };

  export namespace Fmt {
    export type Lib = t.CliFormat.Lib & {
      readonly Code: CliFormatCode.Lib;
    };
  }
}
```

## Non-goal for first pass

Do not add syntax-highlighting dependencies in the first pass.

Do not create a cross-runtime code-rendering abstraction in this pass. This work is the ANSI terminal-string primitive for `@sys/cli`. A later HTML/UI version belongs in the `@sys/ui` family after a real UI need exists.

The immediate value is layout correctness and a shared primitive. Syntax highlighting is a separate enhancement.

`Fmt.Code.block(...)` is not a precompiled highlighter. It is the dependency-free layout primitive: trim, preserve blank lines, indent, optional fence, optional whole-block tone. Shiki-backed highlighting should be a separate async API layered behind the same `Fmt.Code` namespace later.

## Future syntax highlighting

For canonical, world-class, long-lived terminal code highlighting, prefer Shiki.

No highlighting API exists in this pass. A possible future API could be:

```ts
await Fmt.Code.highlight(text, {
  lang: 'yaml',
  theme: 'monokai',
  indent: 2,
  fence: false,
});
```

Default theme decision:

Use Monokai as the default syntax-highlighting theme.

Why Monokai is STIER-defensible:

- wildly familiar to developers across editors and decades
- immediately recognizable as code rather than prose
- high-contrast without feeling novelty-themed
- tasteful enough to be a house default while still conventional
- supported by Shiki/VS Code theme lineage

Do not make theme choice a leaf-package concern. `@sys/cli` should own the default. Leaf packages may override only when they have a strong product reason.


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

1. Tidy the existing `@sys/cli` formatter contract into namespace-shaped types before adding new surface.
2. Add `Fmt.Code.block` to `@sys/cli` now.
3. Expose `@sys/cli/fmt/code` as the isolated leaf import that extends the base formatter with `Code`.
4. Use `Fmt.Code.block` from `@sys/cell` descriptor rendering.
5. Add Shiki-backed highlighting later behind the same `Fmt.Code` seam if needed.

This keeps leaf CLI code simple and makes terminal code rendering a shared CLI-library responsibility.

## Pre-flight tidy

Before adding `Code`, do a narrow type-shape refactor in `@sys/cli`:

- introduce `CliFormat.Lib` for the existing formatter contract
- remove `CliFormatLib` instead of retaining a compatibility scar
- update internal annotations toward `t.CliFormat.Lib` and named namespace contracts
- keep `@sys/cli/fmt` runtime behavior and surface unchanged
- avoid broad behavior changes
- prove the refactor with existing `@sys/cli` formatter tests

This prevents the new code formatter from entrenching the older flat `CliFormatLib` shape.

## Completed commit split

### Commit 0

```text
refactor(cli): namespace formatter type surface

- introduce CliFormat.Lib for the existing formatter contract
- remove the old flat CliFormatLib type name
- update internal formatter annotations to the namespace contract
- keep @sys/cli/fmt runtime behavior unchanged
```

### Commit 1

```text
feat(cli): add code block formatter

- add Fmt.Code.block for terminal code snippets
- expose @sys/cli/fmt/code as an isolated formatter leaf
- support indentation and optional fences
- keep implementation dependency-free
- add tests for blank lines and indentation
```

### Commit 2

```text
refactor(cell): render descriptor help with cli code formatter

- render init agent descriptor outside table rows
- preserve descriptor YAML layout with Fmt.Code.block
- remove inline fence/table formatting from Cell help output
```

### Follow-up

```text
test(cli): cover multiline table cells

- document explicit newline rendering in table cells
- cover multiline text in first and later columns
- assert blank line preservation and ANSI visible-width alignment
- simplify Cell DSL help formatter call-site
```

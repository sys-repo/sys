# @sys/cli Shiki code highlighting plan

## Status

Planned. This is a pure `@sys/cli` feature scoped to the existing code-formatting leaf:

```ts
import { Fmt } from '@sys/cli/fmt/code';
```

The baseline formatter import must remain light:

```ts
import { Fmt } from '@sys/cli/fmt';
```

`@sys/cli/fmt` must not import `Code`, Shiki, or any Shiki-adjacent dependency.

## Direction

Add real terminal syntax highlighting behind `Fmt.Code.highlight(...)` using Shiki.

Do not add highlighting to leaf packages such as `@sys/cell`. Leaf packages should consume the shared CLI formatter only.

Do not fake syntax coloring. Tests must exercise real Shiki output when testing highlighting.

## Core API

Keep the existing synchronous layout primitive:

```ts
Fmt.Code.block(text, {
  lang: 'yaml',
  indent: 2,
  fence: false,
});
```

Add an async Shiki-backed highlighter:

```ts
await Fmt.Code.highlight(text, {
  lang: 'yaml',
  indent: 2,
  fence: false,
});
```

Default theme:

```ts
theme: 'monokai'
```

The default is a standard house default, not a narrowing abstraction. Users must still be able to pass Shiki options through with Shiki-level power.

## Import boundary

Non-negotiable import graph:

```text
@sys/cli/fmt       → base formatter only; no Code; no Shiki
@sys/cli/fmt/code  → base formatter + Code; may own Shiki
```

Preferred implementation detail:

- Use a type-only Shiki import for option types.
- Lazy-load Shiki inside `highlight(...)` so code-leaf users that only call `block(...)` do not pay the runtime highlighter cost until needed.

This lazy-load is not required for the baseline weight guarantee, but it is a clean additional boundary.

## Library

Use Shiki.

Implementation should prefer a native Shiki ANSI output API if one exists. Current Shiki `4.0.2` does not expose `codeToAnsi`; use Shiki's token API and keep the ANSI adapter tiny:

```ts
const { codeToTokens } = await import('shiki');
const tokens = await codeToTokens(text, options);
```

The ANSI renderer should only translate Shiki token color/font metadata into terminal escape sequences. It must not implement language-specific highlighting rules.

Before implementation, verify the current Shiki API and Deno/JSR publish behavior from the module root. Add the dependency/import map in `deps.yaml`/`imports.json` for `@sys/cli` use only.

## Type design

Do not duplicate layout option types between `block(...)` and `highlight(...)`.

Refactor current code formatting options into shared layout options:

```ts
export declare namespace CliFormatCode {
  export type Lib = {
    block(text: string, options?: BlockOptions): string;
    highlight(text: string, options: HighlightOptions): Promise<string>;
  };

  export type LayoutOptions = {
    readonly indent?: number;
    readonly fence?: boolean;
  };

  export type BlockOptions = LayoutOptions & {
    readonly lang?: string;
    readonly tone?: Tone;
  };

  export type HighlightOptions = LayoutOptions & ShikiCodeToTokensOptionsWithDefaultTheme;
}
```

Derive the Shiki option type from Shiki instead of re-declaring it by hand. Conceptually:

```ts
import type { codeToTokens } from 'shiki';

type ShikiCodeToTokensOptions = NonNullable<Parameters<typeof codeToTokens>[1]>;
type WithDefaultTheme<T> = T extends { readonly theme: infer TTheme }
  ? Omit<T, 'theme'> & { readonly theme?: TTheme }
  : T;
type ShikiCodeToTokensOptionsWithDefaultTheme = WithDefaultTheme<ShikiCodeToTokensOptions>;
```

If Shiki's current type shape uses a union around `theme`/`themes`, preserve that power. The only intended local change is making the normal single-theme path default to Monokai when the caller does not supply a theme.

`lang` for `highlight(...)` should come from Shiki's option type, not from a hand-written local duplicate.

## Layout design

Do not make a second formatter.

Extract the current block rendering mechanics into an internal shared layout primitive, for example:

```text
m.Fmt.Code/
  u.layout.ts     ← trim/split/fence/indent shared by block + highlight
  u.block.ts      ← sync raw text block formatter
  u.highlight.ts  ← async Shiki formatter, then shared layout
```

The flow:

```text
block(text, options)
  → trim edge newlines
  → split into lines
  → shared layout with indent/fence/lang
  → optional block tone

highlight(text, options)
  → trim edge newlines
  → Shiki codeToTokens(trimmed, options with theme default)
  → convert Shiki token metadata to ANSI text lines
  → shared layout with indent/fence/lang
```

Do not apply `tone` to highlighted output. If callers want a different highlighted mood, they should choose a Shiki theme.

Important blank-line detail:

Shared layout should decide whether a line is empty by visible text, not raw byte length, so ANSI-only reset lines from Shiki do not turn blank lines into indented whitespace.

Conceptually:

```ts
const visible = stripAnsi(line);
return visible.length > 0 ? `${pad}${line}` : '';
```

## Fences

`fence: true` should keep using the existing code-fence layout convention:

````text
```yaml
...
```
````

Fence marker color remains the existing dim gray convention. Highlighting applies to code contents, not to fence markers.

For `highlight(...)`, the fence language label should use the same `lang` option passed to Shiki when it is string-like.

## Defaults

Default Shiki theme: `monokai`.

Why Monokai:

- familiar across editors and decades
- recognizable as code rather than prose
- high-contrast without novelty
- conventional enough to be a shared CLI default
- supported by Shiki/VS Code theme lineage

No default language. The caller must provide `lang` through Shiki options.

## Tests

Add focused tests under:

```text
code/sys/cli/src/m.core/m.Fmt.Code/-test/
```

Suggested files:

```text
-.test.ts              ← API and wiring
-u.block.test.ts       ← existing block behavior
-u.highlight.test.ts   ← Shiki-backed highlight behavior
```

Test cases:

1. `Code.highlight` and `Fmt.Code.highlight` exist and are the same callable surface.
2. Highlight output strips to the same layout shape as `block(...)` for simple input.
3. Default theme equals explicit Monokai for the same input/options.
4. Highlight output contains ANSI escape sequences for highlighted code.
5. `indent` and `fence` are shared with block layout.
6. Blank lines remain blank after highlighting and indentation.
7. Base `@sys/cli/fmt` runtime surface still does not expose `Code`.

Assertions should avoid brittle exact color bytes except for same-run equivalence checks such as default theme vs explicit Monokai.

Use generic examples in tests, not domain-specific Cell/YAML descriptor examples unless the test specifically needs YAML as a language fixture.

Static multiline strings must use `Str.dedent(...)`.

## Validation

Run from the module root:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task test --trace-leaks ./src/m.core/m.Fmt.Code
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task test
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task dry
```

If dependency/publish behavior differs for Shiki, stop and review before forcing an abstraction.

## BMIND review

This design is not contorted by the constraints:

- Keeping `@sys/cli/fmt` light is a clean package-boundary rule.
- Keeping Shiki behind `@sys/cli/fmt/code` matches the existing code-formatting leaf.
- Making `highlight(...)` async is honest about Shiki setup and grammar/theme loading.
- Sharing layout internals keeps `block(...)` and `highlight(...)` visually consistent.
- Deriving Shiki option types avoids a weak wrapper that would age poorly.
- Defaulting only `theme` preserves caller power while establishing a house default.

Primary failure modes to guard:

1. Accidentally importing the code leaf from base `@sys/cli/fmt`.
2. Hand-copying Shiki option types and losing upstream power.
3. Applying `tone` over highlighted ANSI and muddying syntax colors.
4. Treating ANSI-only blank lines as non-empty during indentation.
5. Writing fake color tests that pass without Shiki actually working.
6. Pulling Shiki into `@sys/cell` or another leaf package.

## Suggested commit

```text
feat(cli): add shiki-backed code highlighting

- add async Fmt.Code.highlight behind @sys/cli/fmt/code
- default Shiki theme to monokai
- pass Shiki options through without narrowing caller power
- share block layout options between block and highlight
- keep base @sys/cli/fmt free of highlighting weight
```

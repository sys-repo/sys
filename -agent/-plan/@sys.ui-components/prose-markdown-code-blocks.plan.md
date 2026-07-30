prose-markdown-code-blocks.plan.md
- [x] d07617524 feat(markdown): expose code-block node guard
- [x] e8837fce8 feat(ui-components): render Prose Markdown code blocks
- [x] 29b6740a4 refactor(ui-components): factor Prose Markdown render helpers
- [x] 8b978eccf feat(ui-components): surface unsupported Markdown nodes
- [x] 597b5eaf6 refactor(ui-components): factor Prose Markdown samples
- [x] 2e089feea refactor(ui-components): flatten Prose Markdown render module
- [x] 123556b10 refactor(ui-components): use thematic-break renderer contract

## Status

Complete seven-commit implementation and closeout ledger; ready for retirement. Fenced and indented
MDAST `code` nodes render safely and neutrally through a stable adapter seam. The systemic traversal
failure exposed by the original omission is also closed: unsupported leaves, unsupported containers,
and malformed known nodes now produce visible diagnostics rather than disappearing as `null`.
Renderer and sample ownership have been factored into focused modules, the renderer directory now
sits at the correct module boundary, and the thematic-break helper uses its dedicated renderer
contract.

This plan does not reopen `prose-markdown-semantic-blocks.plan.md`; that completed seven-commit
ledger remains historical proof and can retire independently.

## Current DMIND review

Verdict: **GO** for the neutral code-block projection and **NO-GO** for syntax highlighting in this
arc.

- A code block is established Markdown semantics, not optional visual polish.
- The neutral renderer repairs silent code-block content loss without adding a Markdown dialect or
  source DSL.
- An unconditional visible node fallback prevents the same omission class from remaining hidden for
  other Markdown semantics; incompleteness should be noisy until it is implemented.
- MDAST already carries the rendered value and optional `lang`/`meta` facts; no source lens or fence
  reparsing is earned.
- Native `<pre><code>` preserves whitespace, exposes durable document semantics, and lets React
  escape authored text.
- `renderers.codeBlock` is the stable boundary for caller-owned presentation and future
  highlighting.
- Highlighting remains an adapter concern because it owns async loading, language support, theme
  policy, token styling, fallback behavior, and bundle cost.
- The existing repository Shiki integration is CLI-owned and emits ANSI terminal output; it is not a
  reusable browser renderer and must not be imported into this core projection by convenience.

## BMIND ownership

- `@sys/markdown` owns the shallow grammar-level `Markdown.Is.code(...)` predicate.
- `@sys/ui-components` owns native React projection and the semantic renderer hook.
- A future UI syntax-highlighting adapter owns highlighter loading, language resolution, theme
  selection, token rendering, and failure fallback.
- DevHarness owns compact visual proof only; sample composition must not leak into the production
  API.
- No highlighting behavior belongs in `@sys/markdown`.

## Commit 1: canonical code-node guard

Add `Markdown.Is.code(input)` as a public shallow structural predicate over the canonical MDAST
`code` node.

Required shape:

```ts
node.type === 'code'
typeof node.value === 'string'
node.lang is nil or string
node.meta is nil or string
```

Requirements:

- use the canonical `Markdown.Is` surface rather than a Prose-private substitute;
- use `Is` from the local `common.ts` type/helper plane;
- remain shallow and structural—do not parse language tags or fence metadata;
- accept both fenced and indented code because both project to the same MDAST node;
- reject malformed `value`, `lang`, and `meta` shapes without throwing;
- add focused guard and public-surface proof;
- keep source fence spelling, fence length, indentation, and closing-fence details out of the guard.

## Commit 2: neutral Prose projection

Add code blocks as a semantic sibling of headings, thematic breaks, lists, and inline code.

Target public seam:

```ts
renderers.codeBlock?: t.ProseMarkdown.Block.Code.Renderer;
```

Target renderer arguments:

```ts
type RendererArgs = {
  node: Node;
  value: string;
  lang?: string;
  meta?: string;
};
```

Renderer callback argument objects remain mutable inputs, consistent with the existing Prose
renderer contracts.

Default projection:

```tsx
<pre>
  <code>{value}</code>
</pre>;
```

Requirements:

- dispatch `code` nodes only after `Markdown.Is.code(...)` succeeds;
- pass the canonical node value without reparsing, trimming, dedenting, or inventing a trailing
  newline;
- normalize nil `lang` and `meta` values to `undefined` in renderer arguments while preserving
  authored strings exactly;
- expose `renderers.codeBlock` rather than overloading `inlineCode` or adding a node-kind catch-all;
- preserve the existing nullish override contract: an absent or nullish override result falls back
  to the native renderer;
- render authored code as a React text child—never as injected HTML;
- retain native `<pre><code>` semantics in the default path;
- add `Styles.codeBlock` for the `<pre>` container rather than exposing a standalone runtime
  component;
- add only layout-safe neutral styling: contained block margins, `maxWidth: '100%'`, and horizontal
  overflow scrolling on the `<pre>` container;
- do not add a background, border, radius, padding, language badge, line numbers, copy button, or
  color theme to the default;
- do not synthesize a `language-*` class or interpret `meta` in the core renderer;
- keep malformed code nodes non-throwing and non-rendering;
- keep string-source and caller-provided AST behavior equivalent because code rendering needs no
  source lexeme.

## Commit 3: focused render-module factoring

Factor the monolithic renderer into a private `u.render/` module while preserving one central
recursive traversal and semantic helper ownership. Keep dispatch auditable in one place; do not
replace the switch with a registry or one-file-per-case choreography.

Requirements:

- retain `u.traverse.tsx` as the sole recursion and node-dispatch authority;
- isolate code-block, heading, inline, list, and thematic-break projections behind narrow helper
  contracts;
- expose the private render entry through `u.render/mod.ts`;
- preserve all public and runtime behavior before introducing the visible fallback policy.

## Commit 4: visible unsupported-node fallback

Add a proper private `ui.NotImplemented.tsx` component to the render module and route every
unsupported or structurally invalid traversal value through it.

Requirements:

- render the fallback unconditionally; do not hide it behind `debug` or an environment check;
- use the standard local `common.ts`, `t.ts`, `ui.*.tsx`, and `mod.ts` component/module grammar;
- keep the private component's `P` props declared inline beside the renderer rather than projecting
  a false public type abstraction through `t.ts`;
- compose the visual token through `Chip.UI` at `xs` size rather than duplicating its inline,
  typography, padding, radius, and border primitives;
- layer only diagnostic magenta color, wrapping containment, emphasis, and a small inline margin
  over the shared Chip primitive;
- render a concise, explicit diagnosis in magenta (`Not implemented: html` or `Invalid node: code`);
- expose only the node type and fallback reason through rendered text and stable data attributes;
- never echo an unsupported node's authored `value`, raw HTML, or other payload;
- render unsupported containers as the visible marker followed by their recursively rendered
  children;
- render unsupported leaves as the visible marker rather than `null`;
- render malformed known semantic nodes as an invalid-node marker and do not call their renderer
  overrides;
- surface non-record AST children as invalid without throwing;
- preserve deliberate safety projections such as unsafe-link plain text;
- keep raw Markdown HTML inert: no HTML injection and no `dangerouslySetInnerHTML`;
- do not add a generic public node-kind renderer or an opt-out that restores silent loss.

### Permanent fallback canary sample

Add a dedicated DevHarness sample using a caller-provided AST with the reserved node type
`proseMarkdownFallbackCanary`.

Requirements:

- explicitly document that the sentinel type must never be added to production dispatch;
- include both leaf and container forms so the sample proves visible omission and preserved child
  content;
- keep the sample centered and compact;
- lock the sentinel name, marker count, and preserved child text in sample-registry tests;
- retain this canary after all real MDAST kinds are implemented so the fallback stays visually
  inspectable and cannot regress to silent `null`.

### Shared sample thematic-break policy

Treat `sourceBreakRenderers` as the base renderer set for every Prose Markdown DevHarness sample.
Sample-specific inline-code, link, and task-state renderers compose over that base rather than
selectively opting into thematic-break styling.

Requirements:

- apply the existing `ProseMarkdown.ThematicBreak.source` renderer to every sample;
- keep the production native `<hr>` fallback neutral and unchanged;
- do not add list-specific, code-block-specific, or registry-entry-specific rule styling;
- keep source-grammar behavior proof in its dedicated renderer suite; do not add renderer-identity,
  class-presence, or duplicated CSS proxy tests merely to mirror sample wiring.

## Code-block sample

Add a compact dedicated code-block sample using the neutral default renderer. Cover both accepted
fence forms and language-tagged versus plain text:

````markdown
```ts
const answer: number = 42;
```

```text
plain text
  preserved indentation
```
````

Requirements:

- keep the fixture short enough to remain in the sample registry;
- retain centered sample geometry unless real content length proves scrolling is needed;
- do not imply syntax highlighting before an adapter exists;
- do not add a Chip, language badge, or custom renderer merely to decorate the neutral proof.

## Syntax-highlighting adapter boundary

The core seam is intentionally sufficient for a future adapter:

```tsx
<Prose.Markdown.UI
  value={markdown}
  renderers={{ codeBlock: syntaxAdapter }}
/>;
```

The adapter receives `{ node, value, lang, meta }` and may return a component that manages async
highlighting. No async contract is required in the synchronous Prose traversal.

A future adapter arc should:

- live outside the neutral Markdown projection;
- dynamically load or otherwise isolate Shiki/browser highlighter weight;
- validate authored `lang` before selecting a grammar and fall back to plain text for unknown
  languages;
- accept explicit caller-owned light/dark theme policy rather than infer it from Markdown;
- render token spans beneath native `<pre><code>` semantics;
- preserve a plain-text `<pre><code>` fallback while loading and after highlighter failure;
- preserve copyable source text and whitespace exactly;
- prefer token-node rendering over `dangerouslySetInnerHTML`; any HTML injection path requires a
  separate security review;
- define SSR, hydration, caching, and language-registry behavior before exposing a built-in public
  adapter;
- earn its own plan and commit arc rather than extending this one opportunistically.

Do not name or expose a built-in Shiki helper in this arc. The renderer contract is stable without
prematurely choosing the adapter's eventual package or runtime surface.

## Proof

`@sys/markdown`:

- valid code nodes with absent, null, and string `lang`/`meta` values;
- malformed value and metadata rejection;
- public `Markdown.Is.code` surface.

`Prose.Markdown`:

- backtick and tilde fences both render native `<pre><code>`;
- exact code text and whitespace preservation;
- language and metadata delivery to the override;
- caller-provided AST equivalence;
- nullish override fallback to native semantics;
- malformed-node safety;
- horizontal containment for long lines;
- unsupported leaf nodes render a visible type-only marker;
- unsupported container nodes render the marker and preserve child content;
- malformed known nodes and non-record AST children render invalid-node markers without throwing;
- raw HTML values remain inert and absent from fallback output;
- the fallback carries stable reason/type attributes and concise type-only labels;
- existing paragraph, heading, thematic-break, list, task, inline-code, and link contracts remain
  green.

## Validation

- focused `@sys/markdown` guard tests;
- complete Prose Markdown suite;
- `@sys/markdown` and `@sys/ui-components` package checks;
- publish dry-runs for both packages;
- exact changed-file format and lint checks;
- staged-diff integrity and exact package-path commit boundaries.

## Non-goals

- No syntax highlighting implementation.
- No prematurely named or exported syntax-highlighting component.
- No Shiki import in `@sys/ui-components`.
- No source-fence lexeme API or second Markdown parser.
- No interpretation of language aliases or fence metadata.
- No `dangerouslySetInnerHTML`.
- No line numbers, copy controls, captions, badges, execution, editing, or code playground.
- No document typography framework.
- No debug-only gating or public catch-all renderer for unsupported nodes.
- No reopening of the completed thematic-break/source-DSL ledger.

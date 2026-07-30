prose-markdown-semantic-blocks.plan.md
- [x] 2101c8cc8 feat(markdown): expose thematic-break source lexemes
- [x] 16fc70042 feat(ui-components): render Prose Markdown thematic breaks
- [x] c1ccc85bc feat(markdown): expose semantic node guards on Markdown.Is
- [x] bc3e486d4 refactor(ui-components): consume Markdown.Is node guards
- [x] bc988a7ab feat(ui-components): render Prose Markdown headings
- [x] ea74903bc feat(markdown): expose thematic-break marker spacing
- [x] ea48aba4f8 feat(ui-components): add Prose Markdown thematic-break source DSL

## Status

Complete. All seven commits have landed and their hashes are recorded. The final source-DSL commit
preserves the production/default boundary while adding an opt-in source renderer, exact behavior
proof, and a component-local visual sample with bounded scrolling.

## Current TMIND review

Verdict: **GO**. The complete arc has passed focused DMIND, adversarial TMIND, package checks,
publish dry-run, behavior tests, and light/dark theme inheritance proof. No production residue or
follow-up requirement remains in this plan.

- `Markdown.Source` is additive and parser-neutral; it validates positioned source spans without
  mutating MDAST or introducing a second Markdown parser.
- Thematic-break source truth is lexical only. Marker spacing is a lexical fact owned by
  `@sys/markdown`; opacity remains an opt-in interpretation owned by `@sys/ui-components`.
- `Prose.Markdown` retains source only for source-string input and never invents source for bare AST
  input.
- Canonical Markdown node invariants move to `Markdown.Is`; renderer traversal and fallback policy
  remain private to `Prose.Markdown`.
- Link shape validation remains distinct from safe-href policy, and GFM task-state validation remains
  distinct from UI accessibility and rendering policy.
- Native `h1`–`h6` and `<hr>` elements preserve semantic fallback behavior.
- Heading and thematic-break overrides are semantic siblings of the existing renderer hooks.
- Rendering remains in `u/u.render.tsx`; a separate `ui.semantic-blocks.tsx` implementation would be
  false ownership and is not earned.
- `-ui.semantic-blocks.test.tsx` correctly names the observable component contract rather than a
  production filename.
- Tests use compact fixtures and exact semantic projections: source offsets, Unicode, frontmatter,
  native tags, override arguments, and AST/source honesty.
- No snapshots, broad DOM dumps, duplicate parser assertions, implicit visual-style policy, or
  private choreography tests were introduced.
- The source DSL preserves one direct visual responsibility per authored fact: marker selects
  texture, marker count selects pixel thickness, and inter-marker spacing selects density.
- Thickness is relative to CommonMark's three-marker grammar floor: three markers produce 1px and
  each additional marker adds 1px, saturating at 10px so adversarial source cannot create unbounded
  layout geometry; the original marker count remains available to custom renderers.
- Spacing is binary rather than proportional: any inter-marker space or tab selects the light 0.4
  density, while compact markers use the optically balanced 0.7 density. Leading and trailing
  whitespace do not affect density.
- Standards-native `<hr>` and CSS border styles carry semantics, responsiveness, and long-term browser
  durability; generated ornament and replacement `<div>` semantics are rejected.

Guard consumption, heading projection, marker-spacing ownership, and the opt-in source visual DSL
are explicit in the commit arc.

## BMIND ownership

This is production Markdown/Prose work, not dev-composition work.

- `@sys/markdown` owns immutable source lenses over positioned MDAST nodes.
- `@sys/ui-components` owns semantic React projection through `Prose.Markdown`.
- `Dev.Help.Markdown` is only a downstream consumer of `Prose.Markdown`.
- Component-local DevHarness sample state owns visual proof and viewport containment without leaking
  into the production API. No Dev Help routing or `Dev.KeyValue` API belongs in this arc.

## Thematic-break source contract

Keep `thematicBreak` as the CommonMark/MDAST semantic noun. MDAST `break` already means an inline
hard break.

Add immutable source lenses without changing `Markdown.parse(source)`:

```ts
Markdown.Source.slice(source, node);
Markdown.Source.thematicBreak(source, node);
```

Target lexical result:

```ts
type ThematicBreakLexeme = {
  readonly raw: string;
  readonly marker: '-' | '*' | '_';
  readonly count: number;
  readonly spaced: boolean;
  readonly position: t.Markdown.Position;
};
```

Requirements:

- derive `raw` from validated node offsets and the exact corresponding source;
- count marker characters rather than raw string length;
- report `spaced: true` only when a space or tab occurs between marker characters, ignoring leading
  and trailing whitespace;
- derive count and spacing in the existing single linear source scan;
- treat the parsed thematic-break node as grammar authority rather than implementing a second
  parser;
- return `undefined` for absent, invalid, out-of-range, or mismatched source offsets;
- preserve JS-slice-compatible Unicode offsets and prove preceding astral characters;
- use `document.markdown` for `Markdown.Frontmatter.parse` body nodes;
- keep lexical facts free of CSS, thickness, tone, and presentation policy;
- do not accept `=` as a thematic-break marker.

## Prose projection contract

For source-string input, retain source beside the parsed AST so renderers can resolve optional
source lexemes. For caller-provided AST input, do not infer or invent source.

Thematic breaks:

- render a native `<hr>` as the nullish semantic fallback;
- expose a semantic `renderers.thematicBreak` hook;
- pass the source node and optional exact lexeme;
- keep visual mappings outside the neutral default and expose them only through an explicitly
  selected source renderer;
- keep the default renderer CommonMark-neutral.

Headings:

- project heading depth to the corresponding native `h1` through `h6` element;
- expose a semantic `renderers.heading` hook;
- pass the source node, canonical depth, and already-rendered children;
- do not turn `Prose.Markdown` into a document typography framework.

## Thematic-break source visual DSL

This is a settled, opt-in `@sys/ui-components` grammar downstream from the semantic baseline.

Authored facts map directly to visual responsibilities:

```text
marker  → texture
count   → CSS pixel thickness
spaced  → density
```

Exact mappings:

```text
- → solid
_ → dashed
* → dotted

3 markers  → 1px
4 markers  → 2px
...
12 markers → 10px
13+ markers remain safely clamped at 10px

compact markers → opacity 0.7
spaced markers  → opacity 0.4
```

Requirements:

- expose the ready renderer through `ProseMarkdown.ThematicBreak.source` and compose it through the
  existing `renderers.thematicBreak` seam;
- do not add a thematic-break prop, a second renderer-selection mechanism, or a standalone component;
- consume `ThematicBreakLexeme.marker`, `count`, and `spaced` without reparsing `raw`;
- preserve the neutral native `<hr>` default unless the source renderer is explicitly selected;
- return the neutral native `<hr>` when a caller-provided AST has no source lexeme;
- render every visual variant as a native `<hr>` using standards-native solid, dashed, or dotted CSS
  border styles;
- use inherited `currentColor`, full responsive width, and local `css(...)` styling through
  `@sys/ui-css`;
- clamp only the built-in physical thickness to 10px; preserve the exact unbounded source count for
  custom renderers;
- treat any amount of inter-marker whitespace as one binary light-density signal rather than a
  continuous spacing scale;
- ignore leading and trailing whitespace when resolving marker spacing;
- add a dedicated source-DSL sample covering all three textures and representative 1px, 2px, 4px,
  and 10px weights in compact and spaced forms;
- retain the existing native thematic breaks in the lists sample without applying the source DSL.

The DSL does not create document hierarchy: headings remain structural, while every variant remains
one semantic thematic break to assistive technology. It must not create a new Markdown dialect or
move presentation policy into `@sys/markdown`.

## Proof

`@sys/markdown`:

- exact source slicing;
- spaced and unspaced thematic-break marker/count facts, including the binary `spaced` projection;
- Unicode/astral offset fidelity;
- frontmatter body-source ownership;
- invalid and mismatched position rejection;
- public `Markdown.Source` surface.

`Prose.Markdown`:

- native heading depth and `<hr>` fallback semantics;
- heading and thematic-break renderer overrides;
- exact lexeme delivery for source-string input;
- absent lexeme and neutral native fallback for caller-provided AST input;
- exact marker-to-texture, grammar-relative count-to-pixel, spacing-to-opacity, and 10px-clamp
  projections;
- native `<hr>` semantics for every source visual variant;
- dedicated visual proof in light and dark themes while existing list separators remain neutral;
- existing fallback, list, task, inline-code, and link contracts remain green.

## Non-goals

- No Markdown dialect or second parser.
- No implicit marker-count-to-style mapping in the semantic fallback.
- No logarithmic or proportional-whitespace visual scale.
- No generated ornament, replacement separator semantics, or marker glyph rendering.
- No source inference for bare AST values.
- No Dev Help or Dev KeyValue API changes.
- No document-layout or typography framework.

# Markdown-backed dev help panel

## Commit arc

- [x] `3eae1698c` feat(ui-components): implement Prose Markdown renderer
- [x] `d700e63c3` docs(ui-components): add Prose Markdown Chip override sample
- [x] `2c28641e7` fix(ui-components): contain Prose Markdown block flow
- [x] `d751566a0` feat(ui-components): add Prose Markdown link renderer override
- [x] `85efa5352` docs(ui-components): default Prose Markdown spec to override sample
- [x] `d95b0bfb8` refactor(ui-components): render KeyValue cursor help with Prose Markdown

Closed: the earned renderer override expansion for this arc is complete. Further renderer hooks such
as `Inline.Strong.Renderer`, `Inline.Emphasis.Renderer`, `Block.Paragraph.Renderer`,
`Block.List.Renderer`, or `Block.ListItem.Renderer` are future work only if a real call site earns
them; they are not tracked as open work in this plan.

This arc is intentionally ordered. `Prose.Markdown` lands first as the Markdown value/source/AST →
React adapter with only the earned inline-code override. The spec harness then demonstrates the
caller-owned `Chip.UI` override without adding a production `Chip` dependency to `Prose.Markdown`.
Renderer-local block-flow containment then closes the screenshot-observed bottom-spacing leak. The
next renderer extension lands deliberately as one second seam only: Markdown `link` → caller-owned
renderer, proven with `Anchor.UI` in the same sample that proves `Chip.UI`. KeyValue then adopts the
renderer and supplies inline-code → `Chip.UI` rendering policy from the earned help use-case.

Renderer override namespace decision: keep `Renderers` as the caller-facing override registry, and
put each renderer type under its semantic node namespace. `Inline.Code.Renderer` is specifically the
renderer for Markdown backtick inline-code nodes; it is not the generic renderer for all inline
nodes. The earned sibling is `Inline.Link.Renderer`, backed by the already-hardened `Anchor.UI` UI
primitive at the caller/spec layer. If future overrides are earned, they should grow as siblings
such as `Inline.Strong.Renderer`, `Inline.Emphasis.Renderer`, and possibly block-level siblings such
as `Block.Paragraph.Renderer`, `Block.List.Renderer`, and `Block.ListItem.Renderer`. That work is
outside this closed plan and should start from a concrete call site/test, not from speculative API
expansion.

Not in this arc:

- `feat(ui-components): extract reusable dev help panel`
- `feat(ui-components): finish Prose Measure/Manuscript`

Those become new arcs only if the renderer proof earns them. XHIGH landing decision: the KeyValue
migration should stay a narrow call-site proof. Do not extract a `DevHarness`/help-builder from one
forcing case. After a second dev/debug docs call site wants the same Markdown + `Chip.UI` + link
policy, extract a reusable DevHarness Markdown help renderer as its own arc.

## Status

Renderer implementation landed in `3eae1698cc8d36aed644dd9332e96e7dacb4d603`:
`feat(ui-components): implement Prose Markdown renderer`.

Spec-harness pedagogy landed in `d700e63c381d20c7268afc4b64f68dfe501a6d5a`:
`docs(ui-components): add Prose Markdown Chip override sample`.

Renderer layout polish landed in `2c28641e7330e5c4cf7edaf197b9c9028eb0cd01`:
`fix(ui-components): contain Prose Markdown block flow`.

Link renderer extension landed in `d751566a0e56bfca8c1af150f2a17993d2b27c4c`:
`feat(ui-components): add Prose Markdown link renderer override`.

Prose Markdown spec defaulting landed in `85efa53528b3dd1af39ef37d53d4169d92fb7b02`:
`docs(ui-components): default Prose Markdown spec to override sample`.

KeyValue cursor-help adoption landed in `d95b0bfb8b386980d803c23f1b34a86e62d72bb0`:
`refactor(ui-components): render KeyValue cursor help with Prose Markdown`.

The implementation slice is the Markdown renderer/usage proof, not a reusable panel. The previous
`InfoPanel` wording is demoted to a possible later shape; it is not accepted public API.

- [x] BMIND scan existing unfinished `Prose.*` rendering modules before implementation.
- [x] DMIND/TMIND boundary resolved: parser emits `inlineCode`; `Prose.Markdown` renders React;
      KeyValue maps inline code → `Chip.UI`.
- [x] Renderer error display decision: keep the local `role='alert'` branch inside
      `Prose.Markdown.UI`. Existing `ErrorBoundary` is for uncaught render exceptions with
      copy/reset affordances, not parse/value validation. Do not extract a shared error panel until
      multiple call sites earn a common severity/action/copy model.
- [x] Renderer block-flow decision: keep prose rhythm compositionally pure inside `Prose.Markdown`.
      The root uses `display: flow-root`, and final paragraph/list block margins are guarded with
      `:last-child`, so parents do not need bottom-offset compensation hacks.
- [x] Renderer extension decision: add `renderers.link` as the second semantic override seam,
      safe-href gated before caller rendering, proven with caller-owned `Anchor.UI` and composed
      with caller-owned `Chip.UI` in the spec harness.
- [x] XHIGH call-site decision: land `refactor(ui-components): render KeyValue cursor help with
      Prose Markdown` as a narrow migration. KeyValue owns the help copy and `inlineCode` →
      `Chip.UI` policy; `Prose.Markdown` remains generic and Chip-free. Reusable DevHarness help
      extraction waits for a second call site.

This plan owns the follow-up extracted from the completed KeyValue cursor interaction idiom plan.

## Current reality

The motivating call site is the KeyValue DEBUG cursor help panel:

```text
code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-ui.CursorHelp.tsx
code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-u.cursor-debug.tsx
code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-SPEC.Debug.tsx
```

The visible content is authored help text: a sentence, inline-code/backtick gesture tokens, and a
bullet list. It is closer to Markdown/prose rendering than to cursor interaction semantics.

Current landed shape: `CursorHelp` authors the stable intro as Markdown with `Str.dedent`, appends
mapped `extraSteps` as Markdown list rows, renders through `Prose.Markdown.UI`, and passes a
KeyValue-owned `renderers.inlineCode` override that maps backtick spans to compact mono `Chip.UI`
tokens. The implementation removed the bespoke JSX prose/list construction without extracting a
DevHarness/help-builder.

Current renderer reality:

- `Prose.Markdown.UI` accepts a single `value?: t.ProseMarkdown.Value` prop where the value is
  either Markdown source text or a parsed Markdown AST.
- `@sys/markdown` stays React-free and owns Markdown source → MDAST parsing only.
- `Prose.Markdown` owns safe Markdown value/source/AST → React rendering.
- Production `Prose.Markdown` has no `Chip` or `Anchor` dependency.
- Caller-owned inline-code rendering is exposed through `renderers.inlineCode` with the public type
  surface rooted at `t.ProseMarkdown.Inline.Code.*`.
- Caller-owned safe-link rendering is exposed through `renderers.link` with the public type surface
  rooted at `t.ProseMarkdown.Inline.Link.*`.
- Default rendering covers the earned subset: paragraphs, text, inline code, strong, emphasis, safe
  links, unordered/ordered lists, list items, breaks, parsed AST input, and graceful unsupported-node
  child rendering.
- Tests prove caller-owned `Chip.UI` inline-code rendering, caller-owned `Anchor.UI` link rendering,
  inline-code/link override composition, safe-href gating, malformed-node hardening, parsed AST
  input, source parsing, list rendering, module export stability, and block-flow containment.
- The spec harness defaults to the visible override sample. It demonstrates `@sys/<Chip>` +
  `<Anchor>` override policy without making those components renderer dependencies, and renders
  Markdown button labels as Markdown too.
- The spec sample uses root-index-compatible dev URLs: `/?dev=${Obj.hash(namespace)}` for
  `sys.ui.component: Chip` and `sys.ui.component: Anchor`; no localhost, port, or magic hash
  literals.
- Renderer-local block-flow containment prevents trailing Markdown block margins from pushing parent
  layout down.

`@sys/markdown` has landed and is the substrate baseline:

```text
676b6e8cf chore(tmpl:pkg): scaffold markdown for @sys/markdown
3f64ec39d feat(markdown): add canonical markdown core substrate
f96caf197 feat(markdown): add safe markdown html rendering
c9ea433f4 feat(markdown): add markdown frontmatter surface
468c8f366 chore(workspace): refreshed 10 workspace packages (3 jsr:publish modules)
```

The cursor interaction plan is complete; this work is now a UI/help/docs rendering question, not a
KeyValue cursor primitive question.

## DMIND/TMIND review

Verdict: `Prose.Markdown` is the renderer for the screenshot. The real subject is Markdown prose
rendered to React with component override seams; panel chrome is a later composition concern.

Precise chain:

```text
Markdown source       = authored prose with backtick inline-code spans.
@sys/markdown         = source → MDAST, React-free.
MDAST inlineCode node = semantic token boundary, not a Chip.
Prose.Markdown        = MDAST/source → React.
KeyValue CursorHelp   = call-site override: inlineCode → Chip.UI.
Help/Docs panel       = future dev-harness/help chrome and composition policy.
```

Hard boundaries:

- Do not put React component injection into `@sys/markdown`.
- Do not make `@sys/markdown` know about `Chip.UI`, `Prose`, dev harnesses, Help panels, or cursor
  semantics.
- Do not make `KeyValue` own a generic Markdown renderer.
- Do not claim full Markdown rendering unless the public API and tests support it.
- `Prose.Markdown` may expose an inline-code renderer override, but must not hardcode `Chip.UI` as
  the global meaning of Markdown inline code.
- If inline-code gesture tokens need `Chip.UI`, that mapping belongs in a UI renderer override at
  the call site.

Attack cases:

- If `Chip.UI` is required by `@sys/markdown`, the substrate boundary is wrong.
- If `KeyValue` semantics leak into `Prose.Markdown`, the renderer boundary is wrong.
- If a Help/Docs panel appears before a renderer proof, the noun is premature.
- If `Markdown.Html.render(...)` plus `dangerouslySetInnerHTML` is used here, the component override
  requirement has been bypassed rather than solved.

## Pre-implementation DMIND review: renderer commit

Confidence: high for the renderer boundary; medium-high for exact prop names until the type surface
and tests force the smallest shape.

Why confidence is high:

- The layer boundary is now exact: `@sys/markdown` parses; `Prose.Markdown` renders React; call
  sites choose component overrides.
- Existing `Prose.Markdown` is already the correct public seam and is only placeholder work.
- The first use-case is narrow and observable: paragraphs, list items, and inline-code chips.
- The failure modes are known and testable: parser leakage, `Chip` leakage into the renderer, unsafe
  HTML rendering, and overclaiming Markdown support.

Design posture for the first commit:

- Type surface first; implementation second.
- Keep `Lib` to `UI` unless a non-React render function is actually earned.
- Public props should accept Markdown `source` and/or parsed `ast`, plus render overrides, `theme`,
  `debug`, and `style`.
- Prefer named public types in `t.ts`: input, component/render overrides, and inline-code renderer
  args. Do not hide public contracts behind `Parameters`/`ReturnType` inference.
- Keep default rendering neutral prose. No panel chrome, no reading-measure wrapper, no manuscript
  font bundle, no dev-help semantics.
- Keep unsupported Markdown nodes honest: either render safe children when structurally valid or
  ignore unsupported leaf nodes. Do not pretend the subset is complete.

Implementation sequence:

1. Export `Markdown` from `@sys/markdown` through `src/common/libs.ts` and expose its type surface
   through `src/common/t.ts`.
2. Update `Prose.Markdown/t.ts` with the renderer contract before touching JSX.
3. Add the narrow red tests for source parsing, AST input, bullet lists, parse errors, and
   `inlineCode` override rendering.
4. Replace placeholder `ui.tsx` with a small AST renderer using local helpers below the exported UI
   surface.
5. Keep `Prose.Measure` and `Prose.Manuscript` untouched in this commit except where tests prove an
   unavoidable shared type seam.

## First-cut implementation shape

Implement types first in `code/sys.ui/ui-components/src/ui.react/Prose.Markdown/t.ts`, then fulfill
that contract in `ui.tsx`.

Candidate renderer contract:

- Accept Markdown source and/or an already parsed `t.Markdown.Ast`.
- Parse source through `Markdown.parse(...)` from `@sys/markdown`.
- Render the small supported MDAST subset needed by this proof: root, paragraph, text, inlineCode,
  list, listItem, and soft/hard line breaks if the source needs them.
- Expose component render overrides for semantic leaves, at minimum `inlineCode`.
- Keep default `inlineCode` rendering typographic and neutral (`<code>` or equivalent). Do not
  import `Chip` in `Prose.Markdown`.
- Map gesture tokens to `Chip.UI` from the KeyValue call site by passing an `inlineCode` renderer
  override.
- Handle parse errors legibly; do not fail empty.

Then migrate the motivating help:

1. Express the existing cursor help copy as Markdown source.
2. Pass the source into `Prose.Markdown.UI`.
3. Pass an `inlineCode` renderer override that returns `Chip.UI` with `mono`, `size='sm'`, and the
   resolved theme name.
4. Preserve current visuals and behavior, including the `extraSteps` hook or replace it with an
   equally explicit Markdown extension point.
5. Remove the hand-built JSX list only after the Markdown path is proven equivalent.

Avoid `Markdown.Html.render(...)` plus `dangerouslySetInnerHTML` for this case because the durable
requirement is component-level inline-code rendering via `Chip.UI`, not sanitized HTML display.

## Existing UI seam

`@sys/ui-components` already has a stubbed prose Markdown lane:

```text
code/sys.ui/ui-components/src/ui.react/Prose.Markdown/
```

That lane currently exports `ProseMarkdown.UI`, but the implementation is placeholder UI and its
props do not yet accept Markdown input. Hard-review decision: use this seam for the renderer instead
of creating a spec-local throwaway renderer, but keep the surface narrow and honest.

BMIND scan of the existing triptych:

- `Prose.Measure` has a good noun: reading geometry. Current code is scaffold-only and should not be
  pulled into this slice unless Markdown rendering needs measure constraints.
- `Prose.Manuscript` has a good noun: typographic prose semantics. Current code has useful style
  direction, but it is still placeholder/content-demo work and should not become the Markdown API by
  accident.
- `Prose.Markdown` has the earned next use-case. Keep the module and finish it against the new
  `@sys/markdown` root.

Decision: keep the design bones, retire the placeholder assumptions. The modules should be refined
from the KeyValue help use-case upward, not deleted wholesale and not completed speculatively.

Likely file impacts:

```text
code/sys.ui/ui-components/src/common/libs.ts                 # export Markdown from @sys/markdown
code/sys.ui/ui-components/src/common/t.ts                    # expose @sys/markdown types through t
code/sys.ui/ui-components/src/ui.react/Prose.Markdown/t.ts   # public renderer contract
code/sys.ui/ui-components/src/ui.react/Prose.Markdown/ui.tsx # AST/source renderer
code/sys.ui/ui-components/src/ui.react/Prose.Markdown/-test/-.test.ts
code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-ui.CursorHelp.tsx
code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-SPEC.Debug.tsx
```

Use the local import lane. If `ui.tsx` imports the core Markdown library while exporting a React
component named `Markdown`, alias the upstream primitive as `MarkdownBase`.

## KeyValue migration slice

Landed in `d95b0bfb8`:

```text
refactor(ui-components): render KeyValue cursor help with Prose Markdown
```

Implementation boundary:

- [x] keep `CursorHelp` in the current KeyValue DEBUG/spec location for this commit;
- [x] express the current help copy as Markdown source;
- [x] append `extraSteps` as Markdown list items;
- [x] render with `Prose.Markdown.UI`;
- [x] pass `renderers.inlineCode` that maps backtick spans to `Chip.UI` with the current compact
      mono visual policy;
- [x] do not introduce DevHarness/help-panel chrome or a reusable builder yet;
- [x] do not add `Chip` knowledge to `Prose.Markdown`.

Future extraction note:

- after a second dev/debug documentation call site wants the same Markdown help policy, extract a
  reusable DevHarness Markdown help renderer/policy in a separate arc.

## STIER readiness gates

- [x] Red step preferred: first add the narrow `Prose.Markdown` rendering test that fails for source
      parsing and inline-code override.
- [x] Prove `Prose.Markdown.UI` exports remain stable through the existing
      `@sys/ui-components/react/prose` surface.
- [x] Add behavior coverage for source parsing, parse-error rendering, bullet list rendering, and
      inline-code override rendering.
- [x] Review scan: `Prose.Markdown` imports the core Markdown primitive, but not `Chip`; KeyValue
      owns the `Chip.UI` override.
- [x] Prove renderer-local layout containment: no trailing Markdown paragraph/list bottom rhythm
      leaks into parent layout.
- [x] Prove the second renderer seam with `renderers.link`, safe-href gating, malformed-link
      hardening, caller-owned `Anchor.UI`, composition with caller-owned `Chip.UI`, and Markdown
      rendering in sample button labels.
- [x] Prove KeyValue cursor help renders through `Prose.Markdown`, preserves Markdown list
      structure, includes caller-provided extra help, and maps inline-code gestures through the
      caller-owned `Chip.UI` override.
- [x] Targeted proof from `code/sys.ui/ui-components`:

```sh
deno task test --trace-leaks ./src/ui.react/Prose.Markdown ./src/ui.react/KeyValue/-test/-ui.cursor-help.test.tsx
deno task test --trace-leaks ./src/ui.react/KeyValue
```

- [x] Final implementation-arc proof:

```sh
deno task check
```

`deno task test` for the entire package remains a normal release/regression gate, not a blocker for
closing this focused Markdown-backed KeyValue help implementation arc.

## Non-goals

- No cursor model, keyboard grammar, insertion, divider, or KeyValue primitive changes.
- No CLI `--help` renderer in this slice; terminal help has separate width/ANSI/table concerns.
- No generalized Markdown editor/parser work.
- No public Help/Docs panel API until naming and ownership are settled.

## Retirement link

Moved from:

```text
-agent/-plan/@sys.ui-components/keyvalue-cursor-interaction-idiom.plan.md
```

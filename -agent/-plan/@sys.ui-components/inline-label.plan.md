@sys.ui-components
inline-label.plan.md
- [x] 818703253 chore(ui-components): scaffold Text.Label primitive
- [x] f9e610573 fix(ui-components): constrain Button content grid
- [x] a185888de feat(ui-components): add bounded Chip ellipsis
- [x] 45982b1a6 feat(ui-components): add non-interactive inline Markdown labels
- [x] ab1e3a07b feat(ui-components): render BulletList string labels with Text.Label
- [x] dea2d2a3d test(ui-components): add BulletList Markdown label specimen
- [x] a30529aa6 feat(ui-components): expose bullet border opacity
- [x] de622cbca refactor(ui-components): format Anchor sample labels through BulletList
- [x] 400bdd3c4 fix(ui): make passkey test text lookup tag-independent

## Intent and scope

A formatted label is text inside a control, not a miniature document. The human selected
`Text.Label` as the production concept: callers author strings with bold, italic, and backtick code,
with code presented through `Chip.UI`. Callers remember one label primitive, not parser or renderer
plumbing. Ordinary wrapping and optional CSS end ellipsis are part of the label contract. The
implementation reuses the existing parser and React-node composition seams. Production BulletList
delegates string action labels to Text.Label once; Dev.List forwards them unchanged. Only Text.Label
owns parsing. Button and Anchor do not infer formatting from their strings. Anchor's Sample States
exercise the shared list path, not a sample-only renderer.

The human retained `Text.Label` and selected local literal fallback: supported inline formatting
remains rendered, while each unsupported inline subtree remains visible as its original Markdown.
For `**Save** [help](/help)`, Save stays bold and `[help](/help)` remains literal, non-interactive
text. Do not hide unsupported content or add warning UI in this first implementation. Whole-input
literal fallback remains the conservative boundary for rejected document shapes or failed recovery.

The human also selected Chip-owned overflow: a chip is an unbroken token that moves to the next line
when the host permits wrapping; if wider than a full available line, it ellipsizes internally. The
opening arc separates that reusable Chip capability from label composition. Neither it nor
Markdown-label behavior belongs to the scaffold.

This plan specifies intended contracts; prose alone proves neither implementation nor execution
authority. The bounded overflow work includes an independently landable Button sizing correction
before Chip acceptance. Chip's clipping switch and Text.Label's explicit ownership selector are
specified below. The human accepted the shown Chip composition for starting Text.Label and moved
remaining browser checks into Text.Label acceptance. The dependency-boundary preparation below
selects the existing public Markdown entry. Local literal fallback is a settled product choice, not
a pending vote.

Repository: `/Users/phil/code/org.sys/sys`. Owning package: `code/sys.ui/ui-components`
(`@sys/ui-components`). Original design baseline: `5bb4c79dc`. Behavior-preparation source baseline:
`818703253`.

The arc separates the behavior-free Text.Label scaffold, reusable Chip overflow, production text
presentation, BulletList string-label adoption, its specimen and marker-appearance follow-ups, and
Anchor specimen adoption. A downstream Passkey test-helper correction addresses the concrete
consumer regression discovered during final verification; it changes no production behavior.
Template maintenance is separately owned below, not a prerequisite. Harness-runtime redesign, domain
state, button interaction, authentication, and document-renderer redesign are out of scope.

## Acceptance evidence at a glance

- Automated: the latest full `@sys/ui-components` run passed 131 tests / 897 steps before the Anchor
  panel-width adjustment; owner check and the focused Anchor suite (1 test / 12 steps) passed
  afterward. The downstream Passkey correction passed full `@sys/ui` tests (17 tests / 174 steps),
  owner check and formatting. These establish source, SSR, mock-DOM and declaration behavior, not
  browser geometry or accessibility. Each receipt below records its source baseline.
- Browser: supplied Dark-theme captures show expected formatting, literal fallback, bounded tokens,
  single visible ellipses and host focus outlines at the reported settings. A computed Button name
  matches the complete supported-formatting text. See the
  [Text.Label browser receipt](#textlabel-browser-receipt) for the exact evidence limits. Later
  Anchor captures show the formatted sample labels fitting the wider panel; the human endorsed that
  presentation. Bullet ring captures cover both Light and Dark themes.
- Unverified: clipped and fallback accessible names, Light theme, live growth recovery, cold
  reload/reset, hover and complete host activation/disabled checks. Browser version, zoom, DPR and
  measured geometry are unreported. The [browser checklist](#browser-acceptance-checklist) defines
  the remaining proof; no additional broad review is required absent a new failure.

## Retirement boundary

The opening arc is the landing ledger; the receipts preserve the verification scope of each unit.
The unverified browser checks above remain acceptance obligations until the human reports outcomes
or explicitly accepts them as nonblocking evidence limits. Landing and visual approval do not
establish those unobserved results. No further implementation defect is identified by the recorded
reviews and checks.

Before removing this plan, resolve that acceptance disposition and preserve the truthful final
snapshot in Git with `plan(done): inline-label.plan.md`. Subsequent removal uses
`plan(archived): inline-label.plan.md`; neither action is authorized by reconciliation alone.
Template maintenance, button grammar and Dev composition work remain with their existing owners
below; retirement of this plan does not retire those independent plans.

## Consolidated planning ownership

This is the sole live plan for the inline-label refinement.

- Archived `-agent/-plan/@sys.ui-components/dev-list-controls.plan.md`: final snapshot `6e709735d`,
  removal `da05df7d5`. Its delivered boundary is Dev.List and its prerequisites and consumer
  adoptions. Shared Markdown labels and a shared Dev composition specimen were explicitly deferred,
  not implemented. Recover its exact content with read-only Git; do not restore or reopen its
  completed arc. This plan resumes only label presentation, not the shared Dev specimen.
- [dev-composition-primitives.plan.md](./dev-composition-primitives.plan.md) retains Dev Help and
  the independent KeyValue-controls candidate. Its historical Dev.List reference is updated to
  distinguish completed adapter work from this production label work. No duplicate label arc there.
- [button-grammar.plan.md](./button-grammar.plan.md) retains action-button presentation and width
  groups. Neither is a prerequisite or deliverable here; rich labels must not require either.
- The obsolete `code/sys.ui/ui-components/src/ui.react/ui/Label/-agent/PLAN.md` proposed measured
  plain-text truncation for Http.Origin, explicitly excluding rich inline formatting. Its useful
  boundary survives here: text display owns truncation; linking and domain/status presentation stay
  outside. Current `Text.Ellipsize` implements measured end/fixed-tail truncation, and
  `Http.Origin/ui.Value.tsx` consumes it with `tail={7}`. Implementation history includes
  `a8ae751d2`. The old note is removed as superseded planning, not as a new behavioral acceptance
  claim. Recover its pre-removal bytes at `5bb4c79dc` using that exact path.

The archived Dev proposal suggested Chip-backed labels and reuse of Prose.Markdown. The current
human decision explicitly selects Chip for inline code, without adopting the document renderer or
Dev-only ownership. The clarified list contract deliberately supersedes the archived literal-string
behavior for action labels only; explicit non-interactive React nodes remain caller-owned.

## Existing source anchors

Paths in this section are relative to `code/sys.ui/ui-components/src/ui.react/`:

- `ui/Text/{t.ts,mod.ts}`: Text namespace with Input, Ellipsize, and the Label member.
- `ui/Text.Ellipsize/{t.ts,ui.tsx,use.TextEllipsize.ts}`: plain-string measurement using one
  computed font; not a rich-content fitter.
- `ui/Prose/{t.ts,mod.ts}`: explicitly long-form authored text.
- `ui/Prose.Markdown/{t.ts,ui.tsx,u.render/u.traverse.tsx,u/u.styles.ts}`: document traversal,
  paragraphs, links, block layout, and a theme-owned root foreground.
- `dev/m.Help.Markdown/ui.tsx`: dev typography plus Chip and Anchor renderer defaults.
- `ui/Chip/{t.ts,ui.tsx}`: the inline-code presentation owner. Its public mono/style seams allow
  composition; default inline-block, scaled type, line-height, padding, and nowrap need label-layout
  proof rather than blind reuse.
- `ui/BulletList/{t.ts,ui.tsx}`: non-interactive React-node labels, shrinkable grid cells, wrapping,
  and Button-owned activation/focus. Label wrappers already use `minWidth: 0`.
- `dev/m.List/{t.ts,ui.tsx,-test/-ui.test.tsx}`: forwards labels unchanged. Its regression pins
  shared string formatting, explicit literal/rich-node identity, and production-list parity.
- `ui/Button/{t.ts,ui.tsx}` and `ui/Anchor/{t.ts,ui.tsx}`: interaction owners. Button foreground
  feedback must remain inherited; Anchor already has whole-anchor CSS truncation.
- `ui/Anchor/-spec/-ui.Samples.tsx`: the two-column Sample States selector; specimen proof of the
  shared Dev.List/BulletList label path.
- `ui/Http.Origin/ui.Value.tsx`: existing plain-text fixed-tail use; unchanged by this plan.

Parser owner: `code/sys/markdown/src/m.Markdown/{t.ts,u/u.parse.ts,m.Source.ts}`. Public
`Markdown.parse` returns a document MDAST and accepts `flavor: 'commonmark'`; it does not expose an
inline-only parser or a node-allowlist option. Text.Label owns the rendering subset, not a new
parser configuration. `Markdown.Source.slice(source, node)` supplies exact positioned source
recovery for unsupported inline subtrees. Keep the original source paired with the tree parsed from
it; do not strip frontmatter, transform the tree, or serialize nodes back to Markdown to manufacture
raw text. No parser-owner extension is currently demonstrated as necessary. Add a shared
`@sys/markdown` capability only for a concrete missing substrate function, not to relocate label
policy.

## Dependency-boundary decision and evidence

Preparation baseline: `fe070ada4`, `@sys/markdown` 0.0.24. Use the existing public `@sys/markdown`
root, re-exported only through `Text.Label/common.ts`; call `Markdown.parse` and
`Markdown.Source.slice`. Keep Markdown out of package-wide and shared UI runtime barrels. Import
Chip through `../Chip/mod.ts`, not through Text, Dev, or an aggregate component surface. Later
BulletList adoption imports `../Text.Label/mod.ts` directly rather than the Text aggregate.

This is the selected engineering boundary for the primitive, not an outstanding approval gate. It
reuses the supported grammar/source API without creating a new package surface or coupling to
Prose.Markdown. `code/sys/markdown/deno.json` exports only the root and types; no public parse-only
entry exists. Do not use private imports, lazy loading, or parser injection to conceal the cost. A
smaller owner-level entry can be justified separately by a concrete consumer budget; it is not
required to begin this unit.

### Reachable imports and consumer impact

Source inspection establishes the existing Markdown root's static branches:

- Parsing/GFM: `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm`;
  serialization also imports `mdast-util-to-markdown`.
- Frontmatter: `mdast-util-frontmatter`, `micromark-extension-frontmatter`, and the public
  `@sys/yaml` core. This is more than just a YAML parse function.
- HTML: `mdast-util-to-hast`, `hast-util-sanitize`, and `hast-util-to-html`.
- Source/guards and shared utilities: `@sys/std` leaf helpers. Type-only MDAST/type-pool exports are
  not runtime edges.

These are reachable dependency families, not a claim that every package is newly added to every
consumer or an exhaustive transitive package inventory. CommonMark selects parsing behavior; it does
not remove statically imported GFM, serialization, frontmatter, or HTML code.

`Text/mod.ts` statically assembles its members. Wiring Label there adds its Markdown branch to
`@sys/ui-components/react/text` and its `/text` alias, including callers that use only Text.Input or
the named TextInput export. Text.Input's implementation need not change. Direct BulletList entries
gain the branch only in the later list-adoption item. In contrast, `/react/dev` already reaches
Markdown through `Dev.Help.Markdown → Prose.Markdown`; list adoption adds another path, not its
first Markdown dependency.

### Cycle assessment and verification boundary

The intended new direction is `Text → Text.Label → Markdown/Chip`, followed later by
`BulletList → Text.Label`. The inspected Markdown owner modules do not import UI components; Chip's
production module does not import Text or its host components. No return edge to Text.Label, Text,
or BulletList was found in those owner-level paths. Keep host compositions and Dev imports in
`-spec/`; importing the Text aggregate or BulletList from Label would break that direction.

The root, Frontmatter, and Html runtime-boundary tests passed: 3 tests / 7 steps. Full Markdown
owner tests passed: 16 tests / 41 steps, including parser and source-lens regressions. These ran
through `code/sys/markdown`'s declared `test` task at the preparation baseline, without source
edits. The inspected `EsmAssert` scanner follows relative static source imports and checks bare
specifiers; it does not resolve all transitive package graphs or prove global acyclicity. At that
preparation baseline, the scaffold had no Label parser edges. These were substrate checks plus a
source-based cycle assessment; the actual primitive wiring is recorded below.

Accept the static graph expansion as this unit's explicit trade-off. Bundle bytes, cold-load time,
and tree-shaking results remain unmeasured; no performance budget or zero-cost claim is introduced.
During primitive verification, inspect the actual Text/Label runtime import paths, typecheck the
owner, and test the public Text member identity and browserless label rendering. Repeat the
entry-path review for direct BulletList and Dev.List at adoption. These are implementation
verification obligations, not additional pre-start approvals.

## Ownership and public shape

Module: `code/sys.ui/ui-components/src/ui.react/ui/Text.Label/`. Intended public composition:
`Text.Label.UI` through the existing `@sys/ui-components/react/text` entry. Follow the existing Text
family and type-pool grammar; no package-root export or duplicate `Prose.Label`, `Dev.Label`, or
standalone Label family is needed.

Naming decision: retain `Text.Label`. Label names the user-facing display concept; the supported
Markdown subset is its authoring notation. `Text.InlineMarkdown` was considered for syntax clarity
but is not the chosen API. Do not add it as an alias, a second family, or a format flag.

- `@sys/markdown`: grammar, escaping, code-span normalization, and MDAST parsing.
- `Text.Label`: supported label subset, Chip composition, inherited presentation, and text overflow.
- Chip: token paint and reusable bounded single-line ellipsis; consume its public component and
  overflow contract rather than copying styles or measuring token text in Text.Label.
- Host: finite available width, shrinkable ancestors, and whether inline flow may wrap. Moving a
  chip to another line is the host's inline layout, not a Chip-owned forced break or width observer.
- Button/Anchor: activation, navigation, focus, disabled state, and feedback.
- BulletList: delegate explicit string action labels to Text.Label; retain list semantics, markers,
  columns, controlled selection, and row layout. No parser or duplicate renderer.
- Dev.List: row-method convenience and unchanged label forwarding; no second normalization.

Public props: required `value: string`, optional `overflow: TextLabel.Overflow` (default `flow`),
`debug` (default false), and `style` through canonical CSS types. The overflow union replaces the
unshipped `truncate` boolean proposal: three compositions need three explicit choices, not two
interacting flags or a special meaning for omitted versus false. No redundant `truncate` alias.

- `flow`: inline presentation; the host permits or prevents wrapping and Chip owns oversized-token
  ellipsis. This mode does not force `white-space: normal` on a nowrap ancestor.
- `truncate`: Text.Label owns a bounded one-line ellipsis box; its Chips do not clip internally.
- `host`: Text.Label and its Chips add no clipping; an explicitly composed ancestor owns it. This is
  a caller declaration, not DOM inspection or an assertion that CSS overflow is inherited.

`debug` outlines the label boundary without changing layout. Do not add public AST input, children,
parser plugins, render callbacks, grammar-mode flags, theme-owned foreground, measurement handles,
or speculative variants. Outside the planned list adoption, callers opt in with the explicit
component. It is a display span, not an HTML form-associated `label` element.

The scaffold defined no behavior; these calls describe the primitive contract. The finite bounds are
part of the examples; code-only and long-token variants must prove them in a browser:

```tsx
import { Anchor } from '@sys/ui-components/react/anchor';
import { Text } from '@sys/ui-components/react/text';

const value = 'Run `build` with **production** settings';

// Wrapping composition: the host supplies the line width; Chip owns token ellipsis.
<div style={{ width: 180 }}>
  <Text.Label.UI value={value} />
</div>;

// Whole-label composition: only Text.Label owns clipping.
<Text.Label.UI value={value} overflow='truncate' style={{ width: 180 }} />;

// Existing outer owner: neither Text.Label nor Chip creates a competing ellipsis.
<Anchor.UI href='/docs' truncate style={{ maxWidth: 180 }}>
  <Text.Label.UI value={value} overflow='host' />
</Anchor.UI>;
```

## List-label contract and compatibility

Normalize at the production BulletList action-label boundary, before the existing ID fallback:

- A string `item.label` becomes Text.Label's `value`. This applies equally to direct BulletList
  users and labels forwarded through Dev.List; do not parse again in the adapter or specimen.
- Non-string React nodes pass through unchanged, including explicit rich labels and fragments
  containing literal strings. Do not stringify nodes or inspect their children.
- Missing/null labels retain the existing literal ID fallback. IDs, content cells, and arbitrary
  Button/Anchor children are not formatting inputs. Empty strings retain empty-label behavior;
  callers still owe actionable controls a non-empty accessible name.
- Keep the field named `label`; do not add an item `value` alias, format flag, or renderer callback.

A Dev.List caller authors notation as ordinary label data:

```tsx
{
  id: 'download',
  label: 'download (`/dist.json`)',
  onActivate: download,
}
```

This is an intentional semantic compatibility change: Markdown punctuation, escapes, and entities in
existing string labels may change displayed text. Audit affected list callers and document the
migration in BulletList and Dev.List public contracts. Literal content can use an explicit node,
such as ``label: <span>{'**literal** `code`'}</span>``.

Preserve IDs, selection, activation, layout defaults, and all non-label fields. Outside this list
boundary, existing controls retain literal strings; callers opt in through explicit Text.Label node
composition.

## Syntax and local literal fallback

Use `Markdown.parse(value, { flavor: 'commonmark' })`. Keep it a document parser; validate the
returned shape before rendering it as a label. No regex backtick splitter, custom Markdown dialect,
HTML rendering round-trip, private dependency import, or generic renderer framework.

The accepted document shape is one paragraph. Within it, render text, inlineCode, strong, and
emphasis; recursively apply the same policy inside supported containers. Unwrap the paragraph into
the label's span, never a paragraph or document container. An empty value renders empty text, not a
placeholder. Whitespace-only input retains its literal source.

For each unsupported inline node, recover its entire original source span through
`Markdown.Source.slice(value, node)` and render that span as escaped React text. Treat that subtree
atomically: do not descend into a link or image and render its supported children, discard its URL,
or reconstruct its syntax. Supported siblings and enclosing strong/emphasis remain supported. No
links, images, HTML elements, focus targets, or diagnostic UI are created from unsupported input.

The human selected this local policy rather than making every unsupported inline node invalidate
otherwise-supported formatting. Required authoring cases include:

- `**Save** [help](/help)`: bold Save followed by literal `[help](/help)`.
- `Run **build** &amp; ship [help](/help)`: build remains bold and the supported text entity remains
  decoded; appending the link does not expose earlier bold delimiters or entity source.
- `*[help](/help)*`: the recovered link spelling remains inside the supported emphasis.
- `[**help**](/help)`: the entire link spelling remains literal; do not format inside the rejected
  subtree or turn it into a link.
- `**Save** <span>**go** &amp;</span>`: inline HTML tags are separate MDAST nodes, not an HTML
  subtree. Recover the tags literally while supported sibling formatting remains rendered. Do not
  introduce an HTML parser to group those tags. Block HTML still rejects the document shape.
- Inline HTML, images, autolinks, escapes, and unsupported source containing entities/backticks:
  preserve the unsupported span's authored spelling, not its parsed text or a serialized
  approximation.

For parse failure, a non-paragraph document, multiple root children, or an unrecoverable unsupported
span, render the whole original value as escaped literal text. Do not drop definitions or flatten
headings/lists to force a document into the inline shape. Reference links with separate definitions
therefore require explicit document-shape tests. Missing, empty, out-of-range, or inconsistent
source spans must not silently lose content or cause guessed reconstruction. Keep this fallback
distinct from ordinary local rejection; it is not a public error-reporting or AST-input API.
`Source.slice` checks offsets, not correspondence between arbitrary source and nodes. Preserve the
private unchanged-source/tree pairing; do not attempt to prove that pairing by building a generic
AST validator, another parser, or line/column reconstruction machinery.

Code delimiters, escapes, embedded backticks, and code whitespace normalization remain parser-owned.
Pin LF/CRLF code values in tests rather than assuming the parser has replaced every line ending with
an ordinary space or adding an unrequested normalization pass. Unmatched syntax follows its parsed
result, not a second local repair heuristic. Normal CSS whitespace processing applies: this is not a
verbatim source viewer. Soft newlines follow inline flow. Unsupported hard-break nodes retain their
source spelling rather than introducing a `br`; spaces/newlines may collapse visually under CSS. Do
not claim every unsupported construct becomes a visible warning. Warning/diagnostic presentation is
deferred, not part of this primitive.

Pin rendered text and retained source separately, including block-like prefixes (`'# '`, `'- '`,
`'1. '`), nested formatting, reference definitions, hard breaks, CRLF, Unicode before a recovered
span, and repeated/adjacent unsupported nodes. These are required contracts and test cases, not
claims of executed parser or browser results.

## Presentation and overflow

- Text.Label renders a neutral span, native `strong`/`em`, and `Chip.UI` with `mono` and native code
  semantics. Callers supply strings, not Chip render callbacks. No nested focus targets, roles,
  handlers, links, or document blocks.
- The label root inherits foreground, font size, line height, and ordinary-text font family. Chip
  owns token paint; omit its theme so currentColor follows Button feedback. Resolve token size and
  line-height through public props/styles, not copied paint. Preserve first-line alignment and
  BulletList row rhythm.
- Inherit whitespace; do not force normal wrapping against a nowrap ancestor. The Chip contract
  below owns token sizing and the composition table owns the single-ellipsis policy. False alone
  does not expose an atomic Chip's internal text to an ancestor's ellipsis. Carry the shown explicit
  inline composition into Text.Label and repeat its browser checks at acceptance; if paint fails,
  obtain a contract decision rather than hiding the failure with a second clipping owner.
- Keep complete rendered text in the DOM. Do not replace it with measured substrings or route
  mixed-font labels through Text.Ellipsize. No observers, canvas, state, storage, or effects for CSS
  ellipsis; measured middle/fixed-tail truncation stays with Text.Ellipsize. Mixed-font middle
  truncation and multiline clamping are non-goals.
- Confine clipping to its selected owner, not focus outlines or BulletList markers. Button owns its
  host sizing correction below. Anchor retains native navigation, focus, and decorative markers;
  compose it explicitly with `overflow='host'`, never by inferring ownership from inherited nowrap.
- Do not synthesize tooltips or aria-labels from raw Markdown. Caller-owned naming remains
  available; an empty display value does not relieve a control of its non-empty accessible-name
  requirement.

## Chip contract and bounded execution strategy

Keep this unit in this plan, in its own commit before label behavior. Chip owns one capability, not
three host modes. It must not import Text.Label, Anchor, Markdown, or a layout-policy context.

Chip acceptance contract:

- Add `truncate?: boolean`, with `D.truncate = false`. Omitted and false preserve the existing
  output and behavior; true opts only this Chip into bounded single-line CSS ellipsis. Do not
  overload the flag with widths, ancestor names, or automatic detection.
- With true, retain intrinsic width when the token fits, cap the complete painted token at the
  available containing width when it does not, and keep its text unbroken. Natural inline layout
  decides whether the intact token moves to a fresh line. With no finite bound, do not promise an
  ellipsis or invent a viewport fallback.
- Preserve full children in the DOM, existing paint, size/mono semantics, and data identity. No
  substring replacement, tooltip/aria-label synthesis, event handlers, focus targets, or JS width
  measurement. Prove direct text and the chosen non-interactive native-code composition; do not
  narrow existing `ReactNode` input or advertise support for arbitrary block/interactive children.
- Keep caller styles last in composition, matching the existing owner convention. An explicit caller
  override can change the sizing recipe; document that boundary rather than enforcing it with
  private selectors or `!important`.

Composition mapping to prove:

| Label composition                     | Label clipping     | Chip `truncate` | Chip layout   | Ellipsis owner |
| ------------------------------------- | ------------------ | --------------- | ------------- | -------------- |
| `flow` in a wrapping host             | None               | `true`          | `inline-grid` | Chip           |
| `truncate` with a finite bound        | One-line label box | `false`         | `inline`      | Text.Label     |
| `host` in a bounded truncating Anchor | None               | `false`         | `inline`      | Anchor         |

Do not overload `false` versus omitted on Chip or Text.Label to encode a third policy. The label's
selector expresses a demonstrated ownership distinction; it is not a Markdown mode or generic layout
framework. The shown Chip layouts are accepted for starting Text.Label, as recorded in the browser
receipt below; this is not full browser-matrix or Text.Label acceptance. Only the explicit
outer-owner compositions supply `style={{ display: 'inline' }}`; do not change Chip's omitted/false
default globally.

Execution sequence within the Chip unit:

1. Use the three caller contracts and finite-width assumptions above. The human selected paired
   browser verification in the existing registered Chip specimen: the assistant supplies the code
   and checklist; the human exercises it in their browser and reports outcomes. Use the owning `dev`
   task when a server needs launching, inspecting its script/help and permitted execution surface
   first. No browser automation setup is required; live browser behavior remains the proof.
2. Work under `code/sys.ui/ui-components/src/ui.react/ui/Chip/`: types in `t.ts`, default in
   `common.ts`, renderer in `ui.tsx`, focused tests under `-test/`, and cases in the existing
   `-spec/`. Keep the public module identity. Preserve specimen storage keys, defaults, and
   interactions; add only the controls/cases required by this contract. No lifecycle cleanup.
3. Establish red → green type/DOM/declaration tests, including omitted/false equivalence, true
   sizing intent, full text, transitions, SSR, and caller-style precedence. Implement the smallest
   CSS/DOM structure that can preserve paint and baseline alignment; neither a new inner span nor
   clipping the outer inline-block is justified by habit alone.
4. Prove geometry in a real browser: current-line fit, fresh-line fit, full-line overflow, and
   single-owner clipping, including code-only content. Use direct Chip/static-label compositions in
   this unit; do not implement Text.Label merely to test its future composition. Exercise both
   Button slots and the independent BulletList grid; keep host corrections outside this unit until a
   concrete failure justifies separately scoped work.
5. Run bounded owner checks/tests, then the owning package check/test and exact-file formatting.
   Review all touched files for dead affordances, duplicate recipes, unused props/imports, and
   misleading proof claims. Record browser environment and outcomes, not screenshots alone.
6. Stop after the Chip unit for its bounded review and separately authorized landing. The human's
   later scope decision accepts the shown composition for starting Text.Label and carries the
   remaining browser matrix into its acceptance. Consume the dependency boundary recorded above; do
   not treat that deferral as completed browser proof.

A missing browser lane, a broken baseline, or inability to obtain one visible ellipsis is an
explicit evidence/contract problem. Report it rather than widening permissions, hiding clipping with
CSS overrides, restoring template experiments, or expanding into a measurement framework. Parser
dependency cost and label-source recovery remain the label unit's obligations, not reasons to import
Markdown or finish the label renderer inside Chip.

## Button host correction

The human authorized the narrow Button correction after browser evidence exposed both 120px slots
escaping their bounds. Button owns its grid body's shrinkable column; Chip cannot resolve the host's
intrinsic track sizing through a percentage bound. Add `gridTemplateColumns: 'minmax(0, 1fr)'` to
`Button/ui.tsx` and focused declaration coverage for both `label` and `children`. Keep this host fix
separate from the Chip feature, with no interaction changes, root clipping, or public API expansion.
Run the existing Button and BulletList regressions and verify both slots and focus clearance in the
Chip specimen. The opening arc places this independent host fix before the Chip feature's landing;
source correction and browser diagnosis may proceed together.

## Deferred template maintenance

[ui-template-maintenance.plan.md](../@sys.tmpl/ui-template-maintenance.plan.md) owns repeated-init
subscription lifetimes, shared-rule theme interference, their reproductions, and later consumer
maintenance. It is not a prerequisite here. Restoring the template baseline did not repair those
inherited defects. The experimental `connect` design needs a settled persistence contract and
theme-only synchronization; the foreground/currentColor stylesheet experiment was rejected as an
appearance change. Do not reintroduce either through Chip or label work. Scaffold recovery evidence
and the retained adaptations are recorded below; template maintenance retains its own arc.

## Implementation boundaries

1. **Scaffold:** human-led standard `@sys/tmpl` `m.mod.ui` generation, then explicit review of
   Text.Label ownership, names, and the initial file set. Use the current template, not handwritten
   scaffolding; inspect the authoritative task/help before running it. Record template adoption. The
   scaffold lands separately before behavior. Keep it behavior-free: no Markdown/Chip wiring,
   formatting or fallback logic, overflow implementation, or consumer adoption. Verify the generated
   module's identity, structure, imports, and owning-module typecheck. Parser-policy and
   browser-layout proof belong to the next item, not this one. No speculative controller or generic
   text engine.
2. **Chip overflow:** implement the boolean opt-in and execution sequence above, retaining existing
   defaults and paint. Keep natural line placement host-owned. Types, renderer, tests, and specimen
   form one bounded unit before label behavior. No Markdown dependency, resize observer, copied
   paint, or template-lifecycle maintenance belongs here. Do not broaden this into arbitrary child
   layout support or a global caller migration.
3. **Primitive:** consume the accepted Chip overflow seam and the selected parser dependency wiring.
   Implement the explicit `flow`/`truncate`/`host` composition selector without a boolean alias.
   Define the public type spine, then fulfill it. Wire the Text family, package type aggregation,
   public surface tests, and the existing registered specimen. Use the existing parser and source
   lens directly with private pure shape validation and local literal recovery. Add a parser-owner
   capability only for a demonstrated substrate gap. Keep runtime dependencies cycle-safe and
   inspect the Text aggregate's added Markdown dependency. Do not couple label rendering to the
   document renderer; no automatic Prose.Markdown refactor or shared rendering framework. Remove
   template placeholder foreground and padding before behavior acceptance. Use Chip for code paint
   and token ellipsis; do not restore the removed optional stylesheet. Keep identity/defaults on
   `D`, public contracts in the type plane, and parser access local to the owner.
4. **Production list adoption:** a separate feature commit makes BulletList delegate explicit string
   action labels to Text.Label through its module surface. Keep Dev.List's forwarding thin and
   normalize only once. Update both public contracts and the old literal-string regression; audit
   affected callers and prove node passthrough, literal ID fallback, content-cell exclusion, and
   unchanged interaction/selection. Do not turn missing-label IDs into parser input.
5. **Anchor specimen adoption:** author notation in the existing Sample States string labels, such
   as the `Dev.Link` token and `/dist.json`. Exercise `Dev.List → BulletList → Text.Label`, without
   per-sample Text.Label wrappers. Preserve existing visible wording apart from intended token
   presentation, stable IDs, preset patches, two-column order, compact insets, selection omission,
   callbacks, persistence, and panel/subject theme separation. Add one focused integration proof;
   keep grammar/rendering tests at Text.Label.

The Text.Label specimen should exercise ordinary text, code/strong/emphasis, nested supported
formatting, literal fallback, long tokens, wrapping, truncation, dynamic content, constrained Button
and BulletList composition, and an outer Anchor. Use the usual harness pattern; persist debug knobs
outside the renderer and keep interaction examples local. Do not broaden this into the separately
deferred shared Dev composition specimen.

## Scaffold adoption and recovery evidence

- Human-selected names: `Text.Label/`, `TextLabel`, and eventual `Text.Label.UI`. Generated via
  `deno task tmpl`, `m.mod.ui`, `@sys/tmpl` 0.0.489 after help/DSL inspection and dry-run. The
  generated boundary was nine module/specimen files plus type and DevHarness pointers.
- Retained adaptations: frozen `{ UI }`, local `D` identity, existing type-family/registry
  placement, specimen `-t.ts` pointing to `ui.react/ui/common.t.ts`, unchanged storage-key identity
  via `STORAGE_KEY.DEV`, and purpose documentation. Removed unused locals/imports and the optional
  stylesheet with no selector consumer. No parser, Chip, consumer, or Text aggregate runtime wiring
  entered the scaffold; placeholder appearance remains for the later primitive item to replace.
- Recovery baseline: `97118f747383a7e4c4b786e9cb3b2dd00e196ce5`. Only attributable template source,
  tests/parity, embedded-bundle changes, and Text.Label's experimental lifecycle adoption were
  restored/removed; unrelated work was preserved. The maintenance plan retains discoveries from the
  rejected experiment. Optional stylesheet removal and inherited specimen lifetimes are distinct;
  maintenance does not justify restoring the unused stylesheet.
- Generation checks at `97118f747` plus scaffold: owner typecheck and eleven-source exact formatting
  passed after the barrel correction. Cleanup checks: owner typecheck, ten-source formatting, and
  Text API 1 test / 1 step passed; optional-affordance removal had no new red phase.
- Recovery checks after `prep:bundle` (104 assets): `code/-tmpl` matched baseline before/after
  checks; both owner typechecks passed; template tests 3 / 7 steps, Text API 1 / 1, UI-components
  121 / 856, ten-source formatting, and tracked whitespace checks passed. Template comparison showed
  only the retained adaptations above. These establish scaffold integration and baseline recovery,
  not fixed inherited lifetimes, appearance equivalence, browser/AT proof, or later behavior
  authorization.

## Implementation acceptance obligations

- Verify the actual Text/Label import paths against the dependency decision above; repeat for direct
  BulletList/Dev.List at their later adoption. Substrate boundary tests do not establish the final
  consumer graph or its measured cost.
- The human owns the [browser acceptance checklist](#browser-acceptance-checklist), including the
  carried Chip checks in actual Text.Label compositions. Declarations and cached CSS rules do not
  establish geometry.
- Validate the local-recovery examples and source-span failure behavior against the existing
  parser/source lens during primitive implementation. Escalate only demonstrated substrate gaps. The
  chosen local fallback policy and the decision not to render links are not invitations to expand
  the supported grammar.
- These are proof obligations of the listed units, not new review commits or gates. The preparation
  GO authorized dependency preparation and plan updates only. The later explicit GO named
  `feat(ui-components): add non-interactive inline Markdown labels`, authorizing that primitive
  unit, not BulletList/Anchor adoption or Git mutation. Neither instruction expands parser policy.

## Verification

- Use red → green owner-level tests for supported formatting, nested validation, exact local source
  recovery, whole-input document/error fallback, escaped/unmatched/multi-backtick input,
  empty/whitespace input, soft newlines, hard breaks, block syntax, links/images/HTML, reference
  definitions, and mixed supported/unsupported input. Prove supported siblings survive adding an
  unsupported inline subtree and that rejected subtrees remain atomic literal source.
- At Chip, test the public contract, default equivalence, full text, paint declarations, caller
  precedence, transitions, and SSR. The shared browser checklist owns rendered acceptance.
- Prove code tokens compose the public Chip component with monospace presentation, not copied paint
  or token-overflow mechanics. Cover long code alone, code beside text, adjacent chips, and code
  nested in strong/emphasis. Label tests own composition; Chip tests own its reusable behavior.
- Keep subset policy, rendering, fallback, props, and browserless SSR proof at Text.Label; prove
  actual member identity at the Text aggregate. Parsed content must never produce interactive
  descendants or raw HTML. Assert rendered semantic text and fallback text without claiming AT
  proof.
- At BulletList, prove string labels reach Text.Label once, explicit nodes bypass interpretation,
  literal IDs remain fallback-only, and content cells are unchanged. At Dev.List, prove the same
  rendered result and unchanged label forwarding, not a second implementation. Replace the old
  literal-string expectation deliberately, retaining a literal-node regression. At Anchor, prove
  authored string samples exercise the shared production path without specimen-local wrapping.
- Prove unchanged Button/BulletList activation, selection, disabled behavior, and ordinary focus
  ownership when the new label is composed. Reuse existing owner tests; avoid duplicating their
  complete event suites in the label module.
- Repeat the browser checklist at consumer adoption, except for the bounded BulletList string-label
  adoption: its browser reinspection is nonblocking, with geometry and computed names explicitly
  unverified. This exception does not change Anchor specimen acceptance. Page captures alone do not
  establish dynamic layout or computed accessible names; those require observation of the relevant
  behavior or accessibility panel.
- Run scoped tests through the owning module tasks before its final full check/test. Inspect live
  task definitions first. Relevant scopes include `src/ui.react/ui/Chip/-test/`,
  `src/ui.react/ui/Button/-test/`, planned `src/ui.react/ui/Text.Label/-test/`,
  `src/ui.react/ui/Text/-test/`, `src/ui.react/ui/BulletList/-test/`,
  `src/ui.react/dev/m.List/-test/`, and the affected Anchor regression. Existing scaffold tests do
  not establish the planned primitive or list-label behavior.
- Format/check exact changed files only. Preserve canonical plan opening blocks even when the
  Markdown formatter disagrees. No workspace-wide formatting or unrelated migration.

Record evidence against its actual source baseline. Planning and archived Dev.List results do not
establish acceptance of later behavior.

## List-adoption verification evidence

Source baseline: `45982b1a6` plus the bounded seven-file BulletList/Dev.List delta.

- BulletList imports `../Text.Label/mod.ts` directly and checks the explicit label with `Is.string`
  before applying the existing nullish ID fallback. Dev.List's runtime is unchanged. Text.Label
  remains the sole parser; no Text aggregate, shared runtime barrel or host-return edge was added.
  Direct BulletList now reaches the accepted static Markdown branch; costs remain unmeasured.
- Red phase: the new label-boundary and descendant-interaction cases, the existing list-semantics
  case and Dev.List SSR case failed against literal rendering. The focused three-file run then
  passed: 3 tests / 17 steps. Owner `deno task check --quiet` and full `deno task test --quiet`
  passed: 130 tests / 894 steps. Exact-file formatting passed for seven implementation files.
- Boundary proof covers one-pass escapes/entities, strong/emphasis/code, literal explicit nodes and
  fragments, missing/null ID fallback, empty strings, numeric/false nodes and excluded content
  cells. Formatted-descendant activation retains Button-owned focus, disabled state and controlled
  selection. Dev.List preserves the original label values/node references and renders identically to
  the production list. Public contracts document the compatibility change and literal-node escape.
- Caller audit: Http.Origin uses literal fallback IDs; webfont family/style and TreeHost spinner
  labels are plain strings. BulletList, Chip and Text.Label debug selectors and the passkey fixture
  selector also use plain display labels. Chip/Text.Label composition fixtures already supply
  explicit nodes. Anchor's current Sample States labels are plain strings; their notation adoption
  stays in the next item. No existing caller required a literal-node migration.
- BulletList's existing stress sample adds authored strong/emphasis/code and a long code-only token,
  and formats its disabled row. Existing width/font/theme/columns/RTL knobs exercise the shared
  production path without new controls or storage. Consumer browser geometry and computed names were
  not rechecked; these automated results do not extend the earlier browser receipts. The human owns
  browser inspection; no server or browser automation was launched.
- The human's named GO authorized this list adoption only, not Anchor sample conversion or Git
  mutation. Parser expansion, template maintenance and broader consumer migrations remain outside
  this unit.

## List specimen and marker-appearance follow-ups

- The dedicated Markdown labels specimen separates formatting examples from layout stress. It uses
  ordinary string labels for supported formatting and local literal recovery, an explicit node for
  literal notation, and a disabled formatted action. Existing controls and persistence remain owned
  by the specimen; production parsing is unchanged.
- Bullet owns `borderOpacity`; BulletList exposes only
  `bullet?: Pick<t.BulletProps, 'borderOpacity'>` and forwards that field explicitly. Standalone
  Bullet retains its default; BulletList uses a stronger border default. Both defaults live in their
  owning `common.ts` constants. Fill colors, selection, sizing, theme ownership and Button-owned
  disabled dimming are unchanged.
- Focused proof retains Bullet's default/override paint check and BulletList's default/forwarding
  check, including omitted/empty options and zero. After the grouped API change, the affected layout
  and selection suites passed: 2 tests / 13 steps; owner typecheck and exact-file formatting passed.
- Human-supplied Light/Dark captures supported the stronger rings without competing with labels or
  selected blue markers. This is visual acceptance at the shown settings, not measured contrast,
  computed accessible names or a complete browser interaction matrix. Anchor adoption remains a
  separate unit.

## Anchor specimen verification evidence

Source baseline: `a30529aa6` plus the bounded sample-label and integration-test delta.

- Only the `Dev.Link` and `/dist.json` tokens gain backtick notation in Sample States labels.
  `Dev.List → BulletList → Text.Label` owns rendering; no local wrappers or parser changes were
  added. Visible wording, IDs, preset patches, callbacks and persistence are unchanged; production
  Anchor code is untouched.
- The added code-token assertion failed against the plain labels. Owner check and full tests then
  passed: 131 tests / 897 steps. The final focused sample suite passed: 1 test / 12 steps, retaining
  existing patch, persistence, focus, two-column and panel/subject-theme regressions. Exact-file
  source formatting and tracked whitespace checks passed.
- Human captures exposed unwanted wrapping in the download selector label. The human chose a wider
  debug panel instead of splitting the presets into separate lists. Anchor's specimen now requests
  480px through `ctx.debug.width`, retaining the two-column list and existing separators. Owner
  check, the focused sample suite (1 test / 12 steps), and three-source formatting passed after this
  adjustment; no new red phase was used for the harness setting. The full-suite result above
  predates this width adjustment.
- The later captures `pi-clipboard-da105fa6-f966-47c9-8909-9e13f53f7ba6.png` and
  `pi-clipboard-85b5bd43-3556-4d77-a06e-eee501a91a8a.png` show both formatted labels fitting on one
  line, aligned rows and the retained two-column group. The human endorsed the result. This closes
  the reported visual-fit issue at the shown settings; computed names and the broader browser
  interaction checklist remain unverified, not implicitly waived by landing. No server or browser
  automation was launched.

## Downstream Passkey test-helper regression

Source baseline: `de622cbca` plus the test-helper delta in
`code/sys.ui/ui/-sample/passkey/ui/-test/u.fixture.tsx`.

- The reported `Missing text: Signed out` failure reproduced in the focused harness test. Its
  `textElement` helper searched only leaf `div` elements. BulletList's adoption at `ab1e3a07b`
  renders explicit strings through Text.Label's `span`, so the text remained present but the test
  could not locate it. This is a test-selector regression, not missing UI text or a theme defect.
- The helper now matches exact text on a leaf element without assuming its tag. Existing foreground
  assertions remain unchanged, including both subject themes. Production Passkey, authentication,
  BulletList and Text.Label behavior are untouched.
- Red → green: focused harness suite passed 1 test / 6 steps. Full `@sys/ui` owner tests passed 17
  tests / 174 steps; owner check, exact-file formatting and tracked whitespace checks passed.
  Existing callers also exercise title identity and KeyValue adjacency through the same helper.

## Primitive verification evidence

Source baseline: `766ac91fd` plus the bounded Text.Label/Text delta (`fe070ada4` supplied the
unchanged production prerequisites). Public `value`, `overflow`, debug and caller style form the
primitive contract. Foreground/theme ownership remains with the host; the scaffold-only theme prop
and placeholder paint/padding are removed. Internal subset types and recovery seams remain outside
package exports. Existing package type aggregation and specimen registration already cover Label.

- Red phase: the three browserless rendering cases failed against the placeholder; the Text API test
  rejected the missing Label member. Parser/recovery and declaration/persistence coverage were added
  during implementation; not every added test had its own observed red phase.
- Focused Label/Text plus Button/BulletList/Anchor regressions through the owner test task with leak
  tracing passed: 30 tests / 227 steps. Full owner `deno task check --quiet` and
  `deno task test --quiet` passed: 129 tests / 892 steps. Exact-file formatting passed for 16
  source/test/specimen files; tracked whitespace checks passed. No formatter write was used.
- Pure recovery tests cover local atomic rejection, nested failure propagation, malformed spans,
  Unicode/CRLF offsets, entities/escapes, hard breaks, definitions and rejected document shapes.
  This parser retains LF and CRLF inside code-span values; tests pin those actual values without
  adding normalization. SSR/DOM tests establish escaped phrasing markup, complete rendered text,
  inherited root typography, caller-style precedence, explicit ellipsis owners and prop transitions.
- Actual source wiring is `Text/common.ts → Text.Label/mod.ts → ui.tsx/u.parse.ts`, with the public
  Markdown root only in `Text.Label/common.ts` and direct `../Chip/mod.ts` in the renderer. No new
  production Text/Dev/host return import or shared runtime-barrel expansion was introduced. Public
  `/react/text` and `/text` identity tests and browserless rendering passed. Static dependency
  expansion remains the accepted trade-off above, not measured bundle/load or global-cycle proof.
- The existing registered Text.Label specimen now uses real labels in 13 numbered rows, both Button
  slots, an explicit-node BulletList and an outer Anchor. Its private storage preserves legacy
  theme/debug values and persists value/overflow/width/font-size; tests inspect serialized changes
  and reset. A local activation counter makes host interaction visible. This is not implicit
  BulletList string adoption, a cold browser reload test, or template lifecycle repair.

### Text.Label browser receipt

Human-supplied captures show the actual Label specimen in Brave on macOS. Version, zoom, DPR and
measured geometry were not supplied; observations below are visual, not pixel measurements.

- Dark / 360px / 10px: six Sample States show supported formatting, plain text, nested code, local
  recovery, whole-input fallback and long code. Baselines and fresh-line placement appear intact;
  long code clips within the fixed-width Buttons and list cells. Rows 6–8 fit at this setting, so
  these captures do not prove outer ellipsis. Representative captures:
  `pi-clipboard-c1905d09-964a-483d-8ae7-7fccba5398dc.png` and
  `pi-clipboard-7e409747-a5ee-4547-a00a-c7325ff1b2e2.png`.
- Dark / 180px / 16px and 120px / 20px: long tokens and rows 6–8 show a single visible ellipsis
  within their bounds. Adjacent tokens wrap without visible overlap. The two-column list becomes
  severely cramped at 120px, but remains contained. Captures:
  `pi-clipboard-8264adf8-9a34-49d8-baad-29572bf4243f.png` and
  `pi-clipboard-5d73b44c-0421-41e4-b6d6-6049de53dcc3.png`.
- Tabbing captures show visible Anchor, Button and list-action outlines. The human reported focus
  moving from the last enabled list action into Debug. The counter changes from 0 to 1, establishing
  an activation, not every host's keyboard/disabled behavior. Representative captures:
  `pi-clipboard-aa837a58-ce57-4424-bfea-4a114550ccb3.png` and
  `pi-clipboard-86b6b6db-317c-4976-82e6-99b8703b978a.png`.
- Accessibility panel: row 9's `div[role="button"]` has role `button` and computed name
  `Run build with production settings.`, derived from Contents without an ARIA-name override.
  Capture: `pi-clipboard-9a5ab461-1213-4459-b710-c3dc2234728b.png`. This proves the supported-text
  case only, not clipped names, either fallback policy, the Anchor, or screen-reader behavior.

No material visual defect was observed in these captures. They do not establish live growth
recovery, Light theme, cold reload/reset, hover or all host interactions. Unobserved checks remain
in the browser checklist; no bundle/load or performance result is claimed.

## Chip verification evidence

### Earlier checks and observed failures

Initial red → green baseline: `818703253`; tests failed for the missing bound/clipping owner before
implementation. The residue pass at `1d532c559` plus the original Chip delta passed scoped tests 3 /
9 steps, package check, full tests 124 / 865, nine-source formatting, and whitespace checks. Its
cleanup had no new production behavior or red phase. The persistence test then exercised cached
snapshot reseeding, not cold storage reload or serialized reset values.

The supplied browser captures at Dark, sm, mono default true, 12px, 360px, truncate/examples true,
debug false showed actual failures: raised bounded-Chip text in rows 1/4; both 120px Button samples
escaping their bounds; row 6 omitting the token, row 7 hard-clipping it without a visible ellipsis,
and row 8 reducing the Anchor to decoration plus ellipsis. Browser/version, zoom, DPR, exact
geometry, dynamic resizing, and accessible names were not established. Capture identifiers:

- `pi-clipboard-6d58e3ff-8616-4df4-bc54-38191cb17041.png`
- `pi-clipboard-2c832687-008a-4885-b03b-cccbdbcfe900.png`
- `pi-clipboard-088104a5-c773-4811-b21f-48d22210eeb0.png`

These observations invalidated the original baseline rationale and outer-owner presentation. A
visible-overflow inline-block with a clipping block descendant did not preserve the required text
baseline. Button's inherited implicit auto track exposed an independent intrinsic-sizing problem. An
atomic unclipped Chip remained opaque to ancestor glyph-level ellipsis. The failures are not a
lack-of-automation finding and cannot be closed by the earlier green checks.

### Corrective implementation checks

Source baseline: `1d532c559` plus the Chip feature and separately owned Button sizing correction.
The bounded Chip uses inline-grid with one `minmax(0, 1fr)` column and a clipping grid item; no
redundant inner display declaration is needed. Omitted/false keeps its original inline-block output.
Only the three explicit outer-owner specimen cases override Chip to inline with clipping off.
Button's body gets its own shrinkable column; no Button/Anchor root clipping or interaction change.
The later visual receipt supports these mechanisms at the shown settings. The human accepted that
composition for starting Text.Label; remaining browser checks belong to its acceptance.

- Red phase: the focused run failed for the missing inline-grid, both Button slot track
  declarations, and the outer-owner fixtures' atomic tokens. After correction, Chip plus Button
  layout tests passed: 4 tests / 12 steps.
- Button/BulletList/Anchor regressions passed: 25 tests / 203 steps.
- `deno task check --quiet` passed; full `deno task test --quiet` passed: 125 tests / 868 steps.
- Exact-file formatting passed for eleven source/test/specimen files; tracked whitespace checks
  passed. Plan formatting retains the mandatory two-line header exception.
- Persistence assertions now read serialized localStorage values after control changes and reset,
  rather than reopening the cached immutable store. These added assertions passed without a new
  production persistence change or red phase. A cold browser reload remains a separate check.
- DOM transitions prove root identity and complete current text, not arbitrary descendant state.
  CSS/DOM tests establish declarations, not alignment, visible ellipsis, or exact containment.
- The specimen extends the existing template-shaped harness, not fresh template output. Storage is
  private, the view takes narrow inputs, and `/-sample/` paths are visibly synthetic. No template
  regeneration, lifecycle repair, or Markdown behavior is part of these corrections.

### Corrected visual receipt and acceptance scope

The corrected captures `pi-clipboard-7133c436-8952-4d12-915e-f3df060b5dce.png` and
`pi-clipboard-7928738a-6845-493c-b194-b2ddfb5e3dd4.png` were reviewed at Dark, sm, mono
undefined/default true, 12px, 360px, truncate/examples true, debug false. The prior baseline lift
was no longer apparent; fit/fresh-line/internal ellipsis and nested formatting matched the intended
composition. Rows 6–8 retained useful token text with one outer ellipsis; both Button slots appeared
contained; BulletList alignment and disabled appearance were consistent. No material visual mismatch
was found at those settings. The human's assessment was: “this looks clean to me.”

Later captures `pi-clipboard-548751cd-d0ca-4ada-b43d-ab622a3a0df0.png` and
`pi-clipboard-59b04701-ae63-4e8b-a5d2-5b2ec6ac019b.png` show the overflow and single-chip views at
240px. The specimen follow-up at `fe070ada4` presents those choices in a single-column Sample States
list, keeps individual knobs independent, and derives selection from current values. It changes
neither production Chip composition nor the scope of visual proof.

The human explicitly authorized: “Accept the shown Chip composition for starting Text.Label; carry
the remaining browser checks into Text.Label acceptance.” This closed the pre-start condition, not
full browser acceptance. The later Text.Label receipt above records additional evidence; neither
static captures nor automated declarations substitute for unobserved results.

## Browser acceptance checklist

Use the existing `http://localhost:1235/?dev` → Text.Label → `(reset)`. Reset supplies Dark, flow,
240px and 12px. Sample States change content; width, font-size and overflow controls remain
independent. Record browser version, zoom, DPR, settings, geometry and outcomes. Use the receipt
above to distinguish observed cases from checks still requiring human evidence.

1. Rows 2–5: compare text/code baselines, current-line fit, fresh-line placement, oversized-token
   ellipsis, and adjacent/nested tokens. A token fits intact only when a full line is wide enough;
   otherwise it clips within Chip. Cycle widths 120/180/240/360 and font sizes 10/12/14/16/20;
   confirm full text returns when widened. For Chip-specific size/mono/truncate checks, use Chip →
   `(reset)` → `Overflow examples (bounded)`; 360px reproduces its historical captures.
2. Rows 6–8: at overflowing widths, require useful token text and one outer ellipsis. Inspect paint,
   padding, vertical clearance, Anchor decoration and focus separately. Whole-token omission or a
   hard-clipped prefix is not acceptance. If inline paint fails, obtain a contract decision rather
   than adding a competing owner or weakening Chip defaults.
3. Rows 9–11 and the Anchor: check containment, row rhythm, hover, visible focus, keyboard
   activation and disabled behavior in both themes. Inspect the Button root/body/track and Chip
   widths where containment is unclear. Focus should skip non-interactive labels and the disabled
   action; only hosts should activate.
4. Change persisted controls, cold-reload, reset, then reload again. Stored values, derived Sample
   State selection and rendered content must agree. Mock-storage tests do not establish this check.
5. In DevTools Elements → Accessibility, select the host `div[role="button"]` or `a`, not its inner
   label span. Inspect computed Name for supported formatting, local recovery and whole-input
   fallback. For long code, the name must retain
   `/-sample/long-directory-name/example.bundle.js.map` even when the visible token clips. Row 9's
   supported-formatting name is established above; clipped and fallback Button names and the outer
   Anchor name remain unverified.

@sys.ui-components
link-grammar.plan.md
- [x] c0f7c7896 feat(ui-components)!: support span roots and CSS sizes in Icon
- [x] 30bd6589c feat(ui-components): add shared Anchor link grammar
- [x] b81b4a7d4 fix(ui-components): unify specimen dividers with Dev.Divider
- [x] d990e2068 fix(ui-components): respect theme in Run focus specimen
- [x] 31ae324da feat(ui-components): add opt-in Anchor truncation
- [x] 60ceb95be feat(ui-components): expose Dev.Link alias
- [x] a19bbeb85 feat(ui): adopt shared Passkey links and refine specimen labels
- [x] d59e35c31 test(ui): synchronize Passkey fixture updates

## Purpose and boundary

A production link grammar with a Dev entry point. Keep target, marker, availability, and opening
notice consistent without duplicating native Anchor behavior. Plain links remain first-class;
resource markers are contextual, not a requirement for every link.

Repository: `/Users/phil/code/org.sys/sys`. Production owner: `code/sys.ui/ui-components`.
Source-comparison baseline: `c0f7c7896`, including Icon's span/CSS-length contract and the shared
focus policy from `46073f617`. The opening arc separates reusable capability, Anchor grammar,
Dev composition, and dependent Passkey adoption; source inspection, not the worktree's total file
count, defines each unit.

This plan owns the work previously represented by
`refactor(ui-components): consolidate development link presentation` in
[passkey-panel.plan.md](../@sys.ui/passkey-panel.plan.md). That plan references this prerequisite
without duplicating its arc. Production Button behavior and Dev KeyValue work remain independent.

## See the examples

In the `@sys/ui-components` dev harness, select **`sys.ui.component: Anchor`**. In the right debug
panel, click **`examples`**, directly above `Sample States`. It cycles **none → focus → links →
none**; select `links` for the prose/standalone matrix. The union value persists; reset and every
`Sample States` selection return to `none`. Older boolean preferences migrate to the single mode.

`Sample States` also offers arrow →, arrow ↗, globe + →, and globe + ↗ presets using `Anchor.Link`.
These expose `openIn` and `resource` controls; native samples expose `target` and `download`
instead. The choice persists; reset returns to the undecorated native sample.

If the harness is not running, run `deno task dev` from `code/sys.ui/ui-components`. Theme and
enabled controls apply to the matrix; the remaining properties edit the single sample, not these
fixed examples.

Specimens live in `code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-ui.LinkExamples.tsx`:
plain, arrow-only, and resource-plus-arrow links, plus dedicated wrapping, 12px/RTL-container,
localization/title-clear, unavailable, focus-clear, and clipping cases. Ordinary samples use the
wider frame; narrow hosts are deliberate. Link examples navigate to `https://example.com`. The focus
view retains local fragment links returning to its first specimen. These are verification surfaces,
not browser or accessibility proof.

## Contract

### Ownership and public surface

- `Anchor.UI` / `A`, with `t.Anchor.Props`, owns native attributes/events, disabled behavior,
  missing-href fallback, rel normalization, generic icon placement, underline, and focus
  composition. Preserve `A === Anchor.UI` and unchanged undecorated output.
- `Anchor.Link`, with `t.Anchor.Link.Props`, translates resource identity and opening intent into
  that presentation. It must not copy native interaction or layout logic.
- The Dev unit adds literal `Dev.Link === Anchor.Link` and `t.Dev.Link.Props = t.Anchor.Link.Props`,
  without a frame or different defaults. Add `readonly Link: t.FC<Link.Props>` to `Dev.Lib`. Do not
  create `Dev.Anchor`, `Dev.A`, `Anchor.UI.Link`, or `Anchor.Link.UI` alternatives.

Public contracts live in the owners' `t.ts` files and existing type pool; runtime wiring stays in
`mod.ts`. Use the existing `@sys/ui-components/react/anchor` and `/react/dev` leaves, not
package-root component exports. The package's `-agent/INVARIANTS.md` has separate, stale
compatibility-barrel claims; do not restore root exports to match them.

Preserve the package split in
[dev-composition-primitives.plan.md](./dev-composition-primitives.plan.md): production grammar in
`@sys/ui-components`, Dev composition at `/react/dev`, and Harness chassis/routing in `@sys/ui-dev`.
That neighboring plan is not a prerequisite. Routing, addresses, domain state, and host placement
stay with their callers.

### Meaning and inputs

**Leading marker: resource category. Label: destination and purpose. Trailing marker: requested
ordinary opening context.**

- `children` is required rich, non-interactive phrasing content. Do not infer a label from `href`,
  flatten children, or add a competing label prop. Required `ReactNode` cannot prove a meaningful,
  non-empty accessible name; that remains caller-owned.
- `resource?: 'web'` requests a private monochrome web marker. Omission means no resource marker,
  not a non-web destination. It does not imply external origin, public Internet, availability,
  safety, or opening behavior. Future resource terms need concrete consumers and coherent meaning.
- `openIn?: 'self' | 'new-tab'` defaults to explicit `_self`, preventing document `<base target>`
  from contradicting the `→` cue. New-tab requests `_blank` with `↗`. Browser preferences retain
  tab/window choice; response handling and caller interception can affect the outcome. These glyphs
  are a local convention, not universal semantics. Same-context navigation does not promise reload.
- `openHint?: string` supplies supporting copy under the opening-help contract below. Keep these
  settled names; add no aliases for unimplemented drafts or competing opening flags.

The semantic props omit `target`, `download`, `icons`, and `'aria-disabled'`; exclude them at
runtime from wider objects too. `Omit` is not a runtime filter. Native `Anchor.UI` retains its
omitted-target, named/frame-target, download, and independent ARIA surfaces. `aria-disabled` alone
describes state; `enabled` controls interaction.

Preserve native follow, copy/inspect address, context menu, modified/middle activation, and history.
This grammar describes browser navigation requests, including relative/query/fragment links. Handler
schemes such as `mailto:` and `tel:`, and downloads, use `Anchor.UI`. Callers own destination
admission: `href: string` does not validate this scope. For `_blank`, native Anchor adds
`noopener noreferrer`; that is not general destination validation or a safety guarantee.

### Availability

`enabled` is the semantic variant's sole availability input. Rows after the first assume a non-empty
`href`:

| State                 | Content                          | Opening cue      |
| --------------------- | -------------------------------- | ---------------- |
| Missing/empty `href`  | Original children only           | None             |
| `enabled=false`       | Label + optional resource marker | None             |
| Enabled, self/default | Label + optional resource marker | `→` only         |
| Enabled, new-tab      | Label + optional resource marker | `↗` + one notice |

Resource identity is not an activation promise, so it may remain when disabled. Native Anchor owns
removal of navigation attributes, exclusion from the tab order, and caller-handler suppression. Do
not leave generated notices in fallback children or create another disabled interaction path.

### Opening help

- Resolve one hint for available new-context links. Omitted/blank `openHint` uses
  `Opens in a new tab`; it is not a hide switch. This is conventional user-facing wording, not a
  technical guarantee of tab rather than window. Preserve meaningful localized overrides verbatim.
- Add one generated `aria-describedby` reference with a stable per-instance ID. Retain caller
  references, deduplicate the merged IDs, and preserve caller descriptions when disabled. Supporting
  text must not replace the accessible name, flatten the label, or be appended as visible prose.
- Use the hint as native `title` only when caller `title` is undefined. Preserve explicit titles,
  including `''`; they do not change or suppress the description. Never copy arbitrary title text
  into the accessible name.
- Self navigation and unavailable links generate neither opening description nor opening title.
  Preserve caller titles where Anchor renders an element; missing href still returns only children.
- Native title is not dependable for keyboard, touch, or screen-reader access. An additive
  description does not prove sighted understanding of `↗` or universal advance-warning coverage. The
  title and description reuse one string; verify that actual AT does not omit or repeat the
  generated notice. Do not infer spoken output from matching attributes.

Keep the compact visual policy explicit. If evidence exposes a gap, resolve it deliberately rather
than silently adding warning prose or a tooltip framework.

### Structure, layout, and focus

Generic `Anchor.Props.icons.leading/trailing` take `t.IconRenderer` in logical order. Render one
anchor and one focus target; marker clicks activate that link. Markers must be decorative,
non-interactive, and phrasing-safe. The renderer type cannot enforce those obligations.

Icon owns `as?: 'div' | 'span'`, defaulting to `div`; Anchor requests `span` through the real
factory. Element identity and CSS display are independent: inline-block CSS or an outer span cannot
repair an invalid div inside prose. Icon accepts numeric or CSS-length sizes, retaining its 24px
default; Anchor requests `1em` so markers follow the surrounding text. Preserve handlers and caller
display control; do not add a second renderer or polymorphic framework. Keep Icon's local common
barrel independent of the aggregate icon initialization cycle.

Preserve rich labels and natural wrapping by default. Only `truncate=true` opts into whole-anchor
single-line ellipsis through an inline-block; callers constrain width via style. Do not impose
inline-flex, padding, or geometry compensation, and do not split/rewrite children to manufacture a
final-word/icon group. Aim for sensible marker placement in representative specimens, not perfect
attachment for every possible React child tree. Native Anchor owns underline boundaries and shared
marker layout, with logical label gaps of 3px for the leading marker and 2px for the trailing arrow.

Pass original caller style inputs through `FocusStyle.compose`, preserving explicit clears and
applying terminal `.class` directly. The shared Button/Anchor recipe retains its 2px stroke, 2px
offset, 1px radius, blue arrival, and 20%-blue rest. The resting colour's low contrast is inherited,
not permission to retune paint. Evaluate the full indicator, including underline; matching tokens is
not accessibility conformance.

## Implementation units and adoption

1. **Icon capability:** opt-in span roots and numeric/CSS-length sizes, independent of link
   semantics. Preserve div/24px defaults. Widening `IconProps.size` changes the contract for custom
   numeric-only renderers and size arithmetic; the breaking-change note carries that consequence.
2. **Anchor grammar:** generic marker layout, semantic translation, public/type wiring, owner tests,
   and the real harness consumers. Keep the API, proof, examples, and persisted sample controls in
   one commit. The focus-specimen changes share presentation with the new link specimens; they do
   not alter production focus paint. No further production/harness split is needed.
3. **Follow-ups:** separate commits for shared decorative dividers, theme-aware Run indicator paint,
   and opt-in Anchor truncation with its overflow specimens. The truncation capability belongs to
   native Anchor and is inherited by Anchor.Link; keep consumer adoption separate.
4. **Dev alias:** exact runtime/type aliases and public-leaf identity proof only. Land this reusable
   entry point before the dependent Passkey consumer changes. No wrapper, new defaults, or sample
   routing in Dev. Keep `dev/m.Help.Markdown/ui.tsx` on its existing native Anchor renderer: quiet
   Markdown prose and caller renderer overrides do not need migration merely to expose an alias.
5. **Passkey link adoption and specimen labels:** both reciprocal debug-panel links belong to this
   sample-owned adoption unit, together with the debug/context label refinements. `SpecLink` uses
   `Dev.Link` with explicit `openIn='self'` and no resource marker; `WebAuthnLink` uses `Anchor.Link`
   with `resource='web'` and `openIn='new-tab'`. Preserve destinations, visible labels, caller-title
   ownership, light debug chrome, host-themed 12px footer, and independent specimen state/lifecycles.
   The title calls the reference a W3C specification without asserting a publication maturity level.
   This unit depends on both Anchor and the Dev alias; neither owner depends on the Passkey sample.
   `-u.navigation.ts` retains address and label ownership.

Each unit carries its own proof. The former production unit's Icon capability and Passkey adoption
are separated without dropping their contracts or verification obligations.

### Separate specimen-divider cleanup

Share the decorative overhanging rule through `Dev.Divider` before continuing consumer adoption.
Button variants and Anchor's focus/link examples use one recipe: 5px height, 25px horizontal bleed,
14px top and 10px bottom spacing, and foreground at 0.1 alpha. Remove Button's extra caption top
margin so the divider alone owns inter-section spacing. Preserve caption typography, focus policy,
interaction, and harness trace lines. The primitive owns decorative markup and accepts resolved
theme and caller style; it owns no specimen state or harness routing.

Switch currently has one subject and no corresponding specimen divider. Its debug-panel `<hr>`
elements are unrelated; do not invent a matrix or restyle those controls as part of this cleanup.
Keep this source change separate from the Passkey and Dev.Link adoption units and from plan files.

### Separate Run focus-theme correction

The shared-arrival Run specimen resolves its settled outline from the host theme's foreground at 0.3
alpha, not fixed white. Preserve blue arrival, timing, geometry, native host activation, and
forced-colour behavior. This belongs to the Button specimen paint helper and caller, not the shared
focus engine. Default/Light regressions ran red before correction; default/Light/Dark coverage, the
Button view suite, module check, and exact-file fmt/lint passed afterward (2 tests / 31 steps).
Generated CSS and DOM identity checks do not establish browser animation or contrast conformance.

### Opt-in Anchor truncation and 180px companion

Expose `truncate?: boolean` on `t.Anchor.Props`, inherited by `t.Anchor.Link.Props`. Keep its
default false on `D`. Native Anchor owns one recipe for both enabled and disabled branches:
inline-block, `overflow: hidden`, `white-space: nowrap`, and `text-overflow: ellipsis`. Caller style
composes last and supplies the width constraint. Omitted/false adds no truncation styling,
preserving current inline behavior. Missing/empty href still returns original children. No new
wrapper, label rewrite, string shortening, generated tooltip, or shared focus/CSS-engine change
belongs here.

The capability and its specimens form one commit, replacing the earlier specimen-only item. Add one
section immediately after hard clipping in
`code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-ui.LinkExamples.tsx`. Keep the default link
inside its clipping host as the no-ellipsis contrast. The companion uses
`<Anchor.Link truncate style={{ width: 180 }}>`; no repeated overflow recipe at the call site. Use
`Dev.Divider` between the examples.

Both examples use the same full rich label, resource marker, opening arrow, destination, theme, and
availability input. Give their shared label a long unbroken suffix to expose a mid-word cutoff; the
precise truncation point remains browser/font-dependent. Whole-link truncation may clip the trailing
arrow too. Label-only ellipsis with persistent markers is outside this item. The existing KeyValue
truncation specimen remains a separate consumer example.

Expected source boundary:

- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/t.ts`
- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/common.ts`
- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/ui.tsx`
- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/-test/-ui.truncate.test.tsx`
- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-ui.LinkExamples.tsx`
- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-SPEC.Debug.tsx`
- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-ui.Root.tsx`
- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/-spec/-ui.Samples.tsx`
- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/-test/-spec.examples.test.tsx`
- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/-test/-spec.link.test.tsx`
- `code/sys.ui/ui-components/src/ui.react/ui/Anchor/-test/-spec.samples.test.tsx`
- `code/sys.ui/ui-components/src/ui.react/dev/-test/-ui.Divider.test.tsx`

The DEBUG additions persist independent truncation/width controls and provide a long-label preset;
reset clears the width constraint, and fixed comparison views remain independent.

Verify default/false parity, emitted enabled/disabled CSS, caller overrides and raw declaration
clears, missing-href fallback, rich children, native events, marker/hint identity through flag
transitions, caller focus replacement, and phrasing-safe SSR. Retain native navigation and opening
semantics. Specimen tests verify adjacent placement, width/content, link-versus-host ownership, and
counts across default/Light/Dark. Run scoped Anchor/Dev tests, module check, exact-file fmt/lint,
and package tests at completion. Browser follow-up covers actual ellipsis, the clipping comparison,
and focus appearance; mock CSS assertions alone cannot. This visual acceptance is outside the
closeout boundary below. Keep this source commit before Passkey/Dev.Link adoption; exclude plan
artifacts.

### Dev alias and reciprocal Passkey adoption

Expose `Dev.Link === Anchor.Link` through the existing `/react/dev` leaf, with the exact
`t.Dev.Link.Props = t.Anchor.Link.Props` contract. Expected alias source boundary:

- `code/sys.ui/ui-components/src/ui.react/dev/mod.ts`
- `code/sys.ui/ui-components/src/ui.react/dev/t.ts`
- New `code/sys.ui/ui-components/src/ui.react/dev/-test/-Link.test.tsx`

Follow the existing `Dev.ObjectView` alias test pattern: compare the public Dev and Anchor leaves,
prove runtime identity and exact prop-type equality, and retain required children and semantic prop
exclusions. Use the existing common/type pool; add no parallel type barrel or component wrapper.

The Passkey adoption has four visible placements but only two shared renderers in
`code/sys.ui/ui/-sample/passkey/-ui.Links.tsx`:

| Placement | Shared renderer | Primitive | Resource | Opening |
| --- | --- | --- | --- | --- |
| Sample debug panel: `view:pure` | `SpecLink` | `Dev.Link` | Omitted | Self, `→` |
| Pure-view debug panel: `view:integration (sample)` | `SpecLink` | `Dev.Link` | Omitted | Self, `→` |
| Sample host footer: `WebAuthn · W3C` | `WebAuthnLink` | `Anchor.Link` | `web` | New tab, `↗` |
| Pure-view host footer: `WebAuthn · W3C` | `WebAuthnLink` | `Anchor.Link` | `web` | New tab, `↗` |

Resource category and opening context are independent of origin. The local query links could be
web resources, but their debug-navigation context needs no globe. The W3C reference deliberately
uses the web resource marker. Do not add origin detection, manual arrows, hand-authored marker
spans, duplicate opening hints, or click handlers to simulate navigation.

`SpecLink` keeps its `SpecLinks` addresses/labels and light-panel theme; semantic self navigation
now renders explicit `target='_self'` rather than omitting target. Update both reciprocal debug-link
assertions accordingly. Assert one decorative generated arrow, no resource marker, no generated
new-context description, one native focus target, and unchanged query resolution.

`WebAuthnLink` keeps `https://www.w3.org/TR/webauthn-3/`, its visible label, explicit caller title,
resolved host theme, and 12px styling. Assert the generated resource marker plus new-tab arrow,
`target='_blank'`, `noopener noreferrer`, and one opening description. Both specs already mount the
same footer helper; preserve that sharing rather than copying markup into either spec.

Reconciled Passkey source boundary:

- `code/sys.ui/ui/-sample/passkey/-ui.Links.tsx`
- `code/sys.ui/ui/-sample/passkey/ui/-spec/-SPEC.Debug.tsx`
- `code/sys.ui/ui/-sample/passkey/ui/-test/-spec.integration.test.tsx`
- `code/sys.ui/ui/-sample/passkey/ui/-test/-spec.test.tsx`
- `code/sys.ui/ui/-sample/passkey/ui/-test/-ui.test.tsx`
- `code/sys.ui/ui/-sample/passkey/ui/ui.tsx`

The original item `feat(ui): adopt Anchor.Link for the Passkey standards reference` maps to
`a19bbeb85 feat(ui): adopt shared Passkey links and refine specimen labels`. The final whole-file
unit includes `(view:pure)` / `(simulated)` debug labels, the expanded `Relying Party ID` label,
and integration-test microtask waits. Dev is imported directly from its public leaf; no common
barrel change was needed.

Keep `-u.navigation.ts`, both specs' host placement, fixtures, persistence, lifecycle ownership,
and authentication behavior unchanged. Verify both debug panels and footer themes with scoped
tests. Browser follow-up covers all four placements for arrows, resource placement, focus, and
same/new-context navigation; DOM evidence does not prove browser navigation. Run owning-module
checks and exact-file fmt/lint, then package tests at completion.

### Anchor landing boundary

The Anchor unit comprises 19 paths under `code/sys.ui/ui-components/src/ui.react/ui/Anchor/`:

- Runtime/types/docs: `common.ts`, `mod.ts`, `t.ts`, `ui.tsx`, `ui.Content.tsx`, `ui.Link.tsx`.
- Harness: `-spec/-SPEC.Debug.tsx`, `-spec/-SPEC.tsx`, `-spec/-u.exampleStyles.ts`,
  `-spec/-ui.FocusExamples.tsx`, `-spec/-ui.LinkExamples.tsx`, `-spec/-ui.Root.tsx`,
  `-spec/-ui.Samples.tsx`.
- Tests: `-test/-spec.examples.test.tsx`, `-test/-spec.focus.test.tsx`, `-test/-spec.link.test.tsx`,
  `-test/-spec.samples.test.tsx`, `-test/-ui.Link.test.tsx`, `-test/-ui.icons.test.tsx`.

Do not include Icon, Passkey, Dev, or plan artifacts in that Anchor selection. The Passkey adoption
follows the Dev alias and uses the six-file boundary above, without partial-hunk selection. Its
integration-test `Schedule.micro()` waits synchronize debug-control assertions; they do not change
link behavior. Preserve authentication, specimen composition, and real operations.

The Cloudflare sample's
`code/sys.driver/driver-cloudflare/-sample/deploy/src/ui/m.Page/ui.ReferenceLink.tsx` demonstrates
repeated semantics, not authority for a cross-package migration. KeyValue's `u/u.href.ts` policy and
`ui/ui.Cell.tsx` composition remain separate. No repository-wide replacement, URI classifier,
automatic external-origin detection, forced reload, preview/fetch/favicon service, routing system,
new focus implementation, or global Anchor restyling.

## Verification

### Closeout boundary

The human's instruction to complete the lint cleanup and prepare retirement closes this plan at
implemented behavior plus automated verification. Browser/AT acceptance is outside this closeout
boundary, not a claimed pass. Retain the visual and accessibility evidence limits below in the
historical snapshot; do not use plan retirement as accessibility-conformance evidence.

The final test-only cleanup keeps React's asynchronous `act` boundaries and explicitly waits for
`Schedule.micro()` after fixture/control updates, matching the integration tests. It changes no
production code or assertions and uses no lint suppression. Its source boundary is
`code/sys.ui/ui/-sample/passkey/ui/-test/-spec.test.tsx`.

Retirement sequence: preserve this final reconciled snapshot with
`plan(done): link-grammar.plan.md`, then remove the live plan with
`plan(archived): link-grammar.plan.md`. Retain its recovery path in dependent plans. These are
plan-only lifecycle commits; preparation performs no Git mutation or deletion.

### Landing assessment

Review the bounded Anchor unit against the Icon baseline, including untracked files; a tracked diff
alone omits much of the implementation and proof. A final independent pass has a specific purpose:
falsify the complete landing boundary and the later emitted-CSS, specimen-layout, and persisted
sample changes, rather than repeat an open-ended architecture review. Inspect every touched file for
residue, dead alternatives, misleading comments, ownership drift, and assertions that prove less
than their names claim. Confirm the unit does not require unselected Passkey or Dev changes.

Adjudicate material findings against executable evidence and the smallest correction in the owning
layer. Repeat review only for a concrete remaining risk. Small visual preferences can follow in
separate increments; native-interaction failures, broken semantics, and accessibility evidence gaps
must not be relabeled as cosmetic nits. A clean source review and passing tests support a code-level
landing assessment, not an unconditional browser/AT or whole-plan completion claim. Do not add
review receipts or ceremonial gates to the opening arc.

### Automated proof and browser/AT follow-up

Automated coverage must exercise the contract's availability/resource/opening combinations, native
attributes and events, marker clicks, caller descriptions/titles, hint resolution, stable IDs
through transitions, original styles and clears, and unchanged undecorated `A`. Pin public
leaves/types, required children, admitted literals, and both type-level and runtime exclusion of
competing inputs. Retain native named/frame/download behavior and test actual consumer wiring. Parse
SSR prose using the real Icon factory; verify its default root, opt-in span, and independent CSS
display. The Dev unit adds exact runtime/type alias proof. Prefer narrow red → green regressions;
record skipped red steps honestly.

Browser verification covers prose/standalone layout, long rich labels, narrow 12px hosts, genuine
RTL content and logical placement, 200–400% zoom/reflow, marker baselines/attachment, clipping, and
native Enter/modified/middle-click navigation. Check focus arrival/re-entry/settling, reduced
motion, and forced colours. With real AT, test rich names, populated caller-description nodes,
localized/default hints, empty/explicit titles, and availability transitions; assess sighted
comprehension separately. DOM/SSR tests cannot establish those outcomes. Use bounded human evidence
if tools are unavailable, not a new automation framework.

Run owning-module tasks, starting with the changed tests:

- `code/sys.ui/ui-components`: scoped `deno task test --trace-leaks`, `deno task check`, then
  package tests at completion. Reuse existing Anchor, FocusStyle, and Dev coverage.
- `code/sys.ui/ui`: `deno task test --trace-leaks ./-sample/passkey/ui/-test/` and
  `deno task check`; retain sample publication exclusion.
- Format/lint exact changed filenames and check scoped diff whitespace. No broad formatting or
  incidental shared-CSS changes.

### Production implementation evidence

- Icon and generic Anchor regressions ran red → green. The original factory div split an SSR
  paragraph into four parsed nodes; the opt-in span retained one.
- The first semantic Link run failed type-checking on the missing `Anchor.Lib.Link` runtime member.
  A separate runtime-red semantic pass was not executed. Subsequent DOM/type/SSR tests covered the
  availability matrix, competing inputs, glyph/target agreement, hints/descriptions, title clears,
  stable IDs, transitions, and caller styles.
- Passkey host adoption ran red → green, preserving destination, explicit caller title, theme, and
  12px styling. The final Passkey regressions also ran red → green for the missing resource marker
  and both reciprocal debug links; Dev itself remains a literal alias.
- Harness regressions cover the persisted examples union, cycling, legacy migration, reset, all ten
  samples leaving both example modes, and shared caption/example/divider styles, including emitted
  pixel spacing. Shared harness tests live in `-spec.examples.test.tsx`, separate from focus/link
  specimen coverage. Each caption pairs with one body; dividers own section spacing, with no imposed
  line-height or footer captions. Fragment targets belong to real specimens.
- Single-sample tests in `-spec.samples.test.tsx` ran red → green for arrow/globe rendering,
  semantic controls, persistence, and returning to native samples/reset without leftover decoration.
- Screenshot follow-up exposed unitless logical margins: the style-object assertion passed while
  numeric `3` serialized without `px`. Explicit pixel units now have red → green CSS-string coverage
  for both logical sides.
- Sizing regressions cover Icon's unchanged 24px default, CSS-length sizes, and Anchor's `1em` roots
  and SVGs at 12px, 14px, and 20px host sizes. These inspect declarations and attributes, not
  computed browser geometry.
- At the Icon-baseline reconciliation, the full ui-components suite was rerun: **107 / 767 steps**,
  plus its module check. The earlier focused Anchor/Icon run passed **10 / 66 steps**. The last
  scoped Passkey UI run at that reconciliation passed **5 / 46 steps** and its module check. These
  are historical worktree checks, not an isolated commit checkout.
- All 19 Anchor files passed exact-file formatting and lint at that reconciliation; the scoped
  tracked diff passed its whitespace check.
- Supplied screenshots informed specimen refinements; live browser navigation, real screen-reader,
  duplicate-announcement, and sighted-comprehension checks remain outstanding. The generated notice
  is one directly referenced hidden sibling, not visible label prose. Use the examples above for the
  remaining human verification.

### Final source verification and remaining limits

- The truncation unit passed **109 tests / 801 steps**, module check, and twelve-file fmt/lint.
  The Dev alias then passed **110 tests / 803 steps**, module check, and three-file fmt/lint.
- The final Passkey worktree passed **5 tests / 46 steps** scoped, **14 tests / 121 steps** for
  the package, module check, and both link-owned files' fmt/lint. Six-file formatting also passed.
  These are observed worktree checks, not isolated commit-checkout runs.
- Expanding lint to all six Passkey files exposed **11 `require-await` errors** in
  `code/sys.ui/ui/-sample/passkey/ui/-test/-spec.test.tsx`. The test-only cleanup adds an explicit
  `Schedule.micro()` wait inside each affected async callback. The resulting worktree passed
  six-file fmt/lint, module check, package tests (**14 tests / 121 steps**), and scoped whitespace
  checks. This supersedes the earlier lint failure without weakening the rule or its assertions.
- Human-supplied screenshots confirmed the displayed W3C globe/new-tab arrow and both reciprocal
  same-context arrows. They do not establish click behavior, keyboard focus geometry, real AT
  announcements, or the browser/AT follow-up matrix described above.

The opening arc records landed implementation. The closeout boundary above distinguishes completed
automated proof from unclaimed browser/AT acceptance; commits and screenshots do not substitute for
those external observations.

### External design references

Consulted during initial design; recheck when consequential decisions depend on them:

- [Carbon links](https://carbondesignsystem.com/components/link/usage/): contextual destination
  icons and quieter inline links. Its origin convention differs from this opening-context grammar.
- [GOV.UK links](https://design-system.service.gov.uk/styles/links/): avoids external icons and
  favours explicit new-tab wording. Evidence against universal decoration, not a ban on contextual
  markers.
- [W3C G201](https://www.w3.org/WAI/WCAG22/Techniques/general/G201): visual and accessible advance
  notice. Advisory guidance, not a required glyph or proof of WCAG conformance.

At re-entry, inspect source/history and reconcile the opening arc. Preserve these contracts and
carry proof with each unit; design approval, reviews, and plan edits are not runtime evidence or Git
mutation authority. No extra approval gate or fixed model/effort recommendation is implied.

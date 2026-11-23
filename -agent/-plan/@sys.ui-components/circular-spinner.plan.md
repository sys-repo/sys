@sys.ui-components
circular-spinner.plan.md
- [x] 2bbdfdece chore(ui-components): scaffold the circular spinner module
- [x] 6b8e13b69 refactor(ui-components)!: expose Bar and Circular through their UI renderers
- [x] 4142d7130 refactor(ui-components)!: rename SpinnerLib to Spinners.Lib
- [x] d6414fb49 feat(ui-components): add the classic macOS-style Spinners.Circular indicator
- [x] 1573ff8f6 refactor(ui-components)!: retire legacy direct React component aliases
- [x] d8cc1ecb3 test(ui-components): move spinner export tests to the family module

## The component

`<Spinners.Circular />` shows that work is in progress, not how much is complete. It occupies an
inline square; the host owns placement, accessible status, busy state and visible feedback.
The glyph itself is decorative and nonfocusable.

## Drawing and motion

The reference is the [classic Web Inspector spinner](https://github.com/WebKit/WebKit/blob/main/Source/WebInspectorUI/UserInterface/Views/IndeterminateProgressSpinner.css):
rounded spokes and a clockwise trail. Its 16px box and discrete frames are historical reference
points, not a contract to reproduce its animation or a claim about current AppKit.

The default is **22 CSS px**. Above 12px, the drawing has twelve petals. At 12px and below, it has
eight with longer inner tips so the gaps stay legible without leaving an oversized center.

**Move the light, not the petals.** Adjacent petals crossfade clockwise over a one-second cycle;
the dim end of the trail holds steady. Rotating the shaded group in discrete steps made inactive
petals flicker at larger sizes. Do not restore that motion or use the reference's fixed alpha table
as an acceptance test. The SVG carries its own shaded starting frame. With reduced motion it stays
in that pose rather than going blank; motion is enabled only under `no-preference`.

## Caller and specimen boundaries

- Public props are `size`, `theme` and `style`. With no theme the glyph inherits the host's text
  color. An explicit theme supplies the foreground; caller `style.color` wins over either.
- A busy button is a **caller example**, not the specimen: the button supplies `aria-busy` and the
  visible word “Running”; the spinner alongside that text does not announce it again.
- The registered specimen shows one spinner. Its size choices are 12, 16, 20, **22 (default)**,
  32 and 64px. The theme control sets the actual prop. The inspector shows the props passed,
  including `size: 22` on reset. Do not add a button wrapper, a tint prop or an empty-props preset
  to demonstrate a host's responsibilities.
- `Spinner.Bar` and `Spinner.Circular` are intentional specimen/component labels. The family name
  in JSX remains plural. The Bar label change is not a change to its rendering or props.

## Package boundary: this feature

Keep `@sys/ui-components/react/spinners` as the family import. `Spinners.Bar` and `Spinners.Circular`
are their owners' `.UI` renderers, not wrappers. The feature initially preserved `/spinners`;
the subsequent breaking migration retired it. Each owner keeps its own `Props`; `t.Spinners.Lib` projects the owners' renderer types.

The individual leaves are `/react/spinners/bar` and `/react/spinners/circular`. They export
`BarSpinner` and `CircularSpinner` respectively. Neither has a short alias: adding a canonical
leaf does not extend the legacy compatibility contract.

The package export suite pins the retired aliases independently of the live export map so that
restoring one causes a failure. The spinner family suite tests leaf isolation separately.

## Acceptance and evidence

- **Imports:** both canonical individual imports resolve, export only their owner, and expose the
  same renderer as the family. Both unpublished short individual imports and the retired aliases
  must fail to resolve. The family suite uses `EsmAssert.runtimeGraphBoundary`
  on each canonical entry to guard against recognized local runtime edges to the family or sibling.
  This is not a complete module resolver or a bundle-size measurement.
- **Glyph:** server markup must contain the intrinsic size, shaded petals, `currentColor` and the
  decorative accessibility attributes without effects. DOM tests check color precedence, size and
  the reduced-motion media rule. They do not observe painted pixels or the accessibility tree.
- **Motion evidence:** during development an isolated `Browser.load` probe sampled the 64px CSS
  timeline across one turn: fixed tips, intermediate brightness on the clockwise handoff and a
  steady dim tail. The human separately confirmed smooth playback. The probe was removed after
  verification. Neither observation proves cold paint before hydration, a live preference toggle
  or a host-only computed-color change; record those separately if checked. Future automated
  browser checks require an authorized owner task using `Browser` from `@sys/testing/server`.
- **Repeatable checks:** from `code/sys.ui/ui-components`, run `deno task check` and
  `deno task test --trace-leaks ./src/ui.react/ui/Spinners ./src/ui.react/ui/Spinners.Bar ./src/ui.react/ui/Spinners.Circular ./src/-test/-exports.leaf.test.ts`.

## Landed follow-up: retire the direct component aliases

The spinner landed without `src/-test/-exports.leaf.test.ts`. The breaking migration landed its
canonical spinner checks and replaced the compatibility assertions with rejection tests.

### Migration inventory

The package export map at the `d6414fb49` baseline pairs every suffix below with the same owner
file under `/react/`. For each listed `path`, replace `@sys/ui-components/<path>` with
`@sys/ui-components/react/<path>`. For versioned JSR imports, keep the version after the package
name and apply the same subpath change when upgrading to the release that removes the aliases.

| Old suffixes (replace `/<path>` with `/react/<path>`) | Workspace callers before retirement |
| --- | --- |
| `action-probe`, `anchor`, `bullet`, `bullet-list`, `button`, `buttons`, `buttons/icons`, `buttons/switch`, `chip`, `cropmarks`, `error-boundary`, `fade-element`, `http-origin`, `icon`, `icon-swatches`, `iframe`, `image/svg`, `key-value`, `layout/center-column`, `layout/rect-grid`, `layout/split-pane`, `layout/tabs`, `layout/tree-host`, `media`, `media/recorder/dev`, `media/timecode/playback-driver`, `object-view`, `path-view`, `player`, `player/youtube`, `preload`, `prose`, `sheet`, `slider`, `splash`, `tree-view`, `tree-view/index`, `vimeo-background` | No callers found beyond the package export suite's constructed compatibility imports. |
| `text` | Export suite plus `src/ui.react/ui/Text/-test/-.test.ts`, which imported the old path only to test compatibility. The migration removed that assertion and retained the canonical API checks. |
| `spinners` | Export suite plus a forbidden-import string in `src/ui.react/ui/Spinners.Circular/-test/-.test.ts`. The latter did not load the alias; the graph-exclusion checks now live in `src/ui.react/ui/Spinners/-test/-exports.test.ts`. |

No retiring imports, re-exports, example imports, or import-map targets were found outside
`ui-components` in the checked workspace. The sweep covered tracked files and searchable live
workspace source and config, excluding lockfiles, dependency caches and planning notes. The
repository template and the published-package Vite fixture already map canonical component paths.
The Vite workspace optimizer derives rewrites from root value exports; its workspace test expects
no `ui-components` rule. Static searches do not cover arbitrary runtime-generated strings or
external consumers.

### Migration proof

All 40 retired paths failed the rejection tests before removal and passed afterward; the canonical
leaves and intentional non-component entry points still import. The separate short paths
`/spinners/bar` and `/spinners/circular` were never published and remain unsupported. The migration
inventory is recorded here, not in the package README. No external release or migration is claimed.

The full package suite passed after alias removal (141 tests, 951 steps). `d8cc1ecb3` then moved
the export graph test unchanged to the spinner family. At that HEAD the package type check and
the scoped checks above passed (6 tests, 63 steps), including the test at its final path.

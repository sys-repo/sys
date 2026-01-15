# Sheet (ui/Sheet)

Purpose:
- An animated sliding "sheet" content container (mobile-style overlay/panel).
- Designed to be hosted inside a container that clips overflow.

---

## Surface + module shape

Exports:
- `Sheet.View` → React component (`ui.tsx`)
- `Sheet.Signals` → state helpers (`m.Signals.ts` → `m.Signals.Stack.ts`)

Pattern:
- `mod.ts` exports a **small lib object** `{ View, Signals }`
- Types live in `t.ts` (+ `t.Signals.ts`)
- Defaults live in `common.ts` (`DEFAULTS as D`)

---

## View: host contract (critical)

`Sheet.View` internally renders a `mask` element and explicitly warns:

- "Ensure this component is within a container with `{ overflow: 'hidden' }`."

This is a **hard host requirement** for correct visuals (the physics bounce would otherwise flash outside the host).

Practical idiom:
- The DevHarness subject (dark host area) is the canonical “overflow-clipped host”.

---

## View: animation + orientation model

Animation wrapper:
- Uses `M.div` (framer-motion wrapper via `./common.ts` re-export) with:
  - `initial`
  - `animate` → `{ y: '0%' }` or `{ x: '0%' }`
  - `exit`
  - `transition` → `{ type: 'spring', bounce, duration }`

Orientation:
- `orientation?: 'Bottom:Up' | 'Top:Down' | 'Left:Right' | 'Right:Left'`
- `wrangle.is(props)` derives:
  - `vertical`
  - `topDown`
  - `leftToRight`

Key idiom:
- Orientation controls **all**:
  - axis (x vs y)
  - border-radius shape
  - shadow direction
  - grid template axis
  - mask placement
  - initial/exit offsets

---

## Layout: spacers + edge margin

The root is a grid with 3 tracks, where the middle track holds the sheet body:

- Vertical sheet:
  - `gridTemplateColumns = edgeMarginTemplate`
  - children: `[spacer] [body] [spacer]` laid out in columns
- Horizontal sheet:
  - `gridTemplateRows = edgeMarginTemplate`
  - children: `[spacer] [body] [spacer]` laid out in rows

`edgeMargin` input:
- `number` → `[v, '1fr', v]`
- `[near, far]` → `[near, '1fr', far]`
- `[near, middle, far]` → as-is
- default → `[0, '1fr', 0]`

`edgeMarginTemplate` converts numbers to px and joins for CSS grid.

Interpretation:
- `edgeMargin` defines how much “gutter” exists on the sides orthogonal to slide direction.
- Middle is typically `'1fr'` so the sheet hugs an edge but remains width/height constrained by gutters.

---

## Styling: theme + shadow defaults

Theme:
- `Color.theme(props.theme)` gives `{ fg, bg }` (and name)
- `body` background uses `theme.bg` and `color: theme.fg`

Shadow:
- Shadow params are split into:
  - opacity (fed into `Color.format`)
  - blurRadius
  - spreadRadius
- Shadow direction is chosen to match slide direction (e.g. Bottom:Up → shadow upwards via y = -5)

Border radius:
- Only the “free” edge corners are rounded, depending on orientation.
  - Example Bottom:Up → `${r}px ${r}px 0 0`

---

## Event handling: pass-through, but consistent

`SheetProps` includes standard mouse handlers (`onClick`, `onMouseDown`, etc) typed as `React.MouseEventHandler<HTMLDivElement>`.

Idiom:
- The Sheet is intentionally a **container primitive** that forwards interaction to host usage logic rather than encoding dismiss behavior.

---

## Debug/spec harness idioms

Spec:
- Uses `AnimatePresence` around conditional sheet mount/unmount.
- Click patterns:
  - clicking host toggles `showing = true`
  - clicking sheet stops propagation and sets `showing = false`

Debug signals:
- `createDebugSignals()` is pure in-memory signals (no LocalStorage in this one):
  - `showing: boolean`
  - `theme: 'Light' | 'Dark'`
  - `orientation: SheetOrientation | undefined`
  - `edgeMargin: SheetMarginInput | undefined`
- Debug panel uses `Signal.useRedrawEffect(debug.listen)` and cycles values via `Signal.cycle`.

---

## Signals: stack state helper (Sheet.Signals.stack)

`Sheet.Signals.stack(signal?)` wraps a `Signal<T[]>` with a stack API:

- `items` returns a cloned array (`[...signal.value]`) → protects against mutation leaks.
- `push(...content)` filters falsy/undefined and appends.
- `pop(leave=0)` removes top-most item, but enforces a minimum stack length.
- `clear(leave=0)` slices stack down to leave.
- `exists(fn)` checks over cloned items.
- `toSignal()` exposes underlying signal.

This is a reusable “UI stack” idiom:
- Keep the canonical state as a `Signal<T[]>`
- Provide a safe helper API that avoids mutation and standardizes stack semantics.

---

## Conformance notes (what this teaches us)
- Host contract is explicit (overflow hidden) → this belongs in the “UI host contract” section globally.
- Orientation is the single governing axis → a good example of “one input fans out to style + animation + layout”.
- The component keeps behavior out: it is a container primitive with forwarded handlers.
- Signals helper is optional and small → state helpers live alongside UI only when they directly serve that UI primitive.

---

## Keywords (for future indexing/search)

- `data-component="sys.ui.Sheet"`
- `M.div` (motion div wrapper)
- `AnimatePresence`
- `edgeMarginTemplate`
- `maskOrientation`
- `orientation: Bottom:Up | Top:Down | Left:Right | Right:Left`
- `Signals.stack`


=========================================================================



## Tree (and Tree.Index) — idioms

### Tree is a thin namespace over Tree.Index
- `ui/Tree` is intentionally minimal: `Tree: { Index }`
- The “real” tree UI is `Tree.Index` (aka `IndexTree`) and its item renderer `Tree.Index.Item`.
- API expectation is validated by the top-level test:
  - `Tree.Index === IndexTree` (re-export contract).

### Public surface is explicit + thin
- `Tree` module:
  - `common.ts` is a pure re-export (`export * from '../common.ts'`).
  - `t.ts` defines only `TreeLib = { Index: t.IndexTreeLib }`.
  - `m.Tree.ts` binds `IndexTree` into the `TreeLib` shape.
- This matches “no logic in mod/t.ts” shape rules.

---

## Tree.Index (IndexTree) — core UI idioms

### Data model: “root → list → view-at-path”
- The component accepts:
  - `root?: t.TreeNode | t.TreeNodeList`
  - `path?: t.ObjectPath`
- Canonical normalization pattern:
  - `rootList = Data.toList(root)` (memoized on `root`)
  - `path = (props.path ?? []) as t.ObjectPath`
  - `view = Data.at(rootList, path)` (memoized on `[rootList, path]`)
- This is the key “nav” idiom:
  - parent holds `path` as state; Tree is a pure projection of `root × path`.

### Path encoding is a stable animation key
- `animKey = Obj.Path.encode(path)`
- Used as `SlideDeck keyId` to drive “panel switch” transitions.
- Net effect: path change == new panel identity.

### Depth-delta drives transition direction
- Direction is computed by comparing `path.length` to `prevPathRef.current.length`:
  - `dir = +1` when drilling deeper
  - `dir = -1` when going back up
  - `dir = 0` for lateral/no-depth change
- This gives a consistent “push/pop” motion model without external routing state.

### SlideDeck is the transition primitive (Tree.Index-local)
- `SlideDeck` renders:
  - entering panel (keyed by `keyId`) sliding in
  - leaving panel captured for one frame and sliding out
- Uses `M.div` + `initial/animate/transition` and clears leaving on `onAnimationComplete`.
- Tree.Index treats this as an internal primitive, but conceptually:
  - “panel stack feel without a real stack”.

### Tree.Index is a list of IndexTreeItem rows (node-per-row)
- Render loop:
  - `{view.map((node) => <IndexTreeItem ... />)}`
- Row “enabled”:
  - `enabled = Boolean(node.meta?.enabled ?? true)`
- Row “chevron” (hasChildren):
  - `chevron = Data.hasChildren(node)`
- No selection model here (selection is a higher layer concern).

### Pointer event elevation: base pointer + semantic node info
- Public handlers:
  - `onPointer`, `onPressDown`, `onPressUp`
- Each receives `IndexTreePointer`:
  - `t.PointerEventsArg & { readonly node: t.TreeNode; readonly hasChildren: boolean }`
- Conversion idiom:
  - `toPointerEvent(node, e)` merges raw pointer arg with node semantics.
- The “meaning” signal for navigation is `hasChildren` plus `node.path`.

### Theming is shape-level
- `theme = Color.theme(props.theme)`
- Component uses resolved theme, not `'Light'|'Dark'` branches:
  - `base: { color: theme.fg }`

---

## Tree.Index.Item (IndexTreeItem) — row interaction idioms

### Defaults pattern + “active gating”
- Defaults are in `D` (`label`, `padding`, `chevron`, `enabled`, `active`, `selected`).
- Derived gating:
  - `isActive = active && enabled`
- This is the canonical “non-interactive when disabled/inactive” rule:
  - cursor changes
  - press handlers suppressed

### Pointer handling via `usePointer` with “wasDown” memory
- Hook yields pointer `e.is` flags (down/up/etc).
- Idiom:
  - capture `wasDown = pointerIs?.down` before update
  - on `down`: fire `onPressDown` if `isActive`
  - on `up`: fire `onPressUp` only if `isActive && wasDown`
- This prevents spurious “up” when pointer didn’t originate in the row.

### Press affordance is purely visual + local
- Label “press shift”:
  - `transform: translateY(1px)` when active and `pointerIs.down`
- No global pressed state; row is self-contained.

### Selection styling is a simple boolean
- `selected` drives a background color change on base container.
- This is intentionally primitive:
  - selection state belongs outside; row just reflects it.

### Chevron API: boolean | custom element
- `chevron?: boolean | t.JSXElement`
- Rendering idiom:
  - if `React.isValidElement(chevron)` render it
  - else render default icon
- Visibility is controlled even when “no chevron”:
  - `visibility: chevron ? 'visible' : 'hidden'`
  - → keeps column alignment stable.

### Structural layout idioms
- Base container:
  - border-bottom rule with `:last-child` removal
  - padding normalized via `Style.toPadding(...)`
- Body grid:
  - `gridTemplateColumns: '1fr auto'`
  - align label left, chevron right
- Debug highlight:
  - `Color.ruby(debug)` as optional debugging background.

---

## DevHarness patterns observed in Tree.Index specs

### Debug signals persist via `LocalStorage.immutable`
- The debug UI stores a small subset:
  - `theme`, `debug`, `yaml`, `path`
- Snapshot drives initial signals.
- `Signal.effect` writes back to storage on change.

### Root construction is a “debug-only adapter”
- `debug.root` is derived from YAML:
  - `IndexTree.Data.Yaml.parse(text)`
- This is important: IndexTree itself stays data-agnostic; parsing is outside.

### Nav interaction pattern (spec)
- `onPressDown` is used as “select/drill”:
  - if `hasChildren` then `p.path.value = e.node.path`
- Back button pops path:
  - `path = path.slice(0, -1)`
- This is the canonical parent-controller pattern for IndexTree.

---

## Missing piece: Tree.Index.data (needed)
Tree.Index is fundamentally “Data-driven”. To fully lock the idioms, we should ingest `Tree.Index.data` next, specifically to capture:
- `t.TreeNode` / `t.TreeNodeList` shapes (and what `node.path` is)
- `Data.toList`, `Data.at`, `Data.hasChildren`
- YAML format conventions (`children`, meta `.` block, id overrides, label rules)

Request: please paste **Tree.Index.data** (that folder list you provided).
Without it, we can describe the UI contracts, but not the canonical node/path semantics.



=============================================================================



## SplitPane (ui/Layout.SplitPane) — idioms

### Component intent
- Generic N-pane splitter with:
  - controlled ratios (`value`) OR uncontrolled ratios (`defaultValue`)
  - pointer-drag gutters + keyboard step nudging
  - optional "collapse to one pane" (`onlyIndex`) that keeps layout stable and makes gutters inert

### Public contract (props) — noteworthy idioms
- `children?: React.ReactNode[]`
  - Explicitly an *array*, not `ReactNode` — caller passes ordered panes.
- Controlled vs uncontrolled:
  - `value?: t.Percent[]` → controlled (external source of truth)
  - `defaultValue?: t.Percent[]` → uncontrolled seed (normalized)
- Bounds:
  - `min?: t.Percent | t.Percent[]`
  - `max?: t.Percent | t.Percent[]`
  - Expanded to per-pane arrays via `asArray(min/max, n, d)`
- Collapse:
  - `onlyIndex?: t.Index`
  - When valid (`0..n-1`), layout becomes a one-hot ratio set and gutter widths are 0.
- Events:
  - `onDragStart({ ratios, activeGutter })`
  - `onChange({ ratios, activeGutter? })` (keyboard step uses this too)
  - `onDragEnd({ ratios, activeGutter })`

### Defaults + identity (common.ts)
- Identity:
  - `D.name = 'SplitPane'`
  - `D.displayName = Pkg.toString(pkg, name, false)`
- Behavior defaults:
  - `D.active = true`
  - `D.orientation = 'horizontal'`
  - `D.defaultValue = 0.5` (note: SPEC adapts this for N panes via fromScalar/even)
  - `D.min = 0.1`, `D.max = 0.9`
- Visual defaults:
  - `D.gutter = 6`
  - `D.dividerOpacity = 0.2`
  - `D.dividerLine = 1`

### Layout idiom: CSS grid as the splitter engine
- SplitPane is a single grid container whose tracks alternate:
  - pane track: `${ratio}fr`
  - gutter track: `${gutterPx}px`
- Track builder: `gridTracks(ratios, gutterPx, orientation)`
  - horizontal → `gridTemplateColumns = "..."; gridTemplateRows = "1fr"`
  - vertical   → `gridTemplateRows = "..."; gridTemplateColumns = "1fr"`
- Collapse uses one-hot ratios + gutterPx=0:
  - `templateTracks({ collapsed: true, onlyIndex })` → grid still has N pane tracks, but N-1 are effectively `0fr`.

### Pane idiom (ui.Pane.tsx)
- Panes are scroll containers by default:
  - `minWidth: 0`, `minHeight: 0`, `overflow: 'auto'`, `display: 'grid'`
- Collapse hiding strategy:
  - `visibility: hidden` + `pointerEvents: 'none'`
  - Keeps grid structure stable (no DOM removal, no reflow surprises).

### Gutter idioms (ui.Gutter.tsx)
- Interaction surface is larger than visual line:
  - Visual line uses `dividerLine/dividerOpacity`
  - Pointer capture uses an absolute "handle" that spans the gutter hit area.
  - The `gutter` prop defines hit-zone thickness (not just the visual divider).
- Pointer start selection:
  - `onPointerDownCapture={() => setActive(i)}`
  - `useSplitDrag` reads `activeGutterRef.current` on pointer down to decide which pair to drag.
- Accessibility + keyboard:
  - `role="separator"`
  - `aria-orientation` flips (horizontal splitter → vertical separator)
  - `aria-valuenow` expresses the pair ratio (pane i as % of pair sum)
  - Arrow keys nudge by `0.02` (2%) via `onStep(i, delta)` when active and not collapsed.
- Cursor policy:
  - only when `active && !collapsed`
  - `col-resize` or `row-resize`

### Drag idiom (use.SplitDrag.tsx)
- Drag is expressed as a delta in ratio space, derived from pixels:
  - `totalGutterPx = (paneCount-1)*gutter` (0 when collapsed)
  - `usableSize = containerSize - totalGutterPx`
  - `fracDelta = pixelDelta / usableSize`
- The active pair update:
  - `clampPairWithBounds(a,b,delta,minA,maxA,minB,maxB)` to respect bounds and preserve pair sum
  - `renormalizePreservingPair(next, i)` to force the global sum back to 1 while keeping the active pair sum constant
- Controlled/uncontrolled behavior:
  - if uncontrolled → `splitRatios.set(next)`
  - always emits `onChange({ ratios: next, activeGutter: i })`

### Ratios state idiom (use.SplitRatios.tsx + t.SplitRatio.ts)
- A discriminated union is used to *make control mode explicit*:
  - controlled: `{ isControlled: true, ratios, mins, maxs }`
  - uncontrolled: `{ isControlled: false, ratios, mins, maxs, set }`
- Uncontrolled seeding:
  - `initial = normalize(defaultValue ?? [], n)` memoized
  - `useEffect` keeps internal state in sync when `n/defaultValue` change (only when uncontrolled)
- Normalization contract:
  - `normalize(ns, n)` ensures correct length and sum=1 (fallback → even split).

### Normalization + math helpers (u.ts)
- `normalize(ns, fallbackLen)`:
  - wrong length → even split
  - non-finite/negative values are clamped out
  - sum <= 0 → even split
- Pair clamp with bounds uses overshoot redistribution between A and B to keep pair sum stable.
- `renormalizePreservingPair`:
  - rescales all non-active panes so total becomes 1, without changing active pair sum.

### DevHarness / debug idioms (-spec)
- Debug signals persisted via:
  - `LocalStorage.immutable<Storage>(\`dev:${D.displayName}\`, defaults)`
- Debug toggles cover:
  - controlled vs uncontrolled (`isControlled`)
  - childCount (0..4)
  - scalar-ish defaultValue for 2 panes via `fromScalar/toScalar`
  - even splits for N panes
  - `onlyIndex` collapse
- SPEC composes the Cropmarks host inside a dummy pane:
  - indicates SplitPane is intended to behave cleanly inside a bounded "host" container.

### Interaction constraints (implicit contract)
- Container must have real size (width/height) for dragging to work.
- Collapsed mode:
  - gutters inert (`pointerEvents: 'none'`, `tabIndex=-1`)
  - track template still stable (one-hot fr + 0px gutters)

### Theming usage
- Uses library-wide contract:
  - `const theme = Color.theme(props.theme)`
  - consumes `theme.fg` for foreground and alpha divider color
- Debug-only background marking:
  - `backgroundColor: Color.ruby(debug)` appears in container/panes.



===========================================================================



## ErrorBoundary (ui/ErrorBoundary) — idioms

### Component intent
- Thin wrapper around `react-error-boundary` that:
  - standardizes the fallback UI (default fallback component),
  - threads `theme` into the fallback renderer,
  - keeps the public surface small and stable.

### Public contract (t.ts) — idioms
- Props are a deliberate subset of `react-error-boundary`:
  - `resetKeys`, `onError`, `onReset`
- Adds sys conventions:
  - `children?: t.ReactNode`
  - `fallbackRender?: ErrorBoundaryRenderer` (renderer receives `theme`)
  - `theme?: t.CommonTheme`
- The key idiom:
  - fallback renderer always receives `{ ...FallbackProps, theme }` via wrapper injection.

### Implementation idiom (ui.tsx)
- Wraps the upstream component rather than re-implementing boundary logic:
  - `import { ErrorBoundary as BaseErrorBoundary } from 'react-error-boundary';`
- Default fallback:
  - `const defaultFallback: t.ErrorBoundaryRenderer = (props) => <ErrorBoundaryFallback {...props} />;`
- Theme injection pattern:
  - `fallbackRender={(e) => fallbackRender({ ...e, theme })}`
- Pass-through of upstream controls:
  - `resetKeys={props.resetKeys}`
  - `onError={props.onError}`
  - `onReset={props.onReset}`

### Fallback UI idioms (ui.Fallback.tsx)
- Primary affordances:
  - "Copy" button that copies a stable, human-readable error dump to clipboard
  - "(reset)" button that calls `resetErrorBoundary()`
- Copy UX uses an explicit transient state:
  - `copied` boolean + `Time.delay(1200, ...)` to revert label
- Error rendering is intentionally compact:
  - `message`
  - `stack` split into lines
  - displayed via `ObjectView`
- Visual idioms:
  - uses `Color.theme(props.theme)` (library-wide contract)
  - magenta-tinted error surface via `Color.alpha(Color.MAGENTA, 0.1)`
  - a mild glass effect: `backdropFilter: 'blur(5px)'`

### Clipboard formatting idioms (u.clipboard.ts)
- Purpose:
  - create a stable clipboard string for JS `Error` or arbitrary thrown values
  - safe against getters and circular structures
- Format contract:
  - title line: `ErrorName: message` or `Non-Error value thrown`
  - optional stack (deduped if it repeats the title line)
  - optional `cause:` (nested, multiline-stringified)
  - optional `props:` (enumerable extras excluding name/message/stack/cause)
  - if non-Error: includes `value:` dump
- Safety idioms:
  - `safeGet` wraps property access (getter-safe)
  - `pickEnumerable` wraps reads and marks unreadable props
  - `multilineStringify` tries `Json.stringify(..., 2)` then falls back to `String(...)`

### DevHarness idioms (-spec)
- Minimal, focused debug state:
  - only `theme` + `debug`
  - persisted via `LocalStorage.immutable(\`dev:${D.displayName}\`, defaults)`
- Sample intentionally throws from render to exercise the boundary:
  - `if (boom) throw new Error('💥 Derp (render-throw to hit ErrorBoundary)')`
- Spec wiring:
  - `Dev.Theme.signalEffect(ctx, p.theme, 1)`
  - boundary logs `onError` and `onReset` via `console.info`

### Notable system conventions reinforced
- `common.ts` re-exports local UI deps (Button/ObjectView/Icons) so boundary + fallback stay thin.
- Theme threading is a first-class part of the boundary contract (not an incidental prop).
- Fallback is designed to help "diagnose + report" via copy-to-clipboard, not just "show an error".


===========================================================================



## Cropmarks (ui/Cropmarks) — idioms

### Component intent
- A universal “host frame” container:
  - renders a 3×3 grid that centers a “subject” cell,
  - optionally draws cropmark-like borders around the subject area,
  - supports sizing modes that make a predictable, debuggable stage for “floating” content.
- Key toggle:
  - `subjectOnly?: boolean` → bypass the frame entirely and render `children` only.

---

## Public contract (t.ts + t.size.ts) — idioms

### Props (t.ts)
- Core:
  - `children?: t.ReactNode`
  - `subjectOnly?: boolean` (escape hatch / production mode)
  - `size?: t.CropmarksSize` (drives layout)
- Border controls:
  - `borderWidth?: number`
  - `borderOpacity?: number`
  - `borderColor?: string`
- System conventions:
  - `debug?: boolean` (present but not used inside component; toggled in dev harness)
  - `theme?: t.CommonTheme`
  - `style?: t.CssInput`

### Size modes (t.size.ts)
- `mode: 'center'`
  - fixed pixel `width?: t.Pixels`, `height?: t.Pixels`
- `mode: 'fill'`
  - axis toggles: `x?: boolean`, `y?: boolean`
  - `margin?: t.CssMarginInput` (pixel-ish edges)
- `mode: 'percent'`
  - `width?: t.Percent`, `height?: t.Percent`
  - optional caps: `maxWidth?: t.Percent`, `maxHeight?: t.Percent`
  - `margin?: t.CssMarginInput`
  - `aspectRatio?: string | number`
    - used only when exactly one axis is supplied

---

## Layout idiom: 3×3 grid with middle “subject” cell

### Structure (ui.tsx)
- Host `<div>` is a grid.
- Nine children are emitted in order:
  - 8 “block” cells around the perimeter
  - 1 center “subject” cell at index 4 (confirmed by test)

This yields a stable semantic mapping:
- Host defines the frame
- Subject is always the middle cell (useful for tests and mental model)

---

## Margin idiom: single source of truth + per-mode conversion

### Margin normalization (u.ts)
- `toFillMargin(size)` returns a canonical `t.CssMarginArray`:
  - default comes from `D.margin` (`DEFAULTS.margin = 40`)
  - applies to `fill` and `percent` modes
  - uses `Style.Edges.toArray(...)` to normalize all CSS margin input shapes
- `asMargin(number)` is the “boring” helper: `Style.Edges.toArray(value ?? 0)`

This is a strong idiom for the repo:
- accept flexible input shape
- normalize early to a single stable representation

---

## Grid-template idiom: named lines + two templates

- Two grid templates exist:
  - **Fill** template: margins on left/right/top/bottom with a single `1fr` body track
  - **Center** template: `1fr auto 1fr` so the subject auto-sizes and is centered

```ts
Grid.Fill.columns = `[left] ${mLeft}px [body-x] 1fr [right] ${mRight}px`
Grid.Fill.rows    = `[top]  ${mTop}px  [body-y] 1fr [bottom] ${mBottom}px`

Grid.Center.columns = `[left] 1fr [body-x] auto [right] 1fr`
Grid.Center.rows    = `[top]  1fr [body-y] auto [bottom] 1fr`
```

### Axis-specific “fill” behaviour (subtle, important)
In `fill` mode you can fill one axis while centering the other:
- `is.x` means “fill X only” (center rows)
- `is.y` means “fill Y only” (center columns)

This produces a useful invariant:
- “fill one axis” is achieved by mixing Fill template on one axis and Center template on the other.

---

## Border idioms: theme-derived, edge-aware, margin-aware

### Opacity default derived from theme
- `opacity = props.borderOpacity ?? (theme.is.dark ? 0.1 : 0.07)`
- `borderColor` defaults to `theme.fg` and is alpha-blended:
  - `Color.alpha(props.borderColor ?? theme.fg, opacity)`

### “Ghost pixel” suppression via margin-zero detection
`wrangle.borderWidth(props)`:
- width per edge:
  - if that edge’s margin is zero → border width becomes `0`
  - otherwise → `borderWidth` (default `1`)
- uses `Style.isZero(value)` to decide

This is a powerful finishing idiom:
- avoids faint 1px lines when the frame margin is 0.

---

## Percent sizing idioms: container query units + host vars

### Host CSS variables (percentCssVars)
When `size.mode === 'percent'`:
- host sets:
  - `--pct-w`, `--pct-h` (when provided)
  - `--pct-w-max`, `--pct-h-max` (when provided)
- host sets `containerType`:
  - `size` if height is provided
  - otherwise `inline-size`

This is very deliberate:
- you only opt into full “size container” when you need both axes.

### Subject sizing (percentCssSubject)
- subject always centers itself:
  - `placeSelf: 'center'`
- width/height are computed via cqi/cqb:
  - `inlineSize = calc(min(var(--pct-w), var(--pct-w-max, 100)) * 1cqi)`
  - `blockSize  = calc(min(var(--pct-h), var(--pct-h-max, 100)) * 1cqb)`
- aspect ratio:
  - only applied when exactly one of width/height is present

### Test proves the contract
`-.test.tsx` asserts:
- host exposes `--pct-w` and `--pct-h`
- subject computed styles use the cqi/cqb formula

This is an unusually strong “CSS contract test” pattern for UI components.

---

## DevHarness idioms (-spec)
- Debug signals persisted via `LocalStorage.immutable(\`dev:${D.displayName}\`, defaults)`
- Controls cover the entire surface area:
  - `theme`, `debug`, `subjectOnly`, `size`
  - plus per-mode editors (center/fill/percent) split into separate small debug components
- Spec uses a light subject background and `overflow: hidden` to make cropping visible.

Notable: `debug` is harness-only for this component; the component itself doesn’t branch on it.

---

## Why this matters for the NavFrame / sheets stack
Cropmarks is a reusable “stage primitive”:
- it standardizes how we embed a “floating UI” inside a host
- it supports “subjectOnly” as a clean production path
- percent mode + container query sizing is a modern, layout-stable way to define “viewport-relative” panels without JS measurement

In practice:
- DevHarness host (dark) → Cropmarks → subject cell → your nav/player/sheets content

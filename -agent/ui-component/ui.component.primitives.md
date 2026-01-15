# ui.component.primitives.md

Reusable building blocks and contracts observed across `@sys/ui-react-components`.

Goal:
- Capture only **repeated** primitives (worth copying).
- Keep these **stable and host-agnostic**.
- Avoid component-specific helpers (those stay in idioms).

=============================================================================


## Theme resolution (library-wide)

### Contract
- Components accept: `theme?: t.CommonTheme`
- Resolve once per render:
  - `const theme = Color.theme(props.theme)`
- Consume resolved values only:
  - `theme.fg` (foreground/text)
  - `theme.bg` (surface/background)
  - `theme.name` (display/debug)
- Do not branch on `'Light' | 'Dark'` inside components.

### Why it matters
- Keeps UI logic independent of theme enumeration.
- Enables theme expansion without component changes.


=============================================================================


## CSS composition via `css(...)`

### Contract
- Define a `styles` object inside render.
- Compose base + overrides (including caller style):
  - `className={css(styles.base, props.style).class}`

### Why it matters
- Keeps styling local, explicit, and consistent.
- Supports host overrides without exposing internals.


=============================================================================


## Motion wrapper + presence transitions (`M.div`, `AnimatePresence`)

### Contract
- Use `M.div` (framer-motion wrapper re-exported from `./common.ts`) for animated surfaces.
- For mount/unmount transitions, wrap conditional render with `AnimatePresence`.
- Prefer explicit `initial / animate / exit / transition` objects.

### Why it matters
- Standardizes animation vocabulary.
- Makes “panel/sheet” UI deterministic and easy to reason about.


=============================================================================


## Signals as explicit state surface (`Signal`)

### Contract
- Mutable state is represented as Signals, owned externally.
- UI components remain pure render functions over props.
- For non-trivial state, use a two-tier pattern:
  1) Pure UI (`Component(props)`)
  2) Signals layer (`createSignals()` + adapter subscribing via `Signal.useRedrawEffect` / `Signal.useEffect`)

### Observed utilities (common usage)
- `Signal.useRedrawEffect(listen)`
- `Signal.effect(...)`
- `Signal.toObject(...)` (debug/inspection)
- `Signal.toggle(...)`, `Signal.cycle(...)` (DevHarness controls)

### Why it matters
- Prevents implicit coupling and “hidden subscriptions”.
- Keeps controllers/test harnesses aligned with production wiring.


=============================================================================


## Debug state persistence (`LocalStorage.immutable`)

### Contract
- DevHarness debug state persists via:
  - `LocalStorage.immutable<Storage>(\`dev:${D.displayName}\`, defaults)`
- Snapshot seeds initial signals.
- A signal effect writes back on change.

### Why it matters
- Makes debug surfaces stable across reloads.
- Keeps debug state minimal and explicit.


=============================================================================


## Host clipping contract (overflow discipline)

### Contract
- Some animated/physics surfaces require an overflow-clipped host:
  - host container must provide `{ overflow: 'hidden' }`
- The component must state this requirement clearly (comment or prop docs).

### Why it matters
- Prevents animation artifacts leaking outside host bounds.
- Makes host responsibilities explicit (no “mystery CSS”).


=============================================================================


## Layout engine: CSS grid as primary structure primitive

### Contract
- Use CSS grid for:
  - track-based splitting (SplitPane)
  - stable multi-cell framing (Cropmarks)
  - spacer/body/spacer alignment (Sheet)
- Prefer “stable structure” strategies:
  - keep DOM stable; hide with `visibility` and disable with `pointerEvents` when collapsing, rather than removing nodes.

### Why it matters
- Predictable sizing, fewer reflow surprises.
- Structural stability simplifies interaction layers.


=============================================================================


## Interaction event elevation (raw pointer → semantic arg)

### Contract
- Expose handlers that receive a semantic event shape, not raw DOM events.
- Pattern:
  - accept base pointer arg
  - attach domain/UI semantics (e.g. `node`, `hasChildren`)
  - pass the merged event upward

### Why it matters
- Keeps components generic but meaningful.
- Avoids duplicating “event decoding” across callers.


=============================================================================


## “Active gating” for interactivity

### Contract
- Derive a single gate boolean (canonical form):
  - `isActive = active && enabled`
- Suppress handlers and adjust cursor/affordances based on that gate.
- For press semantics:
  - only fire “up” if there was a “down” that originated inside the component.

### Why it matters
- Eliminates edge-case input bugs.
- Makes disabled/inert states trustworthy.


=============================================================================


## Clipboard as a diagnostic primitive

### Contract
- Provide a “Copy” affordance for diagnostic payloads when relevant (e.g. error surfaces).
- Clipboard formatting should be:
  - stable
  - readable
  - safe against getters/cycles

### Why it matters
- Improves bug reporting without tooling.
- Keeps diagnostic UX consistent across components.


=============================================================================


## Scroll-container defaults for panes

### Contract
- Pane-like containers that live inside grids should typically set:
  - `minWidth: 0`
  - `minHeight: 0`
  - `overflow: 'auto'`

### Why it matters
- Prevents grid/flex overflow traps.
- Makes nested layouts behave predictably.


=============================================================================


## Component identity constants (`D`)

### Contract
- Each module defines:
  - `D.name`
  - `D.displayName` (via `Pkg.toString(pkg, name, false)`)
- DevHarness keys and storage keys should derive from identity:
  - `dev:${D.displayName}`

### Why it matters
- Stable naming for diagnostics, testing, and storage.
- Avoids hard-coded, drifting identifiers.

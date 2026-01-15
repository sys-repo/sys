# ui.component.shape.md
Canonical, invariant structure for UI components in `@sys/ui-react-components`.

This document defines **form**, not behavior. It exists to:
- constrain generation (Codex + humans),
- prevent stylistic drift,
- avoid reinvention of component structure.

=============================================================================


## Module file set
A UI component module is typically:

- `common.ts`
  Module identity + re-exports + constants.
- `t.ts`
  Public type surface only.
- `ui.tsx`
  React implementation.
- `mod.ts`
  Public export surface (thin).
- `-spec/-SPEC.tsx`
  DevHarness spec - host setup for dev-harness
- `-spec/-SPEC.Debug.tsx`
  Debug UI + LocalStorage-backed debug signals for the DevHarness.

=============================================================================


## `t.ts` — types only
Responsibilities:
- Declare the public library surface.
- Declare props.
- No runtime logic.

Pattern:

```ts
import type { t } from './common.ts';

export type MyComponentLib = {
  readonly UI: t.FC<MyComponentProps>;
};

export type MyComponentProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
```

Rules:
- Use `type`, not `interface`.
- Prefer `readonly` on outputs (e.g. lib surface).
- Props are shallow and optional.
- No imports beyond types.

=============================================================================


## `mod.ts` — explicit public surface
Responsibilities:
- Bind implementation to the public lib shape.
- No logic.

Pattern:

```ts
import type { t } from './common.ts';
import { MyComponent as UI } from './ui.tsx';

export const MyComponent: t.MyComponentLib = { UI };
```

Rules:
- Keep exports thin and explicit.
- Do not re-export internals.

=============================================================================


## `common.ts` — module identity + shared constants
Responsibilities:
- Re-export package `common.ts`.
- Define module identity constants (`D`) and any stable keys.

Pattern:

```ts
import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

const name = 'MyComponent';

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;

export const DEFAULTS = D;

export const STORAGE_KEY = {
  DEV: `dev:${D.displayName}`,
};
```

Rules:
- `D` is the canonical module identity.
- Only constants and stable keys here; no component logic.

=============================================================================


## `ui.tsx` — component implementation
Imports:
- Import from local `./common.ts` (types + shared libs).

Pattern:

```tsx
import React from 'react';
import { type t, Color, css, D, KeyValue } from './common.ts';

export const MyComponent: React.FC<t.MyComponentProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.View
        theme={theme.name}
        items={[
          { kind: 'title', v: D.displayName },
          { k: 'message', v: '👋 hello, world!' },
        ]}
      />
    </div>
  );
};
```

Rules:
- `React.FC<...Props>` is acceptable here.
- Keep `Render:` marker comment.
- Derive theme once: `Color.theme(props.theme)`.
- Create `styles` object inside render.
- Compose styles with `css(styles.base, props.style).class`.

=============================================================================


## `-spec/-SPEC.tsx` — DevHarness entry
Responsibilities:
- Provide a harness that renders the component and wires redraw.

Core pattern:
- `Spec.describe(D.displayName, async (e) => { ... })`
- optional debug signals, theme switching, debug panel row.

---

## `-spec/-SPEC.Debug.tsx` — debug signals (optional)
Responsibilities:
- Define a `createDebugSignals()` that returns:
  - `props` signals
  - `listen()`
  - `reset()`
- Persist via `LocalStorage.immutable(...)`.
- Provide a small Debug UI that toggles debug/theme, reset, and inspects signal state.

Rules:
- Keep this file dev-only (harness support).
- No coupling to product logic.


=============================================================================


## Theming contract (library-wide)
### Type
```ts
/**
 * Common system theme types.
 */
export type CommonTheme = 'Light' | 'Dark';
```

### Props
- UI components may accept:
  - `theme?: t.CommonTheme`

### Resolution
- Theme is always resolved via:
  - `const theme = Color.theme(props.theme)`
- Resolution normalizes the discrete theme value into a usable shape:
  - `{ fg, bg, name }`

### Usage rules
- Components **must not** branch on `'Light' | 'Dark'` directly.
- Components consume **only** resolved values:
  - `theme.bg` → surface / container background
  - `theme.fg` → text / foreground color
- Theme resolution occurs at render time; components remain stateless with respect to theme.

### Composition
- Nested components may:
  - inherit the resolved theme implicitly, or
  - intentionally override / invert via `Color.Theme.invert(...)`
    - Common in DevHarness and diagnostic UIs.

### Rationale
- Keeps component logic independent of theme enumeration.
- Allows future theme expansion without component changes.
- Enforces visual consistency across the entire UI surface.
- Makes components portable across hosts, products, and harnesses.

This is a **shape-level contract**, not a component idiom.
It applies uniformly across `@sys/ui-react-components`.


=============================================================================


## Host / Stage contract (library-wide)

Some components require a bounded host for correct visuals and interaction:
- Real, stable layout bounds (width/height).
- Sometimes `overflow: hidden` to clip spring/motion overflow (e.g. Sheet-like overlays).
- DevHarness “subject” region is the canonical reference host/stage.
- If a component has a hard host requirement, it must state it explicitly in its docstring.


=============================================================================


## State & Signals (house rule)
State is always an explicit input; UI components do not own domain state.

- `@sys/std/signal` is the canonical signal layer and `@sys/ui-react/Signal` is the React glue that mirrors its lifecycle helpers.
- UI components remain pure renderers: props in, markup out. Domain state lives outside the component via explicit Signals or signal snapshots.
- Non-trivial flows follow a two-tier pattern: a pure UI layer consumes props/values while a `createSignals()` controller owns lifecycle-aware Signals and maps them back to props, often wired by DevHarness adapters.
- Lifecycle helpers expose a lazy `Abortable` (`e.life`); React wrappers mirror that shape so cleanup order stays deterministic.
- Controllers (or command layers) advance Signals; UI components only observe and render. No hidden subscriptions—the dependency must appear on the component surface.
- Signals may come from different origins (ImmutableRef, CRDT, loaders, etc.), but the UI boundary stays `source → Signals → props → render`.


=============================================================================


<!-- ACTION: "ADDED" -->
## DevHarness boundary / State boundary
- No `LocalStorage.*` in runtime component files.
- Persistent knobs live in `-spec/-SPEC.Debug.tsx`.
- Runtime views may accept `theme?: t.CommonTheme`, `style?: t.CssInput`, `debug?: boolean` only.
- If state is complex, expose an optional `Signals` helper adjacent to the component; do not bake it into the view.
<!-- END ACTION -->

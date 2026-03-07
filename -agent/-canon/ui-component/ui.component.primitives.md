<!-- ACTION: "CHANGED" -->
# ui.component.primitives.md
Reusable building blocks and contracts observed across `@sys/ui-react-components`.

Goal:
- Capture only repeated primitives (worth copying).
- Keep these stable and host-agnostic.
- Keep persistence in -spec only.

=============================================================================


## Theming

### Theme resolution (Color.theme)
- What it is: Resolve theme once per render and use only derived values for styling and downstream props.
- Where used: `code/sys.ui/ui-react-components/src/ui/Button/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/Slider/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/Media.Video/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/Layout.SplitPane/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/Player.Video.Controls/ui.tsx`
- Snippet:
```ts
const theme = Color.theme(props.theme);
const styles = {
  base: css({ color: theme.fg, backgroundColor: theme.bg }),
};
return <div className={css(styles.base, props.style).class} />;
```
- Notes/constraints: Resolve once per render; pass `theme.name` to nested components when needed.

=============================================================================


## CSS composition

### Render-local styles + css merge
- What it is: Define a `styles` object inside render and compose base + overrides in one place.
- Where used: `code/sys.ui/ui-react-components/src/ui/Button/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/PathView/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/KeyValue/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/Media.Video/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/Layout.RectGrid/ui.tsx`
- Snippet:
```tsx
const styles = { base: css({ position: "relative" }) };
return <div className={css(styles.base, props.style).class} />;
```
- Notes/constraints: Keep the `styles` object inside render; compose caller overrides with `css(styles.base, props.style)`.

=============================================================================


## Spacing normalization

### Style.toPadding / Style.toMargins
- What it is: Normalize padding and margin inputs into concrete CSS edges before render.
- Where used (examples): `code/sys.ui/ui-react-components/src/ui/Button/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/Player.Video.Controls/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/Text.Input/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/TreeView.Index.Item/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/ObjectView/ui.tsx`
- Snippet:
```ts
const styles = {
  base: css({
    ...Style.toPadding(props.padding ?? D.padding),
    ...Style.toMargins(props.margin),
  }),
};
```
- Notes/constraints: Use module defaults (D.*) when inputs are undefined.

=============================================================================


## Pointer/interaction helpers

### usePointer handlers + state
- What it is: Use `usePointer` to unify mouse/touch behavior and attach handlers to a root element.
- Where used: `code/sys.ui/ui-react-components/src/ui/Slider/use.EventMonitor.ts`, `code/sys.ui/ui-react-components/src/ui/Layout.SplitPane/use.SplitDrag.tsx`, `code/sys.ui/ui-react-components/src/ui/TreeView.Index.Item/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/Icon.Swatches/ui.Swatch.tsx`
- Snippet:
```ts
const pointer = usePointer({
  onDown: (e) => onDown?.(e.client),
  onDrag: (e) => onDrag?.(e.client),
  onUp: (e) => onUp?.(e.client),
});
return <div {...pointer.handlers} />;
```
- Notes/constraints: Keep pointer math in helpers (Wrangle) and only wire handlers here.

=============================================================================


## Signals (runtime vs harness usage)

### Runtime signal subscription (Signal.useRedrawEffect)
- What it is: Subscribe view redraw to signal reads without owning state inside the component.
- Where used: `code/sys.ui/ui-react-components/src/ui/Button/ui.tsx`, `code/sys.ui/ui-react-components/src/ui/Player.Video.Element/use.Signals.tsx`, `code/sys.ui/ui-react-components/src/ui/Player.Video.Element/ui.Elapsed.tsx`
- Snippet:
```ts
const listen = () => {
  signals?.props.playing.value;
  signals?.props.muted.value;
};
Signal.useRedrawEffect(listen);
```
- Notes/constraints: Runtime only; no LocalStorage in runtime components.

### Spec harness redraw loop (Signal.effect + ctx.redraw)
- What it is: In `-spec/-SPEC.tsx`, wire debug signals into the harness redraw loop.
- Where used: `code/sys.ui/ui-react-components/src/ui/Button/-spec/-SPEC.tsx`, `code/sys.ui/ui-react-components/src/ui/Slider/-spec/-SPEC.tsx`, `code/sys.ui/ui-react-components/src/ui/Layout.SplitPane/-spec/-SPEC.tsx`, `code/sys.ui/ui-react-components/src/ui/Text.Input/-spec/-SPEC.tsx`, `code/sys.ui/ui-react-components/src/ui/Player.Video.Controls/-spec/-SPEC.tsx`
- Snippet:
```ts
Signal.effect(() => {
  debug.listen();
  ctx.redraw();
});
```
- Notes/constraints: Spec only; keep this wiring out of runtime component files.

### Debug signal factory (createDebugSignals)
- What it is: Return a typed `props` signal bag and a `listen()` helper for harness redraw.
- Where used: `code/sys.ui/ui-react-components/src/ui/Button/-spec/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Slider/-spec/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Layout.SplitPane/-spec/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Text.Input/-spec/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Player.Video.Controls/-spec/-SPEC.Debug.tsx`
- Snippet:
```ts
export function createDebugSignals() {
  const s = Signal.create;
  const props = { theme: s<P["theme"]>("Dark") };
  return { props, listen: () => Signal.listen(props) };
}
```
- Notes/constraints: Spec only; optionally add `reset()` when persistence is used.

=============================================================================


## DevHarness persistence (spec-only)

### LocalStorage.immutable for debug knobs
- What it is: Persist debug controls via `LocalStorage.immutable` and sync signals in an effect.
- Where used: `code/sys.ui/ui-react-components/src/ui/Button/-spec/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Media.Video/-spec/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Layout.SplitPane/-spec/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Text.Input/-spec/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Player.YouTube/-spec/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Media.Config/-spec.zoom/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Dist/-spec/-SPEC.Debug.tsx`, `code/sys.ui/ui-react-components/src/ui/Media.Devices/-spec/-SPEC.Debug.tsx`
- Snippet:
```ts
const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
const snap = store.current;
const props = { theme: Signal.create(snap.theme) };

Signal.effect(() => {
  store.change((d) => {
    d.theme = props.theme.value;
  });
});
```
- Notes/constraints: Spec only; never call LocalStorage in runtime component files.
<!-- END ACTION -->

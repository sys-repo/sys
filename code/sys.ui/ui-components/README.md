# @sys/ui-components

React primitives for composing controls, content, layouts, and media interfaces.

The package root and `/react` export only `pkg`. Import components from explicit `/react/*`
subpaths; `/t` provides types only.

## Entry points

Start with the group that matches the interface:

- **Controls and presentation:** [Button](https://jsr.io/@sys/ui-components/doc/react/button),
  [Icon](https://jsr.io/@sys/ui-components/doc/react/icon), and related primitives.
- **Content:** [Prose](https://jsr.io/@sys/ui-components/doc/react/prose) and
  [ObjectView](https://jsr.io/@sys/ui-components/doc/react/object-view).
- **Layout:** [SplitPane](https://jsr.io/@sys/ui-components/doc/react/layout/split-pane) and
  [Tabs](https://jsr.io/@sys/ui-components/doc/react/layout/tabs).
- **Media:** [Media](https://jsr.io/@sys/ui-components/doc/react/media) and
  [Player](https://jsr.io/@sys/ui-components/doc/react/player).
- **Focus styling:** `FocusStyle` from `@sys/ui-components/style/focus` shares the focus-arrival
  policy with component-owned paint.

## Example

Use a React TSX toolchain that resolves JSR imports:

```tsx
import { Button } from 'jsr:@sys/ui-components/react/button';

function MyComponent(props: { text: string }) {
  return <Button>{props.text}</Button>;
}
```

`Button` is a styled rich-content control with a `div` root and `role="button"`. When enabled and
active, it participates in the tab order and activates on Enter keydown or Space keyup. It is not a
native form control and does not submit forms automatically; interactive descendants own their
input.

### Button appearance and focus

The root defaults to a 1px radius; override it with `style.borderRadius`, including `0` for square
corners. Customize the default focus treatment through four root CSS tokens, without replacing its
motion or preference handling:

| Token                       | Controls                               | Default           |
| --------------------------- | -------------------------------------- | ----------------- |
| `--sys-button-focus-accent` | Arrival colour                         | Opaque blue       |
| `--sys-button-focus-rest`   | Resting colour                         | Blue at 20% alpha |
| `--sys-button-focus-width`  | Outline stroke width, not Button width | `2px`             |
| `--sys-button-focus-offset` | Outline offset from the root edge      | `2px`             |

```tsx
<Button
  style={{
    '--sys-button-focus-accent': '#a855f7',
    '--sys-button-focus-rest': '#887399',
    '--sys-button-focus-width': '2px',
    '--sys-button-focus-offset': '1px',
  }}
>
  Run
</Button>;
```

Use explicit CSS lengths for width and offset. Keep the width positive; `'0px'` offset puts the ring
against the edge, while negative offsets move it inward. The default 2px offset plus 2px stroke
paints 4px outside the root; it does not reserve margin or change layout width or height. Keep
layout on the existing margin, padding and sizing surfaces, and corner shape on
`style.borderRadius`.

On native `:focus-visible`, the accent appears immediately, holds for 70ms, then settles over 220ms
with `ease-out`. Each Button using the default treatment initializes its own palette and geometry.
Choose resting colours for the actual surface; the dim default does not meet 3:1 contrast against
white or Dark. Reduced motion skips the arrival; forced colours uses a static `Highlight` outline.
Both preference modes retain the chosen width and offset. Explicit root animation settings,
including longhands, preserve the caller's animation and keep default focus static. Timing and
easing come from the shared `FocusStyle` policy; Button owns the paint.

Supplying `style[':focus-visible']` instead replaces the complete default treatment. The caller owns
its indicator and motion/preference handling; no default focus variables or media rules are added.
Keep a visible indicator and use explicit units for `outlineOffset`.

See the [API documentation](https://jsr.io/@sys/ui-components/doc) for component props and other
leaves.

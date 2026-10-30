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

See the [API documentation](https://jsr.io/@sys/ui-components/doc) for component props and other
leaves.

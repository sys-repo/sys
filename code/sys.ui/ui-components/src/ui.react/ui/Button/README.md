# Button

Use `Button` for an action, `Anchor.Button` for an inline action styled like a link, and `Anchor.UI`
or `Anchor.Link` for navigation. Use a native submit button to submit a form.

```tsx
import { Button } from 'jsr:@sys/ui-components/react/button';

function EditAction(props: { onEdit: () => void }) {
  return <Button tone='accent' onClick={props.onEdit}>Edit</Button>;
}
```

`tone='accent'` gives an available action a blue label at rest without forcing hover or adding a
fill. Disabled and inactive actions leave the tab order and do not activate.

## Keyboard focus

Both tones share the Anchor family's font-relative keyboard ring. It reserves no space. While a
control has keyboard focus, browsers with CSS anchor positioning can draw a compact ring around one
unclipped box. Wrapped links, self-clipping controls, caller-named CSS anchors, and browsers without
anchor positioning keep the native outline. Forced colours always use the root outline. Leave
clearance at scroll-container edges: an ancestor can clip both kinds of indicator.

Check the **settled** outline, not just its arrival: the built-in resting colour falls below 3:1
contrast on white and Dark surfaces. To adjust its colour without replacing reduced-motion or
forced-colours handling, set `--sys-button-focus-rest` on the root. Use `--sys-button-focus-accent`
for the arrival colour. For geometry, `--sys-button-focus-width` and `--sys-button-focus-offset`
accept CSS lengths; `style.borderRadius` controls the corner shape.

A custom `style[':focus-visible']` replaces the entire treatment. Use it only when you also provide
a visible keyboard indicator that works with reduced motion and forced colours.

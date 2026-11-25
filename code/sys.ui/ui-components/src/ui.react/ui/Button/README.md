# Button

Use `Button` for an action. Use `Anchor` for navigation or a native submit button to submit a form.

```tsx
import { Button } from 'jsr:@sys/ui-components/react/button';

function EditAction(props: { onEdit: () => void }) {
  return <Button tone='accent' onClick={props.onEdit}>Edit</Button>;
}
```

`tone='accent'` gives an available action a blue label at rest without forcing hover or adding a
fill. Disabled and inactive actions leave the tab order and do not activate.

## Keyboard focus

The focus outline does not reserve space. Accent actions normally use a font-relative ring; use
`style` for layout overrides such as `overflow` or `position` so Button can keep the outline on the
root. Forced colours also use a root outline. Leave clearance between rows and at scroll container
edges so the whole ring stays visible.

Check the **settled** outline, not just its arrival: the built-in resting colour falls below 3:1
contrast on white and Dark surfaces. To adjust its colour without replacing reduced-motion or
forced-colours handling, set `--sys-button-focus-rest` on the root. Use `--sys-button-focus-accent`
for the arrival colour. For geometry, `--sys-button-focus-width` and `--sys-button-focus-offset`
accept CSS lengths; `style.borderRadius` controls the corner shape.

A custom `style[':focus-visible']` replaces the entire treatment. Use it only when you also provide
a visible keyboard indicator that works with reduced motion and forced colours.

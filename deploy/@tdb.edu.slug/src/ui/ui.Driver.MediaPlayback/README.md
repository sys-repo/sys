# `ui.Driver.MediaPlayback`

Runtime composition head for media playback behavior layered on top of `TreeContentDriver`.

`MediaPlaybackDriver.head` composes playback runtime + derived playback view state from `TreeContent` state and returns a slot patch. It does **not** own `TreeHost` rendering or debug harness wiring.

## Current (explicit composition)

```tsx
const baseSlots = createSlots({
  content,
  selection,
  theme,
  playbackPosition: head.derived.position,
  playbackPayload: head.derived.payload,
});

const head = MediaPlaybackDriver.head.useHead({
  content,
  selection,
  theme,
  muted,
  renderNavFooter: ({ runtime, theme }) => <NavFooter theme={theme} runtime={runtime} />,
});

const slots = {
  ...baseSlots,
  ...head.slotsPatch,
  nav: { ...(baseSlots.nav ?? {}), ...(head.slotsPatch.nav ?? {}) },
};
```

## Future ergonomic target (not implemented yet)

```tsx
const ui = MediaPlaybackDriverHead.use({ treeContent, theme, muted });
<TreeHost.UI {...ui.treeHost} slots={ui.slots} />
```

The current API intentionally keeps composition explicit while the head seam stabilizes.

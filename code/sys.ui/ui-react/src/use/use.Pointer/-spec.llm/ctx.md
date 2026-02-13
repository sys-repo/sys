# usePointer contract (frozen pre-refactor)

This note freezes observable behavior before the state-machine refactor.

## Required semantics

- `onDown` fires once for an active press cycle (`pointerdown` or `touchstart`).
- `onUp` fires only for a valid active release (`pointerup` or `touchend`).
- `onCancel` fires for active-cycle cancel paths (`pointercancel`, `touchcancel`, `lostpointercapture`).
- Stray `up`/`cancel`/`lostpointercapture` events without an active press cycle are no-op.
- During `pointerup`, a re-entrant `lostpointercapture` must not double-handle or convert `up` into `cancel`.
- Capture APIs are optional:
  - if available, `setPointerCapture` on pointer down and conditional `releasePointerCapture` on pointer up/cancel.
  - if absent, behavior degrades predictably with the same callback semantics.
- Drag integration:
  - start drag on down when drag handling is active.
  - cancel drag on up/cancel/reset.
- Tabs consumer semantics:
  - selected tab remains inert.
  - canceled press must not emit selection change.
  - rapid switching must not drop valid selection-change events.

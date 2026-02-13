# usePointer contract lock (phase A)

This file freezes the public contract and dependency boundaries before the first-principles rewrite.

## Public API assessment

| API item | decision | required semantics | evidence |
|---|---|---|---|
| `usePointer(input?)` | keep | accepts callback shorthand or args object | `use.Pointer.ts` `wrangle.args(...)` |
| `PointerHook.handlers` | keep | exposes pointer, touch, focus, and optional dragdrop handlers | `t.use.Pointer.ts` + runtime handler composition |
| `PointerHook.is` | keep | returns `{ over, down, up, dragging, dragdropping, focused }` | `t.use.Pointer.ts` + existing consumers |
| `PointerHook.drag` | keep | current drag snapshot when pointer-drag active | `t.use.Pointer.ts` + `use.Pointer.Drag.ts` |
| `PointerHook.dragdrop` | keep | current dragdrop snapshot when file drag/drop active | `t.use.Pointer.ts` + `use.Pointer.Dragdrop.ts` |
| `PointerHook.reset()` | keep | clears over/down/focus and cancels drag + dragdrop | existing implementation + tests |
| `onDown` | keep | fires once per valid press cycle (`pointerdown`/`touchstart`) | pointer tests |
| `onUp` | keep | fires only on active release (`pointerup`/`touchend`) | pointer tests |
| `onCancel` | keep | fires on active cancel (`pointercancel`/`touchcancel`/`lostpointercapture`) | pointer tests |
| `onEnter`/`onLeave` | keep | pointer/touch hover-in/out semantics stay stable | current consumers/styles |
| aggregate `on(...)` | keep | receives normalized event + flags + cancel methods | existing contract |
| capture capability internals | internalize | optional feature, no public API guarantee beyond behavior parity | implementation detail |
| machine state naming | internalize | no state names are part of public API | implementation detail |

## Frozen semantic invariants

- Stray `up`, `cancel`, and `lostpointercapture` when no active press cycle are no-op.
- Re-entrant `lostpointercapture` during `pointerup` must not suppress `onUp` or emit `onCancel`.
- If pointer capture APIs are absent, callback semantics remain identical (predictable degradation).
- Drag cancellation happens on release/cancel/reset.

## Dependency boundary audit (phase B)

### Ownership boundaries

- `usePointer` core owns:
  - press lifecycle (`down/up/cancel/lostcapture`)
  - `over/down/focused` flags
  - callback dispatch ordering
  - optional pointer capture calls
- `usePointerDrag` owns:
  - movement threshold
  - document-level move/up/touch listeners
  - drag snapshot production
- `usePointerDragdrop` owns:
  - dragenter/over/leave/drop file semantics
  - drop-guard attachment
  - dragdrop snapshot production

### Coupling verdict

- `usePointerDrag`: orthogonal; only integration points are `start()` and `cancel()`.
- `usePointerDragdrop`: orthogonal; only integration points are handlers spread + `cancel()` on reset/drag stop.
- Rewrite impact: core can be rebuilt without changing drag/dragdrop public contracts.

## Non-goals for v2 rewrite

- No expansion of the public API shape.
- No semantic behavior changes unless failing tests prove current behavior is broken.
- No refactor of drag/dragdrop internals in this phase.

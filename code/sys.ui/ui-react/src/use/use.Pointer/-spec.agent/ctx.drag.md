# usePointerDrag hardening plan (phase lock)

Purpose: harden `use.Pointer.Drag.ts` in a single cohesive pass without API drift.

## Scope (locked)

- Target file:
  - `/Users/phil/code/org.sys/sys/code/sys.ui/ui-react/src/use/use.Pointer/use.Pointer.Drag.ts`
- Allowed:
  - internal lifecycle/session refactor
  - internal listener strategy refactor
  - targeted test additions/updates for drag session robustness
- Forbidden:
  - public API/type shape changes
  - behavior changes outside session-source correctness and teardown robustness
  - cross-hook feature additions

## Non-goals (locked)

- No expansion of `UsePointerDragArgs` or hook return type.
- No redesign of drag payload shape.
- No refactor of `use.Pointer.Dragdrop.ts` except compatibility-preserving updates if strictly required.

## Invariants (must hold)

1. Session source truth:
- Drag session source is explicit at session start (`pointer` vs `touch`), never inferred from global capability (`useIsTouchSupported`) for active-session listener selection.

2. Lifecycle safety:
- `start()` is idempotent during an active session.
- `cancel()` is idempotent and safe to call multiple times.
- Every session reaches a deterministic terminal state.

3. Listener ownership:
- Listener attach/detach is keyed to active session source only.
- Teardown always removes all listeners attached by this session.

4. Stale callback immunity:
- In-flight callbacks from prior sessions are ignored (session token or equivalent guard).

5. Behavioral parity:
- Existing public callback semantics and snapshot fields remain unchanged.

## Boundary contracts (must remain strict)

- `usePointer` owns press lifecycle and consumer callback dispatch.
- `usePointerDrag` owns movement tracking/session listeners only.
- `usePointerDragdrop` owns file drag/drop semantics only.

No hidden coupling or cross-ownership bleed.

## Triple-adversary matrix

### A. Hybrid-input adversary
- Problem class: device supports touch and pointer; capability-based branching selects wrong listener family for current interaction.
- Required defense: source-at-start listener mode selection.

### B. Lifecycle-race adversary
- Problem class: repeated start/cancel, quick up/cancel transitions, in-flight callbacks after cancel.
- Required defense: idempotent lifecycle methods + stale session callback guards.

### C. Boundary-drift adversary
- Problem class: drag hardening breaks pointer core or tab interaction via incidental coupling.
- Required defense: no public contract changes + full regression verification.

## Test plan (gated)

1. Targeted drag tests (first):
- source-mode correctness across sessions
- repeated start/cancel churn
- stale callback ignored after cancel
- no leaked listeners after teardown

2. Pointer regression tests (second):
- `/Users/phil/code/org.sys/sys/code/sys.ui/ui-react/src/use/use.Pointer/-test/-use.Pointer.test.ts`

3. Tabs canary tests (third):
- `/Users/phil/code/org.sys/sys/code/sys.ui/ui-react-components/src/ui/Layout.Tabs/-test/-.test.tsx`

4. Module-wide verification (final):
- `ui-react`: `deno task test --trace-leaks`
- `ui-react-components`: `deno task test --trace-leaks`

## Exit criteria

- Hybrid-session source mismatch class eliminated.
- Drag session teardown deterministic and leak-free.
- No pointer/Tabs regressions.
- No API shape changes.

## Implementation style constraints

- Keep code small and explicit.
- Prefer pure transition helpers + thin effectful shell.
- Avoid speculative abstractions.

# UI harness patterns — running notes

## Scope
- Workspace-level agent notes for reusable UI and DevHarness patterns.
- Not canon. Promote only after patterns repeat and survive review.
- Keep examples generic; do not encode the current component's domain specifics here.

## Why UI work derails agents
- UI work has many soft boundaries active at once: view, debug harness, sample runtime, app usage, domain model, persistence, visual wording, and notes/plans.
- These boundaries are close in the file tree and easy to confuse by adjacency.
- The danger is not difficult code; it is broadening the concept harness before the layer is named.

## Required ambiguity flush before edits
- Name the active layer first:
  - pure widget
  - debug harness
  - app integration
  - domain/runtime package
  - notes/plans
- State which layers are explicitly out of scope.
- State the exact commit/file boundary before staging or committing.
- If a new noun appears, ask whether it is a real domain concept, a UI display concept, or only harness glue.

## Current working shape

### Pure widget boundary
- A reusable UI widget renders snapshots/props.
- It does not open transports, own domain clients, subscribe to domain streams, or invent domain APIs.
- If runtime facts are needed, pass an immutable snapshot into the widget.

### Debug harness ownership
- DevHarness/spec code may own sample setup glue.
- Put non-render setup actions in small `-spec/-u.*.ts` files when they would clutter `-SPEC.Debug.tsx`.
- Keep `-SPEC.Debug.tsx` close to the UI template shape: signals, reset, render controls.
- Do not generalize harness glue into component API unless the human explicitly moves that boundary.

### Defaults and persistence
- Keep one clear `defaults` object for debug signal defaults.
- Persist knobs, not volatile runtime snapshots.
- If persisted storage is a subset of debug state, type that subset explicitly.

### Domain surfaces
- Do not create fake domain APIs inside UI modules.
- If the UI needs domain facts, consume them from the domain surface or pass them in as plain props.
- If a display helper needs a canonical domain list/value, pause and decide whether the domain package should own it.

### Commit hygiene for UI sessions
- Never use `git add -A` in a mixed UI/WIP session.
- Stage explicit whitelisted paths only.
- Notes/plans are separate artifacts unless the human explicitly includes them in the code commit.
- Re-run `git diff --cached --name-only` before committing and compare it to the requested boundary.

## Canon candidates
- Pure UI snapshot boundary for status/debug widgets.
- Debug harness persistence should exclude live runtime status unless the runtime contract explicitly says otherwise.
- UI work should start by naming the active layer and the out-of-scope adjacent layers.

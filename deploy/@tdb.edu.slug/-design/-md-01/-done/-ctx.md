# Context: Layout.TreeSplit (current)

Status:
- Phase 1 (layout-only) is complete and committed.
- Runtime composes `Tree + SplitPane` only.
- No runtime state, no Signals, no LocalStorage.

Canonical intent:
- `Layout.TreeSplit` is a **pure layout compositor**.
- It is **not**:
  - a tree controller
  - a data loader
  - a domain adapter
  - stateful
- Runtime = props-in → markup-out.
- All experimentation, persistence, and wiring live in `-spec`.

House rules (binding):
- Follow `-agent/ui-component/ui.component.authoring.md`.
- One `Color.theme(props.theme)` per render.
- `data-component={D.displayName}` only (no literals).
- Imports of UI primitives only via local `common.ts`.
- Runtime never touches:
  - LocalStorage
  - Signals
  - JSON loading
  - schema validation
  - selection logic

Current phase focus:
## Phase 2 — Data in (no selection)
Goal:
- Render `Tree` with **real data** in the DevHarness.
- Keep runtime UI completely pure.

Constraints:
- Runtime:
  - accepts a `root` prop derived from Tree **public types**
  - no selection, no paths, no loaders
- Spec:
  - loads sample JSON from `-spec/-sample/slug-tree.*.json`
  - adapts JSON → Tree root shape
  - passes root into runtime
- Do not guess Tree props:
  - read Tree public `t.ts` first
  - map only what exists

Future (not now):
## Phase 2.5 — Loader (note only)
- HTTP fetch + schema validation against `slug.SlugTree`
- Lives outside `Layout.TreeSplit`
- Emits typed domain data or fails fast
- UI remains unaware of transport, caching, or validation

Phase ladder (locked):
- Phase 2: data in, no selection
- Phase 3: selection contract (`path`, `onPathChange`) *only if Tree supports it*
- Phase 4: split ergonomics (persistence stays spec-only)

Non-goals (explicit):
- No schema validation in runtime
- No CRDT / Automerge
- No production persistence semantics
- No implicit contracts beyond props

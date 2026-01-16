## Phase 2: Data in (no selection) — LOCKED

Scope:
- Render Tree with real data.
- No selection.
- No loading logic in runtime.

Rules:
- Runtime UI remains pure.
- Spec adapts JSON → Tree root.
- No schema validation yet.
- No HTTP yet.

## Phase 2: Data in (no selection) — Lock

Context inputs:
1. We have a real sample JSON file in `src/ui/Layout.TreeSplit/-spec/-sample/slug-tree.*.json`.
2. That JSON originates from `deploy/@tdb.edu.slug/src/m.compiler/slug.SlugTree` and has a schema there.
3. We will need a loader for it, but Phase 2 can treat loading as spec-only and minimal (read JSON → parse).
4. A future selection path will be `t.ObjectPath`, but Phase 2 must be derived from the *actual* `Tree.Index` public prop/types surface.

Phase 2 objective:
- Render `Tree.Index` with *real data* (from the sample JSON) in the spec, while keeping runtime UI pure and selection-free.

Phase 2 hard constraints:
- Runtime (`src/ui/Layout.TreeSplit/ui.tsx`) stays pure:
  - no LocalStorage
  - no Signals
  - no JSON loading
  - no selection/path wiring
- Spec does the adaptation:
  - load JSON sample
  - map JSON → Tree root shape
  - pass root into runtime
- Do not guess Tree props: read Tree public types first, then map.

Phase 2 required "types read" before any coding:
- Identify the public type for:
  - Tree node shape
  - Tree root prop name/type
  - minimal props required by `Tree.Index` (or `Tree.Index.View` if Index is not directly usable)

Phase 2 deliverables:
- Add a `root` prop to `LayoutTreeSplitProps` whose type is derived from Tree public types (no invented types).
- Update `ui.tsx` to render `Tree.Index` using `props.root ?? <empty-root>`.
- Update `-spec/-SPEC.tsx` to load the JSON sample and adapt it into that `root` type.
- Keep right pane as `children`/placeholder (unchanged).

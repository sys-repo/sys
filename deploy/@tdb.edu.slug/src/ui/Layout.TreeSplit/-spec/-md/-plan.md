# Plan: Layout.TreeSplit (Tree + SplitPane) → driven by slug-tree sample (spec-only)

Purpose:
- Build `ui/Layout.TreeSplit` as a **pure layout component** (Tree panel + right-hand subject region).
- Compose **existing primitives only**:
  - `Tree`
  - `SplitPane`
- Validate against a real `slug-tree.*.json` sample **in DevHarness only**.
- Keep runtime surface pure; all state, persistence, and experimentation stay in `-spec`.

-------------------------------------------------------------------------------

## Imports & composition (explicit)

Runtime composition **must import primitives via local common.ts**:

```ts
// ui/Layout.TreeSplit/common.ts
export { Tree, SplitPane } from '@sys/ui-react-components';
```

Rules:
- `ui.tsx` imports `Tree` and `SplitPane` **only from `./common.ts`**
- No deep or cross-module imports in the UI layer
- This keeps the module surface swappable and audit-friendly

-------------------------------------------------------------------------------

## House rules (canonical)

All phases must conform to:

```
-agent/ui-component/ui.component.shape.md
```

In particular:
- One `Color.theme(props.theme)` call per render
- No `LocalStorage.*` outside `-spec`
- Runtime owns **no domain state**
- Props-in → markup-out only

-------------------------------------------------------------------------------

## Scope

### In scope
- Runtime files:
  - `common.ts`
  - `t.ts`
  - `ui.tsx`
  - `mod.ts`
- Spec files:
  - `-spec/-SPEC.tsx`
  - `-spec/-SPEC.Debug.tsx` (optional)
  - `-spec/-sample/slug-tree.*.json`

### Out of scope (explicitly)
- Any changes to `@sys/tmpl`
- Any new Tree primitives
- CRDT / Automerge / persistence beyond spec
- Production storage or caching semantics

-------------------------------------------------------------------------------

## Runtime intent (frozen)

`Layout.TreeSplit` is:
- A **layout compositor**
- Not a tree controller
- Not a data adapter
- Not stateful

Runtime responsibilities:
- Arrange left/right regions using `SplitPane`
- Render `Tree` with externally-supplied props
- Render right-hand subject via `children` (or `subject` prop)

Everything else lives outside.

-------------------------------------------------------------------------------

## Spec responsibilities (DevHarness)

Spec is allowed to:
- Load real JSON from `-spec/-sample`
- Convert slug-tree → Tree props
- Own selection / expansion / debug state via Signals
- Persist debug knobs via LocalStorage

Spec is **not** allowed to:
- Leak persistence or Signals into runtime
- Introduce implicit contracts not expressed via props

-------------------------------------------------------------------------------

## Phased execution (one at a time)

### Phase A — Runtime skeleton only
- Compose `SplitPane + Tree + children`
- No slug-tree usage yet
- No Signals in runtime

Exit: renders empty Tree + subject slot in Harness

---

### Phase B — Spec loads real slug-tree JSON
- Spec reads sample JSON
- Adapts it into Tree props
- Renders Tree with real structure

Exit: Tree renders real hierarchy

---

### Phase C — Selection wiring (spec-only)
- Spec owns selected node state
- Pass callbacks + selection into Tree
- Right-hand subject reflects selection

Exit: clicking Tree updates subject panel

---

### Phase D — Split sizing & persistence (spec-only)
- Adjustable split width
- Persisted via LocalStorage in `-SPEC.Debug.tsx`

Exit: layout position survives reloads

-------------------------------------------------------------------------------

## Open questions (to resolve before Phase A)
- Slot naming:
  - `children` vs `subject`
- Exact `Tree.Index` prop contract:
  - nodes shape
  - selection API
  - callbacks

We resolve these by reading Tree’s `t.ts`, then freeze Phase A.


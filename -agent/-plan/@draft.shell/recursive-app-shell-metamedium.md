# ui.app-shell — Design Riff

Shared design canvas · Phil · Claude · Codex.
A living riff, not a PLAN and not canon — a central share so we hammer one document
instead of pasting between threads. Distilled snapshot of the current shared picture.
Edit in place: promote settled calls into "Locked", append new questions to "Open edges".

---

## The idea (one line)

A recursive, late-bound composition **metamedium** for app navigation: a small YAML/TypeBox
tree, file-served and Cell-composed, projected into props that render pure `@sys` components —
layer upon layer.

## Settled substrate (do not re-derive)

- **Files<T>** — bounded, transport-independent Cmd grammar (`list / stat / read / write /
  remove / watch / manifest`). Location is transparent; capability + fidelity are advertised
  facts read at the boundary.
- **Cmd algebra** rides any endpoint; WebSocket is one transport adapter, in-process is another.
- **`@sys/cell`** composes services; `--mode` picks the fidelity point (dev live ↔ frozen static)
  and that decision resolves *at the Cell* — it never leaks upward.
- The UI reads capabilities and renders. It never asks where bytes live or whether it is ws/local.
- Treat all of the above as a black box. If a design move starts dragging "how does the data
  get here" upward, that is the smell → push it back down.

## Current reality checkpoint

- `<AppShell>` remains the current UI component name, but the durable root concept is trending toward
  **Shell**. Do not prematurely rename the component until the structure contract earns it.
- The authored document concept is **ShellStructure** for now, because the code lives in
  `deploy/@draft.shell/src/m.shell.structure/`. Do not pretend a broader `Shell.Structure` root
  exists until a real `m.shell/` surface exists.
- `ShellStructure` is pure source: schema/parse/resolve contracts only. It is not FS-, WS-, server-,
  or Cell-specific.
- Authored/sample YAML belongs under `deploy/@draft.shell/-sample/`.
- Delivery is currently expected to use Files-over-WebSocket, but that is a substrate detail below
  the structure concept: `Files.Client.websocket(...)` reads/watches the YAML; it does not name the
  structure.
- Minimal pipeline:
  ```text
  ShellStructure YAML/unknown
    → ShellStructure.Schema
    → ShellStructure.parse
    → ShellStructure.resolve
    → <AppShell> props for now
    → later Shell.View when earned
  ```
- Current source skeleton:
  ```text
  deploy/@draft.shell/src/m.shell.structure/
    common.ts
    mod.ts
    t.ts
    m.Schema/{ common.ts, mod.ts, t.ts }
    m.Parse/{ common.ts, mod.ts, t.ts }
    m.Resolve/{ common.ts, mod.ts, t.ts }
  ```
- `m.Parse` is the ingress boundary: YAML/text/unknown input becomes a typed ShellStructure document
  with schema-backed error shaping.
- `m.Resolve` is the semantic boundary: a valid authored document becomes the canonical/defaulted
  structure that downstream render adapters consume. It may be identity at first, but the seam is
  load-bearing.

## Immediate design goal

Get the smallest correct shape in place before implementing behavior.

- Lay out the pure `ShellStructure` source skeleton first.
- Keep authored YAML samples separate under `deploy/@draft.shell/-sample/`.
- Define the public type surface before implementation.
- Prove only the minimal seam: authored document → schema → parse → resolve.
- Do not add FS/WS/loading code inside `m.shell.structure`.
- Do not over-model nodes, projection, slots, relations, host/environment semantics, or `<AppShell>`
  prop mapping yet.

## Locked

- **Shell is a tree.** The OS window is the given stage, not an authored node.
- **The sidebar is the root node.** It embodies the window; the OS chrome (traffic lights) sits
  inside its header region. The chrome is OS-managed — the node reserves safe-area, does not draw it.
- **A child App Surface slides over-left and occludes the sidebar.** The show/hide toggle lives in
  the sidebar header and drives this. The parent→child edge is **(b): owned + occludes** — a
  relation *between layers*, not visual nesting/clipping.
- **Component internals are the component's concern.** header / body / footer, chrome-inset, tray,
  placement → owned by the slotted principled `@sys` component, NOT modeled in the schema.
- **Node kernel = `{ kind, props, children }`.** `kind` = which `@sys` component fills the layer;
  `props` = the object declared into it; `children` = nested layers. Variety lives in *which
  component* + *what props*, never in the schema growing node kinds.
- **Projection:** YAML (TypeBox-validated) → `{props}` → pure component → render, down the tree,
  layer upon layer. Files delivers the YAML; props are just data. React stays a thin adapter;
  state/controllers live outside React.

## Two cuts that keep it from collapsing

- **Environmental vs compositional concern.**
  - *Environmental* (owned once at a host, ambient down-tree): bounded stage, sheet stack,
    overlay/occlusion, error catching, lifecycle/disposal, theme. A node *requests* these; it
    never reimplements them. One owner per side-effect domain.
  - *Compositional* (local to each node): its children, props, and how its subtree divides.
  - **Recursion is the punchline:** any node can itself become a host — stand up a fresh env for
    its own subtree. "Env" is a capability, not a top-level singleton. Each sub-component is its
    own composition controller and a potential little world. Objects all the way down.

- **Power / floor — the anti-tar-pit DX guarantee.**
  - Don't constrain: any component, unbounded recursion, controller autonomy, own-env — all opt-in.
  - Default hard: a node declaring only `{ kind, props }` inherits sane host behavior and the
    common shell shape for free.
  - The complexity tax is paid only when reaching for power, never to clear the floor.
  - "Simple things simple, complex things possible" stated as a DX contract.

## Open edges (next to land)

1. **Env-host contract** — what affordances a host advertises, how a node requests them, how a
   node becomes a host. (One of the two first-to-lock.)
2. **Relation: schema-field or component-prop?** Is the inter-layer slide/occlude a node field, or
   just props into a Sheet-like Surface component? Occlusion is genuinely *relational between two
   layers* — the one thing a child cannot fully own alone.
3. **Multi-slot authoring** — how authored content reaches a component's named regions
   (header / body / footer): named slots, props, or children carrying a slot hint.
4. **Nav-spine source** — is the nav tree authored YAML, a projection of a Files `list`/`manifest`,
   or both expressed through one dialect? (Raised early; still open.)

## First two to lock

1. The recursive **node kernel** — `{ kind, props, children }` plus whatever the relation/env
   contract turns out to need.
2. The **env-host contract**.

Lock these two and "layer upon layer" becomes turning a crank, not solving a new problem each time.

## Repo primitives in play (compose, do not reinvent)

`Tree.Index` (YAML → TreeNodeList dialect, RFC6901 keys, path-as-truth) ·
`Sheet` (`Left:Right` slide/occlude, `Signals.stack`) ·
`SplitPane` (recursive N-pane) ·
`Cropmarks` (bounded, overflow-clipped stage) ·
`ErrorBoundary` ·
`@sys/schema:typebox` for the schema spine.

## Lineage

Kay (metamedium; simple things simple, complex things possible; late binding) ·
Engelbart (the nav surface is a tool-for-thought) ·
Hickey (simple > easy; keep the kernel untangled) ·
Plan 9 / 9P (one uniform namespace — config and content read through the same pipe) ·
Tuftean restraint.

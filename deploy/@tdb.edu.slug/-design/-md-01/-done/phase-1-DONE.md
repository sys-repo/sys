Module: deploy/@tdb.edu.slug/
Target: src/ui/Layout.TreeSplit

Phase 1 (layout only):
- Implement a pure layout component that composes SplitPane (2 panes).
- Left pane renders Tree.Index with an empty root for now (no JSON, no Signals).
- Right pane renders props.children (or a simple placeholder if children is undefined).
- Follow -agent/ui-component/ui.component.shape.md.
- Use Color.theme(props.theme) exactly once per render.
- No LocalStorage usage outside -spec (and in this phase, none at all).
- Do not introduce Signals or state. No selection wiring.

Edit only:
- t.ts (add children?: t.ReactNode)
- ui.tsx (layout composition)

Keep surrounding code/style consistent with the repo (imports from ./common.ts, css merge with props.style).

Guardrail:
- Do NOT invent/guess Tree.Index props. Keep it minimal: root={[]} only.

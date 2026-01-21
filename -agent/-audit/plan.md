# Codex Plan: Type TreeHost tree/value (keep TreeView.Index generic).
This change makes `TreeHost.Data.findViewNode(tree, path)` return a node whose `.value` is typed as `t.SlugTreeItem`, without changing `@sys/ui-react-components` TreeView types.

## Goal
TreeView.Index remains a generic tree UI with `t.TreeViewNode.value: unknown`.
TreeHost becomes the typed domain boundary:
- TreeHost tree nodes: `value?: t.SlugTreeItem`
- TreeHost events: `node.value` is strongly typed.

## Constraints
- No behavior changes.
- No new runtime logic.
- Keep TreeView.Index API as-is.
- Minimal edits, compilation green.

## Files to edit (in @tdb/edu-slug)
- src/ui/ui.TreeHost/t.ts
- src/ui/ui.TreeHost/t.data.ts
- src/ui/ui.TreeHost/u.data.findViewNode.ts
- src/ui/ui.TreeHost/ui.slot.Tree.tsx
- (optional if referenced) any TreeHost spec files that import types indirectly

## Step 1: Add TreeHost-typed view node aliases
Edit: src/ui/ui.TreeHost/t.ts
- Introduce TreeHost-specific aliases that re-use the upstream TreeView shape but specialize `.value`.

Add near the top (after exports is fine):

- `export type TreeHostViewNode = Omit<t.TreeViewNode, 'value' | 'children'> & { readonly value?: t.SlugTreeItem; readonly children?: TreeHostViewNodeList };`
- `export type TreeHostViewNodeList = readonly TreeHostViewNode[];`

Notes:
- Use `Omit` to keep all existing fields of `t.TreeViewNode` intact.
- Re-define `children` so recursion also uses the typed node.

## Step 2: Switch TreeHostProps.tree to the typed list
Edit: src/ui/ui.TreeHost/t.ts
- Change:
  - `tree?: t.TreeViewNodeList;`
  - → `tree?: t.TreeHostViewNodeList;`

## Step 3: Switch TreeHost event payloads to typed nodes
Edit: src/ui/ui.TreeHost/t.ts
- Change in payloads:
  - `TreeHostPathChange.tree: t.TreeViewNodeList`
  - → `TreeHostPathChange.tree: t.TreeHostViewNodeList`
  - `TreeHostNodeSelect.tree: t.TreeViewNodeList`
  - → `TreeHostNodeSelect.tree: t.TreeHostViewNodeList`
  - `TreeHostNodeSelect.node: t.TreeViewNode`
  - → `TreeHostNodeSelect.node: t.TreeHostViewNode`

Keep:
- `path: t.ObjectPath`
- `is: { readonly leaf: boolean }` unchanged.

## Step 4: Update TreeHostDataLib signatures
Edit: src/ui/ui.TreeHost/t.data.ts
- Change return/arg types to the typed list/node:
  - `fromSlugTree(...) => t.TreeViewNodeList`
  - → `fromSlugTree(...) => t.TreeHostViewNodeList`
  - `findViewNode(tree: t.TreeViewNodeList | undefined, ...) => t.TreeViewNode | undefined`
  - → `findViewNode(tree: t.TreeHostViewNodeList | undefined, ...) => t.TreeHostViewNode | undefined`

Keep `findNode` untouched (it returns `t.SlugTreeItem` from `t.SlugTreeItems` already).

## Step 5: Update findViewNode implementation to return typed node
Edit: src/ui/ui.TreeHost/u.data.findViewNode.ts
- Update parameter/stack types:
  - `tree` arg type becomes `t.TreeHostViewNodeList | undefined` via the lib signature.
  - `const stack: t.TreeViewNode[] = [...tree];`
    → `const stack: t.TreeHostViewNode[] = [...tree];`
  - `while` loop `node` type becomes `t.TreeHostViewNode`.

No logic changes.

## Step 6: Update Tree slot component typing (no runtime change)
Edit: src/ui/ui.TreeHost/ui.slot.Tree.tsx
- Ensure `tree` is treated as `t.TreeHostViewNodeList` (it will be via props).
- Leave the `<TreeView.Index.UI ... />` call alone.
- In `onNodeSelect`, keep piping through but make node typed:

Current shape (already close):
- `props.onNodeSelect?.({ tree, path, node: e.node, is: e.is });`

Change only the `node` assignment to use TreeHost’s typed node resolved by path (so it is guaranteed typed, not `t.TreeViewNode`):

- `const viewNode = TreeHost.Data.findViewNode(tree, path);`
- If `viewNode` exists, pass it as `node`.

Concrete rule:
- Do not cast with `as`.
- Use the existing pure helper to “upgrade” the node to typed:

Pseudo:
- `const path = e.path ?? [];`
- `const node = TreeHost.Data.findViewNode(tree, path);`
- `if (node) props.onNodeSelect?.({ tree, path, node, is: e.is });`

This keeps behavior identical but ensures event payload is typed.

## Step 7: Fix any compile fallout in specs/usages
- Search for `TreeHostProps['tree']` usage or direct `t.TreeViewNodeList` annotations in TreeHost specs.
- Adjust any explicit annotations to `t.TreeHostViewNodeList` if needed.
- Do not change runtime logic.

## Step 8: Validate
Run in relevant packages:
- deno task check
- deno task test

## Success criteria
- `TreeHost.Data.findViewNode(tree, path)?.value` is typed:
  - `t.SlugTreeItem | undefined`
- In dev harness, after selection:
  - `const node = TreeHost.Data.findViewNode(tree, path);`
  - `node?.value.ref` is available only after narrowing to `SlugTreeItemRefOnly`.

## Suggested commit message
refactor(TreeHost): type TreeHost view nodes to SlugTreeItem value

import { type t, Arr, Is, Obj } from '../common.ts';

/**
 * TreeView path lookup (pure); returns the matching TreeViewNode.
 * - `tree` is the UI tree shape (TreeHostViewNodeList).
 * - `path` is the canonical selection path (array of segments).
 */
export const findViewNode: t.TreeHostDataLib['findViewNode'] = (tree, path) => {
  if (!Arr.isArray(tree) || tree.length === 0) return undefined;
  if (!Arr.isArray(path) || path.length === 0) return undefined;
  if (!path.every((seg) => Is.str(seg) && seg.length > 0)) return undefined;

  const stack: t.TreeHostViewNode[] = [...tree];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if (Obj.Path.eql(node.path, path)) return node;

    const children = node.children;
    if (Arr.isArray(children) && children.length > 0) {
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]!);
    }
  }

  return undefined;
};

import { type t } from './common.ts';

/**
 * Determine if the node is bearing child nodes.
 */
export const hasChildren = (n: t.TreeNode) => !!(n.children && n.children.length > 0);

/**
 * Walk the tree to the children at `path` ('' = root level).
 */
export function at(list: t.TreeNodeList, path: t.ObjectPath): t.TreeNodeList {
  if (!path || path.length === 0) return list;
  let curr = list;
  for (const seg of path) {
    const next = curr.find((n) => {
      const tail = n.path[n.path.length - 1]; // canonical segment (id if present)
      const id = typeof n.meta?.id === 'string' ? n.meta.id : undefined;
      const label = typeof n.label === 'string' ? n.label : undefined;
      return seg === tail || (id && seg === id) || (label && seg === label);
    });
    if (!next || !next.children) return [];
    curr = next.children;
  }
  return curr;
}

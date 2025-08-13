import type { t } from './common.ts';

import { Is } from './m.Is.ts';
import { Yaml } from './m.Yaml.ts';
import { lastSeg, toPathParts } from './u.ts';

type D = t.IndexTreeDataLib;

/**
 * Coerce a `root` into a `TreeNodeList`.
 */
const toList: D['toList'] = (root) => {
  if (!root) return [];
  if (Is.list(root)) return root; // ← narrowed to TreeNodeList.
  return root.children ?? [root]; // ← narrowed to TreeNode.
};

/**
 * Determine if the node is bearing child nodes.
 */
export const hasChildren: D['hasChildren'] = (n) => !!(n.children && n.children.length > 0);

/**
 * Get children at a path ('', 'a/b/c', or ['a','b','c']).
 * Path segments match either the literal segment or an `id` override from `meta.id`.
 */
const at: D['at'] = (root, path) => {
  const parts = toPathParts(path);
  if (parts.length === 0) return root;

  let list: t.TreeNodeList = root;
  for (const seg of parts) {
    const next = list.find((n) => {
      const tail = lastSeg(n.key);
      const id = typeof n.meta?.id === 'string' ? (n.meta.id as string) : undefined;
      return seg === tail || (id && seg === id);
    });
    if (!next || !next.children) return [];
    list = next.children;
  }
  return list;
};

/**
 * Find a node by exact `key` (full path) or by predicate.
 */
export const find: D['find'] = (root, keyOr) => {
  const pred =
    typeof keyOr === 'string' ? ({ node }: { node: t.TreeNode }) => node.key === keyOr : keyOr;

  const visit = (list: t.TreeNodeList, parents: readonly t.TreeNode[]): t.TreeNode | undefined => {
    for (const node of list) {
      if (pred({ node, parents })) return node;
      if (node.children) {
        const hit = visit(node.children, [...parents, node]);
        if (hit) return hit;
      }
    }
    return undefined;
  };

  return visit(root, []);
};

/**
 * API:
 */
export const Data = {
  Is,
  Yaml,
  at,
  find,
  toList,
  hasChildren,
} as const satisfies t.IndexTreeDataLib;

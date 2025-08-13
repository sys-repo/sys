import type { t } from './common.ts';
import { lastSeg, toPathParts } from './m.Yaml.u.ts';

const at: t.IndexTreeDataLib['at'] = (root, path) => {
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

export const find: t.IndexTreeDataLib['find'] = (root, keyOr) => {
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

export const Data = {
  at,
  find,
} as const satisfies t.IndexTreeDataLib;

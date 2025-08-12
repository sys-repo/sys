import { type t } from './common.ts';

export const find: t.IndexTreeYamlLib['find'] = (root, keyOr) => {
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

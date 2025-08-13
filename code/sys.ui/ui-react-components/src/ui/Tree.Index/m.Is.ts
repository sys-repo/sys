import type { t } from './common.ts';

export const Is = {
  list(x: t.TreeNode | t.TreeNodeList): x is t.TreeNodeList {
    return Array.isArray(x);
  },

  node(x: t.TreeNode | t.TreeNodeList): x is t.TreeNode {
    return !!x && !Array.isArray(x);
  },
} as const satisfies t.IndexTreeIsLib;

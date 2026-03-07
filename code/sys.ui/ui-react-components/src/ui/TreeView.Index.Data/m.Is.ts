import type { t } from './common.ts';

export const Is: t.IndexTreeViewIsLib = {
  list(x: t.TreeViewNode | t.TreeViewNodeList): x is t.TreeViewNodeList {
    return Array.isArray(x);
  },

  node(x: t.TreeViewNode | t.TreeViewNodeList): x is t.TreeViewNode {
    return !!x && !Array.isArray(x);
  },
};

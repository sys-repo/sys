import type { t } from './common.ts';
import { Is } from './m.Is.ts';

export const toList: t.IndexTreeLib['toList'] = (root) => {
  if (!root) return [];
  if (Is.list(root)) return root; // ← narrowed to TreeNodeList.
  return root.children ?? [root]; // ← narrowed to TreeNode.
};

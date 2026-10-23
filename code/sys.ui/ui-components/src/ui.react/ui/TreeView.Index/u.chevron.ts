import { type t, Data } from './common.ts';

export const resolveShowChevron = (
  node: t.TreeViewNode,
  mode: t.IndexTreeViewChevronMode,
): boolean => {
  if (mode === 'always') return true;
  if (mode === 'never') return false;
  return Data.hasChildren(node);
};

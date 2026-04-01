import type { t } from './common.ts';

/** TreeHost view-node list. */
export type TreeHostViewNodeList = readonly TreeHostViewNode[];
/** Slug-aware TreeHost view node. */
export type TreeHostViewNode = Omit<t.TreeViewNode, 'value' | 'children'> & {
  readonly value?: t.SlugTreeItem;
  readonly children?: TreeHostViewNodeList;
};

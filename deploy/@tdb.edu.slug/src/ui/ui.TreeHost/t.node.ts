import type { t } from './common.ts';

export type TreeHostViewNodeList = readonly TreeHostViewNode[];
export type TreeHostViewNode = Omit<t.TreeViewNode, 'value' | 'children'> & {
  readonly value?: t.SlugTreeItem;
  readonly children?: TreeHostViewNodeList;
};

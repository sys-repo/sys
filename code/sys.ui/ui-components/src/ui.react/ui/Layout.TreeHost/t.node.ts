import type { t } from './common.ts';

/** Tree host node list. */
export type TreeHostViewNodeList = readonly TreeHostViewNode[];
/** Tree host node with optional view-local value and children. */
export type TreeHostViewNode = Omit<t.TreeViewNode, 'value' | 'children'> & {
  readonly value?: unknown;
  readonly children?: TreeHostViewNodeList;
};

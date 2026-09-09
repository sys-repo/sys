import type { t } from './common.ts';

import { IndexTreeViewItem } from '../TreeView.Index.Item/mod.ts';
import { Data } from './common.ts';
import { IndexTreeView as UI } from './ui.tsx';

/** Indexed tree-view renderer, item renderer, and data helpers. */
export const IndexTreeView: t.IndexTreeViewLib = {
  UI,
  Item: IndexTreeViewItem,
  Data,
};

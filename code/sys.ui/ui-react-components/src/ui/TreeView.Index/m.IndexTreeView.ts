import type { t } from './common.ts';

import { IndexTreeViewItem } from '../TreeView.Index.Item/mod.ts';
import { Data } from './common.ts';
import { IndexTreeView as View } from './ui.tsx';

export const IndexTreeView: t.IndexTreeViewLib = {
  View,
  Item: { View: IndexTreeViewItem },
  Data,
};

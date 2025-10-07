import type { t } from './common.ts';

import { IndexTreeItem } from '../Tree.Index.Item/mod.ts';

import { Data } from './common.ts';
import { IndexTree as View } from './ui.tsx';

export const IndexTree: t.IndexTreeLib = {
  View,
  Item: { View: IndexTreeItem },
  Data,
};

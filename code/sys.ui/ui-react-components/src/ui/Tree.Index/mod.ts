/**
 * A simple index tree.
 * @module
 */
import type { t } from './common.ts';

import { IndexItem } from '../Tree.Index.Item/mod.ts';
import { IndexTree as View } from './ui.tsx';

export const IndexTree: t.IndexTreeLib = {
  View,
  Item: { View: IndexItem },
};

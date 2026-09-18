/**
 * @module
 */
import type { t } from './common.ts';
import { Presets } from './u.presets.ts';
import { IndexTreeViewItem as UI } from './ui.tsx';

export const IndexTreeViewItem: t.IndexTreeViewItemLib = {
  UI,
  Presets,
};

export const Item: t.IndexTreeViewItemLib = IndexTreeViewItem;

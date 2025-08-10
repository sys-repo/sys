/**
 * A simple index tree.
 * @module
 */
import { IndexItem } from '../Tree.Index.Item/mod.ts';
import { type t } from './common.ts';
import { IndexTree as View } from './ui.tsx';

export const IndexTree: t.IndexTreeLib = {
  View,
  Item: { View: IndexItem },
};

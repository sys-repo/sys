/**
 * @module
 * Tree-split layout primitive with an associated pure data adapter surface.
 */
import type { t } from './common.ts';
import { Data } from './m.Data.ts';
import { LayoutTreeSplit as UI } from './ui.tsx';

export const LayoutTreeSplit: t.LayoutTreeSplitLib = {
  UI,
  Data,
};

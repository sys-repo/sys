/**
 * @module
 * Tree-split layout primitive with an associated pure data adapter surface.
 */
import type { t } from './common.ts';
import { Data } from './m.Data.ts';
import { TreeHost as UI } from './ui.tsx';

export const TreeHost: t.TreeHostLib = {
  UI,
  Data,
};

import type { t } from './common.ts';

export * from '../common.ts';
export { TooSmall } from '../ui.TooSmall/mod.ts';
export { LayoutHGrid } from '../ui.Layout.HGrid/mod.ts';

/**
 * Constants:
 */
const column: t.HGridColumn = {
  align: 'Center',
  width: 390,
};

export const DEFAULTS = { column } as const;
export const D = DEFAULTS;

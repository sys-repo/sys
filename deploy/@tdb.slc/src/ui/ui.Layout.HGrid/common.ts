import type { t } from './common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
type M = t.HGridColumn;

const column: Required<Omit<M, 'children'>> = {
  align: 'Center',
  width: 390,
};

export const DEFAULTS = { column, gap: 0 } as const;
export const D = DEFAULTS;

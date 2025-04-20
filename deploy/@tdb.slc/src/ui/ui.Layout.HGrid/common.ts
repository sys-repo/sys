import type { t } from './common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
type M = t.HGridColumn;

const column: Required<Omit<M, 'children'>> = {
  align: 'Center',
  width: 390,
  marginTop: 0,
  gap: 0,
};

export const DEFAULTS = { column } as const;
export const D = DEFAULTS;

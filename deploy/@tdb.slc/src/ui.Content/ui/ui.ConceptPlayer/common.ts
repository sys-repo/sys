import type { t } from './common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const column: t.HGridColumn = {
  align: 'Center',
  width: 390,
};

export const DEFAULTS = { column } as const;
export const D = DEFAULTS;

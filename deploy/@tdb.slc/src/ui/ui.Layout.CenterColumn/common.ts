import type { t } from './common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const center: t.CenterColumn = {
  align: 'Center',
  width: 390,
};

export const DEFAULTS = { center, gap: 0 } as const;
export const D = DEFAULTS;

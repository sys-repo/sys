import type { t } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
const width: t.PropListSize = { min: 230 };
export const DEFAULTS = {
  query: { dev: 'dev' },
  width,
} as const;

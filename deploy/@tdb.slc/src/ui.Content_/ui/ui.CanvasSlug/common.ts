import type { t } from './common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const logo: t.LogoKind = 'SLC';

export const DEFAULTS = {
  logo,
} as const;
export const D = DEFAULTS;

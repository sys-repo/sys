import { type t } from './common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const direction: t.SheetDirection = 'Bottom:Up';

export const DEFAULTS = {
  radius: 4,
  duration: 0.25,
  bounce: 0.2,
  direction,
} as const;

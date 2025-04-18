import { type t } from './common.ts';
export * from '../common.ts';

/**
 * Constants:
 */

export const DEFAULTS = {
  radius: 4,
  duration: 0.25,
  bounce: 0.2,
  shadowColor: -0.15,

  get orientation(): { all: t.SheetOrientation[]; default: t.SheetOrientation } {
    return {
      default: 'Bottom:Up',
      all: ['Bottom:Up', 'Top:Down', 'Left:Right', 'Right:Left'],
    };
  },
} as const;

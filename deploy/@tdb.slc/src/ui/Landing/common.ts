import { type t } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  get canvasPosition(): t.LandingCanvasPosition {
    return 'Center';
  },
} as const;

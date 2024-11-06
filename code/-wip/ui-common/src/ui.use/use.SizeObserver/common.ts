import type { t } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */

export const DEFAULTS = {
  get emptyRect(): t.DomRect {
    return { x: -1, y: -1, width: -1, height: -1, top: -1, right: -1, bottom: -1, left: -1 };
  },
} as const;

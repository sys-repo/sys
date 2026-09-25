import type { t } from '../common.ts';

export * from '../common.ts';

/**
 * Defaults:
 */
export const DEFAULTS = {
  trusted: ['@sys/'],
  services: {
    start: { timeout: 10_000 as t.Msecs },
  },
} as const;

export const D = DEFAULTS;

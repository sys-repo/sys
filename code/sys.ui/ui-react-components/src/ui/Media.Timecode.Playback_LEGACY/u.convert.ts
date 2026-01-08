import type { t } from './common.ts';

/**
 * Helpers: unit conversion.
 *
 * Law: Video signals stay in seconds; machine inputs/commands stay in msecs.
 * This module is the single conversion boundary.
 */
export const Convert = {
  toSecs(ms: t.Msecs): t.Secs {
    const n = Number(ms);
    const secs = Number.isFinite(n) ? n / 1000 : 0;
    return Math.max(0, secs) as t.Secs;
  },

  toMsecs(secs: t.Secs): t.Msecs {
    const n = Number(secs);
    const ms = Number.isFinite(n) ? Math.round(n * 1000) : 0;
    return Math.max(0, ms) as t.Msecs;
  },
} as const;

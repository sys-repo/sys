import type { t } from '../common.ts';
import { Is } from './Is.ts';

/**
 * Helpers
 */
export const Wrangle = {
  ctx(input: t.DevTools | t.DevCtx) {
    if (Is.ctx(input)) return input;
    if (Is.dev(input)) return input.ctx;
    return;
  },
} as const;

/**
 * @module
 * Cell-compatible lifecycle service endpoint for Vite.
 */
import type { t } from './common.ts';
import { startDev } from './u.dev.ts';

/** Cell-compatible lifecycle service endpoint for Vite dev. */
export const ViteService: t.ViteService.Lib = {
  start(args) {
    return startDev(args);
  },
};

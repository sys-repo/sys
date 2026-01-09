import type { t } from './common.ts';
import { preload } from './u.preload.ts';

/**
 * Small, pure preloader for warming HTTP cache/network only.
 */
export const Preload: t.HttpPreloadLib = {
  preload,
};

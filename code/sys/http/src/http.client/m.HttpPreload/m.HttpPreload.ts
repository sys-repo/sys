import type { t } from './common.ts';
import { warm } from './u.warm.ts';

/**
 * Small, pure preloader for warming HTTP cache/network only.
 */
export const Preload: t.HttpPreloadLib = {
  warm,
};

/**
 * @module
 * Small, composable helpers for function calls.
 */
import type { t } from './common.ts';
import { onceOnly } from './u.once.ts';

/**
 * Small, composable helpers for function calls.
 */
export const Fn: t.FnLib = {
  onceOnly,
};

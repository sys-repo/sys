import type { t } from '../common.ts';
import type { retry } from '@std/async';

/**
 * Utilities for asynchronous operations.
 */
export type AsyncLib = {
  delay: t.TimeLib['delay'];
  retry: typeof retry;
};

import type { t } from '../common.ts';

import { retry } from '@std/async';
import { Time } from '../m.DateTime/mod.ts';

/**
 * Utilities for asynchronous operations.
 */
export const Async: t.AsyncLib = {
  delay: Time.delay,
  retry,
};

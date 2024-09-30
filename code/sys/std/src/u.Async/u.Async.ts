import type { t } from '../common.ts';

import { retry } from '@std/async';
import { Time } from '../u.Time/mod.ts';

/**
 * Utilities for asynchronous operations.
 */
export const Async: t.AsyncLib = {
  delay: Time.delay,
  retry,
};

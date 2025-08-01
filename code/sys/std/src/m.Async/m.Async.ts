import type { AsyncLib } from './t.ts';

import { retry } from '@std/async';
import { Time } from '../m.DateTime/mod.ts';

/**
 * Utilities for asynchronous operations.
 */
export const Async: AsyncLib = {
  delay: Time.delay,
  retry,
};

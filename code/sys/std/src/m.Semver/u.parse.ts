import { parse as base } from '@std/semver';

import type { t } from './common.ts';
import { stripPrefix } from './u.ts';

export const parse: t.SemverLib['parse'] = (value) => {
  if (is.empty(value)) value = '0.0.0';
  value = stripPrefix(value.trim());
  return base(value);
};

/**
 * Helpers
 */
const is = {
  empty(input?: string) {
    if (typeof input !== 'string') return true;
    return input.trim() === '';
  },
} as const;

import { parse as base } from '@std/semver';

import type { t } from './common.ts';
import { stripPrefix } from './u.prefix.ts';

export const parse: t.SemverLib['parse'] = (input) => {
  if (is.empty(input)) input = '0.0.0';
  input = stripPrefix(input.trim());
  return base(input);
};

/**
 * Helpers
 */
const is = {
  empty(input?: string) {
    return typeof input !== 'string' ? true : input.trim() === '';
  },
} as const;

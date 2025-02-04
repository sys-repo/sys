import { parse as base } from '@std/semver';

import type { t } from './common.ts';
import { Prefix } from './m.Prefix.ts';

export const parse: t.SemverLib['parse'] = (input) => {
  if (is.empty(input)) input = '0.0.0';
  return base(Prefix.strip(input));
};

/**
 * Helpers
 */
const is = {
  empty(input?: string) {
    return typeof input !== 'string' ? true : input.trim() === '';
  },
} as const;

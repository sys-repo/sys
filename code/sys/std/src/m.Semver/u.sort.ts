import { compare } from '@std/semver';

import type { t } from './common.ts';
import { parse } from './u.parse.ts';

/**
 * Sort a list of versions.
 */
export const sort: t.SemverLib['sort'] = (input, opt) => {
  const { order = 'desc' } = wrangle.options(opt);
  const sorted = [...input].sort((inputA, inputB) => {
    const a = wrangle.semver(inputA);
    const b = wrangle.semver(inputB);
    return order === 'asc' ? compare(a, b) : compare(b, a);
  });
  return sorted as any; // NB: type hack (overridden method response).
};

/**
 * Helpers
 */
const wrangle = {
  semver(input: t.StringSemver | t.SemVer): t.SemVer {
    return typeof input === 'string' ? parse(input) : input;
  },

  options(input?: t.SemverSortOptionsInput): t.SemverSortOptions {
    if (!input) return {};
    if (typeof input === 'string') {
      if (input === 'asc' || input === 'desc') return { order: input };
      return {};
    }
    return input;
  },
} as const;

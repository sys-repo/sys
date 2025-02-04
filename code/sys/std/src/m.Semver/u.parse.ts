import { parse as base } from '@std/semver';
import { type t } from './common.ts';

export const parse: t.SemverLib['parse'] = (value) => {
  if (is.empty(value)) value = '0.0.0';
  value = stripPrefix(value.trim());
  return base(value);
};

/**
 * Helpers
 */
function stripPrefix(version: string): string {
  return version.replace(/^(~|\^|=|>=|<=|>|<|\*|x|\d+x|\d+\.\d+x|\d+\.\d+\.\dx)?\s*/, '');
}

const is = {
  empty(input?: string) {
    if (typeof input !== 'string') return true;
    return input.trim() === '';
  },
} as const;

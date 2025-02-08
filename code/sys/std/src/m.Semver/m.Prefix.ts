import { type t } from './common.ts';

const REGEX = /^(~|\^|=|>=|<=|>|<|\*|x|\d+x|\d+\.\d+x|\d+\.\d+\.\dx)?\s*/;

export const Prefix: t.SemverPrefixLib = {
  get(input) {
    if (typeof input !== 'string') return '';
    input = input.trim();
    const match = input.match(REGEX);
    return match?.[1] || '';
  },

  strip(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(REGEX, '');
  },
};

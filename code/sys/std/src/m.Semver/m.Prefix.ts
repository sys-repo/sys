import { type t } from './common.ts';

const REGEX = /^(~|\^|=|>=|<=|>|<|\*|x|\d+x|\d+\.\d+x|\d+\.\d+\.\dx)?\s*/;

export const Prefix: t.SemverPrefixLib = {
  strip(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(REGEX, '');
  },
};

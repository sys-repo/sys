import { type t } from './common.ts';

export function stripPrefix(input: t.StringSemver): t.StringSemver {
  if (typeof input !== 'string') return '';
  input = input.trim();
  return input.replace(/^(~|\^|=|>=|<=|>|<|\*|x|\d+x|\d+\.\d+x|\d+\.\d+\.\dx)?\s*/, '');
}

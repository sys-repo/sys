import { Is, type t } from './common.ts';

const UNSAFE_TEXT = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u;
const ABSENT = Object.freeze({ kind: 'absent' } as const);
const INVALID = Object.freeze({ kind: 'invalid' } as const);

/**
 * Canonical package-subpath parsing.
 */
export const Subpath: t.Pkg.Subpath.Lib = Object.freeze({
  parse(input) {
    if (input === undefined) return ABSENT;
    if (!Is.str(input) || UNSAFE_TEXT.test(input)) return INVALID;

    const value = input.trim().split('/').filter((part) => part.length > 0).join('/');
    return value ? Object.freeze({ kind: 'valid', value } as const) : ABSENT;
  },
});

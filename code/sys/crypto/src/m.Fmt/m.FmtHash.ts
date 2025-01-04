import { type t, c, Hash } from './common.ts';

export const FmtHash: t.FmtHashLib = {
  digest(input, options = {}) {
    if (!input) return '';

    const { length = 5 } = options;
    const hash = Hash.toString(input);

    const algo = Hash.prefix(hash);
    const short = Hash.shorten(hash, length, true);
    const endHash = `#${short.slice(-length)}`;
    const uri = `${'digest'}:${algo}:${c.green(endHash)}`;

    return c.gray(uri);
  },
};

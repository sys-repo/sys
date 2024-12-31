import { type t, c } from './common.ts';
import { Hash } from '../u.Hash/mod.ts';

export const Console: t.HashConsoleLib = {
  digest(input, options = {}) {
    if (!input) return '';

    const { length = 6 } = options;
    const hash = Hash.toString(input);

    const algo = Hash.prefix(hash);
    const short = Hash.shorten(hash, length, true);
    const endHash = `#${short.slice(-length)}`;
    const uri = `${'digest'}:${algo}:${c.green(endHash)}`;

    return c.gray(uri);
  },
};

import { type t, c, Hash } from './common.ts';

export const Console: t.HashConsoleLib = {
  digest(input, options = {}) {
    if (!input) return '';

    const { length = 4 } = options;
    const hash = Hash.toString(input);

    const algo = Hash.prefix(hash);
    const short = Hash.shorten(hash, length, true);
    const endHash = `#${short.slice(-length)}`;
    const uri = `${c.green('digest')}:${algo}:${c.green(endHash)}`;

    return c.gray(uri);
  },
};

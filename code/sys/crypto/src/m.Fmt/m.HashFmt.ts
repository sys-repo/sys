import { type t, c, Hash } from './common.ts';

export const HashFmt: t.HashFmtLib = {
  digest(input, options = {}) {
    if (!input) return '';

    const { length = 5 } = options;
    const hash = Hash.toString(input);

    const algo = Hash.prefix(hash);
    const short = Hash.shorten(hash, length, true);
    const endHash = `#${short.slice(-length)}`;

    let uri = `digest`;
    if (options.algo ?? true) uri += `:${algo}`;
    uri += `:${c.green(endHash)}`;

    return c.gray(uri);
  },
};

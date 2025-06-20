import { c, Hash } from './common.ts';
import type { HashFmtLib } from './t.ts';

export const HashFmt: HashFmtLib = {
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

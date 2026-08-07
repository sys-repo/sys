import { c, Hash, Is, type t, Text } from './common.ts';

/** Hash formatting helpers for terminal output. */
export const HashFmt: t.HashFmt.Lib = {
  digest(input, options = {}) {
    if (!input) return '';

    const { length = 5 } = options;
    const hash = Hash.toString(input);
    const algo = Hash.prefix(hash);
    const short = Hash.shorten(hash, length, true);
    const endHash = `#${short.slice(-length)}`;
    const includeAlgo = options.algo ?? true;
    const primary = includeAlgo ? `digest:${algo}:${endHash}` : `digest:${endHash}`;
    const candidates = includeAlgo ? [primary, `${algo}:${endHash}`, endHash] : [primary, endHash];
    const maxWidth = Is.num(options.maxWidth)
      ? Math.max(0, Math.floor(options.maxWidth))
      : undefined;
    const uri = maxWidth === undefined
      ? primary
      : candidates.find((candidate) => Text.Width.measure(candidate) <= maxWidth) ?? '';
    if (!uri) return '';

    const hashIndex = uri.lastIndexOf('#');
    return `${c.gray(uri.slice(0, hashIndex))}${c.green(uri.slice(hashIndex))}`;
  },
};

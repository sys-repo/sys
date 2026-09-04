import { c, Fmt, Hash, Is, type t, Text } from './common.ts';

/** Hash formatting helpers for terminal output. */
export const HashFmt: t.HashFmt.Lib = Object.freeze({
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
    const arrow = options.arrow ? `${c.green('←')} ` : '';
    const arrowWidth = Text.Width.measure(arrow);
    const maxWidth = Is.num(options.maxWidth)
      ? Math.max(0, Math.floor(options.maxWidth) - arrowWidth)
      : undefined;
    const uri = maxWidth === undefined
      ? primary
      : candidates.find((candidate) => Text.Width.measure(candidate) <= maxWidth) ?? '';
    if (!uri) return '';

    const hashIndex = uri.lastIndexOf('#');
    const digest = `${c.gray(uri.slice(0, hashIndex))}${c.green(uri.slice(hashIndex))}`;
    const value = options.url ? Fmt.hyperlink(digest, options.url) : digest;
    return `${arrow}${value}`;
  },
});

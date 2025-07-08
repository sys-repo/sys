import { type t, Hash, Str } from './common.ts';

/**
 * Display formatter:
 */
export const Fmt = {
  files(filemap: t.BinaryFileMap = {}) {
    if (!filemap) return [];
    return Object.entries(filemap).map(([hash, f]) => {
      return {
        name: f.name,
        type: f.type,
        size: Str.bytes(f.bytes.length),
        hash: Hash.shorten(f.hash, [12, 5]),
      };
    });
  },
};

import { type t, Hash, Str } from './common.ts';

type BinaryFileFormatted = {
  name: string;
  type: string;
  size: string;
  hash: string;
};

/**
 * Display formatter:
 */
export const Fmt = {
  file(f: t.BinaryFile.File): BinaryFileFormatted {
    return {
      name: f.name,
      type: f.type,
      size: Str.bytes(f.bytes.length),
      hash: Hash.shorten(f.hash ?? '', [12, 8]),
    };
  },

  toFileList(filemap: t.BinaryFile.Map = {}) {
    if (!filemap) return [];
    return Object.values(filemap).map((f) => Fmt.file(f));
  },

  fileMap(filemap: t.BinaryFile.Map = {}) {
    const res: Record<string, BinaryFileFormatted> = {};
    Object.entries(filemap).forEach(([key, f]) => {
      const hash = Hash.shorten(key, [0, 5]);
      res[hash] = Fmt.file(f);
    });
    return res;
  },
};

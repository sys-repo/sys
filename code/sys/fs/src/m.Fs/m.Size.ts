import { type t, exists, Str, walk } from './common.ts';

export const Size: t.Fs.SizeLib = {
  async dir(path, options = {}) {
    const res: t.Fs.DirSize = {
      path,
      exists: await exists(path),
      total: { files: 0, bytes: 0 },
      toString(options) {
        return Str.bytes(res.total.bytes, options);
      },
    };
    if (!res.exists) return res;

    const maxDepth = options.maxDepth ?? Infinity;
    for await (const entry of walk(path, { includeDirs: false, maxDepth })) {
      if (!entry.isFile) continue;
      const stats = await Deno.stat(entry.path);
      res.total.bytes += stats.size;
      res.total.files += 1;
    }
    return res;
  },
};

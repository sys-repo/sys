import { type t, exists, Str, walk } from './common.ts';
import type { FsSizeLib } from './t.ts';

export const Size: FsSizeLib = {
  async dir(path, options = {}) {
    const res: t.FsDirSize = {
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

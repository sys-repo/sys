import { exists } from '@std/fs';
import { format } from '@std/fmt/bytes';
import { walk } from './u.walk.ts';

import type { t } from './common.ts';

export const Size: t.FsSizeLib = {
  async dir(path, options = {}) {
    const res: t.FsDirSize = {
      path,
      exists: await exists(path),
      total: { files: 0, bytes: 0 },
      toString(options) {
        return format(res.total.bytes, options);
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

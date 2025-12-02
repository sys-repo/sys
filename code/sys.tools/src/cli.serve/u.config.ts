import type { t } from './common.ts';
import { getConfig as get } from './u.config.get.ts';
import { MutateConfig as Mutate } from './u.config.mutate.ts';

export * from './u.config.get.ts';
export * from './u.config.normalize.ts';

export const Config = {
  Mutate,
  get,
  findLocation(config: t.ServeTool.Config, dir: t.StringDir) {
    return (config.current.dirs ?? []).find((m) => m.dir === dir);
  },
  findBundle(config: t.ServeTool.Config, locationDir: t.StringDir, distUrl: t.StringUrl) {
    const loc = Config.findLocation(config, locationDir);
    return (loc?.remoteBundles ?? []).find((m) => m.remote.dist === distUrl);
  },
} as const;

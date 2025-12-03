import type { t } from './common.ts';
import { getConfig as get } from './u.config.get.ts';
import { MutateConfig as Mutate } from './u.config.mutate.ts';

export * from './u.config.get.ts';
export * from './u.config.normalize.ts';

export const Config = {
  Mutate,
  get,

  /**
   * Lookup a remote bundle mounted under a given serve-location.
   */
  findLocation(config: t.ServeTool.Config, dir: t.StringDir) {
    return (config.current.dirs ?? []).find((m) => m.dir === dir);
  },

  /**
   * Find a bundle within a location.
   * Identity can be:
   *   - legacy: by distUrl only (if localDir is omitted)
   *   - new:    by (distUrl + localDir) when both provided
   */
  findBundle(
    config: t.ServeTool.Config,
    locationDir: t.StringDir,
    distUrl: t.StringUrl,
    localDir?: t.StringRelativeDir,
  ) {
    const loc = Config.findLocation(config, locationDir);
    const bundles = loc?.remoteBundles ?? [];

    if (localDir === undefined) {
      // Back-compat: first match on dist only.
      return bundles.find((m) => m.remote.dist === distUrl);
    }

    // New identity: (dist + localDir).
    return bundles.find((m) => m.remote.dist === distUrl && m.local.dir === localDir);
  },
} as const;

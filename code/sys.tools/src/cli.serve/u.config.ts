import { type t, Config as Base } from './common.ts';
import { getConfig as get } from './u.config.get.ts';
import { MutateConfig as Mutate } from './u.config.mutate.ts';
import { normalize } from './u.config.normalize.ts';

export * from './u.config.get.ts';
export { normalize };

/**
 * Config file namespace.
 */
export const Config = {
  ...Base,

  Mutate,
  normalize,
  get,

  /**
   * Lookup a remote bundle mounted under a given serve-location.
   */
  findLocation(config: t.ServeTool.ConfigDoc, dir: t.StringDir) {
    return (config.dirs ?? []).find((m) => m.dir === dir);
  },

  /**
   * Find a bundle within a location.
   * Identity can be:
   *   - legacy: by distUrl only (if localDir is omitted)
   *   - new:    by (distUrl + localDir) when both provided
   */
  findBundle(
    config: t.ServeTool.ConfigDoc,
    locationDir: t.StringDir,
    localDir?: t.StringRelativeDir,
  ) {
    if (!localDir) return;
    const loc = Config.findLocation(config, locationDir);
    const bundles = loc?.remoteBundles ?? [];
    localDir = localDir.replace(/^\/+/, '');
    return bundles.find((m) => m.local.dir === localDir);
  },
} as const;

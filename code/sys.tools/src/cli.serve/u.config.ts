import { type t, Config as Base } from './common.ts';
import { get } from './u.config.get.ts';
import { MutateConfig as Mutate } from './u.config.mutate.ts';
import {
  normalize,
  resolveDir,
  toStoredDir,
  absKey,
  normalizeLocalDir,
} from './u.config.normalize.ts';

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

  resolveDir,
  toStoredDir,
  absKey,
  normalizeLocalDir,

  /**
   * Lookup a serve-location by its stored key.
   * Callers should pass the stored `dir` value ('.' or relative when inside cwd).
   */
  findLocation(config: t.ServeTool.Config.Doc, dir: t.StringDir) {
    return (config.dirs ?? []).find((m) => m.dir === dir);
  },

  /**
   * Find a bundle within a location by local.dir identity.
   * Requires the stored location key.
   */
  findBundle(
    config: t.ServeTool.Config.Doc,
    locationDir: t.StringDir,
    localDir?: t.StringRelativeDir,
  ) {
    if (!localDir) return;
    const loc = Config.findLocation(config, locationDir);
    const bundles = loc?.remoteBundles ?? [];
    const local = normalizeLocalDir(localDir);
    return bundles.find((m) => normalizeLocalDir(m.local.dir) === local);
  },
} as const;

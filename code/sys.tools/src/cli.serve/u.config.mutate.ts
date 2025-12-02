import { type t } from './common.ts';

type Draft = t.ServeTool.ConfigDoc;

/**
 * Mutation helpers (pass a mutation `draft` object).
 */
export const MutateConfig = {
  /**
   * Retrieve (or prepare to create) a directory entry inside the Serve config.
   */
  getLocation(d: Draft, locationDir: t.StringDir) {
    const locations = d.dirs || (d.dirs = []);
    const index = locations.findIndex((item) => item.dir === locationDir);
    const exists = index > -1;
    const location = exists ? locations[index] : undefined;
    return { exists, index, locations, location };
  },

  /**
   * Ensure a remote-bundle entry exists or create it.
   * Returns clean bundle-centric handles (no redundant prefixes).
   */
  getRemoteBundle(d: Draft, locationDir: t.StringDir, distUrl: t.StringUrl) {
    const loc = MutateConfig.getLocation(d, locationDir);

    // No location defined → return clean empty structure.
    if (!loc.location) {
      return {
        bundle: undefined,
        exists: false,
        index: -1,
        bundles: undefined as t.ServeTool.DirBundleConfig[] | undefined,
        location: loc,
      };
    }

    const bundles = loc.location.remoteBundles || (loc.location.remoteBundles = []);
    const index = bundles.findIndex((b) => b.remote.dist === distUrl);
    let bundle: t.ServeTool.DirBundleConfig | undefined;
    const exists = index > -1;

    if (exists) {
      bundle = bundles[index]!;
    } else {
      bundle = { remote: { dist: distUrl }, local: { dir: '' } };
      bundles.push(bundle);
    }

    return {
      bundle,
      exists,
      index: exists ? index : bundles.length - 1,
      bundles,
      get location() {
        return loc;
      },
    };
  },
} as const;

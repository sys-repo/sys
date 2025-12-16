import { type t } from './common.ts';
import { absKey, resolveDir, normalizeLocalDir } from './u.config.normalize.ts';

type Draft = t.ServeTool.ConfigDoc;

type MutateGetLocationResult = {
  readonly exists: boolean;
  readonly index: number;
  readonly locations: t.ServeTool.DirConfig[];
  readonly location: t.ServeTool.DirConfig | undefined;
};

type MutateGetRemoteBundleResult = {
  readonly bundle: t.ServeTool.DirRemoteBundle | undefined;
  readonly exists: boolean;
  readonly index: number;
  readonly bundles: t.ServeTool.DirRemoteBundle[] | undefined;
  readonly location: MutateGetLocationResult;
};

/**
 * Mutation helpers (pass a mutation `draft` object).
 * All identity operations require `cwd` explicitly (portable configs).
 */
export const MutateConfig = {
  /**
   * Retrieve a directory entry inside the Serve config.
   *
   * Identity rule:
   *   - Locations are compared by resolved absolute path.
   *   - Storage format (relative vs absolute) is NOT identity.
   */
  getLocation(d: Draft, cwd: t.StringDir, locationDir: t.StringDir): MutateGetLocationResult {
    const locations = d.dirs || (d.dirs = []);

    const targetAbs = absKey(resolveDir(cwd, locationDir));

    const index = locations.findIndex((item) => absKey(resolveDir(cwd, item.dir)) === targetAbs);
    const exists = index > -1;
    const location = exists ? locations[index] : undefined;

    return { exists, index, locations, location };
  },

  /**
   * Ensure a remote-bundle entry exists or create it.
   * Identity is a pair: (remote.dist + local.dir) for a given resolved location.
   */
  getRemoteBundle(
    d: Draft,
    cwd: t.StringDir,
    locationDir: t.StringDir,
    distUrl: t.StringUrl,
    localDir: t.StringRelativeDir,
  ): MutateGetRemoteBundleResult {
    const loc = MutateConfig.getLocation(d, cwd, locationDir);

    // No location defined → return clean empty structure (caller decides how to handle).
    if (!loc.location) {
      return {
        bundle: undefined,
        exists: false,
        index: -1,
        bundles: undefined,
        location: loc,
      };
    }

    const bundles = loc.location.remoteBundles || (loc.location.remoteBundles = []);
    const local = normalizeLocalDir(localDir);
    const index = bundles.findIndex((m) => m.remote.dist === distUrl && m.local.dir === local);

    const exists = index > -1;
    let bundle: t.ServeTool.DirRemoteBundle | undefined;

    if (exists) {
      bundle = bundles[index]!;
    } else {
      bundle = { local: { dir: local }, remote: { dist: distUrl } };
      bundles.push(bundle);
    }

    return {
      bundle,
      exists,
      index: exists ? index : bundles.length - 1,
      bundles,
      location: loc,
    };
  },
} as const;

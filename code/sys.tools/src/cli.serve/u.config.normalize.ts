import { type t } from './common.ts';

export async function normalize(config: t.ServeTool.Config) {
  const current = config.current;

  /**
   * Migration:Add: missing app-bundle logs
   *    config/[dirs]/[remoteBundles]/log
   */
  const hasMissingBundleLogs = (current.dirs ?? []).some((dir) =>
    (dir.remoteBundles ?? []).some((bundle) => bundle.log == null),
  );
  if (hasMissingBundleLogs) {
    config.change((d) => {
      const dirs = d.dirs || (d.dirs = []);
      dirs.forEach((dir) => {
        const bundles = dir.remoteBundles || (dir.remoteBundles = []);
        bundles
          .filter((bundle) => bundle.log == null)
          .forEach((bundle) => (bundle.log = { pulls: [] }));
      });
    });
  }

  /** Save if changed */
  if (config.fs.pending) await config.fs.save();
}

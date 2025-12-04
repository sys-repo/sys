import type { t } from '../common.ts';

/** Result from a bundle-pull operation */
export type PullBundleResult = t.HttpPullToDirResult & { dist: t.DistPkg };

/** Details of a remote-bundle pull operations */
export type DirPullBundleLogEntry = {
  kind: t.ServeTool.Command;
  time: t.UnixTimestamp;
  digest: t.StringHash;
  pkg: t.Pkg;
  size: { total: t.NumberBytes; pkg: t.NumberBytes };
};

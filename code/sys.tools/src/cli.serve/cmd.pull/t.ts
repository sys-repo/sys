import type { t } from '../common.ts';

/** Result from a bundle-pull operation */
export type PullBundleResult = t.HttpPullToDirResult & { dist: t.DistPkg };

import type { t } from '../common.ts';

/** Result from a bundle-pull operation */
export type PullToolBundleResult = t.HttpPullToDirResult & { dist: t.DistPkg };

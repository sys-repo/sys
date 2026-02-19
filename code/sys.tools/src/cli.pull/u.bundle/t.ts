import type { t } from '../common.ts';

/** Result from a bundle-pull operation */
export type PullToolBundleResult = t.HttpPullToDirResult & { dist: t.DistPkg };

export type PullToolRemoteBundleResult =
  | { readonly ok: true; readonly data: PullToolBundleResult }
  | { readonly ok: false; readonly error: string };

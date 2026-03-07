import type { t } from '../common.ts';

export type PullToolBundleSummaryMeta =
  | { readonly kind: 'http'; readonly source: t.StringUrl }
  | { readonly kind: 'github:release'; readonly repo: string; readonly release: string };

/** Result from a bundle-pull operation */
export type PullToolBundleResult = t.HttpPullToDirResult & {
  dist?: t.DistPkg;
  dists?: readonly t.DistPkg[];
  summary?: PullToolBundleSummaryMeta;
};

export type PullToolRemoteBundleResult =
  | { readonly ok: true; readonly data: PullToolBundleResult }
  | { readonly ok: false; readonly error: string };

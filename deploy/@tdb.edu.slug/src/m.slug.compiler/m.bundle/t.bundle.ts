import type { t } from './common.ts';

/**
 * CRDT document graph (DAG).
 */
export type BundleDagObject = Record<string, unknown>;
export type BundleCmdClient = t.Crdt.Cmd.Client;

/**
 * Configuration Profile
 */
export type BundleBase = {
  readonly enabled?: boolean;
};

export type BundleConfig =
  | (BundleBase & t.SlugBundleFileTree & { readonly kind: 'slug-tree:fs' })
  | (BundleBase & t.SlugBundleMediaSeq & { readonly kind: 'slug-tree:media:seq' });

export type BundleKind = BundleConfig['kind'];

export type BundleProfile = {
  readonly bundles: readonly BundleConfig[];
};

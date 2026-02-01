import type { t } from './common.ts';
import type { SlugBundleMediaSeq } from './t.bundle.seq.ts';
import type { SlugBundleFileTree } from './t.bundle.tree.ts';

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
  | (BundleBase & SlugBundleFileTree & { readonly kind: 'slug-tree:fs' })
  | (BundleBase & SlugBundleMediaSeq & { readonly kind: 'slug-tree:media:seq' });

export type BundleKind = BundleConfig['kind'];

export type BundleProfile = {
  readonly bundles: readonly BundleConfig[];
};

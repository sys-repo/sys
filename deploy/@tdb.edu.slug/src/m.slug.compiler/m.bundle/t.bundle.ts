import type { t } from './common.ts';

/**
 * CRDT document graph (DAG).
 */
export type BundleDagObject = Record<string, unknown>;
/** Command runner passed into bundle workflows. */
export type BundleCmdClient = t.Crdt.Cmd.Client;

/**
 * Configuration Profile
 */
export type BundleBase = {
  readonly enabled?: boolean;
};

/** Single bundle configuration entry. */
export type BundleConfig =
  | (BundleBase & t.SlugBundleFileTree & { readonly kind: 'slug-tree:fs' })
  | (BundleBase & t.SlugBundleMediaSeq & { readonly kind: 'slug-tree:media:seq' });

/** Bundle configuration discriminator. */
export type BundleKind = BundleConfig['kind'];

/** Bundle profile document. */
export type BundleProfile = {
  readonly bundles: readonly BundleConfig[];
};

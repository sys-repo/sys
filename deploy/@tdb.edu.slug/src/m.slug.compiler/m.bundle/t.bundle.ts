import type { t } from './common.ts';
import type { SlugBundleMediaSeq } from './t.bundle.seq.ts';
import type { SlugBundleSlugTreeFs } from './t.bundle.tree.ts';

/**
 * CRDT document graph (DAG).
 */
export type BundleDagObject = Record<string, unknown>;
export type BundleCmdClient = t.Crdt.Cmd.Client;

/**
 * Configuration Profile
 */
export type BundleKind = BundleConfig['kind'];

export type BundleConfig =
  | (SlugBundleSlugTreeFs & { readonly kind: 'slug-tree:fs' })
  | (SlugBundleMediaSeq & { readonly kind: 'slug-tree:media:seq' });

export type BundleProfile = {
  readonly bundles: readonly BundleConfig[];
};

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
export type BundleProfile = {
  readonly 'bundle:slug-tree:fs'?: SlugBundleSlugTreeFs;
  readonly 'bundle:slug-tree:media:seq'?: SlugBundleMediaSeq;
};

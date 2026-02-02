import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.core.ts';
export type * from './kind.tree.fs/t.ts';
export type * from './kind.tree.media.seq/t.ts';

export type BundleDescriptorSchemaLib = {
  readonly Schema: t.TSchema;
  readonly ItemSchema: t.TSchema;
};

export type BundleDescriptor = t.BundleDescriptorSlugTreeFs | t.BundleDescriptorSlugTreeMediaSeq;
export type BundleDescriptorDoc = {
  readonly bundles: readonly BundleDescriptor[];
};

export type BundleDescriptorKind =
  | t.BundleDescriptorSlugTreeFs['kind']
  | t.BundleDescriptorSlugTreeMediaSeq['kind'];

export type BundleDescriptorAssetKind =
  | t.BundleDescriptorSlugTreeFsAssetKind
  | t.BundleDescriptorSlugTreeMediaSeqAssetKind;

export type BundleDescriptorAssetKindMap = {
  'slug-tree:fs': t.BundleDescriptorSlugTreeFsAssetKind;
  'slug-tree:media:seq': t.BundleDescriptorSlugTreeMediaSeqAssetKind;
};

import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.core.ts';
export type * from './kind.tree.fs/t.ts';
export type * from './kind.tree.media.seq/t.ts';

/** Schema helpers for bundle descriptors. */
export type BundleDescriptorSchemaLib = {
  readonly Schema: t.TSchema;
  readonly ItemSchema: t.TSchema;
};

/** Union of supported bundle descriptor shapes. */
export type BundleDescriptor = t.BundleDescriptorSlugTreeFs | t.BundleDescriptorSlugTreeMediaSeq;
/** Bundle-descriptor document wrapper. */
export type BundleDescriptorDoc = {
  readonly bundles: readonly BundleDescriptor[];
};

/** Discriminant union of bundle descriptor kinds. */
export type BundleDescriptorKind =
  | t.BundleDescriptorSlugTreeFs['kind']
  | t.BundleDescriptorSlugTreeMediaSeq['kind'];

/** Union of supported bundle asset-kind values. */
export type BundleDescriptorAssetKind =
  | t.BundleDescriptorSlugTreeFsAssetKind
  | t.BundleDescriptorSlugTreeMediaSeqAssetKind;

/** Map from bundle kind to its asset-kind union. */
export type BundleDescriptorAssetKindMap = {
  'slug-tree:fs': t.BundleDescriptorSlugTreeFsAssetKind;
  'slug-tree:media:seq': t.BundleDescriptorSlugTreeMediaSeqAssetKind;
};

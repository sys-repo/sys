import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.core.ts';
export type * from './kind.tree.fs/t.ts';
export type * from './kind.tree.media.seq/t.ts';

export type BundleDescriptor = t.BundleDescriptorSlugTreeFs | t.BundleDescriptorSlugTreeMediaSeq;
export type BundleDescriptorDoc = {
  readonly bundles: readonly BundleDescriptor[];
};

export type BundleDescriptorKind =
  | t.BundleDescriptorSlugTreeFs['kind']
  | t.BundleDescriptorSlugTreeMediaSeq['kind'];

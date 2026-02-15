import type { t } from './common.ts';
import type { BundleDescriptorBase } from '../t.core.ts';

/** Asset-kind union for slug-tree media sequence bundles. */
export type BundleDescriptorSlugTreeMediaSeqAssetKind = 'video' | 'image';

/** Bundle descriptor for slug-tree media sequence layouts. */
export type BundleDescriptorSlugTreeMediaSeq = BundleDescriptorBase & {
  readonly kind: 'slug-tree:media:seq';
  readonly layout?: {
    readonly manifestsDir?: t.StringDir;
    readonly mediaDirs?: {
      readonly video?: t.StringDir;
      readonly image?: t.StringDir;
    };
    readonly shard?: {
      readonly video?: {
        readonly strategy: 'prefix-range';
        readonly total: number;
      };
      readonly image?: {
        readonly strategy: 'prefix-range';
        readonly total: number;
      };
    };
  };
  readonly files?: {
    readonly assets?: t.StringPath;
    readonly playback?: t.StringPath;
    readonly tree?: t.StringPath;
  };
};

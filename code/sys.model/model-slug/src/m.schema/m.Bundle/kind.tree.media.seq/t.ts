import type { t } from './common.ts';
import type { BundleDescriptorBase } from '../t.core.ts';

export type BundleDescriptorSlugTreeMediaSeq = BundleDescriptorBase & {
  readonly kind: 'slug-tree:media:seq';
  readonly layout?: {
    readonly manifestsDir?: t.StringDir;
    readonly mediaDirs?: {
      readonly video?: t.StringDir;
      readonly image?: t.StringDir;
    };
  };
  readonly files?: {
    readonly assets?: t.StringPath;
    readonly playback?: t.StringPath;
    readonly tree?: t.StringPath;
  };
};

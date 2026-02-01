import type { t } from './common.ts';
import type { BundleDescriptorBase } from '../t.core.ts';

export type BundleDescriptorSlugTreeFs = BundleDescriptorBase & {
  readonly kind: 'slug-tree:fs';
  readonly layout?: {
    readonly manifestsDir?: t.StringDir;
    readonly contentDir?: t.StringDir;
  };
  readonly files?: {
    readonly tree?: t.StringPath;
    readonly index?: t.StringPath;
  };
};

import { type t } from './common.ts';

export const TARGETS: Record<t.BundleDescriptorKind, t.SlugClientLoaderDescriptorTarget> = {
  'slug-tree:fs': {
    kind: 'slug-tree:fs',
    descriptorPath: 'kb/-manifests',
    basePath: 'kb/-manifests',
  },
  'slug-tree:media:seq': {
    kind: 'slug-tree:media:seq',
    descriptorPath: 'program/-manifests',
    basePath: 'program',
  },
};

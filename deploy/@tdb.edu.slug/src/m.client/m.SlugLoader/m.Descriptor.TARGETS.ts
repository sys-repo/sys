import { type t } from './common.ts';

export const TARGETS: readonly t.SlugClientLoaderDescriptorTarget[] = [
  {
    id: 'fs:kb-manifests',
    kind: 'slug-tree:fs',
    descriptorPath: 'kb/-manifests',
    basePath: 'kb/-manifests',
  },
  {
    id: 'media:program',
    kind: 'slug-tree:media:seq',
    descriptorPath: 'program/-manifests',
    basePath: 'program',
  },
] as const;

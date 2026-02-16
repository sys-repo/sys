import { type t, SlugLoader } from './common.ts';

type TargetMap = Record<'file' | 'media', t.SlugLoaderDescriptorTarget>;

const TARGET: TargetMap = {
  file: {
    id: 'fs:kb-manifests',
    kind: 'slug-tree:fs',
    descriptorPath: 'kb/-manifests',
    basePath: 'kb/-manifests',
  },
  media: {
    id: 'media:program',
    kind: 'slug-tree:media:seq',
    descriptorPath: 'program/-manifests',
    basePath: 'program',
  },
};

export const DESCRIPTOR = {
  file: SlugLoader.DescriptorFactory.create(TARGET.file),
  media: SlugLoader.DescriptorFactory.create(TARGET.media),
} as const;

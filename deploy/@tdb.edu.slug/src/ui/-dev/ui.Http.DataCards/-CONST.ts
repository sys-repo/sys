import { type t, SlugLoader } from './common.ts';

type TargetMap = Record<'file' | 'media', t.SlugLoaderDescriptorTarget>;
const create = SlugLoader.DescriptorFactory.create;

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

const KINDS = [TARGET.file.kind, TARGET.media.kind] as const;
export const DESCRIPTOR = {
  KINDS,
  TARGET,

  file: create(TARGET.file),
  media: create(TARGET.media),

  resolve(kind: t.BundleDescriptorKind) {
    return kind === TARGET.media.kind ? DESCRIPTOR.media : DESCRIPTOR.file;
  },
} as const;

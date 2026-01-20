import { type t } from './common.ts';

export * from './slug.SlugTree/mod.ts';
export * from './slug.Traits/mod.ts';
export * from './slug.MediaComposition.Sequence/mod.ts';

import { SlugTreeSchema as Tree } from './slug.SlugTree/mod.ts';
import { ManifestSchema as Manifest } from './slug.Manifests/mod.ts';

export const SlugSchema: t.SlugSchemaLib = {
  Tree,
  Manifest,
};

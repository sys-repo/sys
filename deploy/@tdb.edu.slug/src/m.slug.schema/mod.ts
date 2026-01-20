import { type t } from './common.ts';

export * from './slug.SlugTree/mod.ts';
export * from './slug.Traits/mod.ts';
export * from './slug.MediaComposition.Sequence/mod.ts';

import { SlugTreeSchema } from './slug.SlugTree/mod.ts';

export const SlugSchema: t.SlugSchemaLib = {
  Tree: SlugTreeSchema,
};

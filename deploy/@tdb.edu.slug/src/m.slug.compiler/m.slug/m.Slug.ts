import { type t, SlugSchema } from './common.ts';

import { makeParser as parser } from '../m.resolve/mod.ts';
import { MediaComposition } from '../m.slug.MediaComposition/mod.ts';
import { SlugTree as Tree } from '../m.slug.SlugTree/mod.ts';

export const Slug: t.SlugLib = {
  parser,
  Schema: SlugSchema,
  Tree,
  Trait: {
    Helpers: SlugSchema.Traits,
    MediaComposition,
  },
};

import { type t, SlugSchema } from './common.ts';

import { makeParser as parser } from '../resolve/mod.ts';
import { MediaComposition } from '../slug.MediaComposition/mod.ts';
import { SlugTree as Tree } from '../slug.SlugTree/mod.ts';

export const Slug: t.SlugLib = {
  parser,
  Schema: SlugSchema,
  Tree,
  Trait: {
    Helpers: SlugSchema.Traits,
    MediaComposition,
  },
};

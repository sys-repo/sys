import { type t, Traits } from './common.ts';

import { SlugSchema as Schema } from '../../m.slug.schema/mod.ts';
import { makeParser as parser } from '../resolve/mod.ts';
import { MediaComposition } from '../slug.MediaComposition/mod.ts';
import { SlugTree as Tree } from '../slug.SlugTree/mod.ts';

export const Slug: t.SlugLib = {
  parser,
  Schema,
  Tree,
  Trait: {
    Helpers: Traits,
    MediaComposition,
  },
};

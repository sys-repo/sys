import { type t, Traits } from './common.ts';

import { makeParser as parser } from '../resolve/mod.ts';
import { MediaComposition } from '../slug.MediaComposition/mod.ts';
import { SlugTree } from '../slug.SlugTree/mod.ts';

export const Slug: t.SlugLib = {
  parser,
  Trait: {
    Helpers: Traits,
    MediaComposition,
  },
  Tree: SlugTree,
};

import type { t } from './common.ts';

import { makeParser as parser } from '../resolve/mod.ts';
import { MediaComposition } from '../slug.MediaComposition/mod.ts';

export const Slug: t.SlugLib = {
  parser,
  Trait: { MediaComposition },
};

import type { t } from './common.ts';

import { makeParser as parser } from '../resolve/mod.ts';
import { Sequence } from '../slug.MediaComposition.Sequence/mod.ts';
import { toPlayback } from './u.toPlayback.ts';
import { MediaComposition } from '../slug.MediaComposition/mod.ts';

export const Slug: t.SlugLib = {
  MediaComposition,
  Sequence,
  parser,
  toPlayback,
};

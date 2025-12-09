import type { t } from './common.ts';

import { makeParser as parser } from '../resolve/mod.ts';
import { Sequence } from '../slug.sequence/mod.ts';
import { toSlugPlaybackSpec as toPlayback } from './u.playback.ts';

export const Slug: t.SlugLib = {
  Sequence,
  parser,
  toPlayback,
};

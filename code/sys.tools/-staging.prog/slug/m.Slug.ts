import { makeParser as parser } from '../resolve/mod.ts';
import { Sequence } from '../slug.sequence/mod.ts';
import type { t } from './common.ts';

export const Slug: t.SlugLib = {
  Sequence,
  parser,
};

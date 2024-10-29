import { Hash as Base } from '@sys/std/hash';
import { Dir } from './m.Hash.Dir.ts';

import type { t } from './common.ts';

export const Hash: t.HashSLib = {
  ...Base,
  Dir,
};

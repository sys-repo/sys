import { Pkg as Base } from '@sys/std/pkg';
import { dist } from './u.fs.dist.ts';

import type { t } from './common.ts';

export const Pkg: t.PkgSLib = {
  ...Base,
  dist,
};

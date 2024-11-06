import { Pkg as Base } from '@sys/std/pkg';
import { Dist } from './m.Dist.ts';

import type { t } from './common.ts';

export const Pkg: t.PkgSLib = {
  ...Base,
  Dist,
};

import { Pkg as Base } from '@sys/std/pkg';
import { saveDist } from './u.saveDist.ts';

import type { t } from './common.ts';

export const Pkg: t.PkgSLib = {
  ...Base,
  saveDist,
};

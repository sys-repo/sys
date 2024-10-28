import type { t } from './common.ts';
import { Pkg as Base } from '@sys/std/pkg';
import { saveDist } from './u.save.ts';

export const Pkg: t.PkgSLib = {
  ...Base,
  saveDist,
};

import type { t } from './common.ts';
import { MonorepoCi as Ci } from './m.ci/mod.ts';
import { MonorepoPkg as Pkg } from './m.pkg/mod.ts';

export const Monorepo: t.Monorepo.Lib = { Ci, Pkg };

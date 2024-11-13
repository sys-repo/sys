import type { t } from './common.ts';
import { Env } from './m.Env.ts';
import { build } from './u.cmd.build.ts';
import { dev } from './u.cmd.dev.ts';

export const VitePress: t.VitePressLib = {
  dev,
  build,
  Env,
  init: Env.init,
};

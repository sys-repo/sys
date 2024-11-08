import type { t } from './common.ts';
import { dev } from './u.cmd.dev.ts';
import { build } from './u.cmd.build.ts';

export const VitePress: t.VitePressLib = {
  dev,
  build,
};

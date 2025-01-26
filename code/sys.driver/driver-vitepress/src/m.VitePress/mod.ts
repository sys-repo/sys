import type { t } from './common.ts';

import { Env } from '../m.Vitepress.Env/mod.ts';
import { build } from './u.cmd.build.ts';
import { dev } from './u.cmd.dev.ts';

/**
 * Tools for working with a VitePress project.
 */
export const VitePress: t.VitePressLib = {
  Env,
  dev,
  build,
};

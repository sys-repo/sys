import type { t } from './common.ts';

import { Cmd } from '../m.Cmd/mod.ts';
import { Env } from '../m.Env/mod.ts';
import { build } from './u.cmd.build.ts';
import { dev } from './u.cmd.dev.ts';

/**
 * Tools for working with a VitePress project.
 */
export const VitePress: t.VitePressLib = {
  Env,
  Cmd,
  dev,
  build,
};

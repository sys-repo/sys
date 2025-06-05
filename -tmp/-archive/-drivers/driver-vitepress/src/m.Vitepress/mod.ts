import type { VitepressLib } from './t.ts';

import { VitepressTmpl as Tmpl } from '../m.Vitepress.Tmpl/mod.ts';
import { backup } from './u.backup.ts';
import { build } from './u.build.ts';
import { dev } from './u.dev.ts';

/**
 * Tools for working with a VitePress project.
 */
export const Vitepress: VitepressLib = {
  Tmpl,
  dev,
  build,
  backup,
};

import type { t } from './common.ts';

import { VitepressTmpl as Tmpl } from '../m.Vitepress.Tmpl/mod.ts';
import { backup } from './u.backup.ts';
import { build } from './u.build.ts';
import { dev } from './u.dev.ts';

/**
 * Tools for working with a VitePress project.
 */
export const Vitepress: t.VitepressLib = {
  Tmpl,
  dev,
  build,
  backup,
};

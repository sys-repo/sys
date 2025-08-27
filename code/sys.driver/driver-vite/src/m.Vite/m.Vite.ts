import type { ViteLib } from './t.ts';

import { ViteTmpl as Tmpl } from '../m.tmpl/mod.ts';
import { ViteConfig as Config } from './common.ts';
import { backup } from './u.backup.ts';
import { build } from './u.build.ts';
import { dev } from './u.dev.ts';

/**
 * Tools for running Vite via commands issued to a child process.
 */
export const Vite: ViteLib = {
  Tmpl,
  Config,
  build,
  dev,
  backup,
} as const;

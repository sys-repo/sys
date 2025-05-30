import { ViteTmpl as Tmpl } from '../m.Vite.Tmpl/mod.ts';
import { ViteConfig as Config, type t } from './common.ts';
import { backup } from './u.backup.ts';
import { build } from './u.build.ts';
import { dev } from './u.dev.ts';

/**
 * Tools for running Vite via commands issued to a child process.
 */
export const Vite: t.ViteLib = {
  Tmpl,
  Config,
  build,
  dev,
  backup,
} as const;

import { Plugin } from '../m.Vite.Plugin/mod.ts';
import { ViteConfig as Config, type t } from './common.ts';
import { build } from './u.cmd.build.ts';
import { dev } from './u.cmd.dev.ts';

/**
 * Tools for running Vite via commands issued to a child process.
 */
export const Vite: t.ViteLib = {
  Config,
  Plugin,
  common: Plugin.common,
  build,
  dev,
} as const;

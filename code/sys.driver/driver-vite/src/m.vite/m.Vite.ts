import { type t, ViteConfig as Config } from './common.ts';
import { ViteStartup as Startup } from '../m.vite.startup/mod.ts';
import { build } from './u/u.build.ts';
import { dev } from './u/u.dev.ts';

/**
 * Tools for running Vite via commands issued to a child process.
 */
export const Vite: t.Vite.Lib = {
  Config,
  Startup,
  build,
  dev,
} as const;

/**
 * @module
 * The entry points, when using the module from the command-line [argv].
 */
import type { t } from './common.ts';

import { main } from './m.Entry.main.ts';
import { build } from './u.build.ts';
import { dev } from './u.dev.ts';
import { serve } from './u.serve.ts';

/** CLI entry helpers for dev, build, serve, and command dispatch. */
export const ViteEntry: t.ViteEntry.Lib = {
  main,
  dev,
  build,
  serve,
};

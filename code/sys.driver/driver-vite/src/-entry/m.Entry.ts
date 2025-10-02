/**
 * @module
 * The entry points, when using the module from the command-line [argv].
 */
import type { ViteEntryLib } from './t.ts';

import { main } from './m.Entry.main.ts';
import { build } from './u.build.ts';
import { dev } from './u.dev.ts';
import { serve } from './u.serve.ts';

export const ViteEntry: ViteEntryLib = {
  main,
  dev,
  build,
  serve,
};

/**
 * @module
 * The entry points, when using the module from the command-line [argv].
 */
import type { t } from './common.ts';
import { build, dev, serve } from './u.command/mod.ts';
import { main } from './m.Entry.main.ts';

/**
 * CLI entry helpers bound to the shared lazy command registry.
 */
export const ViteEntry: t.ViteEntry.Lib = { main, dev, build, serve };

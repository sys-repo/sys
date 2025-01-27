/**
 * @module
 * Start the live (HMR) dev server.
 * HMR: hot-module-reload
 *
 * ```bash
 * deno run jsr:@sys/driver-vite/build
 * ```
 */
import { type t, Args } from './common.ts';
import { ViteEntry } from './mod.ts';

const args = Args.parse<t.ViteEntryArgsBuild>(Deno.args);
await ViteEntry.build({ ...args, cmd: 'build' });
Deno.exit(0);

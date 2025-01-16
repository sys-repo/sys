/**
 * @module
 * Start the live (HMR) dev server.
 * HMR: hot-module-reload
 *
 * ```bash
 * deno run jsr:@sys/driver-vitepress/build
 * ```
 */
import { type t, Args } from './common.ts';
import { Entry } from './mod.ts';

const args = Args.parse<t.ViteEntryArgsBuild>(Deno.args);
await Entry.build({ ...args, cmd: 'build' });
Deno.exit(0);

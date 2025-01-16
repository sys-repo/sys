/**
 * @module
 * Start the live (HMR) dev server.
 * HMR: hot-module-reload
 *
 * ```bash
 * deno run jsr:@sys/driver-vite/dev
 * ```
 */
import { type t, Args } from './common.ts';
import { Entry } from './mod.ts';

const args = Args.parse<t.ViteEntryArgsDev>(Deno.args);
await Entry.dev({ ...args, cmd: 'dev' });
Deno.exit(0);

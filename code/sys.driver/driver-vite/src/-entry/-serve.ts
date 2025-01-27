/**
 * @module
 * Entry point for serving the build `/dist` folder
 * via a plain HTTP server.
 *
 * ```bash
 * deno run jsr:@sys/driver-vite/serve
 * ```
 */
import { type t, Args } from './common.ts';
import { ViteEntry } from './mod.ts';

const args = Args.parse<t.ViteEntryArgsServe>(Deno.args);
await ViteEntry.serve({ ...args, cmd: 'serve' });
Deno.exit(0);

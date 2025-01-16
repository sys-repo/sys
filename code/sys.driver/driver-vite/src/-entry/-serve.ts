/**
 * @module
 * Entry point for serving the build `/dist` folder
 * via a plain HTTP server.
 *
 * ```bash
 * deno run jsr:@sys/driver-vitepress/serve
 * ```
 */
import { type t, Args } from './common.ts';
import { Entry } from './mod.ts';

const args = Args.parse<t.EntryArgsServe>(Deno.args);
await Entry.serve({ ...args, cmd: 'serve' });
Deno.exit(0);

/**
 * Entry point for starting an HTTP server.
 * @module
 *
 * ```bash
 * deno run -RNE jsr:@sys/http/server/start
 * ```
 */
import { type t, Args, Str } from './common.ts';
import { Entry } from './mod.ts';

const args = Args.parse<t.HttpEntryArgsStart>(Deno.args);

console.info(Str.SPACE);
await Entry.start({ ...args, cmd: 'start' });
Deno.exit(0);

/**
 * @module
 * Entry point for starting an HTTP server.
 *
 * ```bash
 * deno run -NE --allow-run jsr:@sys/http/server/start
 * ```
 */
import { type t, Args } from './common.ts';
import { Entry } from './mod.ts';

const args = Args.parse<t.HttpEntryArgsStart>(Deno.args);
await Entry.start({ ...args, cmd: 'start' });
Deno.exit(0);

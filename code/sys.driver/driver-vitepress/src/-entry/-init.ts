/**
 * @module
 * Entry point for initializing from templates.
 *
 * ```bash
 * deno run -RWNE --allow-run jsr:@sys/driver-vitepress/init
 * ```
 */
import { type t, Args } from './common.ts';
import { VitepressEntry } from './mod.ts';

const args = Args.parse<t.VitepressEntryArgsInit>(Deno.args);
await VitepressEntry.main({ ...args, cmd: 'init' });
Deno.exit(0);

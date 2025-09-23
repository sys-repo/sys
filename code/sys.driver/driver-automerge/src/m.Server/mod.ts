/**
 * @module CRDT sync-server.
 */
import { type t, Args, Str } from './common.ts';
import { Server } from './m.Server.ts';

/**
 * Library:
 */
export { Server };

/**
 * @module
 * Command-line entrypoint for starting an HTTP server.
 *
 * ```bash
 * deno run jsr:@sys/driver-automerge/ws
 * deno run jsr:@sys/driver-automerge/ws --port=3030 --dir=.tmp/sync.crdt
 * deno run jsr:@sys/driver-automerge/ws  -p=3030     -d=.tmp/sync.crdt
 * ```
 */
if (import.meta.main) {
  const { port, dir } = Args.parse<t.SyncServerArgs>(Deno.args, {
    alias: { d: 'dir', p: 'port' },
    default: { port: 3030 },
  });

  console.info(Str.SPACE);
  await Server.ws({ port, dir });
}

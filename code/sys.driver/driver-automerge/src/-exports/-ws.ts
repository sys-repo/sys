/**
 * @module CRDT sync-server.
 */
import { Server } from '../m.Server/mod.ts';
import { type t, Args, Str } from './common.ts';

export * from '../m.Server/mod.ts';

/**
 * @module
 * Command-line entrypoint for starting an HTTP server.
 *
 * ```bash
 * deno run jsr:@sys/driver-automerge/ws
 * deno run jsr:@sys/driver-automerge/ws --port=3030 --dir=.tmp/sync.crdt --host=0.0.0.0
 * ```
 */
if (import.meta.main) {
  type A = t.SyncServerArgs;
  const { port, dir, host, silent } = Args.parse<A>(Deno.args, { default: { port: 3030 } });
  console.info(Str.SPACE);
  await Server.ws({ port, dir, host, silent });
}

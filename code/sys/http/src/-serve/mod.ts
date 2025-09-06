import { type t, Args, Str } from './common.ts';
import { start } from './u.start.ts';

/**
 * Library:
 */
export { start };

/**
 * Entry point for starting an HTTP server.
 * @module
 *
 * ```bash
 * deno run -RNE jsr:@sys/http/serve
 * deno run -RNE jsr:@sys/http/serve --port=1234 --dir=dist
 * ```
 */
if (import.meta.main) {
  const args = Args.parse<t.HttpServeInput>(Deno.args);
  console.info(Str.SPACE);
  await start(args);
  Deno.exit(0);
}

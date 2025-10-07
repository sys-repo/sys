/**
 * @module @sys/http/serve
 *
 * CLI entrypoint for starting an HTTP static file server.
 *
 * ```bash
 * deno run -RNE jsr:@sys/http/serve
 * deno run -RNE jsr:@sys/http/serve --port=1234 --dir=dist
 * ```
 */
import { type t, Args, Str } from './common.ts';
import { start } from './u.start.ts';

/**
 * Library:
 */
export { start };

/**
 * @module
 * Command-line entrypoint for starting an HTTP server.
 *
 * ```bash
 * deno run -RNE jsr:@sys/http/serve
 * deno run -RNE jsr:@sys/http/serve --port=1234 --dir=dist
 * ```
 */
if (import.meta.main) {
  const args = Args.parse<t.HttpServeArgs>(Deno.args);
  console.info(Str.SPACE);
  await start(args);
  Deno.exit(0);
}

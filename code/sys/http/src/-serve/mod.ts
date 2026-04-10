/**
 * @module
 * CLI entrypoint for starting an HTTP static file server.
 *
 * ```bash
 * deno run -RNE jsr:@sys/http/serve
 * deno run -RNE jsr:@sys/http/serve --port=1234 --dir=dist
 * deno run -RNE jsr:@sys/http/serve --no-interactive --dir=dist
 * ```
 */
import { parseArgs } from './u.args.ts';
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
 * deno run -RNE jsr:@sys/http/serve --no-interactive --dir=dist
 * ```
 */
if (import.meta.main) {
  const args = parseArgs(Deno.args);
  await start(args);
  Deno.exit(0);
}

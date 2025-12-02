/**
 * @module
 * CLI entrypoint for starting an HTTP static file server.
 *
 * ```bash
 * deno run -RNE jsr:@sys/http/serve
 * deno run -RNE jsr:@sys/http/serve --port=1234 --dir=dist
 * ```
 */
export * from '../-serve/mod.ts';

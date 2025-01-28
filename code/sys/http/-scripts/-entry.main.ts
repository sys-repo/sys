/**
 * Sample used to pass "deno task" commands to the entry point.
 *
 * @example
 * Invoked via deno run command:
 * ```bash
 *  deno run -NE jsr:@sys/http/server/start --port=1234
 * ```
 */
import '../src/-entry/-main.ts';

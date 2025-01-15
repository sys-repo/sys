/**
 * Sample pass-through from deno.json task.
 * In external usage of the module reference the module directly
 * by it's JSR address, eg:
 *
 * ```bash
 * deno run -RWNE --allow-run jsr:@sys/driver-vitepress/init
 * ```
 */
import '../src/-main/-init.ts';

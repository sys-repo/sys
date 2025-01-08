/**
 * Sample pass-through from deno.json task.
 * In external usage of the module reference the module directly
 * by it's JSR address, eg:
 *
 * ```json
 *  {
 *    "tasks": {
 *      "build": "deno run -RWE --allow-run jsr:@sys/main build"
 *    }
 *  }
 * ```
 */
import '../src/m.Cmd/-main.ts';

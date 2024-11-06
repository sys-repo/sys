/**
 * @module
 * Tools for terminal based CLI's (command-line-interfaces).
 *
 * @example
 * Display a CLI spinner:
 *
 * ```ts
 * import { Cli, Time } from '@sys/std-s';
 *
 * const spinner = Cli.spinner('My long running process...');
 *
 * await Time.wait(500);
 * spinner.text = 'Doing something else...';
 * await Time.wait(1000);
 *
 * spinner.succeed('Done!');
 * Deno.exit(0);
 * ```
 *
 * @example
 * Display details in a tabular layout:
 *
 * ```ts
 * import { Cli, Time } from '@sys/std-s';
 * import { Cli } from '@sys/std-s/cli';    // (alternative import path)
 *
 * const table = Cli.table(['Foo', 'Bar']).indent(2);
 * table.push();
 * table.push(['123456', 'abc']);
 * table.push(['333', 'Hello World 👋']);
 * table.render();
 * ```
 */
export { Cli } from './m.Cli.ts';
export { Format } from './m.Format.ts';

/**
 * @module
 * Tools for terminal based CLI's (command-line-interfaces).
 *
 * @example
 * Display a CLI spinner:
 *
 * ```ts
 * import { Time } from '@sys/std';
 * import { Cli } from '@sys/cli';
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
 * import { Cli } from '@sys/cli';
 * import { c } from '@sys/cli/fmt';
 *
 * const table = Cli.table(['Foo', 'Bar']).indent(2);
 * table.push();
 * table.push(['123456', 'abc']);
 * table.push(['333', c.green('Hello World 👋')]);
 * table.render();
 * ```
 */
import { Cli } from './m.Cli.ts';

export { c, stripAnsi } from './common.ts';
export { Format } from './m.Format.ts';
export { Keyboard } from './m.Keyboard.ts';
export { Prompt } from './m.Prompt.ts';
export { Spinner } from './m.Spinner.ts';
export { Table } from './m.Table.ts';

export { Cli };

export default Cli;

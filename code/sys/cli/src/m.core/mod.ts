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
import { Cli } from './m.Cli/mod.ts';

export { Args, c, Color, stripAnsi } from './common.ts';
export { Fmt } from './m.Fmt/mod.ts';
export { Keyboard } from './m.Keyboard/mod.ts';
export { Prompt } from './m.Prompt/mod.ts';
export { Spinner } from './m.Spinner/mod.ts';
export { Table } from './m.Table/mod.ts';

export { Cli };
export default Cli;

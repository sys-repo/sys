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
 * const spinner = Cli.spinner(Cli.Fmt.spinnerText('My long running process...'));
 *
 * await Time.wait(500);
 * spinner.text = Cli.Fmt.spinnerText('Doing something else...');
 * await Time.wait(1000);
 *
 * spinner.succeed(Cli.Fmt.spinnerText('Done!'));
 * Deno.exit(0);
 * ```
 *
 * @example
 * Create a dormant spinner instance:
 *
 * ```ts
 * import { Cli } from '@sys/cli';
 *
 * const spinner = Cli.Spinner.create(Cli.Fmt.spinnerText('Waiting...'));
 * spinner.start();
 * spinner.succeed(Cli.Fmt.spinnerText('Done!'));
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

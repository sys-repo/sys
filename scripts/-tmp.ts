import { Cli, Time } from '@sys/std-s';

/**
 * SAMPLE: Table
 */
const table = Cli.table(['Foo', 'Bar']).indent(2);
table.push();
table.push(['123456', 'abc']);
table.push(['333', 'Hello World 👋']);
table.render();
console.info();

/**
 * SAMPLE: Spinner
 */
const spinner = Cli.spinner('Processing...');
// spinner.start();

await Time.wait(500);
spinner.text = 'Doing something else...';
await Time.wait(1000);
spinner.succeed('Done!');

Deno.exit(0);

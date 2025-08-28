# Command Line Interface
Tools for working with a command-line interfaces (`cli`).

- Ansi colors
- Table formatting
- Prompting (user input)

### Example
```ts
import { Cli, c } from '@sys/cli';

/**
 * Ansi colors:
 */
console.info(c.cyan('using color'));

/**
 * string: plain → ansi → plain:
 */
const text = `thing ${c.green('with')} color`;
const stripped = Cli.stripAnsi(text);


/**
 * Table formatting:
 */
const table = Cli.table([]);
table.push(['foo', 'bar']);
console.info(table.toString().trim())


/**
 * Prompting:
 */
const dirname = await Cli.Prompt.Input.prompt({
  message: 'Folder Name',
  default: 'foo',
  // Keep folder-name simple + safe: letters, numbers, dot, dash, underscore, slashes (no spaces).
  validate: (v: string) =>
    /^[\w.\-\/]+$/.test(v) || 'Use letters, numbers, ".", "-", "_" (and optional "/")',
});
```

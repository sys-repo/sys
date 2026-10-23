# @sys/cli

Terminal input and output for Deno command-line applications.

The root `Cli` library provides tables, colors, spinners, and prompts. Focused entry points include:

- [`/fmt`](https://jsr.io/@sys/cli/doc/fmt): ANSI colors, text layout, and display formatting.
- [`/keyboard`](https://jsr.io/@sys/cli/doc/keyboard): keypress handling and bindings.
- [`/shell`](https://jsr.io/@sys/cli/doc/shell): plan PATH and alias changes without executing a
  shell.
- [`/testing`](https://jsr.io/@sys/cli/doc/testing): fake spinners and isolated select-prompt
  replacements.

## Format a table

```ts
import { Cli } from 'jsr:@sys/cli';
import { c } from 'jsr:@sys/cli/fmt';

const table = Cli.table([]);
table.push(['Package', 'Status']);
table.push(['example', c.green('ready')]);

console.info(table.toString().trim());
```

The example prints a table without waiting for input. Use `Cli.stripAnsi(text)` to remove terminal
control sequences when you need plain text.

Prompts and keyboard input are interactive. Keep them out of unattended runs unless you provide a
non-interactive alternative. For filesystem paths, check more than syntax: confirm containment
within the intended directory and the required access before use.

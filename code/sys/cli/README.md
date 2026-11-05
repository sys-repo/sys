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

## Keyboard ownership

`Keyboard.bind()` borrows terminal stdin, returning `undefined` when stdin fails the terminal check.
Disposal requests input shutdown without another keystroke. `await Keyboard.shutdown(handle)` waits
for native input release and that binding's callbacks. Never await it from the binding's own
callback: it would wait for itself.

Managed bindings share one input session: they compete for keys, and disposing one stops shared
input. Each handle owns its callback completion; await every active binding before handing input to
another API.

Raw Cliffy `Keyboard.keypress()` / `Cli.keypress()` remains unchanged and has a separate lifetime:
managed shutdown does not dispose raw owners. Finish raw input or prompts before starting managed
bindings, and await managed shutdown before switching back. Overlapping these APIs is unsupported.
Managed input never closes or destroys process-owned stdin.

`handle.finished` retains the original lifecycle outcome. After a release failure, another
`Keyboard.shutdown(handle)` retries and awaits release while preserving the original failure. A
rejected shutdown is not evidence of successful cleanup.

## Testing

From `code/sys/cli`, run `deno task test:keyboard:pty` for real terminal proofs outside ordinary
unit discovery. The lane requires `script` and `stty` and is skipped on Windows. Stop-only cases
check natural exit and child operation/resource leaks without subsequent input; separate cases check
callback completion, terminal state and sequential handoff.

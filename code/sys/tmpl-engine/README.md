# Template Engine
Tools for working with simple `filesystem` files as templates that can be copied, adjusted and/or updated into target projects.

## Programmatic usage
Preview the file operations (dry-run), print a table, then execute:

```ts
import { Tmpl } from '@sys/tmpl';
import { Fs } from '@sys/fs';

const run = async () => {
  // Source: a folder containing the template files.
  const source = './src/-tmpl/';

  // Target: current terminal working directory.
  const target = Fs.cwd('terminal');

  // 1) Preview (dry-run).
  const preview = await Tmpl.write(target, { source, dryRun: true });

  // Print the operation table to console.
  console.log(Tmpl.table(preview.ops));

  // 2) Apply (perform writes).
  await Tmpl.write(target, { source });
};

run();
```

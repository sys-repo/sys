# Template Engine
Tools for working with simple `filesystem` files as templates that can be copied, adjusted and/or updated into target projects.


## Kernel Usage
**Bundle folder → JSON artifact** (ready to ship inside a JSR module):
```ts
import { makeTmpl, Path } from '@sys/tmpl-engine';

const kernel = makeTmpl({ 
  sourceDir: './src/-tmpl', 
  loadFileMap: async () => ({}) ,
});

await kernel.bundle({
  srcDir: Path.resolve('./src/-tmpl'),
  outFile: './-bundle.json',
});
```

Apply (write) → Materialize files:
```ts
import bundle from './-bundle.json' with { type: 'json' };
import { makeTmpl, FileMap, type t } from '@sys/tmpl-engine';

const kernel = makeTmpl({
  sourceDir: '-tmpl',
  loadFileMap: async () => (FileMap.validate(bundle).fileMap as t.FileMap),
});

await kernel.write('./my-catalog' as t.StringDir);
```


<p>&nbsp;<p>


## Core Engine Usage
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

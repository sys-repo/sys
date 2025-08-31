# Template Engine
Tools for working with simple `filesystem` files as templates that can be copied, adjusted and/or updated into target projects.

## Kernal Usage
**Run a pre-bundled template** with preview + real write in a few lines:

```ts
import bundle from './-bundle.json' with { type: 'json' };
import { makeTmpl, FileMap, Path, type t } from '@sys/tmpl-engine';
import { createFileProcessor } from './u.processFile.ts';

const sourceDir = Path.resolve('-tmpl');      // template source folder
const targetDir = './my-catalog';             // where to materialize
const bundleRoot = 'my-namespace';            // sub-folder of sourceDir/bundle to extract.

const kernel = makeTmpl({
  sourceDir,
  loadFileMap: async () => (FileMap.validate(bundle).fileMap as t.FileMap),
  makeProcessFile: ({ bundleRoot }) => createFileProcessor({ bundleRoot }),
});

// 1) Preview (dry-run).
const preview = await kernel.write(targetDir, { dryRun: true, bundleRoot });
console.info(kernel.table(preview.ops, { dryRun: true, baseDir: targetDir as t.StringDir }));

// 2) Real write.
await kernel.write(targetDir, { bundleRoot });
```

<p>&nbsp;<p>

**Custom file processor:** file renames & text transformions in one place:
```ts
// u.processFile.ts
import { type t } from '@sys/tmpl-engine';

/**
 * Minimal processor example:
 */
export function createFileProcessor() {
  return (e: t.FileMapProcessFile) => {
    // Rename .gitignore-
    if (e.path.endsWith('.gitignore-')) {
      e.target.rename(e.path.replace(/-$/, '') as t.StringPath);
    }

    // Replace "FOO" in .ts files
    if (e.text && e.path.endsWith('.ts')) {
      const next = e.text.replace(/\bFOO\b/g, 'e.something');
      e.modify(next);
    }
  };
}
```

<p>&nbsp;<p>

**Bundle folder → JSON artifact** (ready to ship inside a JSR module)

```ts
import { makeTmpl, Path } from '@sys/tmpl-engine';

const kernel = makeTmpl({ sourceDir: './src/-tmpl', loadFileMap: async () => ({}) });

await kernel.bundle({ 
  srcDir: Path.resolve('./src/-tmpl'), 
  outFile: './-bundle.json' 
});
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

# Template Engine
Tools for working with simple file-system folders as Templates that can be **copied**, **adjusted**, and/or **updated**, into target locations.


<p>&nbsp;<p>

## Usage
Use the template engine to bundle source folders into JSON artifacts and
apply them into target projects. This is the recommended entry-point
for most modules.


```ts
import { Tmpl } from '@sys/tmpl-engine';
```

<p>&nbsp;<p>


**Eample: Bundle folder → JSON artifact** (ready to ship inside a JSR module):
```ts
// src/m.tmpl/u.bundle.ts

if (import.meta.main) {
  const source = './src/-tmpl';
  const target = './src/-bundle.json'

  const result = await Tmpl.FileMap.bundle(source, target);
  console.info('Wrote bundle to:', result.file);
}
```

This prepares the asset bundle making it an embeddable JSON file within your module.
It is a good idea to expose this as a `"prep"` task on the `deno.json` file:

```json
{
  "tasks": {
    "prep": "deno run -RWE src/m.tmpl/u.bundle.ts",
  },
}
```



<p>&nbsp;<p>

**Apply (write) → materialize files:**
```ts
// import { makeTmpl, FileMap, type t } from '@sys/tmpl-engine';
import { createFileProcessor } from './u.processFile.ts';

// ↓ the bundled JSON artifact from the last step:
import bundle from './-bundle.json' with { type: 'json' };

🐷
// const dryRun = true;           // ← toggle: preview vs. real write
// const target = './my-catalog' 
// 
// const kernel = makeTmpl({
//   loadFileMap: async () => FileMap.validate(bundle).fileMap,
//   makeProcessFile: () => createFileProcessor(),
// });
// 
// // Run write:
// const result = await kernel.write(target, { dryRun });
// 
// // Show table:
// console.info(kernel.table(result.ops, { dryRun, baseDir: target }));
```

<p>&nbsp;<p>


## Process Files
Use a **process file** `function` to adjust or filter files as they are materialized.  
This can rename, exclude, or modify content inline.

```ts
// u.processFile.ts
import { type t } from '@sys/tmpl-engine';

/**
 * Example processor:
 * - Rename ".gitignore-" → ".gitignore"
 * - Replace "FOO" → "bar" in .ts files
 */
export function makeProcessFile() {
  return (e: t.FileMapProcessFile) => {
    if (e.path.endsWith('.gitignore-')) {
      e.target.rename(e.path.replace(/-$/, ''));
    }

    if (e.text && e.path.endsWith('.ts')) {
      e.modify(e.text.replace(/\bFOO\b/g, 'bar'));
    }
  };
}
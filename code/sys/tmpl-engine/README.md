# Template Engine
Tools for working with simple file-system folders as Templates that can be **copied**, **adjusted**, and/or **updated**, into target locations.


<p>&nbsp;<p>

## Usage
Use the template engine to bundle source folders into embeddable JSON artifacts and apply them into target projects.  
This is the recommended entry-point for most modules.

```ts
import { TmplEngine } from '@sys/tmpl-engine';
```

<p>&nbsp;<p>


**Eample: Bundle folder → JSON artifact** (ready to ship inside a JSR module):
```ts
// src/m.tmpl/-u.bundle.ts
if (import.meta.main) {
  const source = './src/-tmpl';
  const target = './src/-bundle.json';

  const result = await TmplEngine.FileMap.bundle(source, target);
  console.info('Wrote bundle to:', result.file);
}
```

This prepares the asset bundle as a JSON file that can be embedded within your module.  
It is a good idea to expose this as a `"prep"` task in your `deno.json` file:

```json
{
  "tasks": {
    "prep": "deno run -RWE src/m.tmpl/mod.ts --bundle",
  },
}
```



<p>&nbsp;<p>

**Example: Write files to disk:**
```ts
// src/m.tmpl/u.write.ts
import { TmplEngine, Path } from '@sys/tmpl-engine';
import { processFile } from './u.processFile.ts'; // ← see sample below (optional).

// The bundled JSON artifact from the previous step:
import bundle from './-bundle.json' with { type: 'json' };

if (import.meta.main) {
  const target = './my-catalog';

  // Options:
  const dryRun = true; // ← (default: false) toggle: preview vs real write
  const force = false //  ← (default: false)

  // Validate + load the file data.
  const { fileMap } = TmplEngine.FileMap.validate(bundle);

  // Build the template from the map and processor:
  const tmpl = TmplEngine.makeTmpl(fileMap, processFile);

  // Apply to disk:
  const res = await tmpl.write(Path.resolve(target), { dryRun /*, force: true */ });

  // Pretty table (paths shown relative to target):
  const table = TmplEngine.Log.table(res.ops, { baseDir: Path.resolve(target) });
  console.info(table);
}
```

<p>&nbsp;<p>


## Process Files
Use a **file processor** `function` to adjust or filter files as they are materialized.  
This can rename, exclude, or modify content inline.

```ts
// u.processFile.ts
import { type t } from '@sys/tmpl-engine';

/**
 * Example processor:
 * - Rename ".gitignore-" → ".gitignore"
 * - Replace "FOO" → "bar" in .ts files
 * - Skip large binary files (e.g., .png)
 */
const processFile: t.TmplProcessFile = (e) => {
  // Rename ".gitignore-"
  if (e.path.endsWith('.gitignore-')) {
    e.target.rename(e.path.replace(/-$/, ''));
  }

  // Inline replacement in TypeScript files
  if (e.text && e.path.endsWith('.ts')) {
    e.modify(e.text.replace(/\bFOO\b/g, 'bar'));
  }

  // Skip certain binaries
  if (e.contentType.startsWith('image/') && e.path.endsWith('.png')) {
    e.skip('skipped PNG (user-space)');
  }
};
```

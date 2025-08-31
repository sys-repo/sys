# Template Engine
Tools for working with simple filesystem **files** as **templates** that can be copied, adjusted and/or updated into target projects.


<p>&nbsp;<p>

## Usage
Use the kernel (`bundle` + `makeTmpl`) to package and apply templates for your module.

<p>&nbsp;<p>

**Bundle folder → JSON artifact** (ready to ship inside a JSR module):
```ts
import { bundleFolder } from '@sys/tmpl-engine';

await bundleFolder({
  srcDir: './src/-tmpl',
  outFile: './-bundle.json',
});
```

<p>&nbsp;<p>

**Apply (write) → materialize files:**
```ts
import bundle from './-bundle.json' with { type: 'json' };
import { makeTmpl, FileMap, type t } from '@sys/tmpl-engine';

const dryRun = true;           // ← toggle: preview vs. real write
const target = './my-catalog' 

const kernel = makeTmpl({
  loadFileMap: async () => FileMap.validate(bundle).fileMap,
});

// Run write:
const result = await kernel.write(target, { dryRun });

// Show table only in dry-run:
if (dryRun) {
  console.info(kernel.table(result.ops, { dryRun, baseDir: target }));
}

// 👉 flip `dryRun = false` to actually materialize files into target.
```

<p>&nbsp;<p>

# @sys/tmpl-engine

Bundle filesystem templates into JSON, then copy or adapt their files into target projects. Use
[`@sys/tmpl`](https://jsr.io/@sys/tmpl) for the ready-made command-line templates; use this package
when defining a template or its file processor.

## Preview the files to write

`TmplEngine.makeTmpl` accepts a source directory or a FileMap. A processor may rename, skip, or
modify each file before it is written.

This example requires an existing `./templates` directory. Paths are relative to the working
directory; the preview reads the source and inspects the destination without writing template files.

```ts
import { Path, TmplEngine } from 'jsr:@sys/tmpl-engine';

const target = Path.resolve('./generated');
const tmpl = TmplEngine.makeTmpl('./templates', (file) => {
  if (file.path === 'gitignore') file.target.rename('.gitignore');
});

const result = await tmpl.write(target, { dryRun: true });
console.info(TmplEngine.Log.table(result.ops, { baseDir: target }));
```

Set `dryRun: false` to write. Processors still run during a dry run, so keep their own effects under
caller control. Existing files are normally skipped unless `force` is true **or the processor calls
`modify`**; `force: false` is not a general no-overwrite guarantee. Skipped files are not written.
Use trusted templates, processors, and destinations; this API is not filesystem confinement or an
atomic project update.

## Bundle a template

Bundling writes a JSON FileMap that can travel with a package, rather than writing the template's
files into a target project:

```ts
import { TmplEngine } from 'jsr:@sys/tmpl-engine';

const result = await TmplEngine.bundle('./templates', './templates.json');
console.info(result.file);
```

The source directory must exist. Bundling needs filesystem read/write access and writes the chosen
output file. For a loaded JSON artifact, call `TmplEngine.FileMap.validate` and check both `error`
and the presence of `fileMap` before passing the map to `makeTmpl`.

See the [API documentation](https://jsr.io/@sys/tmpl-engine/doc) for FileMap validation, filtering,
processors, and operation results.

import bundle from './-bundle.json' with { type: 'json' };

import { type t, FileMap, Fs, Path, PATHS, pkg } from './common.ts';
import { createFileProcessor } from './u.processFile.ts';

export const write: t.CatalogTmplLib['write'] = async (target, opts = {}) => {
  const { dryRun = false, bundleRoot } = opts;

  // Validate embedded bundle artifact:
  let { fileMap, error } = FileMap.validate(bundle);
  if (!fileMap || error) throw new Error(`Invalid catalog bundle: ${error?.message ?? 'unknown error'}`);
  fileMap = Object.fromEntries(Object.entries(fileMap).filter(([k]) => k.startsWith(`${bundleRoot}/`)));

  // Ensure the given bundle-root exists within the FileMap:
  const exists = Object.keys(fileMap).some((key) => key.startsWith(`${bundleRoot}/`))
  if (!exists) {
    let msg = `The bundle-root '${bundleRoot}' was not found within the '/-tmpl/' folder.`
    msg += ` Ensure the 'deno task prep' helper has been run.`
    throw new Error(msg)
  }

  const sourceDir = Fs.toDir(Path.resolve(PATHS.tmpl.source));
  const targetDir = Fs.toDir(Path.resolve(target));

  // Pass the bundleRoot into the file-processor:
  const processFile = createFileProcessor({ bundleRoot });

  /**
   * Materialize Tempate:
   */
  const materialize = async (dir: t.StringDir) => {
    const res = await FileMap.materialize(fileMap, dir, { processFile });
    const ops = res.ops.map((o) => ({ ...o })) as unknown as t.TmplFileOperation____[];
    return { 
      source: sourceDir, 
      target: targetDir, 
      ops 
    } satisfies t.TmplWriteResult
  }

  if (dryRun) {
    const prefix = `sys.ui-factory.tmpl-`
    const tmp = (await Fs.makeTempDir({ prefix })).absolute;
    try {
      return await materialize(tmp)
    } finally {
      await Fs.remove(tmp);
    }
  }

  // Materialize the template to the filesystem.
  return await materialize(targetDir.absolute)
};
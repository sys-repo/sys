import bundle from './-bundle.json' with { type: 'json' };

import { type t, FileMap, Fs, Path } from './common.ts';
import { createFileProcessor } from './u.processFile.ts';

export const write: t.CatalogTmplLib['write'] = async (target, opts = {}) => {
  const { dryRun = false } = opts;

  const { fileMap, error } = FileMap.validate(bundle);
  if (!fileMap || error) throw new Error(`Invalid catalog bundle: ${error?.message ?? 'unknown error'}`);

  // Metadata for response:
  const sourceDir = Fs.toDir(Path.resolve('./src/-tmpl/'));
  const targetDir = Fs.toDir(Path.resolve(target));

  const processFile = createFileProcessor({});

  if (dryRun) {
    const tmp = (await Fs.makeTempDir({ prefix: 'ui-factory-tmpl-' })).absolute;
    try {
      const res = await FileMap.materialize(fileMap, tmp, { processFile });
      const ops = res.ops.map((o) => ({ ...o })) as unknown as t.TmplFileOperation[];
      return { source: sourceDir, target: targetDir, ops };
    } finally {
      await Fs.remove(tmp);
    }
  }

  // Real write:
  const absTarget = Path.resolve(target) as t.StringDir;
  const res = await FileMap.materialize(fileMap, absTarget, { processFile });
  const ops = res.ops.map((o) => ({ ...o })) as unknown as t.TmplFileOperation[];
  return { source: sourceDir, target: targetDir, ops };
};
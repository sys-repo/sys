import { type t, FileMap, Fs, Path } from './common.ts';

export function makeWriter(args: t.TmplMakeArgs) {
  const sourceDir = Fs.toDir(Path.resolve(args.sourceDir ?? '.'));

  const write: t.TmplKernel['write'] = async (target, opts = {}) => {
    const { dryRun = false, bundleRoot } = opts;

    const fileMap = await args.loadFileMap();
    const processFile = args.makeProcessFile?.({ bundleRoot });

    const targetDir = Fs.toDir(Path.resolve(target));
    const materialize = async (dir: string) => {
      const res = await FileMap.materialize(fileMap, dir, { processFile });

      // Keep ops in their native shape (FileMapMaterializeOp[]);
      // callers rendering tables can pass them to Log.table which normalizes.
      const ops = res.ops as unknown as t.TmplFileOperation[];

      const out: t.TmplWriteResponse = { source: sourceDir, target: targetDir, ops };
      return out;
    };

    if (dryRun) {
      const tmp = (await Fs.makeTempDir({ prefix: 'tmpl-' })).absolute;
      try {
        return await materialize(tmp);
      } finally {
        await Fs.remove(tmp);
      }
    }

    return await materialize(targetDir.absolute);
  };

  return write;
}

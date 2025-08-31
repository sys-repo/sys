import { type t, Fs, Path } from './common.ts';
import { toMap } from './u.toMap.ts';

export const bundle: t.FileMapLib['bundle'] = async (sourceDir, options) => {
  const { targetFile, filter } = options;

  const out = Path.resolve(targetFile) as t.StringPath;
  await Fs.ensureDir(Path.dirname(out));

  const fileMap = await toMap(sourceDir, { filter });
  await Fs.writeJson(out, fileMap, { throw: true });

  return {
    count: Object.keys(fileMap).length,
    fileMap,
    file: out,
  };
};

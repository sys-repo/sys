import { type t, Fs, Is, Path } from './common.ts';
import { toMap } from './u.toMap.ts';

type F = t.FileMapLib['bundle'];

export const bundle: F = async (sourceDir, opt) => {
  const { targetFile, filter } = wrangle.options(opt);

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

/**
 * Helpers:
 */
const wrangle = {
  options(input: Parameters<F>[1]): t.FileMapBundleOptions {
    if (Is.string(input)) return { targetFile: input };
    return input;
  },
} as const;

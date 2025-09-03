import { type t, Fs, Is, Path } from './common.ts';
import { Is as FileMapIs } from './m.Is.ts';
import { toMap } from './u.toMap.ts';

type F = t.FileMapLib['bundle'];

export const bundle: F = async (sourceDir, opt) => {
  const { targetFile, filter, beforeWrite } = wrangle.options(opt);
  const file = Path.resolve(targetFile) as t.StringPath;
  await Fs.ensureDir(Path.dirname(file));

  // Prepare the filemap to write.
  let fileMap = await toMap(sourceDir, { filter });
  let modified = false;

  // Write to disk.
  await Fs.writeJson(file, fileMap, { throw: true });
  if (Is.func(beforeWrite)) {
    const clone = { ...fileMap };
    beforeWrite({
      file,
      get fileMap() {
        return clone;
      },
      modify(next) {
        if (!FileMapIs.fileMap(next)) {
          throw new Error(`The given modified file-map value is not valid: ${next}`);
        }
        fileMap = { ...next };
        modified = true;
      },
    });
  }

  /**
   * API:
   */
  const count = Object.keys(fileMap).length;
  return {
    count,
    file,
    get fileMap() {
      return fileMap;
    },
    modified,
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

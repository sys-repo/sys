import { type t, Path } from './common.ts';
import { toDir } from './u.toDir.ts';

export const makeTempDir: t.FsLib['makeTempDir'] = async (options = {}) => {
  const path = await Deno.makeTempDir({
    dir: options.dir,
    prefix: options.prefix,
    suffix: options.suffix,
  });
  return toDir(Path.resolve(path));
};

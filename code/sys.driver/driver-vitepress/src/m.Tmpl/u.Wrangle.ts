import { type t, Path, Fs } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  dir(dir: string): t.TmplDir {
    return {
      dir,
      async ls() {
        const files = await Fs.glob(dir).find('**');
        return files.filter((p) => p.path !== dir).map((p) => p.path);
      },
    };
  },

  file(path: t.StringPath): t.TmplFile {
    const cwd = Path.cwd();
    const dir = Path.trimCwd(Path.dirname(path));
    const name = Path.trimCwd(Path.basename(path));
    return { cwd, path, dir, name };
  },
} as const;

import { type t, Fs, Path } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  dir(dir: string): t.TmplDir {
    return {
      dir,
      async ls(trimCwd) {
        const files = await Fs.glob(dir).find('**');
        return files
          .filter((p) => p.path !== dir)
          .map((p) => (trimCwd ? Path.trimCwd(p.path) : p.path));
      },
    };
  },

  file(path: t.StringPath): t.TmplFile {
    const cwd = Path.cwd();
    const dir = Path.trimCwd(Path.dirname(path));
    const name = Path.trimCwd(Path.basename(path));
    return { cwd, path, dir, name };
  },

  rename(input: t.TmplFile | string, filename: string) {
    const path = typeof input === 'string' ? input : input.path;
    const dir = Path.dirname(path);
    return Wrangle.file(Fs.join(dir, filename));
  },
} as const;

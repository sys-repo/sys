import { type t, Fs, Path } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  dir(dir: string, filters?: t.TmplFilter[]): t.TmplDir {
    return {
      dir,
      async ls(trimCwd) {
        const files = await Fs.glob(dir, { includeDirs: false }).find('**');
        const include = (path: string) => {
          if (!filters) return true;
          const file = Wrangle.file(path);
          return filters.every((filter) => filter(file));
        };
        return files
          .filter((p) => include(p.path))
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
